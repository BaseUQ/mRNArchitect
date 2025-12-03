import json
import sys

from DegScore import DegScore


def main():
    sequence = sys.argv[1]
    structure = sys.argv[2]
    output_file = sys.argv[3]

    mdl = DegScore(
        sequence.replace("T", "U"),
        structure=structure,
    )

    with open(output_file, "w") as f:
        f.write(
            json.dumps(
                {
                    "sequence": sequence,
                    "structure": structure,
                    "degscore": mdl.degscore,
                    "est_half_life": mdl.est_half_life,
                }
            )
        )
