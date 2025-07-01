import argparse


from sequence import OptimizationConfiguration, Sequence


def cli():
    parser = argparse.ArgumentParser(
        description="A toolkit to optimize mRNA sequences."
    )
    parser.add_argument("sequence", type=str, help="The sequence to optimize.")
    parser.add_argument(
        "--sequence-type",
        type=str,
        choices=["amino-acid", "nucleic-acid"],
        default="nucleic-acid",
        help="The type of sequence given.",
    )
    parser.add_argument(
        "--organism",
        type=str,
        choices=["human", "mouse"],
        default="human",
        help="The organism/codon usage table to optimize for.",
    )
    parser.add_argument(
        "--enable-uridine-depletion",
        action=argparse.BooleanOptionalAction,
        help="If set, will enable uridine depletion.",
    )
    parser.add_argument(
        "--avoid-ribosome-slip",
        action=argparse.BooleanOptionalAction,
        help="If set, will avoid sequences that may cause ribosome slippage.",
    )
    parser.add_argument(
        "--gc-content-min",
        type=float,
        default=0.4,
        help="The minimum GC-ratio (global and windowed).",
    )
    parser.add_argument(
        "--gc-content-max",
        type=float,
        default=0.7,
        help="The maximum GC-ratio (global and windowed).",
    )
    parser.add_argument(
        "--gc-content-window", type=int, default=100, help="The GC-ratio window size."
    )
    parser.add_argument("--avoid-restriction-sites", type=str, action="append")
    parser.add_argument("--avoid-sequences", type=str, action="append")
    parser.add_argument("--avoid-repeat-length", type=int, default=10)
    parser.add_argument("--avoid-poly-a", type=int, default=9)
    parser.add_argument("--avoid-poly-c", type=int, default=6)
    parser.add_argument("--avoid-poly-g", type=int, default=6)
    parser.add_argument("--avoid-poly-t", type=int, default=9)
    parser.add_argument("--hairpin-stem-size", type=int, default=10)
    parser.add_argument("--hairpin-window", type=int, default=60)
    args = parser.parse_args()

    if args.sequence_type == "nucleic-acid":
        sequence = Sequence.from_nucleic_acid_sequence(args.sequence)
    else:
        sequence = Sequence.from_amino_acid_sequence(args.sequence)
    optimization = sequence.optimize(
        OptimizationConfiguration(
            organism=args.organism,
            enable_uridine_depletion=args.enable_uridine_depletion,
            avoid_ribosome_slip=args.avoid_ribosome_slip,
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
    )
    print(str(optimization.output))


if __name__ == "__main__":
    cli()
