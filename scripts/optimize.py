import dataclasses
import functools
import io
import json
import math
import re
import time
import typing

import Bio.Restriction.Restriction_Dictionary
import click
import polars as pl
import RNA
import typer
from dnachisel import DnaOptimizationProblem
from dnachisel.builtin_specifications import (
    AvoidPattern,
    AvoidHairpins,
    AvoidRareCodons,
    EnforceGCContent,
    EnforceTranslation,
    UniquifyAllKmers,
)
from dnachisel.builtin_specifications.codon_optimization import (
    CodonOptimize,
)

MAX_RANDOM_ITERS = 20_000

URIDINE_DEPLETION_TABLE = {
    "*": {"TAA": 0.276, "TAG": 0.223, "TGA": 0.5},
    "A": {"GCA": 0.349, "GCC": 0.53, "GCG": 0.121, "GCT": 0},
    "C": {"TGC": 1.0, "TGT": 0},
    "D": {"GAC": 1.0, "GAT": 0},
    "E": {"GAA": 0.459, "GAG": 0.541},
    "F": {"TTC": 1.0, "TTT": 0},
    "G": {"GGA": 0.328, "GGC": 0.379, "GGG": 0.294, "GGT": 0},
    "H": {"CAC": 1.0, "CAT": 0},
    "I": {"ATA": 0.302, "ATC": 0.698, "ATT": 0},
    "K": {"AAA": 0.464, "AAG": 0.536},
    "L": {
        "CTA": 0.089,
        "CTC": 0.213,
        "CTG": 0.432,
        "TTA": 0.104,
        "TTG": 0.161,
        "CTT": 0,
    },
    "M": {"ATG": 1.0},
    "N": {"AAC": 1.0, "AAT": 0},
    "P": {"CCA": 0.427, "CCC": 0.432, "CCG": 0.141, "CCT": 0},
    "Q": {"CAA": 0.284, "CAG": 0.716},
    "R": {"AGA": 0.259, "AGG": 0.236, "CGA": 0.125, "CGC": 0.17, "CGG": 0.21, "CGT": 0},
    "S": {"AGC": 0.357, "TCA": 0.256, "TCC": 0.314, "TCG": 0.073, "AGT": 0, "TCT": 0},
    "T": {"ACA": 0.413, "ACC": 0.447, "ACG": 0.14, "ACT": 0},
    "V": {"GTA": 0.163, "GTC": 0.286, "GTG": 0.551, "GTT": 0},
    "W": {"TGG": 1.0},
    "Y": {"TAC": 1.0, "TAT": 0},
}

REF_CODON_USAGE_TABLE = """amino_acid codon h_sapiens m_musculus
* TAA 0.3 0.29
* TAG 0.24 0.24
* TGA 0.47 0.47
A GCA 0.23 0.23
A GCC 0.4 0.38
A GCG 0.11 0.09
A GCT 0.27 0.29
C TGC 0.54 0.52
C TGT 0.46 0.48
D GAC 0.54 0.55
D GAT 0.46 0.45
E GAA 0.42 0.41
E GAG 0.58 0.59
F TTC 0.54 0.56
F TTT 0.46 0.44
G GGA 0.25 0.26
G GGC 0.34 0.33
G GGG 0.25 0.24
G GGT 0.16 0.18
H CAC 0.58 0.59
H CAT 0.42 0.41
I ATA 0.17 0.16
I ATC 0.47 0.5
I ATT 0.36 0.34
K AAA 0.43 0.39
K AAG 0.57 0.61
L CTA 0.07 0.08
L CTC 0.2 0.2
L CTG 0.4 0.39
L CTT 0.13 0.13
L TTA 0.08 0.07
L TTG 0.13 0.13
M ATG 1 1
N AAC 0.53 0.57
N AAT 0.47 0.43
P CCA 0.28 0.29
P CCC 0.32 0.3
P CCG 0.11 0.1
P CCT 0.29 0.31
Q CAA 0.27 0.26
Q CAG 0.73 0.74
R AGA 0.21 0.22
R AGG 0.21 0.22
R CGA 0.11 0.12
R CGC 0.18 0.17
R CGG 0.2 0.18
R CGT 0.08 0.09
S AGC 0.24 0.24
S AGT 0.15 0.15
S TCA 0.15 0.14
S TCC 0.22 0.22
S TCG 0.05 0.05
S TCT 0.19 0.2
T ACA 0.28 0.29
T ACC 0.36 0.35
T ACG 0.11 0.1
T ACT 0.25 0.25
V GTA 0.12 0.12
V GTC 0.24 0.25
V GTG 0.46 0.46
V GTT 0.18 0.17
W TGG 1 1
Y TAC 0.56 0.57
Y TAT 0.44 0.43"""

CODON_USAGE_TABLE = pl.read_csv(
    source=io.StringIO(REF_CODON_USAGE_TABLE),
    has_header=True,
    separator=" ",
)

CODON_TO_AMINO_ACID_MAP = {
    codon: CODON_USAGE_TABLE.filter(codon=codon)["amino_acid"][0]
    for codon in CODON_USAGE_TABLE["codon"]
}
"""Maps a codon to an amino acid symbol."""


@dataclasses.dataclass(eq=True, frozen=True)
class NucleicAcid:
    """A nucleic acid sequence."""

    sequence: str
    """The nucleic acid sequence."""

    def __post_init__(self):
        # Check the sequence is a nucleic acid
        if not self.sequence:
            return
        if match := re.search(r"[^ACGTU]+", self.sequence):
            raise ValueError(f"`sequence` contains invalid character: {match}")
        if "T" in self.sequence and "U" in self.sequence:
            raise ValueError("`sequence` contains both T and U amino acids.")

    @classmethod
    def from_amino_acid(
        cls, amino_acid_sequence: str, organism: str = "h_sapiens"
    ) -> "NucleicAcid":
        """Create a NucleicAcid from an amino acid sequence.

        >>> str(NucleicAcid.from_amino_acid("IR"))
        'ATCAGG'
        """
        return NucleicAcid(
            "".join(
                CODON_USAGE_TABLE.filter(amino_acid=amino_acid).sort(organism)["codon"][
                    -1
                ]
                for amino_acid in amino_acid_sequence
            )
        )

    @functools.cache
    def __len__(self):
        """The nucleotide length of the nucleic acid.

        >>> len(NucleicAcid("ATACGG"))
        6
        """
        return len(self.sequence)

    def __iter__(self):
        """Iterate over each codon triplet in the sequence."""
        return iter(self.sequence)

    def __str__(self) -> str:
        return self.sequence

    def __add__(self, other: "NucleicAcid") -> "NucleicAcid":
        return NucleicAcid(sequence=self.sequence + other.sequence)

    def __bool__(self) -> bool:
        return bool(self.sequence)

    @property
    @functools.cache
    def is_amino_acid(self):
        """Returns True if the sequence may be an amino acid (i.e. length % 3 == 0 and all valid codons).

        >>> NucleicAcid("AGT").is_amino_acid
        True

        >>> NucleicAcid("U").is_amino_acid
        False
        """
        return len(self.sequence) % 3 == 0

    @property
    def codons(self) -> typing.Iterator[str]:
        if not self.is_amino_acid:
            raise ValueError(
                "Nucleic acid sequence length must be a multiple of 3 to be a valid amino acid sequence."
            )
        return iter(self.sequence[i : i + 3] for i in range(0, len(self.sequence), 3))

    @property
    @functools.cache
    def amino_acid(self) -> str:
        """Returns the nucleic acid sequence as an amino acid sequence.

        >>> NucleicAcid("ATACGG").amino_acid
        'IR'
        """
        return "".join(
            CODON_TO_AMINO_ACID_MAP[self.sequence[i : i + 3]]
            for i in range(0, len(self.sequence), 3)
        )

    @property
    @functools.cache
    def a_ratio(self):
        """The ratio of A nucleotides in the sequence.

        >>> NucleicAcid("ACCGGGTTTT").a_ratio
        0.1
        """
        return len([it for it in self.sequence if it == "A"]) / len(self.sequence)

    @property
    @functools.cache
    def c_ratio(self):
        """The ratio of C nucleotides in the sequence.

        >>> NucleicAcid("ACCGGGTTTT").c_ratio
        0.2
        """
        return len([it for it in self.sequence if it == "C"]) / len(self.sequence)

    @property
    @functools.cache
    def g_ratio(self):
        """The ratio of G nucleotides in the sequence.

        >>> NucleicAcid("ACCGGGTTTT").g_ratio
        0.3
        """
        return len([it for it in self.sequence if it == "G"]) / len(self.sequence)

    @property
    @functools.cache
    def tu_ratio(self):
        """The ratio of T/U nucleotides in the sequence.

        >>> NucleicAcid("ACCGGGTTTT").tu_ratio
        0.4
        """
        return len([it for it in self.sequence if it in ["T", "U"]]) / len(
            self.sequence
        )

    @property
    def at_ratio(self):
        return self.a_ratio + self.tu_ratio

    @property
    def ga_ratio(self):
        return self.a_ratio + self.g_ratio

    @property
    def gc_ratio(self):
        return self.c_ratio + self.g_ratio

    @property
    @functools.cache
    def uridine_depletion(self):
        """The Uridine depletion of the sequence.

        >>> NucleicAcid("AAAAAT").uridine_depletion
        0.5
        """
        if not self.is_amino_acid:
            return None

        codons = list(self.codons)
        return len([it for it in codons if it[2] in ["T", "U"]]) / len(codons)

    @functools.cache
    def codon_adaptation_index(self, organism: str) -> float | None:
        """Calculate the Codon Adaptation Index of the sequence using the provided codon table.

        >>> NucleicAcid("ATACGG").codon_adaptation_index("h_sapiens")
        0.5869226668127944

        >>> NucleicAcid("ATACGG").codon_adaptation_index("m_musculus")
        0.5116817192534651

        >>> NucleicAcid("A").codon_adaptation_index("h_sapiens")


        >>> NucleicAcid("").codon_adaptation_index("h_sapiens")
        0
        """
        if not self.is_amino_acid:
            return None
        if not self.sequence:
            return 0
        weights = []
        codons = list(self.codons)
        for codon in codons:
            amino_acid = CODON_TO_AMINO_ACID_MAP[codon]
            codon_frequency = CODON_USAGE_TABLE.filter(codon=codon)[organism][0]
            max_codon_frequency = CODON_USAGE_TABLE.filter(amino_acid=amino_acid).sort(
                organism
            )[organism][-1]
            weights.append(codon_frequency / max_codon_frequency)
        cai = math.prod(weights) ** (1 / len(codons))
        return cai

    @property
    @functools.cache
    def minimum_free_energy(self) -> tuple[str, float]:
        """Calculate the minimum free energy of the sequence.

        >>> NucleicAcid("ACTCTTCTGGTCCCCACAGACTCAGAGAGAACCCACC").minimum_free_energy
        ('.((((.((((((......))).)))))))........', -10.199999809265137)
        """
        return tuple(RNA.fold_compound(str(self)).mfe())


@dataclasses.dataclass(eq=True, frozen=True, kw_only=True)
class mRNA:
    fivePrimeCap: NucleicAcid = dataclasses.field(
        default_factory=lambda: NucleicAcid(sequence="")
    )
    fivePrimeUTR: NucleicAcid = dataclasses.field(
        default_factory=lambda: NucleicAcid(sequence="")
    )
    codingSequence: NucleicAcid = dataclasses.field(
        default_factory=lambda: NucleicAcid(sequence="")
    )
    threePrimeUTR: NucleicAcid = dataclasses.field(
        default_factory=lambda: NucleicAcid(sequence="")
    )
    polyATail: NucleicAcid = dataclasses.field(
        default_factory=lambda: NucleicAcid(sequence="")
    )

    @property
    @functools.cache
    def combined(self) -> NucleicAcid:
        return (
            self.fivePrimeCap
            + self.fivePrimeUTR
            + self.codingSequence
            + self.threePrimeUTR
            + self.polyATail
        )

    @functools.cache
    def __len__(self):
        return len(self.combined)

    @functools.cache
    def codon_adaptation_index(self, organism: str):
        """The Codon Adaption Index of the the total mRNA.

        >>> mRNA(fivePrimeUTR=NucleicAcid("ATA"), codingSequence=NucleicAcid("CGG")).codon_adaptation_index("h_sapiens")
        0.5869226668127944
        """
        return self.combined.codon_adaptation_index(organism)

    @property
    @functools.cache
    def minimum_free_energy(self) -> tuple[str, float]:
        return self.combined.minimum_free_energy


def _sequence_is_nucleic_acid(sequence: str) -> bool:
    """
    >>> _sequence_is_nucleic_acid("ATCGTA")
    True
    >>> _sequence_is_nucleic_acid("ABCDEF")
    False
    >>> _sequence_is_nucleic_acid("A")
    False
    >>> _sequence_is_nucleic_acid("")
    False
    """
    return bool(
        len(sequence) % 3 == 0
        and re.search(r"^[ACGT]+$", sequence)
        and (
            ("T" in sequence and "U" not in sequence)
            or ("U" in sequence and "T" not in sequence)
        )
    )


def _sequence_is_amino_acid(sequence: str) -> bool:
    """
    >>> _sequence_is_amino_acid("ACDEM")
    True
    >>> _sequence_is_amino_acid("ATCGTAU")
    False
    >>> _sequence_is_amino_acid("")
    False
    """
    return bool(re.search(r"^[ACDEFGHIKLMNPQRSTVWY]+$", sequence))


def _optimize_sequence(
    sequence: str,
    organism: str = "h_sapiens",
    gc_min: float = 0.4,
    gc_max: float = 0.7,
    gc_window: int = 100,
    avoid_restriction_sites: list[str] | None = None,
    avoid_sequences: list[str] | None = None,
    avoid_repeat_length: int = 10,
    hairpin_stem_size: int = 10,
    hairpin_window: int = 60,
    avoid_poly_A: int = 9,
    avoid_poly_C: int = 6,
    avoid_poly_G: int = 6,
    avoid_poly_T: int = 9,
    avoid_uridine_depletion: bool = False,
    avoid_ribosome_slip: bool = False,
):
    input_sequence = sequence
    if _sequence_is_amino_acid(input_sequence):
        input_sequence = str(
            NucleicAcid.from_amino_acid(input_sequence, organism=organism)
        )
    elif not _sequence_is_nucleic_acid(input_sequence):
        raise RuntimeError("Sequence is not a recognizable nucleic or amino acid.")

    constraints = [
        EnforceGCContent(mini=gc_min, maxi=gc_max),
        EnforceGCContent(mini=gc_min, maxi=gc_max, window=gc_window),
        AvoidHairpins(stem_size=hairpin_stem_size, hairpin_window=hairpin_window),
        AvoidPattern(f"{avoid_poly_A}xA"),
        AvoidPattern(f"{avoid_poly_C}xC"),
        AvoidPattern(f"{avoid_poly_G}xG"),
        EnforceTranslation(),
    ]

    if avoid_uridine_depletion:
        constraints.append(
            AvoidRareCodons(0.1, codon_usage_table=URIDINE_DEPLETION_TABLE)
        )

    if avoid_ribosome_slip:
        constraints.append(AvoidPattern("3xT"))
    else:
        constraints.append(AvoidPattern(f"{avoid_poly_T}xT"))

    cut_site_constraints = [
        AvoidPattern(f"{site}_site") for site in avoid_restriction_sites or []
    ]
    constraints.extend(cut_site_constraints)

    custom_pattern_constraints = [AvoidPattern(it) for it in avoid_sequences or []]
    constraints.extend(custom_pattern_constraints)

    start = time.time()

    optimization_problem = DnaOptimizationProblem(
        sequence=input_sequence,
        constraints=constraints,
        objectives=[
            CodonOptimize(species=organism, method="use_best_codon"),
            UniquifyAllKmers(k=avoid_repeat_length),
        ],
    )
    optimization_problem.max_random_iters = MAX_RANDOM_ITERS

    try:
        optimization_problem.resolve_constraints()
    except Exception as e:
        raise RuntimeError(f"Input sequence is invalid, cannot optimize: {e}")

    try:
        optimization_problem.optimize()
    except Exception as e:
        raise RuntimeError(f"Optimization process failed: {e}")

    return {
        "input": sequence,
        "output": optimization_problem.sequence,
        "debug": {
            "time": (time.time() - start),
            "constraints": optimization_problem.constraints_text_summary(),
            "objectives": optimization_problem.objectives_text_summary(),
        },
    }


if __name__ == "__main__":
    app = typer.Typer()

    @app.command()
    def get_restriction_sites():
        click.echo(json.dumps(Bio.Restriction.Restriction_Dictionary.rest_dict))

    @app.command()
    def convert_to_nucleic_acid(sequence: str, organism: str):
        click.echo(
            json.dumps(str(NucleicAcid.from_amino_acid(sequence, organism))), nl=False
        )

    @app.command()
    def optimize_sequence(
        sequence: str,
        organism: str = "h_sapiens",
        gc_min: float = 0.4,
        gc_max: float = 0.7,
        gc_window: int = 100,
        avoid_restriction_sites: list[str] = [],
        avoid_sequences: list[str] = [],
        avoid_repeat_length: int = 10,
        hairpin_stem_size: int = 10,
        hairpin_window: int = 60,
        avoid_poly_A: int = 9,
        avoid_poly_C: int = 6,
        avoid_poly_G: int = 6,
        avoid_poly_T: int = 9,
        avoid_uridine_depletion: bool = False,
        avoid_ribosome_slip: bool = False,
    ):
        click.echo(
            json.dumps(
                _optimize_sequence(
                    sequence=sequence,
                    organism=organism,
                    gc_min=gc_min,
                    gc_max=gc_max,
                    gc_window=gc_window,
                    avoid_restriction_sites=avoid_restriction_sites,
                    avoid_sequences=avoid_sequences,
                    avoid_repeat_length=avoid_repeat_length,
                    hairpin_stem_size=hairpin_stem_size,
                    hairpin_window=hairpin_window,
                    avoid_poly_A=avoid_poly_A,
                    avoid_poly_C=avoid_poly_C,
                    avoid_poly_G=avoid_poly_G,
                    avoid_poly_T=avoid_poly_T,
                    avoid_uridine_depletion=avoid_uridine_depletion,
                    avoid_ribosome_slip=avoid_ribosome_slip,
                )
            )
        )

    @app.command()
    def analyze_sequence(sequence: str, organism: str):
        nucleic_acid = NucleicAcid(sequence)
        click.echo(
            json.dumps(
                {
                    "a_ratio": nucleic_acid.a_ratio,
                    "c_ratio": nucleic_acid.c_ratio,
                    "g_ratio": nucleic_acid.g_ratio,
                    "tu_ratio": nucleic_acid.tu_ratio,
                    "at_ratio": nucleic_acid.at_ratio,
                    "ga_ratio": nucleic_acid.ga_ratio,
                    "gc_ratio": nucleic_acid.gc_ratio,
                    "uridine_depletion": nucleic_acid.uridine_depletion,
                    "codon_adaptation_index": nucleic_acid.codon_adaptation_index(
                        organism
                    ),
                    "minimum_free_energy": nucleic_acid.minimum_free_energy,
                }
            )
        )

    app()
