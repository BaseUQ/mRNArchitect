import functools
import json
import math
import re
import time
import typing
import sys

import msgspec

MAX_RANDOM_ITERS = 20_000
"""The maximum number of iterations to run when optimizing."""

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
"""Used to calculate uridine depletion."""

# REF_CODON_USAGE_TABLE = """amino_acid codon h_sapiens m_musculus
# * TAA 0.3 0.29
# * TAG 0.24 0.24
# * TGA 0.47 0.47
# A GCA 0.23 0.23
# A GCC 0.4 0.38
# A GCG 0.11 0.09
# A GCT 0.27 0.29
# C TGC 0.54 0.52
# C TGT 0.46 0.48
# D GAC 0.54 0.55
# D GAT 0.46 0.45
# E GAA 0.42 0.41
# E GAG 0.58 0.59
# F TTC 0.54 0.56
# F TTT 0.46 0.44
# G GGA 0.25 0.26
# G GGC 0.34 0.33
# G GGG 0.25 0.24
# G GGT 0.16 0.18
# H CAC 0.58 0.59
# H CAT 0.42 0.41
# I ATA 0.17 0.16
# I ATC 0.47 0.5
# I ATT 0.36 0.34
# K AAA 0.43 0.39
# K AAG 0.57 0.61
# L CTA 0.07 0.08
# L CTC 0.2 0.2
# L CTG 0.4 0.39
# L CTT 0.13 0.13
# L TTA 0.08 0.07
# L TTG 0.13 0.13
# M ATG 1 1
# N AAC 0.53 0.57
# N AAT 0.47 0.43
# P CCA 0.28 0.29
# P CCC 0.32 0.3
# P CCG 0.11 0.1
# P CCT 0.29 0.31
# Q CAA 0.27 0.26
# Q CAG 0.73 0.74
# R AGA 0.21 0.22
# R AGG 0.21 0.22
# R CGA 0.11 0.12
# R CGC 0.18 0.17
# R CGG 0.2 0.18
# R CGT 0.08 0.09
# S AGC 0.24 0.24
# S AGT 0.15 0.15
# S TCA 0.15 0.14
# S TCC 0.22 0.22
# S TCG 0.05 0.05
# S TCT 0.19 0.2
# T ACA 0.28 0.29
# T ACC 0.36 0.35
# T ACG 0.11 0.1
# T ACT 0.25 0.25
# V GTA 0.12 0.12
# V GTC 0.24 0.25
# V GTG 0.46 0.46
# V GTT 0.18 0.17
# W TGG 1 1
# Y TAC 0.56 0.57
# Y TAT 0.44 0.43"""


CODON_FREQUENCY_TABLE = {
    "h_sapiens": {
        "K": {"AAA": 0.43, "AAG": 0.57},
        "Y": {"TAC": 0.56, "TAT": 0.44},
        "H": {"CAC": 0.58, "CAT": 0.42},
        "T": {"ACA": 0.28, "ACC": 0.36, "ACG": 0.11, "ACT": 0.25},
        "*": {"TAA": 0.3, "TAG": 0.24, "TGA": 0.47},
        "V": {"GTA": 0.12, "GTC": 0.24, "GTG": 0.46, "GTT": 0.18},
        "Q": {"CAA": 0.27, "CAG": 0.73},
        "I": {"ATA": 0.17, "ATC": 0.47, "ATT": 0.36},
        "S": {
            "AGC": 0.24,
            "AGT": 0.15,
            "TCA": 0.15,
            "TCC": 0.22,
            "TCG": 0.05,
            "TCT": 0.19,
        },
        "W": {"TGG": 1.0},
        "L": {
            "CTA": 0.07,
            "CTC": 0.2,
            "CTG": 0.4,
            "CTT": 0.13,
            "TTA": 0.08,
            "TTG": 0.13,
        },
        "A": {"GCA": 0.23, "GCC": 0.4, "GCG": 0.11, "GCT": 0.27},
        "M": {"ATG": 1.0},
        "D": {"GAC": 0.54, "GAT": 0.46},
        "G": {"GGA": 0.25, "GGC": 0.34, "GGG": 0.25, "GGT": 0.16},
        "R": {
            "AGA": 0.21,
            "AGG": 0.21,
            "CGA": 0.11,
            "CGC": 0.18,
            "CGG": 0.2,
            "CGT": 0.08,
        },
        "F": {"TTC": 0.54, "TTT": 0.46},
        "N": {"AAC": 0.53, "AAT": 0.47},
        "P": {"CCA": 0.28, "CCC": 0.32, "CCG": 0.11, "CCT": 0.29},
        "E": {"GAA": 0.42, "GAG": 0.58},
        "C": {"TGC": 0.54, "TGT": 0.46},
    },
    "m_musculus": {
        "D": {"GAC": 0.55, "GAT": 0.45},
        "Q": {"CAA": 0.26, "CAG": 0.74},
        "C": {"TGC": 0.52, "TGT": 0.48},
        "R": {
            "AGA": 0.22,
            "AGG": 0.22,
            "CGA": 0.12,
            "CGC": 0.17,
            "CGG": 0.18,
            "CGT": 0.09,
        },
        "K": {"AAA": 0.39, "AAG": 0.61},
        "E": {"GAA": 0.41, "GAG": 0.59},
        "N": {"AAC": 0.57, "AAT": 0.43},
        "*": {"TAA": 0.29, "TAG": 0.24, "TGA": 0.47},
        "G": {"GGA": 0.26, "GGC": 0.33, "GGG": 0.24, "GGT": 0.18},
        "Y": {"TAC": 0.57, "TAT": 0.43},
        "H": {"CAC": 0.59, "CAT": 0.41},
        "W": {"TGG": 1.0},
        "M": {"ATG": 1.0},
        "S": {
            "AGC": 0.24,
            "AGT": 0.15,
            "TCA": 0.14,
            "TCC": 0.22,
            "TCG": 0.05,
            "TCT": 0.2,
        },
        "V": {"GTA": 0.12, "GTC": 0.25, "GTG": 0.46, "GTT": 0.17},
        "T": {"ACA": 0.29, "ACC": 0.35, "ACG": 0.1, "ACT": 0.25},
        "P": {"CCA": 0.29, "CCC": 0.3, "CCG": 0.1, "CCT": 0.31},
        "F": {"TTC": 0.56, "TTT": 0.44},
        "I": {"ATA": 0.16, "ATC": 0.5, "ATT": 0.34},
        "A": {"GCA": 0.23, "GCC": 0.38, "GCG": 0.09, "GCT": 0.29},
        "L": {
            "CTA": 0.08,
            "CTC": 0.2,
            "CTG": 0.39,
            "CTT": 0.13,
            "TTA": 0.07,
            "TTG": 0.13,
        },
    },
}
"""Maps an organism, amino acid and codon to a frequency."""

CODON_MAX_FREQUENCY_TABLE = {
    "h_sapiens": {
        "P": {"codon": "CCC", "frequency": 0.32},
        "G": {"codon": "GGC", "frequency": 0.34},
        "R": {"codon": "AGG", "frequency": 0.21},
        "H": {"codon": "CAC", "frequency": 0.58},
        "Y": {"codon": "TAC", "frequency": 0.56},
        "F": {"codon": "TTC", "frequency": 0.54},
        "T": {"codon": "ACC", "frequency": 0.36},
        "M": {"codon": "ATG", "frequency": 1.0},
        "E": {"codon": "GAG", "frequency": 0.58},
        "I": {"codon": "ATC", "frequency": 0.47},
        "K": {"codon": "AAG", "frequency": 0.57},
        "N": {"codon": "AAC", "frequency": 0.53},
        "A": {"codon": "GCC", "frequency": 0.4},
        "V": {"codon": "GTG", "frequency": 0.46},
        "S": {"codon": "AGC", "frequency": 0.24},
        "Q": {"codon": "CAG", "frequency": 0.73},
        "*": {"codon": "TGA", "frequency": 0.47},
        "W": {"codon": "TGG", "frequency": 1.0},
        "D": {"codon": "GAC", "frequency": 0.54},
        "C": {"codon": "TGC", "frequency": 0.54},
        "L": {"codon": "CTG", "frequency": 0.4},
    },
    "m_musculus": {
        "F": {"codon": "TTC", "frequency": 0.56},
        "L": {"codon": "CTG", "frequency": 0.39},
        "I": {"codon": "ATC", "frequency": 0.5},
        "W": {"codon": "TGG", "frequency": 1.0},
        "Q": {"codon": "CAG", "frequency": 0.74},
        "H": {"codon": "CAC", "frequency": 0.59},
        "*": {"codon": "TGA", "frequency": 0.47},
        "D": {"codon": "GAC", "frequency": 0.55},
        "M": {"codon": "ATG", "frequency": 1.0},
        "G": {"codon": "GGC", "frequency": 0.33},
        "T": {"codon": "ACC", "frequency": 0.35},
        "C": {"codon": "TGC", "frequency": 0.52},
        "R": {"codon": "AGG", "frequency": 0.22},
        "A": {"codon": "GCC", "frequency": 0.38},
        "S": {"codon": "AGC", "frequency": 0.24},
        "K": {"codon": "AAG", "frequency": 0.61},
        "V": {"codon": "GTG", "frequency": 0.46},
        "E": {"codon": "GAG", "frequency": 0.59},
        "Y": {"codon": "TAC", "frequency": 0.57},
        "N": {"codon": "AAC", "frequency": 0.57},
        "P": {"codon": "CCT", "frequency": 0.31},
    },
}
"""Maps organism and amino acid to the codon with highest frequency."""

CODON_TO_AMINO_ACID_MAP = {
    "TAA": "*",
    "TAG": "*",
    "TGA": "*",
    "GCA": "A",
    "GCC": "A",
    "GCG": "A",
    "GCT": "A",
    "TGC": "C",
    "TGT": "C",
    "GAC": "D",
    "GAT": "D",
    "GAA": "E",
    "GAG": "E",
    "TTC": "F",
    "TTT": "F",
    "GGA": "G",
    "GGC": "G",
    "GGG": "G",
    "GGT": "G",
    "CAC": "H",
    "CAT": "H",
    "ATA": "I",
    "ATC": "I",
    "ATT": "I",
    "AAA": "K",
    "AAG": "K",
    "CTA": "L",
    "CTC": "L",
    "CTG": "L",
    "CTT": "L",
    "TTA": "L",
    "TTG": "L",
    "ATG": "M",
    "AAC": "N",
    "AAT": "N",
    "CCA": "P",
    "CCC": "P",
    "CCG": "P",
    "CCT": "P",
    "CAA": "Q",
    "CAG": "Q",
    "AGA": "R",
    "AGG": "R",
    "CGA": "R",
    "CGC": "R",
    "CGG": "R",
    "CGT": "R",
    "AGC": "S",
    "AGT": "S",
    "TCA": "S",
    "TCC": "S",
    "TCG": "S",
    "TCT": "S",
    "ACA": "T",
    "ACC": "T",
    "ACG": "T",
    "ACT": "T",
    "GTA": "V",
    "GTC": "V",
    "GTG": "V",
    "GTT": "V",
    "TGG": "W",
    "TAC": "Y",
    "TAT": "Y",
}
"""Maps a codon to an amino acid symbol."""


class NucleicAcid(msgspec.Struct):
    """A nucleic acid sequence.

    >>> str(NucleicAcid("att"))
    'ATT'

    >>> str(NucleicAcid("AtU"))
    'ATT'
    """

    sequence: str
    """The nucleic acid sequence."""

    def __post_init__(self):
        # Normalize sequence to be DNA-like
        self.sequence = self.sequence.upper().replace("U", "T")
        if match := re.search(r"[^ACGT]+", self.sequence):
            raise ValueError(f"`sequence` contains invalid character: {match.group(0)}")

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
                CODON_MAX_FREQUENCY_TABLE[organism][amino_acid]["codon"]
                for amino_acid in amino_acid_sequence
            )
        )

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

    def __hash__(self):
        return hash(self.sequence)

    @property
    @functools.cache
    def is_amino_acid(self):
        """Returns True if the sequence may be an amino acid (i.e. length % 3 == 0).

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
    def t_ratio(self):
        """The ratio of T nucleotides in the sequence.

        >>> NucleicAcid("ACCGGGTTTT").t_ratio
        0.4
        """
        return len([it for it in self.sequence if it == "T"]) / len(self.sequence)

    @property
    def at_ratio(self):
        """The combined ratio of A and T/U nucleotides in the sequence.

        >>> NucleicAcid("ACCGGGTTTT").at_ratio
        0.5
        """
        return self.a_ratio + self.t_ratio

    @property
    def ga_ratio(self):
        """The combined ratio of G and A nucleotides in the sequence.

        >>> NucleicAcid("ACCGGGTTTT").ga_ratio
        0.4
        """
        return self.a_ratio + self.g_ratio

    @property
    def gc_ratio(self):
        """The combined ratio of G and C nucleotides in the sequence.

        >>> NucleicAcid("ACCGGGTTTT").gc_ratio
        0.5
        """
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
        return len([it for it in codons if it[2] == "T"]) / len(codons)

    @functools.cache
    def codon_adaptation_index(self, organism: str) -> float | None:
        """Calculate the Codon Adaptation Index of the sequence using the provided codon table.

        >>> NucleicAcid("ATACGG").codon_adaptation_index("h_sapiens")
        0.5869226668127944

        >>> NucleicAcid("ATACGG").codon_adaptation_index("m_musculus")
        0.5116817192534651

        >>> NucleicAcid("A").codon_adaptation_index("h_sapiens")


        >>> NucleicAcid("").codon_adaptation_index("h_sapiens")

        """
        if not self.sequence or not self.is_amino_acid:
            return None
        weights = []
        codons = list(self.codons)
        for codon in codons:
            amino_acid = CODON_TO_AMINO_ACID_MAP[codon]
            codon_frequency = CODON_FREQUENCY_TABLE[organism][amino_acid][codon]
            max_codon_frequency = CODON_MAX_FREQUENCY_TABLE[organism][amino_acid][
                "frequency"
            ]
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
        import RNA

        return tuple(RNA.fold_compound(str(self)).mfe())


def _optimize_sequence(
    sequence: str,
    organism: str = "h_sapiens",
    gc_content_min: float = 0.4,
    gc_content_max: float = 0.7,
    gc_content_window: int = 100,
    avoid_restriction_sites: list[str] | None = None,
    avoid_sequences: list[str] | None = None,
    avoid_repeat_length: int = 10,
    hairpin_stem_size: int = 10,
    hairpin_window: int = 60,
    avoid_poly_a: int = 9,
    avoid_poly_c: int = 6,
    avoid_poly_g: int = 6,
    avoid_poly_t: int = 9,
    avoid_uridine_depletion: bool = False,
    avoid_ribosome_slip: bool = False,
):
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

    constraints = [
        EnforceGCContent(mini=gc_content_min, maxi=gc_content_max),
        EnforceGCContent(
            mini=gc_content_min, maxi=gc_content_max, window=gc_content_window
        ),
        AvoidHairpins(stem_size=hairpin_stem_size, hairpin_window=hairpin_window),
        AvoidPattern(f"{avoid_poly_a}xA"),
        AvoidPattern(f"{avoid_poly_c}xC"),
        AvoidPattern(f"{avoid_poly_g}xG"),
        EnforceTranslation(),
    ]

    if avoid_uridine_depletion:
        constraints.append(
            AvoidRareCodons(0.1, codon_usage_table=URIDINE_DEPLETION_TABLE)
        )

    if avoid_ribosome_slip:
        constraints.append(AvoidPattern("3xT"))
    else:
        constraints.append(AvoidPattern(f"{avoid_poly_t}xT"))

    cut_site_constraints = [
        AvoidPattern(f"{site}_site") for site in avoid_restriction_sites or [] if site
    ]
    constraints.extend(cut_site_constraints)

    custom_pattern_constraints = [
        AvoidPattern(it) for it in avoid_sequences or [] if it
    ]
    constraints.extend(custom_pattern_constraints)

    start = time.time()

    optimization_problem = DnaOptimizationProblem(
        sequence=sequence,
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
    command = sys.argv[1]

    if command == "get-resition-sites":
        import Bio.Restriction.Restriction_Dictionary

        print(json.dumps(Bio.Restriction.Restriction_Dictionary.rest_dict), end="")
    elif command == "convert-sequence-to-nucleic-acid":
        sequence = sys.argv[2]
        organism = sys.argv[3]
        print(json.dumps(str(NucleicAcid.from_amino_acid(sequence, organism))), end="")
    elif command == "analyze-sequence":
        sequence = sys.argv[2]
        organism = sys.argv[3]
        nucleic_acid = NucleicAcid(sequence)
        start = time.time()
        analysis = {
            "a_ratio": nucleic_acid.a_ratio,
            "c_ratio": nucleic_acid.c_ratio,
            "g_ratio": nucleic_acid.g_ratio,
            "t_ratio": nucleic_acid.t_ratio,
            "at_ratio": nucleic_acid.at_ratio,
            "ga_ratio": nucleic_acid.ga_ratio,
            "gc_ratio": nucleic_acid.gc_ratio,
            "uridine_depletion": nucleic_acid.uridine_depletion,
            "codon_adaptation_index": nucleic_acid.codon_adaptation_index(organism),
            "minimum_free_energy": nucleic_acid.minimum_free_energy,
        }
        analysis["debug"] = {"time": time.time() - start}
        print(json.dumps(analysis), end="")
    elif command == "optimize-sequence":
        import msgspec

        class OptimizationRequest(msgspec.Struct, kw_only=True, rename="camel"):
            sequence: str
            organism: typing.Literal["h_sapiens", "m_musculus"]
            avoid_uridine_depletion: bool
            avoid_ribosome_slip: bool
            gc_content_min: float
            gc_content_max: float
            gc_content_window: int
            avoid_restriction_sites: list[str]
            avoid_sequences: str | list[str]
            avoid_repeat_length: int
            avoid_poly_a: int
            avoid_poly_c: int
            avoid_poly_g: int
            avoid_poly_t: int
            hairpin_stem_size: int
            hairpin_window: int

            def __post_init__(self):
                if isinstance(self.avoid_sequences, str):
                    self.avoid_sequences = self.avoid_sequences.split(",")
                if self.gc_content_min > self.gc_content_max:
                    raise ValueError("GC content minmum must be less than maximum.")

            def to_dict(self):
                return {f: getattr(self, f) for f in self.__struct_fields__}

        request = msgspec.json.decode(sys.argv[2], type=OptimizationRequest)
        print(json.dumps(_optimize_sequence(**request.to_dict())), end="")
    else:
        raise RuntimeError(f"Unknown command: {command}")
