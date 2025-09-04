from collections import defaultdict
import functools
import math
import re
import timeit
import typing

import msgspec

from ..constants import (
    CODON_TO_AMINO_ACID_MAP,
)
from ..organism import (
    KAZUSA_HOMO_SAPIENS,
    codon_usage_bias,
    CodonUsage,
    CodonUsageTable,
    load_organism,
    Organism,
)
from ..types import AminoAcid, Codon
from .optimize import OptimizationParameter, OptimizationError, optimize

_DEFAULT_OPTIMIZATION_PARAMETERS = [
    OptimizationParameter(
        enforce_sequence=False,
        organism=KAZUSA_HOMO_SAPIENS,
        avoid_repeat_length=10,
        enable_uridine_depletion=False,
        avoid_ribosome_slip=False,
        avoid_manufacture_restriction_sites=False,
        avoid_micro_rna_seed_sites=False,
        gc_content_min=0.4,
        gc_content_max=0.7,
        gc_content_window=100,
        avoid_restriction_sites=[],
        avoid_sequences=[],
        avoid_poly_a=9,
        avoid_poly_c=6,
        avoid_poly_g=6,
        avoid_poly_t=9,
        hairpin_stem_size=10,
        hairpin_window=60,
    )
]


class OptimizationException(Exception):
    pass


class MinimumFreeEnergy(msgspec.Struct, kw_only=True, rename="camel"):
    structure: str
    energy: float


class Analysis(msgspec.Struct, kw_only=True, rename="camel"):
    class Debug(msgspec.Struct, kw_only=True, rename="camel"):
        time_seconds: float

    a_ratio: float
    c_ratio: float
    g_ratio: float
    t_ratio: float
    at_ratio: float
    ga_ratio: float
    gc_ratio: float
    uridine_depletion: float | None
    codon_adaptation_index: float | None
    minimum_free_energy: MinimumFreeEnergy
    debug: Debug


class OptimizationResult(msgspec.Struct, kw_only=True, rename="camel"):
    class Error(msgspec.Struct, kw_only=True, rename="camel"):
        message: str
        problem: str | None
        constraint: str | None
        location: str | None

    class Result(msgspec.Struct, kw_only=True, rename="camel"):
        sequence: "Sequence"
        constraints: str | None
        objectives: str | None

    success: bool
    result: Result | None
    error: Error | None
    time_in_seconds: float


SequenceType = typing.Literal["nucleic-acid", "amino-acid", "auto-detect"]


class Sequence(msgspec.Struct, frozen=True, rename="camel"):
    """A nucleic acid sequence.

    >>> str(Sequence("ATT"))
    'ATT'
    """

    nucleic_acid_sequence: str
    """The nucleic acid sequence."""

    def __post_init__(self):
        if match := re.search(r"[^ACGT]+", self.nucleic_acid_sequence):
            raise ValueError(f"`sequence` contains invalid character: {match.group(0)}")

    @classmethod
    def from_string(
        cls,
        sequence: str,
        sequence_type: SequenceType = "auto-detect",
        organism: Organism | str = KAZUSA_HOMO_SAPIENS,
    ) -> "Sequence":
        """Create a Sequence from a raw string.

        >>> str(Sequence.from_string("AuT"))
        'ATT'

        >>> str(Sequence.from_amino_acid_sequence("Ir"))
        'ATCAGA'
        """

        _sequence_type = sequence_type
        if sequence_type == "auto-detect":
            match = re.search(r"[^ACGTUN]", sequence, re.IGNORECASE)
            _sequence_type = "amino-acid" if match else "nucleic-acid"

        if _sequence_type == "nucleic-acid":
            # Interpret sequence and nucleic acid sequence
            if re.search(r"[N]", sequence, re.IGNORECASE):
                raise RuntimeError(
                    "Cannot parse nucleic acid sequences with 'N' symbols."
                )
            return cls(sequence.upper().replace("U", "T"))

        # Interpret string as amino acid sequence
        if re.search(r"[X]", sequence, re.IGNORECASE):
            raise RuntimeError("Cannot parse amino acid sequences with 'X' symbols.")

        organism = load_organism(organism)
        return cls(
            "".join(
                organism.max_codon(typing.cast(AminoAcid, amino_acid))
                for amino_acid in sequence.upper()
            ).upper()
        )

    @classmethod
    def from_nucleic_acid_sequence(cls, nucleic_acid_sequence: str) -> "Sequence":
        """Create a Sequence from a nucleic acid sequence.
        Ensures that the sequence will be upper cased and any `U` codons replaced with `T`.

        >>> str(Sequence.from_nucleic_acid_sequence("AuT"))
        'ATT'
        """
        return cls.from_string(
            sequence=nucleic_acid_sequence, sequence_type="nucleic-acid"
        )

    @classmethod
    def from_na(cls, nucleic_acid_sequence: str) -> "Sequence":
        """Alias of Sequence.from_nucleic_acid_sequence(...)"""
        return cls.from_nucleic_acid_sequence(nucleic_acid_sequence)

    @classmethod
    def from_amino_acid_sequence(
        cls,
        amino_acid_sequence: str,
        organism: Organism | str = KAZUSA_HOMO_SAPIENS,
    ) -> "Sequence":
        """Create a Sequence from an amino acid sequence.
        The nucleic acid sequence will be codon optimized for the given `organism`.

        >>> str(Sequence.from_amino_acid_sequence("Ir"))
        'ATCAGA'
        """
        return cls.from_string(
            sequence=amino_acid_sequence, sequence_type="amino-acid", organism=organism
        )

    @classmethod
    def from_aa(
        cls, amino_acid_sequence, organism: Organism | str = KAZUSA_HOMO_SAPIENS
    ) -> "Sequence":
        """Alias from Sequence.from_amino_acid_sequence(...)"""
        return cls.from_amino_acid_sequence(amino_acid_sequence, organism)

    def __len__(self):
        """The nucleotide length of the nucleic acid.

        >>> len(Sequence("ATACGG"))
        6
        """
        return len(self.nucleic_acid_sequence)

    def __iter__(self):
        """Iterate over each codon triplet in the sequence."""
        return iter(self.nucleic_acid_sequence)

    def __str__(self) -> str:
        return self.nucleic_acid_sequence

    def __add__(self, other: "Sequence") -> "Sequence":
        return Sequence(self.nucleic_acid_sequence + other.nucleic_acid_sequence)

    def __bool__(self) -> bool:
        return bool(self.nucleic_acid_sequence)

    def __hash__(self):
        return hash(self.nucleic_acid_sequence)

    def __getitem__(self, val) -> "Sequence":
        return Sequence(self.nucleic_acid_sequence[val])

    def __contains__(self, val: "Sequence | str") -> bool:
        if isinstance(val, Sequence):
            return val.nucleic_acid_sequence in self.nucleic_acid_sequence
        if isinstance(val, str):
            return val in self.nucleic_acid_sequence
        raise NotImplementedError

    @property
    @functools.cache
    def is_amino_acid_sequence(self):
        """Returns True if the sequence may be an amino acid (i.e. length % 3 == 0).

        >>> Sequence("AGT").is_amino_acid_sequence
        True

        >>> Sequence("T").is_amino_acid_sequence
        False
        """
        return len(self.nucleic_acid_sequence) % 3 == 0

    @property
    def codons(self) -> typing.Iterator[Codon]:
        if not self.is_amino_acid_sequence:
            raise ValueError(
                "Nucleic acid sequence length must be a multiple of 3 to be a valid amino acid sequence."
            )
        for i in range(0, len(self.nucleic_acid_sequence), 3):
            yield typing.cast(Codon, self.nucleic_acid_sequence[i : i + 3])

    @property
    @functools.cache
    def amino_acid_sequence(self) -> str:
        """Returns the nucleic acid sequence as an amino acid sequence.

        >>> Sequence("ATACGG").amino_acid_sequence
        'IR'
        """
        return "".join(CODON_TO_AMINO_ACID_MAP[codon] for codon in self.codons)

    def reverse(self) -> "Sequence":
        """Returns a new Sequence that is the reverse of this sequence.

        >>> str(Sequence("ACGT").reverse())
        'TGCA'
        """
        return Sequence("".join(reversed(self.nucleic_acid_sequence)))

    def complement(self) -> "Sequence":
        """Returns a new Sequence that is the complement of this sequence.

        >>> str(Sequence("ATGC").complement())
        'TACG'
        """
        _COMPLEMENT_MAP = {"A": "T", "C": "G", "G": "C", "T": "A"}
        return Sequence("".join(_COMPLEMENT_MAP[n] for n in self.nucleic_acid_sequence))

    def reverse_complement(self) -> "Sequence":
        """Returns a new Sequence that is the reverse complement of this sequence.

        >>> str(Sequence("ATGC").reverse_complement())
        'GCAT'
        """
        return self.reverse().complement()

    @property
    @functools.cache
    def a_ratio(self):
        """The ratio of A nucleotides in the sequence.

        >>> Sequence("ACCGGGTTTT").a_ratio
        0.1
        """
        return len([it for it in self.nucleic_acid_sequence if it == "A"]) / len(
            self.nucleic_acid_sequence
        )

    @property
    @functools.cache
    def c_ratio(self):
        """The ratio of C nucleotides in the sequence.

        >>> Sequence("ACCGGGTTTT").c_ratio
        0.2
        """
        return len([it for it in self.nucleic_acid_sequence if it == "C"]) / len(
            self.nucleic_acid_sequence
        )

    @property
    @functools.cache
    def g_ratio(self):
        """The ratio of G nucleotides in the sequence.

        >>> Sequence("ACCGGGTTTT").g_ratio
        0.3
        """
        return len([it for it in self.nucleic_acid_sequence if it == "G"]) / len(
            self.nucleic_acid_sequence
        )

    @property
    @functools.cache
    def t_ratio(self):
        """The ratio of T nucleotides in the sequence.

        >>> Sequence("ACCGGGTTTT").t_ratio
        0.4
        """
        return len([it for it in self.nucleic_acid_sequence if it == "T"]) / len(
            self.nucleic_acid_sequence
        )

    @property
    def at_ratio(self):
        """The combined ratio of A and T/U nucleotides in the sequence.

        >>> Sequence("ACCGGGTTTT").at_ratio
        0.5
        """
        return self.a_ratio + self.t_ratio

    @property
    def ga_ratio(self):
        """The combined ratio of G and A nucleotides in the sequence.

        >>> Sequence("ACCGGGTTTT").ga_ratio
        0.4
        """
        return self.a_ratio + self.g_ratio

    @property
    def gc_ratio(self):
        """The combined ratio of G and C nucleotides in the sequence.

        >>> Sequence("ACCGGGTTTT").gc_ratio
        0.5
        """
        return self.c_ratio + self.g_ratio

    @property
    @functools.cache
    def uridine_depletion(self) -> float | None:
        """The Uridine depletion of the sequence.

        >>> Sequence("AAAAAT").uridine_depletion
        0.5
        """
        if not self.is_amino_acid_sequence:
            return None

        codons = list(self.codons)
        return len([it for it in codons if it[2] == "T"]) / len(codons)

    @functools.cache
    def codon_adaptation_index(
        self, organism: Organism | str = KAZUSA_HOMO_SAPIENS
    ) -> float | None:
        """Calculate the Codon Adaptation Index of the sequence using the provided codon table.

        >>> Sequence("ATACGG").codon_adaptation_index()
        0.5812433943953039

        >>> Sequence("A").codon_adaptation_index()


        >>> Sequence("").codon_adaptation_index()

        """
        if not self.nucleic_acid_sequence or not self.is_amino_acid_sequence:
            return None

        organism = load_organism(organism)

        weights = [organism.weight(codon) for codon in self.codons]
        cai = math.prod(weights) ** (1 / len(weights))
        return cai

    @property
    @functools.cache
    def minimum_free_energy(self) -> MinimumFreeEnergy:
        """Calculate the minimum free energy of the sequence.

        >>> Sequence("ACTCTTCTGGTCCCCACAGACTCAGAGAGAACCCACC").minimum_free_energy
        MinimumFreeEnergy(structure='.((((.((((((......))).)))))))........', energy=-10.199999809265137)
        """
        import RNA

        mfe = RNA.fold_compound(str(self)).mfe()
        return MinimumFreeEnergy(structure=mfe[0], energy=mfe[1])

    @property
    @functools.cache
    def gini_coefficient(self) -> float | None:
        """Calculate the Gini coefficient of the sequence.
        see: https://en.wikipedia.org/wiki/Gini_coefficient

        >>> Sequence("ACTTCA").gini_coefficient
        0.0

        >>> Sequence("AAAAAACCCTTT").gini_coefficient
        0.08333333333333333
        """
        if not self.is_amino_acid_sequence:
            return None

        counts = defaultdict(int)
        for codon in self.codons:
            counts[codon] += 1

        cumulative_absolute_difference = sum(
            abs(a - b) for a in counts.values() for b in counts.values()
        )
        average = sum(count for count in counts.values()) / len(counts)
        gini_coefficient = cumulative_absolute_difference / (
            pow(2 * len(counts), 2) * average
        )
        return gini_coefficient

    @property
    @functools.cache
    def cpg_ratio(self):
        """Calculate the CpG ratio.

        >>> Sequence("ACG").cpg_ratio
        0.3333333333333333

        >>> Sequence("AGC").cpg_ratio
        0.0
        """
        count = 0
        for i in range(0, len(self) - 1):
            if (
                self.nucleic_acid_sequence[i] == "C"
                and self.nucleic_acid_sequence[i + 1] == "G"
            ):
                count += 1
        return count / len(self)

    @property
    @functools.cache
    def slippery_site_ratio(self):
        """Calculate the slippery site (TTT) ratio.

        >>> Sequence("TTT").slippery_site_ratio
        0.3333333333333333

        >>> Sequence("AGC").slippery_site_ratio
        0.0
        """
        count = 0
        for i in range(0, len(self) - 2):
            if (
                self.nucleic_acid_sequence[i] == "T"
                and self.nucleic_acid_sequence[i + 1] == "T"
                and self.nucleic_acid_sequence[i + 2] == "T"
            ):
                count += 1
        return count / len(self)

    @functools.cache
    def rare_codon_ratio(
        self, organism: Organism | str = KAZUSA_HOMO_SAPIENS
    ) -> float | None:
        """Get the ratio of rare codons in the sequence.
        A rare codon is defined as any codon that is NOT the most frequent codon
        according to the codon usage table for the given organism.

        >>> Sequence("AAA").rare_codon_ratio()
        0.3333333333333333

        >>> Sequence("CTG").rare_codon_ratio()
        0.0
        """
        if not self.is_amino_acid_sequence:
            return None
        organism = load_organism(organism)
        count = 0
        for codon in self.codons:
            amino_acid = CODON_TO_AMINO_ACID_MAP[codon]
            min_codon = organism.min_codon(amino_acid)
            max_codon = organism.max_codon(amino_acid)
            if codon == min_codon and min_codon != max_codon:
                count += 1
        return count / len(self)

    @property
    @functools.cache
    def codon_usage_table(self) -> CodonUsageTable | None:
        """Generates a codon usage table from this sequence."""
        if not self.is_amino_acid_sequence:
            return None
        counts: dict[AminoAcid, dict[Codon, int]] = defaultdict(
            lambda: defaultdict(int)
        )
        for codon in self.codons:
            amino_acid = CODON_TO_AMINO_ACID_MAP[codon]
            counts[amino_acid][codon] += 1

        codon_usage_table: CodonUsageTable = {
            codon: CodonUsage(
                codon=codon,
                number=counts[amino_acid][codon],
                frequency=(
                    counts[amino_acid][codon]
                    / (sum(counts[amino_acid].values() or [1]))
                ),
            )
            for codon, amino_acid in CODON_TO_AMINO_ACID_MAP.items()
        }
        return codon_usage_table

    @functools.cache
    def codon_usage_bias(
        self, organism: Organism | str = KAZUSA_HOMO_SAPIENS
    ) -> float | None:
        """Codon usage bias of this sequence with respect to the given organism.
        see: https://onlinelibrary.wiley.com/doi/10.1046/j.1365-2958.1998.01008.x
        """
        if not self.is_amino_acid_sequence or not self.codon_usage_table:
            return None
        return codon_usage_bias(
            self.codon_usage_table, load_organism(organism).codon_usage_table
        )

    def analyze(self, organism: Organism | str = KAZUSA_HOMO_SAPIENS) -> Analysis:
        """Collect and return a set of statistics about the sequence."""
        start = timeit.default_timer()
        minimum_free_energy = self.minimum_free_energy
        return Analysis(
            a_ratio=self.a_ratio,
            c_ratio=self.c_ratio,
            g_ratio=self.g_ratio,
            t_ratio=self.t_ratio,
            at_ratio=self.at_ratio,
            ga_ratio=self.ga_ratio,
            gc_ratio=self.gc_ratio,
            uridine_depletion=self.uridine_depletion,
            codon_adaptation_index=self.codon_adaptation_index(organism),
            minimum_free_energy=minimum_free_energy,
            debug=Analysis.Debug(time_seconds=timeit.default_timer() - start),
        )

    def optimize(
        self, parameters: typing.Sequence[OptimizationParameter] | None = None
    ) -> OptimizationResult:
        """Optimize the sequence based on the configuration parameters.

        >>> Sequence("ACGACCATTAAA").optimize(parameters=[OptimizationParameter(organism="human")]).result.sequence
        Sequence(nucleic_acid_sequence='ACCACCATCAAG')
        """
        start = timeit.default_timer()
        try:
            result = optimize(
                self.nucleic_acid_sequence,
                parameters=parameters or _DEFAULT_OPTIMIZATION_PARAMETERS,
            )
        except OptimizationError as e:
            return OptimizationResult(
                success=False,
                result=None,
                error=OptimizationResult.Error(
                    message=str(e.message),
                    problem=str(e.problem),
                    location=str(e.location),
                    constraint=str(e.constraint),
                ),
                time_in_seconds=(timeit.default_timer() - start),
            )
        return OptimizationResult(
            success=True,
            result=OptimizationResult.Result(
                sequence=Sequence(result.sequence),
                constraints=result.constraints_text_summary(),
                objectives=result.objectives_text_summary(),
            ),
            error=None,
            time_in_seconds=(timeit.default_timer() - start),
        )
