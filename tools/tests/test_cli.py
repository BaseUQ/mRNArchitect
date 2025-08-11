import pytest

from tools.cli import cli


@pytest.mark.parametrize(
    ["args", "output"],
    (
        [["-h"], "A toolkit to optimize mRNA sequences."],
        [["optimize", "ACGACG"], "ACCACC"],
    ),
)
def test_cli(capsys, args, output):
    try:
        cli(args)
    except SystemExit:
        pass
    cli_output = capsys.readouterr().out
    assert output in cli_output
