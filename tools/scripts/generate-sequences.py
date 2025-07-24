import csv
import itertools
import multiprocessing
import sys
import typing

from ..constants import SEQUENCES
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
    sequence: str,
    enable_uridine_depletion: bool,
    avoid_ribosome_slip: bool,
    gc_content_min: float,
    gc_content_max: float,
    gc_content_window: int,
    avoid_repeat_length: int,
) -> tuple[dict, dict | None, Exception | None]:
    print(f"#{index:<8}: Optimizing {sequence_name}")
    input = {
        "sequence_name": sequence_name,
        "input_sequence": sequence,
        "enable_uridine_depletion": enable_uridine_depletion,
        "avoid_ribosome_slip": avoid_ribosome_slip,
        "gc_content_min": gc_content_min,
        "gc_content_max": gc_content_max,
        "gc_content_window": gc_content_window,
        "avoid_repeat_length": avoid_repeat_length,
    }
    result, error = None, None
    try:
        optimized = Sequence.from_nucleic_acid_sequence(sequence).optimize(
            constraints=[
                Constraint(
                    gc_content_min=gc_content_min,
                    gc_content_max=gc_content_max,
                    gc_content_window=gc_content_window,
                    enable_uridine_depletion=enable_uridine_depletion,
                    avoid_ribosome_slip=avoid_ribosome_slip,
                )
            ],
            objectives=[
                Objective(
                    organism="human",
                    avoid_repeat_length=10,
                )
            ],
        )
        if not optimized.result:
            raise RuntimeError(
                optimized.error.message
                if optimized.error
                else "Could not optimize: unknown error"
            )
        result = {
            "output_sequence": optimized.result.sequence.nucleic_acid_sequence,
            "a_ratio": optimized.result.sequence.a_ratio,
            "c_ratio": optimized.result.sequence.c_ratio,
            "g_ratio": optimized.result.sequence.g_ratio,
            "t_ratio": optimized.result.sequence.t_ratio,
            "at_ratio": optimized.result.sequence.at_ratio,
            "ga_ratio": optimized.result.sequence.ga_ratio,
            "gc_ratio": optimized.result.sequence.gc_ratio,
            "uridine_depletion": optimized.result.sequence.uridine_depletion,
            "cai": optimized.result.sequence.codon_adaptation_index("h_sapiens"),
            "mfe": optimized.result.sequence.minimum_free_energy.energy,
        }
    except Exception as e:
        print(f"#{index:<8}: Error - {e}")
        error = e
    return input, result, error


if __name__ == "__main__":
    input_fasta_file = sys.argv[1]
    sequence_type = typing.cast(SequenceType, sys.argv[2])
    output_file = sys.argv[3]
    # for header, sequence in _iterate_fasta_file(input_fasta_file, sequence_type):
    #    print(header)
    #    print(sequence)

    enable_uridine_depletion_range = [True, False]
    avoid_ribosome_slip_range = [True, False]
    gc_content_min_range = list(i / 10 for i in range(0, 11))
    gc_content_max_range = list(i / 10 for i in range(0, 11))
    gc_content_window_range = list(range(0, 201, 40))
    avoid_repeat_length_range = list(range(5, 16, 2))

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
        results = pool.starmap(_optimize, _iterate_parameters(), chunksize=100)

        formatted_results = [
            {
                "status": "success" if not error else "failure",
                "reason": str(error) if error else "",
                **input,
                **(result if result else {}),
            }
            for input, result, error in results
        ]
        with open(output_file, "w") as f:
            writer = csv.DictWriter(
                f,
                fieldnames=[
                    "status",
                    "reason",
                    "sequence_name",
                    "input_sequence",
                    "enable_uridine_depletion",
                    "avoid_ribosome_slip",
                    "gc_content_min",
                    "gc_content_max",
                    "gc_content_window",
                    "avoid_repeat_length",
                    "output_sequence",
                    "a_ratio",
                    "c_ratio",
                    "g_ratio",
                    "t_ratio",
                    "at_ratio",
                    "ga_ratio",
                    "gc_ratio",
                    "cai",
                    "mfe",
                ],
                extrasaction="ignore",
                restval="",
            )
            writer.writeheader()
            for r in formatted_results:
                writer.writerow(r)
