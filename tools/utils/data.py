import functools
import pathlib

import polars as pl

from tools.constants import CODON_TO_AMINO_ACID_MAP


@functools.cache
def load_rare_codons() -> set[str]:
    """Get the set of rare codons.

    >>> len(load_rare_codons())
    61
    """
    df = pl.read_csv(pathlib.Path(__file__).parent / ".." / "data" / "rare-codons.csv")
    return set(df["codon"].to_list())


@functools.cache
def load_codon_pairs() -> dict[tuple[str, str], float]:
    """Load codon pairs table data.

    >>> len(load_codon_pairs())
    4096
    """
    df = pl.read_csv(
        pathlib.Path(__file__).parent / ".." / "data" / "codon-pair" / "human.csv"
    )
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
