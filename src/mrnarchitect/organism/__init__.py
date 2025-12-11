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
from bs4 import BeautifulSoup

from mrnarchitect.codon_table import CodonUsage, CodonUsageTable
from mrnarchitect.constants import CODONS
from mrnarchitect.types import Codon

CODON_TABLES_DIRECTORY = pathlib.Path(__file__).parent / "codon_tables"
TRNA_DATASETS_DIRECTORY = pathlib.Path(__file__).parent / "trna_datasets"
ORGANISMS_DB = pathlib.Path(__file__).parent / "organisms.db"


SLUG_TO_TRNA_DATABASE_FILE: dict[str, str] = {
    "homo-sapiens": "hg38-tRNAs.bed",
    "mus-musculus": "mm39-tRNAs.bed",
}


class Organism(msgspec.Struct, frozen=True):
    slug: str
    name: str
    kazusa_id: str

    @property
    def codon_usage_table(self) -> CodonUsageTable:
        return load_codon_usage_table(self.kazusa_id)
        # return load_codon_usage_table()

    @property
    def trna_dataset(self) -> dict[str, float] | None:
        return load_trna_adaptation_index_dataset(self.slug)


def rebuild_database():
    organisms: list[dict] = []
    for c in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
        contents = (
            urllib.request.urlopen(f"https://www.kazusa.or.jp/codon/{c}.html")
            .read()
            .decode("utf-8")
        )

        soup = BeautifulSoup(contents)
        for a in soup("a"):
            href = next(iter(a.get_attribute_list("href")), None)
            if not href or not href.startswith("/codon/cgi-bin/showcodon.cgi?species="):
                continue
            id = href.split("=")[1]
            full_name = a.get_text()
            if id and full_name:
                name = full_name.rsplit("[", maxsplit=1)[0].strip()
                organisms.append(
                    {
                        "slug": "-".join(name.strip().split()).lower(),
                        "name": name.strip(),
                        "kazusa_id": id.strip(),
                    }
                )

    if ORGANISMS_DB.exists():
        ORGANISMS_DB.unlink()
    connection = sqlite3.connect(ORGANISMS_DB)
    cursor = connection.cursor()
    cursor.execute("CREATE VIRTUAL TABLE organism USING fts5(slug, name, kazusa_id)")
    for organisms_batch in itertools.batched(organisms, 100):
        cursor.executemany(
            "INSERT INTO organism VALUES(:slug, :name, :kazusa_id)",
            organisms_batch,
        )
        print(f"Commited {len(organisms_batch)}")
        connection.commit()
    connection.close()


def load_organism_from_slug(slug: str) -> Organism:
    connection = sqlite3.connect(ORGANISMS_DB)
    connection.row_factory = sqlite3.Row
    cursor = connection.cursor()
    res = cursor.execute(
        "SELECT * FROM organism WHERE slug = ?",
        (slug,),
    )
    row = res.fetchone()
    connection.close()
    return Organism(slug=row["slug"], name=row["name"], kazusa_id=row["kazusa_id"])


def search_organisms(terms: str | list[str], limit: int = 10) -> list[Organism]:
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
    return [
        Organism(slug=row["slug"], name=row["name"], kazusa_id=row["kazusa_id"])
        for row in rows
    ]


def load_codon_usage_table(kazusa_id: str) -> CodonUsageTable:
    organism_file = CODON_TABLES_DIRECTORY / f"{kazusa_id}.json"
    if organism_file.exists():
        with open(organism_file, "rb") as f:
            return msgspec.json.decode(f.read(), type=CodonUsageTable)

    codon_usage_table = load_codon_usage_table_from_kazusa(kazusa_id)
    codon_usage_table.save(organism_file)
    return codon_usage_table


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
