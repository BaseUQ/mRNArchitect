import collections
import functools
import pathlib
import statistics

import msgspec
import polars as pl

from tools.constants import CODONS
from tools.organism import CodonUsageTable
from tools.types import Organism


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
        c for c in df.columns if len(c) == 6 and c[:3] in CODONS and c[3:] in CODONS
    ]
    assert len(columns) == 64**2, f"Length should be {64**2}: {len(columns)}"
    return {(c[:3], c[3:]): df[c].to_list()[0] / total_count for c in columns}


def load_codon_usage_table(
    organism: CodonUsageTable | Organism = "homo-sapiens",
) -> CodonUsageTable:
    if isinstance(organism, CodonUsageTable):
        return organism
    path = pathlib.Path(__file__).parent / "codon-tables" / f"{organism}.json"
    if not path.exists():
        raise RuntimeError(
            f"Could not load codon usage table, file does not exist: {path}"
        )
    with open(path, "rb") as f:
        return msgspec.json.decode(f.read(), type=CodonUsageTable)


@functools.cache
def load_trna_adaptation_index_dataset(
    organism: Organism = "homo-sapiens",
) -> dict[str, float]:
    """Load the tAI weights for an organism.
    see: https://github.com/smsaladi/tAI/blob/master/tAI/tAI.py
    """
    ORGANISM_TO_FILE: dict[Organism, str] = {
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

    with open(
        pathlib.Path(__file__).parent / "tAI" / ORGANISM_TO_FILE[organism],
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
