import collections
import csv
import functools
import itertools
import pathlib
import re
import sqlite3
import statistics
import typing
import urllib.request

import msgspec

from mrnarchitect.codon_table import CodonUsage, CodonUsageTable
from mrnarchitect.constants import AMINO_ACID_TO_CODONS_MAP, AMINO_ACIDS, CODONS
from mrnarchitect.types import Codon

CODON_USAGE_TABLES_CSV = pathlib.Path(__file__).parent / "codon_usage.csv"
TRNA_DATASETS_DIRECTORY = pathlib.Path(__file__).parent / "trna_datasets"
ORGANISMS_DB = pathlib.Path(__file__).parent / "organisms.db"


SLUG_TO_TRNA_DATABASE_FILE: dict[str, str] = {
    "homo-sapiens": "hg38-tRNAs.bed",
    "mus-musculus": "mm39-tRNAs.bed",
}


class Organism(msgspec.Struct, frozen=True):
    slug: str
    name: str
    id: str

    @property
    @functools.cache
    def codon_usage_table(self) -> CodonUsageTable:
        return load_codon_usage_table_from_database(self.slug)

    @property
    @functools.cache
    def trna_dataset(self) -> dict[str, float] | None:
        return load_trna_adaptation_index_dataset(self.slug)


def build_database(overwrite: bool = False) -> int | None:
    def _is_float(s: str) -> bool:
        try:
            float(s)
            return True
        except ValueError:
            return False

    def _load_codon_usage_table(row: dict[str, str]) -> CodonUsageTable:
        # Rename rows with `U` nucletides with `T` for consistency
        for codon in CODONS:
            row[codon] = row.pop(codon.replace("T", "U"))
        usage: dict[Codon, CodonUsage] = {}
        num_codons = int(row["Ncodons"])
        for aa in AMINO_ACIDS:
            frequency_sum = sum(
                float(row[codon]) for codon in AMINO_ACID_TO_CODONS_MAP[aa]
            )
            for codon in AMINO_ACID_TO_CODONS_MAP[aa]:
                frequency = float(row[codon])
                usage[codon] = CodonUsage(
                    codon=codon,
                    number=int(num_codons * frequency),
                    frequency=frequency / frequency_sum if frequency_sum else 0.0,
                )
        return CodonUsageTable(id=row["SpeciesID"], usage=usage)

    if ORGANISMS_DB.exists():
        if overwrite:
            ORGANISMS_DB.unlink()
        else:
            return

    with open(CODON_USAGE_TABLES_CSV, "r") as f:
        reader = csv.DictReader(f)
        rows = [
            {
                "slug": "-".join(row["SpeciesName"].strip().split()).lower(),
                "name": row["SpeciesName"].strip(),
                "id": row["SpeciesID"].strip(),
                "codon_usage_table": msgspec.json.encode(_load_codon_usage_table(row)),
            }
            for row in reader
            # Skip mictochondrion rows
            if not row["SpeciesName"].startswith("mitochondrion")
            # Validate codon frequencies
            and all(_is_float(row[key]) for key in row.keys() if len(key) == 3)
        ]

    connection = sqlite3.connect(ORGANISMS_DB)
    cursor = connection.cursor()
    cursor.execute(
        "CREATE VIRTUAL TABLE organism USING fts5(slug, name, id, codon_usage_table UNINDEXED)"
    )
    for row_batch in itertools.batched(rows, 100):
        cursor.executemany(
            "INSERT INTO organism VALUES(:slug, :name, :id, :codon_usage_table)",
            row_batch,
        )
        connection.commit()
    connection.close()
    return len(rows)


def load_codon_usage_table_from_database(slug: str) -> CodonUsageTable:
    build_database()
    connection = sqlite3.connect(ORGANISMS_DB)
    connection.row_factory = sqlite3.Row
    cursor = connection.cursor()
    res = cursor.execute(
        "SELECT * FROM organism WHERE slug = ?",
        (slug,),
    )
    row = res.fetchone()
    connection.close()
    return msgspec.json.decode(row["codon_usage_table"], type=CodonUsageTable)


def load_organism_from_database(slug: str) -> Organism:
    build_database()
    connection = sqlite3.connect(ORGANISMS_DB)
    connection.row_factory = sqlite3.Row
    cursor = connection.cursor()
    res = cursor.execute(
        "SELECT * FROM organism WHERE slug = ?",
        (slug,),
    )
    row = res.fetchone()
    connection.close()
    return Organism(slug=row["slug"], name=row["name"], id=row["id"])


def search_organisms(terms: str | list[str], limit: int = 10) -> list[Organism]:
    build_database()
    if isinstance(terms, str):
        terms = terms.split()
    connection = sqlite3.connect(ORGANISMS_DB)
    connection.row_factory = sqlite3.Row
    cursor = connection.cursor()
    res = cursor.execute(
        "SELECT * FROM organism WHERE organism MATCH ? LIMIT ?",
        (
            " AND ".join(f'"{it}"*' for it in terms),
            limit,
        ),
    )
    rows = res.fetchall()
    connection.close()
    return [Organism(slug=row["slug"], name=row["name"], id=row["id"]) for row in rows]


def load_codon_usage_table_from_kazusa(kazusa_id: str) -> CodonUsageTable:
    contents = (
        urllib.request.urlopen(
            f"https://www.kazusa.or.jp/codon/cgi-bin/showcodon.cgi?species={kazusa_id}&aa=1&style=GCG"
        )
        .read()
        .decode("utf-8")
    )
    if (match := re.search(r"(?:<PRE>)([\s\S]*)(?:</PRE>)", contents)) is None:
        raise RuntimeError(f"Could not parse table: {id}")
    table_string = match.group(1)
    table_rows = list(
        csv.DictReader(
            [line for line in table_string.split("\n") if line.strip()],
            delimiter=" ",
            skipinitialspace=True,
        )
    )

    codon_usages: list[CodonUsage] = [
        CodonUsage(
            codon=typing.cast(Codon, row["Codon"].upper().replace("U", "T")),
            number=int(float(row["Number"])),
            frequency=float(row["Number"])
            / sum(
                float(r["Number"]) for r in table_rows if r["AmAcid"] == row["AmAcid"]
            ),
        )
        for row in table_rows
    ]
    usage: dict[Codon, CodonUsage] = {it.codon: it for it in codon_usages}

    return CodonUsageTable(
        id=str(kazusa_id),
        usage=usage,
    )


@functools.cache
def load_trna_adaptation_index_dataset(
    organism: str = "homo-sapiens",
) -> dict[str, float] | None:
    """Load the tAI weights for an organism.
    see: https://github.com/smsaladi/tAI/blob/master/tAI/tAI.py
    """
    ORGANISM_TO_FILE: dict[str, str] = {
        "homo-sapiens": "hg38-tRNAs.bed",
        "mus-musculus": "mm39-tRNAs.bed",
    }

    P = {"T": 0.59, "C": 0.72, "A": 0.0001, "G": 0.32}

    def _reverse_complement(s: str) -> str:
        return (
            s.replace("A", "t")
            .replace("T", "A")
            .replace("t", "T")
            .replace("G", "c")
            .replace("C", "G")
            .replace("c", "C")[::-1]
        )

    if organism not in ORGANISM_TO_FILE:
        return None

    with open(
        TRNA_DATASETS_DIRECTORY / ORGANISM_TO_FILE[organism],
        "r",
    ) as f:
        rows = [line.strip().split() for line in f.readlines() if line.strip()]

    trnas = [row[3].split("-") for row in rows]
    data: list[tuple[str, str]] = [
        (it[1], it[2])
        for it in trnas
        if it[1] not in ["iMet", "Und"] and "N" not in it[2]
    ]
    trna_counts = collections.Counter(_reverse_complement(it[1]) for it in data)
    for codon in CODONS:
        if codon not in trna_counts:
            trna_counts[codon] = 0

    weights = {codon: 0.0 for codon in trna_counts.keys()}
    for codon in trna_counts.keys():
        wobble = codon[2]
        base = codon[:2]
        if wobble == "T":
            weights[codon] = trna_counts[codon] + P["T"] * trna_counts[base + "C"]
        elif wobble == "C":
            weights[codon] = trna_counts[codon] + P["C"] * trna_counts[base + "T"]
        elif wobble == "A":
            weights[codon] = trna_counts[codon] + P["A"] * trna_counts[base + "T"]
        elif wobble == "G":
            weights[codon] = trna_counts[codon] + P["G"] * trna_counts[base + "A"]
        else:
            raise RuntimeError(f"Non-standard codon or notation: {codon}")

    # Remove stop codons and methionine
    for codon in ["ATG", "TGA", "TAA", "TAG"]:
        del weights[codon]

    max_weight = max(weights.values())
    geomean_weight = statistics.geometric_mean(w for w in weights.values() if w)

    return {
        codon: weight / max_weight if weight else geomean_weight
        for codon, weight in weights.items()
    }
