import argparse

import msgspec

from .organism import (
    KAZUSA_HOMO_SAPIENS,
    KAZUSA_MUS_MUSCULUS,
)
from .sequence import Sequence
from .sequence.optimize import OptimizationParameter

DEFAULT_ORGANISMS = {
    "human": KAZUSA_HOMO_SAPIENS,
    "mouse": KAZUSA_MUS_MUSCULUS,
}


def _parse_sequence(args):
    if hasattr(args, "sequence_type") and args.sequence_type == "amino-acid":
        return Sequence.from_amino_acid_sequence(
            args.sequence, organism=DEFAULT_ORGANISMS[args.organism]
        )
    return Sequence.from_nucleic_acid_sequence(args.sequence)


def _print(output, args):
    if hasattr(args, "format") and args.format == "json":
        print(msgspec.json.encode(output).decode())
    else:
        print(msgspec.yaml.encode(output).decode())


def _optimize(args):
    sequence = _parse_sequence(args)
    if args.config:
        parameters = msgspec.json.decode(args.config, type=list[OptimizationParameter])
    else:
        parameters = [
            OptimizationParameter(
                organism=args.organism,
                avoid_repeat_length=args.avoid_repeat_length,
                enable_uridine_depletion=args.enable_uridine_depletion,
                avoid_ribosome_slip=args.avoid_ribosome_slip,
                avoid_micro_rna_seed_sites=args.avoid_micro_rna_seed_sites,
                avoid_manufacture_restriction_sites=args.avoid_manufacture_restriction_sites,
                gc_content_min=args.gc_content_min,
                gc_content_max=args.gc_content_max,
                gc_content_window=args.gc_content_window,
                avoid_restriction_sites=args.avoid_restriction_sites or [],
                avoid_sequences=args.avoid_sequences or [],
                avoid_poly_a=args.avoid_poly_a,
                avoid_poly_c=args.avoid_poly_c,
                avoid_poly_g=args.avoid_poly_g,
                avoid_poly_t=args.avoid_poly_t,
                hairpin_stem_size=args.hairpin_stem_size,
                hairpin_window=args.hairpin_window,
            )
        ]

    result = sequence.optimize(parameters=parameters)
    _print(result, args)


def _analyze(args):
    sequence = _parse_sequence(args)
    result = sequence.analyze(organism=DEFAULT_ORGANISMS[args.organism])
    _print(result, args)


def _convert(args):
    sequence = _parse_sequence(args)
    if args.sequence_type == "amino-acid":
        result = sequence.nucleic_acid_sequence
    else:
        result = sequence.amino_acid_sequence
    _print(result, args)


def cli():
    parser = argparse.ArgumentParser(
        description="A toolkit to optimize mRNA sequences."
    )
    subparsers = parser.add_subparsers(required=True, help="Command to execute.")

    # Optimize
    optimize = subparsers.add_parser("optimize", help="Optimize a sequence.")
    optimize.add_argument("sequence", type=str, help="The sequence to optimize.")
    optimize.add_argument(
        "--sequence-type",
        type=str,
        choices=["nucleic-acid", "amino-acid"],
        default="nucleic-acid",
        help="The type of sequence.",
    )
    optimize.add_argument(
        "--config",
        type=str,
        default="",
        help="The optimization configuration given as a JSON structure. Other command line options are ignored.",
    )
    optimize.add_argument(
        "--organism",
        type=str,
        choices=DEFAULT_ORGANISMS.keys(),
        default="human",
        help="The organism to use.",
    )
    optimize.add_argument(
        "--enable-uridine-depletion",
        action=argparse.BooleanOptionalAction,
        help="If set, will enable uridine depletion.",
    )
    optimize.add_argument(
        "--avoid-ribosome-slip",
        action=argparse.BooleanOptionalAction,
        help="If set, will avoid sequences that may cause ribosome slippage.",
    )
    optimize.add_argument(
        "--avoid-micro-rna-seed-sites",
        action=argparse.BooleanOptionalAction,
        help="If set, will avoid common microRNA seed sites.",
    )
    optimize.add_argument(
        "--avoid-manufacture-restriction-sites",
        action=argparse.BooleanOptionalAction,
        help="If set, will avoid manufacture restriction sites.",
    )
    optimize.add_argument(
        "--gc-content-min",
        type=float,
        default=0.4,
        help="The minimum GC-ratio (global and windowed).",
    )
    optimize.add_argument(
        "--gc-content-max",
        type=float,
        default=0.7,
        help="The maximum GC-ratio (global and windowed).",
    )
    optimize.add_argument(
        "--gc-content-window", type=int, default=100, help="The GC-ratio window size."
    )
    optimize.add_argument("--avoid-restriction-sites", type=str, action="append")
    optimize.add_argument("--avoid-sequences", type=str, action="append")
    optimize.add_argument("--avoid-repeat-length", type=int, default=10)
    optimize.add_argument("--avoid-poly-a", type=int, default=9)
    optimize.add_argument("--avoid-poly-c", type=int, default=6)
    optimize.add_argument("--avoid-poly-g", type=int, default=6)
    optimize.add_argument("--avoid-poly-t", type=int, default=9)
    optimize.add_argument("--hairpin-stem-size", type=int, default=10)
    optimize.add_argument("--hairpin-window", type=int, default=60)
    optimize.add_argument(
        "--format", type=str, choices=["yaml", "json"], default="yaml"
    )
    optimize.set_defaults(func=_optimize)

    # Analyze
    analyze = subparsers.add_parser("analyze", help="Analyze a sequence.")
    analyze.add_argument("sequence", type=str, help="The sequence to analyze.")
    analyze.add_argument(
        "--sequence-type",
        type=str,
        choices=["nucleic-acid", "amino-acid"],
        default="nucleic-acid",
        help="The type of sequence.",
    )
    analyze.add_argument(
        "--organism",
        type=str,
        choices=DEFAULT_ORGANISMS.keys(),
        default="human",
        help="The organism to use.",
    )
    analyze.add_argument("--format", type=str, choices=["yaml", "json"], default="yaml")
    analyze.set_defaults(func=_analyze)

    convert = subparsers.add_parser(
        "convert",
        help="Convert a sequence between a nucleic and amino acid, or vice versa.",
    )
    convert.add_argument("sequence", type=str, help="The sequence to convert.")
    convert.add_argument(
        "--sequence-type",
        type=str,
        choices=["nucleic-acid", "amino-acid"],
        default="nucleic-acid",
        help="The type of sequence.",
    )
    convert.add_argument(
        "--organism",
        type=str,
        choices=DEFAULT_ORGANISMS.keys(),
        default="human",
        help="The organism to use.",
    )
    convert.add_argument("--format", type=str, choices=["yaml", "json"], default="yaml")
    convert.set_defaults(func=_convert)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    cli()
