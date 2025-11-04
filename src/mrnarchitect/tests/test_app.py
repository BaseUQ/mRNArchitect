from unittest.mock import ANY

from litestar.testing import TestClient

from mrnarchitect.app import app

app.debug = True


def test_convert():
    with TestClient(app=app) as client:
        response = client.post(
            "/api/convert",
            json={"sequence": "MIL"},
        )
        assert response.status_code == 201
        assert response.json() == {"sequence": "ATGATCCTG"}


def test_optimize():
    with TestClient(app=app) as client:
        response = client.post(
            "/api/optimize",
            json={
                "sequence": "MIL",
                "parameters": [
                    {
                        "optimize_cai": True,
                    }
                ],
            },
        )
        assert response.status_code == 201
        assert response.json() == {
            "success": True,
            "error": None,
            "time_in_seconds": ANY,
            "result": {
                "sequence": {
                    "nucleic_acid_sequence": "ATGATCCTG",
                },
                "constraints": ANY,
                "objectives": ANY,
            },
        }


def test_analyze():
    with TestClient(app=app) as client:
        response = client.post(
            "/api/analyze",
            json={
                "sequence": "MIL",
            },
        )
        assert response.status_code == 201
        assert response.json() == {
            "a_ratio": 0.2222222222222222,
            "at_ratio": 0.5555555555555556,
            "c_ratio": 0.2222222222222222,
            "codon_adaptation_index": 1.0,
            "debug": {
                "time_seconds": ANY,
            },
            "g_ratio": 0.2222222222222222,
            "ga_ratio": 0.4444444444444444,
            "gc_ratio": 0.4444444444444444,
            "minimum_free_energy": {
                "average_energy": 0.0,
                "energy": 0.0,
                "structure": ".........",
            },
            "t_ratio": 0.3333333333333333,
            "trna_adaptation_index": 0.3173599613405995,
            "uridine_depletion": 0.0,
        }


def test_compare():
    with TestClient(app=app) as client:
        response = client.post(
            "/api/compare",
            json={"sequence_a": "ACG", "sequence_b": "AGC"},
        )
        assert response.status_code == 201
        assert response.json() == {
            "hamming_distance": 2,
        }
