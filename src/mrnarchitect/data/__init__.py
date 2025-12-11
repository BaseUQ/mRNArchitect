import csv
import functools
import pathlib

from mrnarchitect.codon_table import CodonUsageTable
from mrnarchitect.constants import CODONS
from mrnarchitect.organism import (
    Organism,
    load_organism_from_slug,
)


@functools.cache
def load_rare_codons() -> set[str]:
    """Get the set of rare codons.

    >>> len(load_rare_codons())
    61
    """
    with open(
        pathlib.Path(__file__).parent / "rare-codons.csv", "r", encoding="utf-8-sig"
    ) as f:
        reader = csv.DictReader(f, delimiter=",")
        return set([row["codon"] for row in reader])


@functools.cache
def load_codon_pairs() -> dict[tuple[str, str], float]:
    """Load codon pairs table data.

    >>> len(load_codon_pairs())
    4096
    """
    with open(pathlib.Path(__file__).parent / "codon_pair" / "human.csv", "r") as f:
        reader = csv.DictReader(f, delimiter=",")
        rows = [row for row in reader]
    total_count = float(rows[0]["#CODON PAIRS"])
    assert reader.fieldnames
    columns = [
        c
        for c in reader.fieldnames
        if len(c) == 6 and c[:3] in CODONS and c[3:] in CODONS
    ]
    assert len(columns) == 64**2, f"Length should be {64**2}: {len(columns)}"
    return {(c[:3], c[3:]): float(rows[0][c]) / total_count for c in columns}


def load_codon_usage_table(
    organism: CodonUsageTable | Organism | str = "homo-sapiens",
) -> CodonUsageTable:
    if isinstance(organism, CodonUsageTable):
        return organism
    if isinstance(organism, str):
        return load_organism_from_slug(organism).codon_usage_table
    return organism.codon_usage_table


@functools.cache
def load_trna_adaptation_index_dataset(
    organism: str = "homo-sapiens",
) -> dict[str, float] | None:
    """Load the tAI weights for an organism.
    see: https://github.com/smsaladi/tAI/blob/master/tAI/tAI.py
    """

    return load_organism_from_slug(organism).trna_dataset


@functools.cache
def load_microrna_seed_sites() -> list[str]:
    """Load microRNA seed sites from file.

    >>> len(load_microrna_seed_sites())
    50

    >>> all(len(it) == 7 for it in load_microrna_seed_sites())
    True

    >>> all("U" not in it for it in load_microrna_seed_sites())
    True
    """
    with open(pathlib.Path(__file__).parent / "microRNAs.txt", "r") as f:
        lines = f.readlines()
        return [
            line.strip().split()[2].replace("U", "T")
            for line in lines[1:]  # ignore header
        ]


@functools.cache
def load_manufacture_restriction_sites() -> list[str]:
    """Load manufacture restriction sites.

    >>> len(load_manufacture_restriction_sites())
    4

    >>> all("U" not in it for it in load_manufacture_restriction_sites())
    True
    """
    with open(
        pathlib.Path(__file__).parent / "manufacture-restriction-sites.txt", "r"
    ) as f:
        lines = f.readlines()
        return [
            line.strip().split()[1].replace("U", "T")
            for line in lines[1:]  # ignore header
        ]
