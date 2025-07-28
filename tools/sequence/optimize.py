import itertools
import typing

import msgspec
from dnachisel import Location as DnaChiselLocation
from dnachisel.builtin_specifications import (
    AvoidPattern,
    AvoidHairpins,
    AvoidRareCodons,
    EnforceGCContent,
    EnforceTranslation,
    UniquifyAllKmers,
)
from dnachisel.builtin_specifications.codon_optimization import CodonOptimize
from dnachisel.DnaOptimizationProblem import DnaOptimizationProblem, NoSolutionError

from ..organism import (
    CODON_TO_AMINO_ACID_MAP,
    load_organism,
    Organism,
)


OptimizationError = NoSolutionError


class Location(msgspec.Struct, frozen=True, kw_only=True, rename="camel"):
    start: int | None = None
    end: int | None = None

    def __post_init__(self):
        if self.start is not None and self.end is not None and self.start >= self.end:
            raise ValueError("`start` must be less than `end`.")

    @property
    def dnachisel_location(self):
        if not self.start or not self.end:
            return None

        return DnaChiselLocation(self.start, self.end)


class Constraint(Location, frozen=True, kw_only=True, rename="camel"):
    enable_uridine_depletion: bool = False
    avoid_ribosome_slip: bool = False
    gc_content_min: float | None = None
    gc_content_max: float | None = None
    gc_content_window: int | None = None
    avoid_restriction_sites: list[str] = msgspec.field(default_factory=list)
    avoid_sequences: list[str] = msgspec.field(default_factory=list)
    avoid_poly_a: int | None = None
    avoid_poly_c: int | None = None
    avoid_poly_g: int | None = None
    avoid_poly_t: int | None = None
    hairpin_stem_size: int | None = None
    hairpin_window: int | None = None

    def __post_init__(self):
        super().__post_init__()
        if (
            self.gc_content_min is not None
            and self.gc_content_max is not None
            and self.gc_content_min > self.gc_content_max
        ):
            raise ValueError("GC content minimum must be less than maximum.")

    @property
    def dnachisel_constraints(self):
        constraints: list = [EnforceTranslation()]

        if self.gc_content_min is not None and self.gc_content_max is not None:
            constraints.append(
                EnforceGCContent(
                    mini=self.gc_content_min,  # type: ignore
                    maxi=self.gc_content_max,
                    location=self.dnachisel_location,
                )
            )
            if self.gc_content_window is not None:
                constraints.append(
                    EnforceGCContent(
                        mini=self.gc_content_min,  # type: ignore
                        maxi=self.gc_content_max,
                        window=self.gc_content_window,
                        location=self.dnachisel_location,
                    )
                )
        if self.hairpin_stem_size is not None and self.hairpin_window is not None:
            constraints.append(
                AvoidHairpins(
                    stem_size=self.hairpin_stem_size,
                    hairpin_window=self.hairpin_window,
                    location=self.dnachisel_location,
                )
            )
        if self.avoid_poly_a is not None:
            constraints.append(
                AvoidPattern(f"{self.avoid_poly_a}xA", location=self.dnachisel_location)
            )
        if self.avoid_poly_c is not None:
            constraints.append(
                AvoidPattern(f"{self.avoid_poly_c}xC", location=self.dnachisel_location)
            )
        if self.avoid_poly_g is not None:
            constraints.append(
                AvoidPattern(f"{self.avoid_poly_g}xG", location=self.dnachisel_location)
            )
        if self.avoid_poly_t is not None:
            constraints.append(
                AvoidPattern(f"{self.avoid_poly_t}xT", location=self.dnachisel_location)
            )

        if self.enable_uridine_depletion:
            uridine_depletion_codon_usage_table = {
                amino_acid: {
                    codon: (0.0 if codon[-1] == "T" else 1.0)
                    for codon, aa in CODON_TO_AMINO_ACID_MAP.items()
                    if aa == amino_acid
                }
                for amino_acid in set(CODON_TO_AMINO_ACID_MAP.values())
            }
            constraints.append(
                AvoidRareCodons(
                    0.5,
                    codon_usage_table=uridine_depletion_codon_usage_table,
                    location=self.dnachisel_location,
                )
            )

        if self.avoid_ribosome_slip:
            constraints.append(AvoidPattern("3xT", location=self.dnachisel_location))

        cut_site_constraints = [
            AvoidPattern(f"{site}_site", location=self.dnachisel_location)
            for site in self.avoid_restriction_sites
            if site
        ]
        constraints.extend(cut_site_constraints)

        custom_pattern_constraints = [
            AvoidPattern(it, location=self.dnachisel_location)
            for it in self.avoid_sequences
            if it
        ]
        constraints.extend(custom_pattern_constraints)

        return constraints


class Objective(Location, frozen=True, kw_only=True, rename="camel"):
    organism: Organism | str | None = None
    avoid_repeat_length: int | None = None

    def __post_init__(self):
        super().__post_init__()

    @property
    def dnachisel_objectives(self):
        objectives = []

        if self.organism is not None:
            objectives.append(
                CodonOptimize(
                    codon_usage_table=load_organism(self.organism).to_dnachisel_dict(),
                    method="use_best_codon",
                    location=self.dnachisel_location,
                )
            )

        if self.avoid_repeat_length is not None:
            objectives.append(
                UniquifyAllKmers(
                    k=self.avoid_repeat_length, location=self.dnachisel_location
                )
            )

        return objectives


DEFAULT_CONSTRAINT = Constraint(
    enable_uridine_depletion=False,
    avoid_ribosome_slip=False,
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


def optimize(
    nucleic_acid_sequence: str,
    constraints: typing.Sequence[Constraint],
    objectives: typing.Sequence[Objective],
    max_random_iters: int = 20_000,
):
    optimization_problem = DnaOptimizationProblem(
        sequence=nucleic_acid_sequence,
        constraints=list(
            itertools.chain(*[it.dnachisel_constraints for it in constraints])
        ),
        objectives=list(
            itertools.chain(*[it.dnachisel_objectives for it in objectives])
        ),
        logger=None,  # type: ignore
    )
    optimization_problem.max_random_iters = max_random_iters

    optimization_problem.resolve_constraints()

    optimization_problem.optimize()

    return optimization_problem
