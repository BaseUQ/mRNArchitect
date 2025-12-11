import pytest

from mrnarchitect.organism import Organism, search_organisms


@pytest.mark.parametrize(
    ["terms", "results"],
    [
        [
            "homo sap",
            [Organism(slug="homo-sapiens", name="Homo sapiens", kazusa_id="9606")],
        ],
        [
            "9606",
            [Organism(slug="homo-sapiens", name="Homo sapiens", kazusa_id="9606")],
        ],
        [
            ["homo", "sap"],
            [Organism(slug="homo-sapiens", name="Homo sapiens", kazusa_id="9606")],
        ],
    ],
)
def test_search_organisms(terms, results):
    assert search_organisms(terms) == results
