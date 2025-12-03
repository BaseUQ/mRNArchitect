import pathlib
import typing

from mrnarchitect.sequence import Sequence, SequenceType


def parse_fasta_file(
    input_file: pathlib.Path | str, sequence_type: SequenceType = "auto-detect"
) -> typing.Generator[tuple[str, str, Sequence | None, str | None]]:
    """Parse a fasta file into an iterator of (name, sequence) tuples."""

    def _parse_sequence(
        sequence: str, sequence_type: SequenceType
    ) -> typing.Tuple[Sequence | None, str | None]:
        try:
            return Sequence.create(sequence, sequence_type), None
        except RuntimeError as e:
            return None, str(e)

    header = ""
    sequences = []
    with open(input_file, "r") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            if line.startswith(">"):
                if sequences:
                    raw_sequence = "".join(sequences)
                    sequence, error = _parse_sequence(raw_sequence, sequence_type)
                    yield (
                        header,
                        raw_sequence,
                        sequence,
                        error,
                    )
                header = line.lstrip(">")
                sequences = []
            else:
                sequences.append(line)
    if header and sequences:
        raw_sequence = "".join(sequences)
        sequence, error = _parse_sequence(raw_sequence, sequence_type)
        yield header, raw_sequence, sequence, error
