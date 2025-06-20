import argparse


from sequence import OptimizationConfiguration, Sequence


def cli():
    parser = argparse.ArgumentParser(
        description="A toolkit to optimize mRNA sequences."
    )
    parser.add_argument(
        "sequence", type=str, help="The nucleic acid sequence to optimize."
    )
    parser.add_argument(
        "--organism",
        type=str,
        choices=["human", "mouse"],
        default="human",
        help="The organism/codon usage table to optimize for.",
    )
    args = parser.parse_args()

    sequence = Sequence.from_nucleic_acid_sequence(args.sequence)
    optimization = sequence.optimize(OptimizationConfiguration(organism=args.organism))
    print(str(optimization.output))


if __name__ == "__main__":
    cli()
