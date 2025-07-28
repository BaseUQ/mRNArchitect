import csv
import itertools
import multiprocessing
import sys
import typing

from tools.sequence.sequence import Analysis, OptimizationResult

from ..sequence import Sequence
from ..sequence.optimize import Constraint, Objective

SequenceType = typing.Literal["nucleic-acid", "amino-acid"]


def _iterate_fasta_file(input_file: str, sequence_type: SequenceType):
    def _sequence(s: str) -> Sequence:
        if sequence_type == "amino-acid":
            return Sequence.from_amino_acid_sequence(s)
        return Sequence.from_nucleic_acid_sequence(s)

    header = None
    sequences = []
    with open(input_file, "r") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            if line.startswith(">"):
                if sequences:
                    yield header, _sequence("".join(sequences))
                header = line.lstrip(">")
                sequences = []
            else:
                sequences.append(line)
    if header and sequences:
        yield header, _sequence("".join(sequences))


def _optimize(
    index: int,
    sequence_name: str,
    input_sequence: str,
    enable_uridine_depletion: bool,
    avoid_ribosome_slip: bool,
    gc_content_min: float,
    gc_content_max: float,
    gc_content_window: int,
    avoid_repeat_length: int,
) -> tuple[
    str,
    str,
    Analysis | None,
    Constraint,
    Objective,
    str | None,
    Analysis | None,
    Exception | None,
]:
    print(f"#{index:<8}: Optimizing {sequence_name}")
    constraint = Constraint(
        enable_uridine_depletion=enable_uridine_depletion,
        avoid_ribosome_slip=avoid_ribosome_slip,
        gc_content_min=gc_content_min,
        gc_content_max=gc_content_max,
        gc_content_window=gc_content_window,
        avoid_restriction_sites=[],
        avoid_sequences=[],
        avoid_poly_a=9,
        avoid_poly_c=6,
        avoid_poly_g=6,
        avoid_poly_t=9,
        hairpin_stem_size=10,
        hairpin_window=60,
    )
    objective = Objective(
        organism="human",
        avoid_repeat_length=avoid_repeat_length,
    )

    input_analysis, output_sequence, output_analysis, error = None, None, None, None
    try:
        input_analysis = Sequence.from_nucleic_acid_sequence(input_sequence).analyze(
            "human"
        )

        optimized = Sequence.from_nucleic_acid_sequence(input_sequence).optimize(
            constraints=[constraint],
            objectives=[objective],
        )
        if not optimized.result:
            raise RuntimeError(
                optimized.error.message
                if optimized.error
                else "Could not optimize: unknown error"
            )
        output_sequence = optimized.result.sequence.nucleic_acid_sequence
        output_analysis = optimized.result.sequence.analyze("human")
    except Exception as e:
        print(f"#{index:<8}: Error - {e}")
        error = e
    return (
        sequence_name,
        input_sequence,
        input_analysis,
        constraint,
        objective,
        output_sequence,
        output_analysis,
        error,
    )


if __name__ == "__main__":
    input_fasta_file = sys.argv[1]
    sequence_type = typing.cast(SequenceType, sys.argv[2])
    output_file = sys.argv[3]

    # enable_uridine_depletion_range = [True, False]
    # avoid_ribosome_slip_range = [True, False]
    # gc_content_min_range = list(i / 10 for i in range(0, 11))
    # gc_content_max_range = list(i / 10 for i in range(0, 11))
    # gc_content_window_range = list(range(0, 201, 40))
    # avoid_repeat_length_range = list(range(5, 16, 2))
    enable_uridine_depletion_range = [False]
    avoid_ribosome_slip_range = [False]
    gc_content_min_range = [0.4]
    gc_content_max_range = [0.7]
    gc_content_window_range = [100]
    avoid_repeat_length_range = [10]

    def _iterate_parameters():
        index = 0
        for header, sequence in _iterate_fasta_file(input_fasta_file, sequence_type):
            for (
                enable_uridine_depletion,
                avoid_ribosome_slip,
                gc_content_min,
                gc_content_max,
                gc_content_window,
                avoid_repeat_length,
            ) in itertools.product(
                enable_uridine_depletion_range,
                avoid_ribosome_slip_range,
                gc_content_min_range,
                gc_content_max_range,
                gc_content_window_range,
                avoid_repeat_length_range,
            ):
                if gc_content_min >= gc_content_max:
                    continue
                yield (
                    index,
                    header,
                    sequence.nucleic_acid_sequence,
                    enable_uridine_depletion,
                    avoid_ribosome_slip,
                    gc_content_min,
                    gc_content_max,
                    gc_content_window,
                    avoid_repeat_length,
                )
                index += 1

    with multiprocessing.Pool() as pool:
        results = pool.starmap(_optimize, _iterate_parameters(), chunksize=2)

        with open(output_file, "w") as f:
            writer = csv.DictWriter(
                f,
                fieldnames=[
                    "status",
                    "reason",
                    "sequence_name",
                    "input_sequence",
                    "output_sequence",
                    "enable_uridine_depletion",
                    "avoid_ribosome_slip",
                    "gc_content_min",
                    "gc_content_max",
                    "gc_content_window",
                    "avoid_repeat_length",
                    "output_sequence",
                    "input_a_ratio",
                    "input_c_ratio",
                    "input_g_ratio",
                    "input_t_ratio",
                    "input_at_ratio",
                    "input_ga_ratio",
                    "input_gc_ratio",
                    "input_cai",
                    "input_mfe",
                    "output_a_ratio",
                    "output_c_ratio",
                    "output_g_ratio",
                    "output_t_ratio",
                    "output_at_ratio",
                    "output_ga_ratio",
                    "output_gc_ratio",
                    "output_cai",
                    "output_mfe",
                ],
                extrasaction="ignore",
                restval="",
            )
            writer.writeheader()
            for (
                sequence_name,
                input_sequence,
                input_analysis,
                constraint,
                objective,
                output_sequence,
                output_analysis,
                error,
            ) in results:
                writer.writerow(
                    {
                        "status": "success" if not error else "failure",
                        "reason": str(error) if error else "",
                        "sequence_name": sequence_name,
                        "input_sequence": input_sequence,
                        "enable_uridine_depletion": constraint.enable_uridine_depletion,
                        "avoid_ribosome_slip": constraint.avoid_ribosome_slip,
                        "gc_content_min": constraint.gc_content_min,
                        "gc_content_max": constraint.gc_content_max,
                        "gc_content_window": constraint.gc_content_window,
                        "avoid_repeat_length": objective.avoid_repeat_length,
                        "output_sequence": output_sequence or "",
                        "input_a_ratio": input_analysis.a_ratio
                        if input_analysis
                        else "",
                        "input_c_ratio": input_analysis.c_ratio
                        if input_analysis
                        else "",
                        "input_g_ratio": input_analysis.g_ratio
                        if input_analysis
                        else "",
                        "input_t_ratio": input_analysis.t_ratio
                        if input_analysis
                        else "",
                        "input_at_ratio": input_analysis.at_ratio
                        if input_analysis
                        else "",
                        "input_ga_ratio": input_analysis.ga_ratio
                        if input_analysis
                        else "",
                        "input_gc_ratio": input_analysis.gc_ratio
                        if input_analysis
                        else "",
                        "input_cai": input_analysis.codon_adaptation_index
                        if input_analysis
                        else "",
                        "input_mfe": input_analysis.minimum_free_energy.energy
                        if input_analysis
                        else "",
                        "output_a_ratio": output_analysis.a_ratio
                        if output_analysis
                        else "",
                        "output_c_ratio": output_analysis.c_ratio
                        if output_analysis
                        else "",
                        "output_g_ratio": output_analysis.g_ratio
                        if output_analysis
                        else "",
                        "output_t_ratio": output_analysis.t_ratio
                        if output_analysis
                        else "",
                        "output_at_ratio": output_analysis.at_ratio
                        if output_analysis
                        else "",
                        "output_ga_ratio": output_analysis.ga_ratio
                        if output_analysis
                        else "",
                        "output_gc_ratio": output_analysis.gc_ratio
                        if output_analysis
                        else "",
                        "output_cai": output_analysis.codon_adaptation_index
                        if output_analysis
                        else "",
                        "output_mfe": output_analysis.minimum_free_energy.energy
                        if output_analysis
                        else "",
                    }
                )

            # for r in formatted_results:
            #    writer.writerow(r)
