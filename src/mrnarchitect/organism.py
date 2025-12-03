import csv
import functools
import re
import typing
import urllib.request

import msgspec

from .constants import (
    AMINO_ACIDS,
    CODONS,
    CodonTable,
)
from .types import AminoAcid, Codon, Organism


ORGANISM_TO_KAZUSA_ID_MAP: dict[Organism, int] = {
    "homo-sapiens": 9606,
    "mus-musculus": 10090,
}


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
        return CodonTable.amino_acid(self.codon)


class CodonUsageTable(msgspec.Struct, frozen=True):
    id: str
    usage: dict[Codon, CodonUsage]
    """Maps a codon to it's usage."""

    def __hash__(self):
        return hash(self.id)

    @functools.cache
    def most_frequent(self, amino_acid: AminoAcid) -> CodonUsage:
        return max(
            [
                usage
                for codon, usage in self.usage.items()
                if codon in CodonTable.codons(amino_acid)
            ],
            key=lambda x: x.number,
        )

    @functools.cache
    def least_frequent(self, amino_acid: AminoAcid) -> CodonUsage:
        return min(
            [
                usage
                for codon, usage in self.usage.items()
                if codon in CodonTable.codons(amino_acid)
            ],
            key=lambda x: x.number,
        )

    def weight(self, codon: Codon) -> float:
        amino_acid = CodonTable.amino_acid(codon)
        return self.usage[codon].number / self.most_frequent(amino_acid).number

    def to_dnachisel_dict(self) -> dict[str, dict[str, float]]:
        return {
            amino_acid: {
                codon_usage.codon: codon_usage.frequency
                for codon_usage in self.usage.values()
                if codon_usage.amino_acid == amino_acid
            }
            for amino_acid in AMINO_ACIDS
        }

    def save(self, path: str):
        with open(path, "wb") as f:
            f.write(msgspec.json.encode(self))


def load_codon_table_from_kazusa(kazusa_id: int) -> CodonUsageTable:
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


def codon_usage_bias(f: CodonUsageTable, c: CodonUsageTable):
    """Calculate the codon usage bias between two codon usage tables."""
    number_f: dict[AminoAcid, int] = {
        amino_acid: sum(
            usage.number for usage in f.usage.values() if usage.amino_acid == amino_acid
        )
        for amino_acid in AMINO_ACIDS
    }
    total_number_f = sum(usage.number for usage in f.usage.values())
    p_f: dict[AminoAcid, float] = {
        amino_acid: number_f[amino_acid] / total_number_f for amino_acid in AMINO_ACIDS
    }

    return sum(
        p_f[amino_acid]
        * sum(
            abs(f.usage[codon].frequency - c.usage[codon].frequency)
            for codon in CodonTable.codons(amino_acid)
        )
        for amino_acid in AMINO_ACIDS
    )
