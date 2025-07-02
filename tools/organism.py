import csv
import pathlib
import re
import typing
import urllib.request

import msgspec

from .constants import AMINO_ACIDS, CODON_TO_AMINO_ACID_MAP, CODONS
from .types import Codon, AminoAcid


KAZUSA_HOMO_SAPIENS = "kazusa:9606"
KAZUSA_MUS_MUSCULUS = "kazusa:10090"


class CodonUsage(msgspec.Struct, frozen=True):
    """Codon usage for a particular codon and organism."""

    codon: Codon
    """The codon this usage relates to."""

    number: int
    """The raw number of codons."""

    frequency: float
    """The frequency of this codon relative to other codons for the same amino acid."""

    def __post_init__(self):
        if self.codon not in CODONS:
            raise ValueError(f"`codon` is not valid: {self.codon}")

    @property
    def amino_acid(self) -> str:
        """The 1-letter amino acid symbol for this codon."""
        return CODON_TO_AMINO_ACID_MAP[self.codon]


CodonUsageTable = dict[Codon, CodonUsage]
"""Maps a codon to it's usage."""

MaxCodonUsageTable = dict[AminoAcid, CodonUsage]
"""Maps an amino acid to the maximum codon usage amongst all codons for that amino acid."""


class Organism(msgspec.Struct, frozen=True):
    id: str
    codon_usage_table: CodonUsageTable
    max_codon_usage_table: MaxCodonUsageTable

    def __hash__(self):
        return hash(self.id)

    def weight(self, codon: Codon) -> float:
        amino_acid = CODON_TO_AMINO_ACID_MAP[codon]
        return (
            self.codon_usage_table[codon].number
            / self.max_codon_usage_table[amino_acid].number
        )

    def max_codon(self, amino_acid: AminoAcid) -> Codon:
        return self.max_codon_usage_table[amino_acid].codon

    def to_dnachisel_dict(self) -> dict[str, dict[str, float]]:
        return {
            amino_acid: {
                codon_usage.codon: codon_usage.frequency
                for codon_usage in self.codon_usage_table.values()
                if codon_usage.amino_acid == amino_acid
            }
            for amino_acid in AMINO_ACIDS
        }

    def save(self):
        with open(f"data/organisms/{self.id}.json", "wb") as f:
            f.write(msgspec.json.encode(self))


def load_organism_from_web(id: str) -> Organism:
    kazusa_id = id.split(":")[1]
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
    codon_usage_table: CodonUsageTable = {it.codon: it for it in codon_usages}

    max_codon_usage_table: MaxCodonUsageTable = {
        amino_acid: sorted(
            (it for it in codon_usages if it.amino_acid == amino_acid),
            key=lambda x: x.number,
        )[-1]
        for amino_acid in AMINO_ACIDS
    }

    return Organism(
        id=id,
        codon_usage_table=codon_usage_table,
        max_codon_usage_table=max_codon_usage_table,
    )


def load_organism(organism: Organism | str = KAZUSA_HOMO_SAPIENS) -> Organism:
    if isinstance(organism, Organism):
        return organism
    path = pathlib.Path(f"data/organisms/{organism}.json")
    if not path.exists():
        raise RuntimeError(f"Could not load organism, file does not exist: {path}")
    with open(path, "rb") as f:
        return msgspec.json.decode(f.read(), type=Organism)
