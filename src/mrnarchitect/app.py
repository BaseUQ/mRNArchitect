import pathlib
import os

from litestar import Litestar, MediaType, get, post
from litestar.config.compression import CompressionConfig
from litestar.config.cors import CORSConfig
from litestar.openapi import OpenAPIConfig
from litestar.static_files import create_static_files_router
import msgspec

from mrnarchitect import sequence
from mrnarchitect.sequence.optimize import (
    optimize,
    OptimizationParameter,
    OptimizationResult,
)
from mrnarchitect.sequence import Sequence
from mrnarchitect.sequence.sequence import Analysis
from mrnarchitect.types import Organism
from mrnarchitect.utils.fasta import SequenceType


ASSETS_DIR = pathlib.Path("frontend/dist")
ALLOW_ORIGINS = [it for it in os.getenv("ALLOW_ORIGINS", "").split(",") if it]


@get("/", media_type=MediaType.HTML, include_in_schema=False)
async def get_index() -> str:
    with open(ASSETS_DIR / "index.html", "r") as f:
        return f.read()


class ConvertRequest(msgspec.Struct):
    sequence: str
    sequence_type: SequenceType = "auto-detect"
    organism: Organism = "homo-sapiens"


class ConvertResponse(msgspec.Struct):
    sequence: str


@post(
    "/api/convert",
    summary="Convert sequence.",
    description="Convert a sequence from amino to nucleic acid.",
)
async def post_convert(data: ConvertRequest) -> ConvertResponse:
    sequence = Sequence.create(
        data.sequence, sequence_type=data.sequence_type, codon_usage_table=data.organism
    )
    return ConvertResponse(sequence=sequence.nucleic_acid_sequence)


class OptimizeRequest(msgspec.Struct):
    sequence: str
    parameters: list[OptimizationParameter]


@post(
    "/api/optimize",
    summary="Optimize sequence.",
    description="Run an optimization on the given sequence.",
)
async def post_optimize(data: OptimizeRequest, headers: dict) -> OptimizationResult:
    result = optimize(Sequence.create(data.sequence), parameters=data.parameters)
    # Log the optimization
    print(
        msgspec.json.encode(
            {
                "function": "optimize",
                "ip": headers.get("x-forwarded-for")
                or headers.get("X-Forwarded-For")
                or None,
                "sequence": data.sequence,
            }
        ).decode("utf-8")
    )
    return result


class AnalyzeRequest(msgspec.Struct):
    sequence: str
    organism: Organism = "homo-sapiens"


@post(
    "/api/analyze",
    summary="Analyze sequence.",
    description="Analyze and return statistics about the given sequence.",
)
async def post_analyze(data: AnalyzeRequest) -> Analysis:
    sequence = Sequence.create(data.sequence)
    return sequence.analyze(data.organism)


app = Litestar(
    route_handlers=[
        get_index,
        post_convert,
        post_optimize,
        post_analyze,
        create_static_files_router(path="/", directories=[ASSETS_DIR]),
    ],
    compression_config=CompressionConfig(backend="gzip", gzip_compress_level=9),
    cors_config=CORSConfig(allow_origins=ALLOW_ORIGINS) if ALLOW_ORIGINS else None,
    openapi_config=OpenAPIConfig(title="mRNArchitect API", version="0.0.1"),
)
