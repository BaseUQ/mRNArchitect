import functools
import math
import re
import time
import typing

import msgspec

from .organism import (
    AminoAcid,
    CODON_TO_AMINO_ACID_MAP,
    Codon,
    Organism,
    Organisms,
)


class OptimizationException(Exception):
    pass


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
        cls, amino_acid_sequence: str, organism: Organism = "h_sapiens"
    ) -> "NucleicAcid":
        """Create a NucleicAcid from an amino acid sequence.

        >>> str(NucleicAcid.from_amino_acid("IR"))
        'ATCAGA'
        """
        organisms = Organisms.load()
        return NucleicAcid(
            "".join(
                organisms.max_codon(organism, typing.cast(AminoAcid, amino_acid))
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
    def codons(self) -> typing.Iterator[Codon]:
        if not self.is_amino_acid:
            raise ValueError(
                "Nucleic acid sequence length must be a multiple of 3 to be a valid amino acid sequence."
            )
        for i in range(0, len(self.sequence), 3):
            yield typing.cast(Codon, self.sequence[i : i + 3])

    @property
    @functools.cache
    def amino_acid(self) -> str:
        """Returns the nucleic acid sequence as an amino acid sequence.

        >>> NucleicAcid("ATACGG").amino_acid
        'IR'
        """
        return "".join(CODON_TO_AMINO_ACID_MAP[codon] for codon in self.codons)

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
    def codon_adaptation_index(self, organism: Organism) -> float | None:
        """Calculate the Codon Adaptation Index of the sequence using the provided codon table.

        >>> NucleicAcid("ATACGG").codon_adaptation_index("h_sapiens")
        0.5812433943953039

        >>> NucleicAcid("ATACGG").codon_adaptation_index("m_musculus")
        0.5232073207377501

        >>> NucleicAcid("A").codon_adaptation_index("h_sapiens")


        >>> NucleicAcid("").codon_adaptation_index("h_sapiens")

        """
        if not self.sequence or not self.is_amino_acid:
            return None

        organisms = Organisms.load()
        weights = [organisms.weight(organism, codon) for codon in self.codons]
        cai = math.prod(weights) ** (1 / len(weights))
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

    def optimize(
        self,
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
    ) -> tuple["NucleicAcid", dict]:
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
            "R": {
                "AGA": 0.259,
                "AGG": 0.236,
                "CGA": 0.125,
                "CGC": 0.17,
                "CGG": 0.21,
                "CGT": 0,
            },
            "S": {
                "AGC": 0.357,
                "TCA": 0.256,
                "TCC": 0.314,
                "TCG": 0.073,
                "AGT": 0,
                "TCT": 0,
            },
            "T": {"ACA": 0.413, "ACC": 0.447, "ACG": 0.14, "ACT": 0},
            "V": {"GTA": 0.163, "GTC": 0.286, "GTG": 0.551, "GTT": 0},
            "W": {"TGG": 1.0},
            "Y": {"TAC": 1.0, "TAT": 0},
        }
        """Used to calculate uridine depletion."""

        constraints = [
            EnforceGCContent(mini=gc_content_min, maxi=gc_content_max),  # type: ignore
            EnforceGCContent(
                mini=gc_content_min,  # type: ignore
                maxi=gc_content_max,
                window=gc_content_window,
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
            AvoidPattern(f"{site}_site")
            for site in avoid_restriction_sites or []
            if site
        ]
        constraints.extend(cut_site_constraints)

        custom_pattern_constraints = [
            AvoidPattern(it) for it in avoid_sequences or [] if it
        ]
        constraints.extend(custom_pattern_constraints)

        start = time.time()

        optimization_problem = DnaOptimizationProblem(
            sequence=self.sequence,
            constraints=constraints,
            objectives=[
                CodonOptimize(species=organism, method="use_best_codon"),
                UniquifyAllKmers(k=avoid_repeat_length),
            ],
            logger=None,  # type: ignore
        )
        optimization_problem.max_random_iters = MAX_RANDOM_ITERS

        try:
            optimization_problem.resolve_constraints()
        except Exception as e:
            raise OptimizationException(
                f"Input sequence is invalid, cannot optimize: {e}"
            )

        try:
            optimization_problem.optimize()
        except Exception as e:
            raise OptimizationException(f"Optimization process failed: {e}")

        return (
            NucleicAcid(optimization_problem.sequence),
            {
                "time": (time.time() - start),
                "constraints": optimization_problem.constraints_text_summary(),
                "objectives": optimization_problem.objectives_text_summary(),
            },
        )
