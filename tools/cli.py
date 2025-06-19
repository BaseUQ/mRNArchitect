import sys
from concurrent.futures import ThreadPoolExecutor

import msgspec

from .organism import (
    load_organism,
    load_organism_from_web,
    KAZUSA_HOMO_SAPIENS,
    KAZUSA_MUS_MUSCULUS,
)
from .sequence import OptimizationConfiguration, Sequence

DEFAULT_ORGANISMS = [
    KAZUSA_HOMO_SAPIENS,
    KAZUSA_MUS_MUSCULUS,
]

if __name__ == "__main__":
    command = sys.argv[1]

    if command == "generate-default-organisms":
        with ThreadPoolExecutor() as executor:
            futures = [
                executor.submit(load_organism_from_web, it) for it in DEFAULT_ORGANISMS
            ]
            for future in futures:
                organism = future.result()
                organism.save()
    elif command == "get-restriction-sites":
        import Bio.Restriction.Restriction_Dictionary

        print(
            msgspec.json.encode(
                Bio.Restriction.Restriction_Dictionary.rest_dict
            ).decode(),
            end="",
        )
    elif command == "convert-sequence-to-nucleic-acid":
        sequence = sys.argv[2]
        organism = load_organism(sys.argv[3])
        print(
            msgspec.json.encode(
                str(Sequence.from_amino_acid_sequence(sequence, organism))
            ).decode(),
            end="",
        )
    elif command == "analyze-sequence":
        sequence = Sequence(sys.argv[2])
        organism = load_organism(sys.argv[3])
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
