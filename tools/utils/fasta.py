import pathlib
import typing

from tools.sequence.sequence import Sequence, SequenceType


def parse_fasta_file(
    input_file: pathlib.Path | str, sequence_type: SequenceType = "auto-detect"
) -> typing.Generator[tuple[str, Sequence | None]]:
    """Parse a fasta file into an iterator of (name, sequence) tuples."""

    def _parse_sequence(sequence: str, sequence_type: SequenceType):
        try:
            return Sequence.create(sequence, sequence_type)
        except RuntimeError:
            return None

    header = ""
    sequences = []
    with open(input_file, "r") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            if line.startswith(">"):
                if sequences:
                    yield (
                        header,
                        _parse_sequence("".join(sequences), sequence_type),
                    )
                header = line.lstrip(">")
                sequences = []
            else:
                sequences.append(line)
    if header and sequences:
        yield header, _parse_sequence("".join(sequences), sequence_type)
