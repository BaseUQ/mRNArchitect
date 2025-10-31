import pytest

from mrnarchitect.cli import cli


@pytest.mark.parametrize(
    ["args", "output"],
    (
        [["-h"], "A toolkit to optimize mRNA sequences."],
        [["optimize", "ACGACG"], "ACCACC"],
        [["analyze", "ACGACG"], "codon_adaptation_index"],
    ),
)
def test_cli(capsys, args, output):
    try:
        cli(args)
    except SystemExit:
        pass
    cli_output = capsys.readouterr().out
    assert output in cli_output
