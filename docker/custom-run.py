# /// script
# dependencies = [
#   "custom_optimizer",
#   "setuptools",
#   "viennarna",
# ]
# ///

import argparse

from custom import TissueOptimizer

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("protein", type=str)
    parser.add_argument("--top", type=int, default=1)
    args = parser.parse_args()

    opt = TissueOptimizer("Kidney", n_pool=100)

    opt.optimize(args.protein)

    best = opt.select_best(
        by={"MFE": "min", "MFEini": "max", "CAI": "max", "CPB": "max", "ENC": "min"},
        homopolymers=7,
        top=10,
    )
    for sequence in best["Sequence"].to_list():
        print(sequence)
