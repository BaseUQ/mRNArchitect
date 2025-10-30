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
                        "optimizeCai": True,
                    }
                ],
            },
        )
        assert response.status_code == 201
        assert response.json() == {
            "success": True,
            "error": None,
            "timeInSeconds": ANY,
            "result": {
                "sequence": {
                    "nucleicAcidSequence": "ATGATCCTG",
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
            "aRatio": 0.2222222222222222,
            "atRatio": 0.5555555555555556,
            "cRatio": 0.2222222222222222,
            "codonAdaptationIndex": 1.0,
            "debug": {
                "timeSeconds": ANY,
            },
            "gRatio": 0.2222222222222222,
            "gaRatio": 0.4444444444444444,
            "gcRatio": 0.4444444444444444,
            "minimumFreeEnergy": {
                "averageEnergy": 0.0,
                "energy": 0.0,
                "structure": ".........",
            },
            "tRatio": 0.3333333333333333,
            "trnaAdaptationIndex": 0.3173599613405995,
            "uridineDepletion": 0.0,
        }
