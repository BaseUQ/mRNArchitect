import functools
import pathlib
import typing

import msgspec
import polars as pl

from tools.constants import CODON_TO_AMINO_ACID_MAP
from tools.organism import CodonUsageTable
from tools.types import Codon, Organism


@functools.cache
def load_rare_codons() -> set[str]:
    """Get the set of rare codons.

    >>> len(load_rare_codons())
    61
    """
    df = pl.read_csv(pathlib.Path(__file__).parent / "rare-codons.csv")
    return set(df["codon"].to_list())


@functools.cache
def load_codon_pairs() -> dict[tuple[str, str], float]:
    """Load codon pairs table data.

    >>> len(load_codon_pairs())
    4096
    """
    df = pl.read_csv(pathlib.Path(__file__).parent / "codon-pair" / "human.csv")
    total_count = df["#CODON PAIRS"].to_list()[0]
    columns = [
        c
        for c in df.columns
        if len(c) == 6
        and c[:3] in CODON_TO_AMINO_ACID_MAP
        and c[3:] in CODON_TO_AMINO_ACID_MAP
    ]
    assert len(columns) == 64**2, f"Length should be {64**2}: {len(columns)}"
    return {(c[:3], c[3:]): df[c].to_list()[0] / total_count for c in columns}


def load_codon_usage_table(organism: Organism = "homo-sapiens") -> CodonUsageTable:
    path = pathlib.Path(__file__).parent / "codon-tables" / f"{organism}.json"
    if not path.exists():
        raise RuntimeError(f"Could not load organism, file does not exist: {path}")
    with open(path, "rb") as f:
        return msgspec.json.decode(f.read(), type=CodonUsageTable)


@functools.cache
def load_trna_adaptation_index_dataset(
    organism: Organism = "homo-sapiens",
) -> list[tuple[int, Codon]]:
    ORGANISM_TO_FILE: dict[Organism, str] = {
        "homo-sapiens": "hg38-tRNAs-confidence-set.out",
        "mus-musculus": "mm39-tRNAs-confidence-set.out",
    }

    with open(
        pathlib.Path(__file__).parent / "tAI" / ORGANISM_TO_FILE[organism],
        "r",
    ) as f:
        lines = f.readlines()

    rows = [
        line.strip().split(maxsplit=15)
        for line in lines[3:]  # First three lines are headers
        if line.strip()
    ]
    return [(int(row[1]), typing.cast(Codon, row[5])) for row in rows]
