import itertools

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
from dnachisel.DnaOptimizationProblem import DnaOptimizationProblem

from ..organism import (
    CODON_TO_AMINO_ACID_MAP,
    KAZUSA_HOMO_SAPIENS,
    load_organism,
    Organism,
)


class OptimizationException(Exception):
    pass


class Location(msgspec.Struct, frozen=True, kw_only=True):
    location_start: int | None = None
    location_end: int | None = None

    def __post_init__(self):
        if self.location_start and self.location_start % 3 != 0:
            raise ValueError("`location_start` must be multiple of 3.")
        if self.location_end and self.location_end % 3 != 0:
            raise ValueError("`location_end` must be a multiple of 3.")
        if (
            self.location_start is not None
            and self.location_end is not None
            and self.location_start >= self.location_end
        ):
            raise ValueError("`location_start` must be less than `location_end`.")

    @property
    def dnachisel_location(self):
        if not self.location_start:
            return None

        return DnaChiselLocation(self.location_start, self.location_end)


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
        else:
            constraints.append(
                AvoidPattern(f"{self.avoid_poly_t}xT", location=self.dnachisel_location)
            )

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
    organism: Organism | str = KAZUSA_HOMO_SAPIENS
    avoid_repeat_length: int = 10

    def __post_init__(self):
        super().__post_init__()

    @property
    def dnaschisel_objectives(self):
        organism = load_organism(self.organism)
        return [
            CodonOptimize(
                codon_usage_table=organism.to_dnachisel_dict(),
                method="use_best_codon",
                location=self.dnachisel_location,
            ),
            UniquifyAllKmers(
                k=self.avoid_repeat_length, location=self.dnachisel_location
            ),
        ]


def optimize(
    nucleic_acid_sequence: str,
    constraints: list[Constraint],
    objectives: list[Objective],
    max_random_iters: int = 20_000,
):
    optimization_problem = DnaOptimizationProblem(
        sequence=nucleic_acid_sequence,
        constraints=list(
            itertools.chain(*[it.dnachisel_constraints for it in constraints])
        ),
        objectives=list(
            itertools.chain(*[it.dnaschisel_objectives for it in objectives])
        ),
        logger=None,  # type: ignore
    )
    optimization_problem.max_random_iters = max_random_iters

    try:
        optimization_problem.resolve_constraints()
    except Exception as e:
        raise OptimizationException(f"Input sequence is invalid, cannot optimize: {e}")

    try:
        optimization_problem.optimize()
    except Exception as e:
        raise OptimizationException(f"Optimization process failed: {e}")

    return optimization_problem
