import typing

from tools.sequence import Sequence

SequenceType = typing.Literal["nucleic-acid", "amino-acid"]


def parse_fasta_file(
    input_file: str, sequence_type: SequenceType
) -> typing.Generator[tuple[str, Sequence]]:
    """Parse a fasta file into an iterator of (name, sequence) tuples."""

    def _sequence(s: str) -> Sequence:
        if sequence_type == "amino-acid":
            return Sequence.from_amino_acid_sequence(s)
        return Sequence.from_nucleic_acid_sequence(s)

    header = ""
    sequences = []
    with open(input_file, "r") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            if line.startswith(">"):
                if sequences:
                    if sequence_type == "amino-acid" or all(
                        "N" not in s for s in sequences
                    ):
                        yield header, _sequence("".join(sequences))
                header = line.lstrip(">")
                sequences = []
            else:
                sequences.append(line)
    if header and sequences:
        if sequence_type == "amino-acid" or all("N" not in s for s in sequences):
            yield header, _sequence("".join(sequences))
