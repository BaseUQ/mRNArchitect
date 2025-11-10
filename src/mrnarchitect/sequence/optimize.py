import functools
import pathlib
import timeit
import typing

import msgspec
from dnachisel import Location as DnaChiselLocation
from dnachisel.builtin_specifications import (
    AvoidPattern,
    AvoidHairpins,
    AvoidRareCodons,
    EnforceGCContent,
    EnforceSequence,
    EnforceTranslation,
    UniquifyAllKmers,
)
from dnachisel.builtin_specifications.codon_optimization import CodonOptimize
from dnachisel.DnaOptimizationProblem import DnaOptimizationProblem, NoSolutionError

from mrnarchitect.constants import AMINO_ACIDS, CodonTable
from mrnarchitect.types import Organism
from mrnarchitect.data import load_codon_usage_table
from mrnarchitect.organism import CodonUsageTable
from mrnarchitect.sequence.sequence import Sequence
from mrnarchitect.sequence.specifications.constraints import CAIRange
from mrnarchitect.sequence.specifications.objectives import OptimizeTAI, TargetPseudoMFE

OptimizationError = NoSolutionError


@functools.cache
def _load_microrna_seed_sites() -> list[str]:
    """Load microRNA seed sites from file.

    >>> len(_load_microrna_seed_sites())
    50

    >>> all(len(it) == 7 for it in _load_microrna_seed_sites())
    True

    >>> all("U" not in it for it in _load_microrna_seed_sites())
    True
    """
    with open(pathlib.Path(__file__).parent / "microRNAs.txt", "r") as f:
        lines = f.readlines()
        return [
            line.strip().split()[2].replace("U", "T")
            for line in lines[1:]  # ignore header
        ]


@functools.cache
def _load_manufacture_restriction_sites() -> list[str]:
    """Load manufacture restriction sites.

    >>> len(_load_manufacture_restriction_sites())
    4

    >>> all("U" not in it for it in _load_manufacture_restriction_sites())
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


class Location(msgspec.Struct, frozen=True, kw_only=True):
    start_coordinate: int | None = None
    """The start coordinate (1-based)."""
    end_coordinate: int | None = None
    """The end coordinate (1-based, inclusive)."""

    def __post_init__(self):
        if (
            self.start_coordinate is not None
            and self.end_coordinate is not None
            and self.start_coordinate >= self.end_coordinate
        ):
            raise ValueError("`start_coordinate` must be less than `end_coordinate`.")

    @property
    def dnachisel_location(self):
        """Returns a DNAChisel Location.

        >>> Location(start_coordinate=1, end_coordinate=30).dnachisel_location.start
        0

        >>> Location(start_coordinate=1, end_coordinate=30).dnachisel_location.end
        30
        """
        if self.start_coordinate is None or self.end_coordinate is None:
            return None

        # NOTE: DNAChisel locations use python slice rules (i.e. they are 0-based, and exclusive of the end index)
        return DnaChiselLocation(self.start_coordinate - 1, self.end_coordinate)


class OptimizationParameter(
    Location, frozen=True, kw_only=True, forbid_unknown_fields=True
):
    enforce_sequence: bool = False
    codon_usage_table: CodonUsageTable | Organism | None = None
    optimize_cai: bool = False
    optimize_mfe: float | None = None
    optimize_tai: float | None = None
    avoid_repeat_length: int | None = None
    enable_uridine_depletion: bool = False
    avoid_ribosome_slip: bool = False
    avoid_manufacture_restriction_sites: bool = False
    avoid_micro_rna_seed_sites: bool = False
    gc_content_global_min: float | None = None
    gc_content_global_max: float | None = None
    gc_content_window_min: float | None = None
    gc_content_window_max: float | None = None
    gc_content_window_size: int | None = None
    avoid_restriction_sites: list[str] = msgspec.field(default_factory=list)
    avoid_sequences: list[str] = msgspec.field(default_factory=list)
    avoid_poly_a: int | None = None
    avoid_poly_c: int | None = None
    avoid_poly_g: int | None = None
    avoid_poly_t: int | None = None
    hairpin_stem_size: int | None = None
    hairpin_window: int | None = None
    cai_min: float | None = None
    cai_max: float | None = None

    def __post_init__(self):
        super().__post_init__()
        if (
            self.gc_content_global_min is not None
            and self.gc_content_global_max is not None
            and self.gc_content_global_min > self.gc_content_global_max
        ):
            raise ValueError(
                "GC content global minimum must be less than global maximum."
            )

        if (
            self.gc_content_window_min is not None
            and self.gc_content_window_max is not None
            and self.gc_content_window_min > self.gc_content_window_max
        ):
            raise ValueError(
                "GC content window minimum must be less than window maximum."
            )

    def dnachisel(self, nucleic_acid_sequence: str) -> tuple[list, list]:
        location = self.dnachisel_location
        if self.enforce_sequence:
            if not location:
                raise RuntimeError("Cannot enforce sequence without a location.")
            return [
                EnforceSequence(
                    nucleic_acid_sequence[location.start : location.end],
                    location=location,
                )
            ], []

        constraints: list = [EnforceTranslation()]
        objectives: list = []

        if (
            self.gc_content_global_min is not None
            and self.gc_content_global_max is not None
        ):
            constraints.append(
                EnforceGCContent(
                    mini=self.gc_content_global_min,  # type: ignore
                    maxi=self.gc_content_global_max,
                    location=location,
                )
            )
        if (
            self.gc_content_window_min is not None
            and self.gc_content_window_max is not None
            and self.gc_content_window_size is not None
        ):
            constraints.append(
                EnforceGCContent(
                    mini=self.gc_content_window_min,  # type: ignore
                    maxi=self.gc_content_window_max,
                    window=self.gc_content_window_size,
                    location=location,
                )
            )

        if self.hairpin_stem_size is not None and self.hairpin_window is not None:
            constraints.append(
                AvoidHairpins(
                    stem_size=self.hairpin_stem_size,
                    hairpin_window=self.hairpin_window,
                    location=location,
                )
            )
        if self.avoid_poly_a is not None:
            constraints.append(
                AvoidPattern(f"{self.avoid_poly_a}xA", location=location)
            )
        if self.avoid_poly_c is not None:
            constraints.append(
                AvoidPattern(f"{self.avoid_poly_c}xC", location=location)
            )
        if self.avoid_poly_g is not None:
            constraints.append(
                AvoidPattern(f"{self.avoid_poly_g}xG", location=location)
            )
        if self.avoid_poly_t is not None:
            constraints.append(
                AvoidPattern(f"{self.avoid_poly_t}xT", location=location)
            )

        if self.enable_uridine_depletion:
            uridine_depletion_codon_usage_table = {
                amino_acid: {
                    codon: (0.0 if codon[-1] == "T" else 1.0)
                    for codon in CodonTable.codons(amino_acid)
                }
                for amino_acid in AMINO_ACIDS
            }
            constraints.append(
                AvoidRareCodons(
                    0.5,
                    codon_usage_table=uridine_depletion_codon_usage_table,
                    location=location,
                )
            )

        if self.avoid_ribosome_slip:
            constraints.append(AvoidPattern("3xT", location=location))

        if self.avoid_micro_rna_seed_sites:
            micro_rna_sites = _load_microrna_seed_sites()
            for site in micro_rna_sites:
                constraints.append(AvoidPattern(site, location=location))

        if self.avoid_manufacture_restriction_sites:
            manufacture_restriction_sites = _load_manufacture_restriction_sites()
            for site in manufacture_restriction_sites:
                constraints.append(AvoidPattern(site, location=location))

        cut_site_constraints = [
            AvoidPattern(f"{site}_site", location=location)
            for site in self.avoid_restriction_sites
            if site
        ]
        constraints.extend(cut_site_constraints)

        custom_pattern_constraints = [
            AvoidPattern(it, location=location) for it in self.avoid_sequences if it
        ]
        constraints.extend(custom_pattern_constraints)

        if (
            self.codon_usage_table
            and self.cai_min is not None
            and self.cai_max is not None
        ):
            constraints.append(
                CAIRange(
                    codon_usage_table=load_codon_usage_table(self.codon_usage_table),
                    cai_min=self.cai_min,
                    cai_max=self.cai_max,
                    location=location,
                )
            )

        if self.codon_usage_table and self.optimize_cai:
            objectives.append(
                CodonOptimize(
                    codon_usage_table=load_codon_usage_table(
                        self.codon_usage_table
                    ).to_dnachisel_dict(),
                    method="use_best_codon",
                    location=location,
                )
            )

        if self.optimize_mfe:
            objectives.append(
                TargetPseudoMFE(
                    target_pseudo_mfe=self.optimize_mfe,
                    location=location,
                )
            )

        if self.optimize_tai:
            objectives.append(
                OptimizeTAI(
                    target_tai=self.optimize_tai,
                    location=location,
                )
            )

        if self.avoid_repeat_length is not None:
            objectives.append(
                UniquifyAllKmers(k=self.avoid_repeat_length, location=location)
            )

        return constraints, objectives


class OptimizationResult(msgspec.Struct, kw_only=True):
    class Error(msgspec.Struct, kw_only=True):
        message: str
        problem: str | None
        constraint: str | None
        location: str | None

    class Result(msgspec.Struct, kw_only=True):
        sequence: Sequence
        constraints: str | None
        objectives: str | None

    success: bool
    result: Result | None
    error: Error | None
    time_in_seconds: float


def _optimize(
    nucleic_acid_sequence: str,
    parameters: typing.Sequence[OptimizationParameter],
    max_random_iters: int,
    mutations_per_iteration: int,
) -> DnaOptimizationProblem:
    constraints, objectives = [], []
    for p in parameters:
        c, o = p.dnachisel(nucleic_acid_sequence)
        constraints.extend(c)
        objectives.extend(o)

    optimization_problem = DnaOptimizationProblem(
        sequence=nucleic_acid_sequence,
        constraints=constraints,
        objectives=objectives,
        logger=None,  # type: ignore
    )
    optimization_problem.max_random_iters = max_random_iters
    optimization_problem.mutations_per_iteration = mutations_per_iteration

    optimization_problem.resolve_constraints()

    optimization_problem.optimize()

    return optimization_problem


DEFAULT_OPTIMIZATION_PARAMETER = OptimizationParameter(
    enforce_sequence=False,
    codon_usage_table="homo-sapiens",
    optimize_cai=True,
    avoid_repeat_length=10,
    enable_uridine_depletion=False,
    avoid_ribosome_slip=False,
    avoid_manufacture_restriction_sites=False,
    avoid_micro_rna_seed_sites=False,
    gc_content_global_min=0.4,
    gc_content_global_max=0.7,
    gc_content_window_min=0.4,
    gc_content_window_max=0.7,
    gc_content_window_size=100,
    avoid_restriction_sites=[],
    avoid_sequences=[],
    avoid_poly_a=9,
    avoid_poly_c=6,
    avoid_poly_g=6,
    avoid_poly_t=9,
    hairpin_stem_size=10,
    hairpin_window=60,
)


def optimize(
    sequence: Sequence,
    parameters: typing.Sequence[OptimizationParameter] | None = None,
    max_random_iters: int = 20_000,
    mutations_per_iteration: int = 2,
) -> OptimizationResult:
    """Optimize the sequence based on the configuration parameters.

    >>> str(optimize(Sequence("ACGACCATTAAA"), parameters=[OptimizationParameter(codon_usage_table="homo-sapiens", optimize_cai=True)]).result.sequence)
    'ACCACCATCAAG'
    """
    start = timeit.default_timer()
    try:
        result = _optimize(
            sequence.nucleic_acid_sequence,
            parameters=parameters or [DEFAULT_OPTIMIZATION_PARAMETER],
            max_random_iters=max_random_iters,
            mutations_per_iteration=mutations_per_iteration,
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
