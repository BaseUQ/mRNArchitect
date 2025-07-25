import functools
import math
import re
import time
import typing

import msgspec
from pandas.core.base import NoNewAttributesMixin

from ..constants import (
    CODON_TO_AMINO_ACID_MAP,
)
from ..organism import (
    KAZUSA_HOMO_SAPIENS,
    load_organism,
    Organism,
)
from ..types import AminoAcid, Codon
from .optimize import Constraint, Location, Objective, OptimizationError, optimize


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


class Sequence(msgspec.Struct, frozen=True, rename="camel"):
    """A sequence.

    >>> str(Sequence("ATT"))
    'ATT'
    """

    nucleic_acid_sequence: str
    """The nucleic acid sequence."""

    def __post_init__(self):
        if match := re.search(r"[^ACGT]+", self.nucleic_acid_sequence):
            raise ValueError(f"`sequence` contains invalid character: {match.group(0)}")

    @classmethod
    def from_nucleic_acid_sequence(cls, nucleic_acid_sequence: str) -> "Sequence":
        """Create a Sequence from a nucleic acid sequence.
        Ensures that the sequence will be upper cased and any `U` codons replaced with `T`.

        >>> str(Sequence.from_nucleic_acid_sequence("AuT"))
        'ATT'
        """
        return cls(nucleic_acid_sequence.upper().replace("U", "T"))

    @classmethod
    def from_nn(cls, nucleic_acid_sequence: str) -> "Sequence":
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
        organism = load_organism(organism)
        return cls(
            "".join(
                organism.max_codon(typing.cast(AminoAcid, amino_acid))
                for amino_acid in amino_acid_sequence.upper()
            ).upper()
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

    def analyze(self, organism: Organism | str | None = None) -> Analysis:
        """Collect and return a set of statistics about the sequence."""
        start = time.time()
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
            debug=Analysis.Debug(time_seconds=time.time() - start),
        )

    def optimize(
        self,
        constraints: typing.Sequence[Constraint],
        objectives: typing.Sequence[Objective],
    ) -> OptimizationResult:
        """Optimize the sequence based on the configuration parameters.

        >>> Sequence("ACGACCATTAAA").optimize(constraints=[], objectives=[Objective(organism="human")]).output
        Sequence(nucleic_acid_sequence='ACCACCATGAAC')
        """
        start = time.time()
        try:
            result = optimize(
                self.nucleic_acid_sequence,
                constraints=constraints,
                objectives=objectives,
            )
        except OptimizationError as e:
            return OptimizationResult(
                success=False,
                result=None,
                error=OptimizationResult.Error(
                    message=e.message,
                    problem=str(e.problem),
                    location=e.location,
                    constraint=e.constraint,
                ),
                time_in_seconds=(time.time() - start),
            )
        return OptimizationResult(
            success=True,
            result=OptimizationResult.Result(
                sequence=Sequence(result.sequence),
                constraints=result.constraints_text_summary(),
                objectives=result.objectives_text_summary(),
            ),
            error=None,
            time_in_seconds=(time.time() - start),
        )
