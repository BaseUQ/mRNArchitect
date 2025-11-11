import msgspec
from litestar import Router, post

from mrnarchitect.analyze import Analysis, analyze
from mrnarchitect.optimize import (
    OptimizationParameter,
    OptimizationResult,
    optimize,
)
from mrnarchitect.sequence import Sequence, SequenceType
from mrnarchitect.types import Organism


class ConvertRequest(msgspec.Struct):
    sequence: str
    sequence_type: SequenceType = "auto-detect"
    organism: Organism = "homo-sapiens"


class ConvertResponse(msgspec.Struct):
    sequence: str


@post(
    "/convert",
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
    "/optimize",
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
    gc_content_window_size: int | None = None


@post(
    "/analyze",
    summary="Analyze sequence.",
    description="Analyze and return statistics about the given sequence.",
)
async def post_analyze(data: AnalyzeRequest) -> Analysis:
    sequence = Sequence.create(data.sequence)
    return analyze(sequence, data.organism)


class CompareRequest(msgspec.Struct):
    sequence_a: str
    sequence_b: str


class CompareResponse(msgspec.Struct):
    hamming_distance: int | None


@post(
    "/compare",
    summary="Compare sequences.",
    description="Compare and return comparison statistics between two sequences.",
)
async def post_compare(data: CompareRequest) -> CompareResponse:
    sequence_a = Sequence.create(data.sequence_a)
    sequence_b = Sequence.create(data.sequence_b)
    return CompareResponse(hamming_distance=sequence_a.hamming_distance(sequence_b))


api_router = Router(
    path="/api",
    route_handlers=[
        post_analyze,
        post_compare,
        post_convert,
        post_optimize,
    ],
)
