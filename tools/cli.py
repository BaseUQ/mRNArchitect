import sys
import typing

import msgspec

from .organism import Organism, Organisms
from .sequence import Sequence, OptimizationConfiguration


if __name__ == "__main__":
    command = sys.argv[1]

    if command == "get-restriction-sites":
        import Bio.Restriction.Restriction_Dictionary

        print(
            msgspec.json.encode(
                Bio.Restriction.Restriction_Dictionary.rest_dict
            ).decode(),
            end="",
        )
    elif command == "generate-organisms":
        organisms = Organisms.load_from_kazusa()
        organisms.save()
    elif command == "convert-sequence-to-nucleic-acid":
        sequence = sys.argv[2]
        organism = typing.cast(Organism, sys.argv[3])
        print(
            msgspec.json.encode(
                str(Sequence.from_amino_acid_sequence(sequence, organism))
            ).decode(),
            end="",
        )
    elif command == "analyze-sequence":
        sequence = Sequence(sys.argv[2])
        organism = typing.cast(Organism, sys.argv[3])
        result = sequence.analyze(organism)
        print(msgspec.json.encode(result).decode(), end="")
    elif command == "optimize-sequence":
        sequence = Sequence(sys.argv[2])
        config = msgspec.json.decode(sys.argv[3], type=OptimizationConfiguration)
        result = sequence.optimize(config)
        print(
            msgspec.json.encode(result).decode(),
            end="",
        )
    else:
        raise RuntimeError(f"Unknown command: {command}")
