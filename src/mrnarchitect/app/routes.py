import hashlib

from litestar.background_tasks import P
import msgspec
from litestar import Router, post

from mrnarchitect.analyze import Analysis, analyze
from mrnarchitect.optimize import (
    OptimizationParameter,
    OptimizationResult,
    optimize,
)
from mrnarchitect.organism import Organism, search_organisms
from mrnarchitect.sequence import Sequence, SequenceType


class ConvertRequest(msgspec.Struct):
    sequence: str
    sequence_type: SequenceType = "auto-detect"
    organism: Organism | str = "homo-sapiens"


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
async def post_optimize(
    data: OptimizeRequest,
    headers: dict,
) -> OptimizationResult:
    result = optimize(Sequence.create(data.sequence), parameters=data.parameters)
    # Log the optimization
    print(
        msgspec.json.encode(
            {
                "function": "optimize",
                "ip": headers.get("x-forwarded-for")
                or headers.get("X-Forwarded-For")
                or None,
                "user": {
                    "email": headers.get("x-mrnarchitect-email"),
                    "name": headers.get("x-mrnarchitect-name"),
                    "organization": headers.get("x-mrnarchitect-organization"),
                },
                "sequence": {
                    "sequence": data.sequence,
                    "hash": hashlib.sha256(data.sequence.encode()).hexdigest(),
                    "nt_length": len(data.sequence),
                },
                "optimized_sequence_hash": hashlib.sha256(
                    str(result.result.sequence).encode()
                ).hexdigest()
                if result.result
                else None,
                "parameters": data.parameters,
            }
        ).decode("utf-8")
    )
    return result


class AnalyzeRequest(msgspec.Struct):
    sequence: str
    organism: Organism | str = "homo-sapiens"
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


class SearchOrganismsRequest(msgspec.Struct):
    terms: str


class SearchOrganismsResponse(msgspec.Struct):
    organisms: list[Organism]


@post(
    "/search-organisms",
    summary="Search organisms.",
    description="Search for organism by Kazusa ID or latin name.",
)
async def post_search_organisms(
    data: SearchOrganismsRequest,
) -> SearchOrganismsResponse:
    return SearchOrganismsResponse(organisms=search_organisms(data.terms))


api_router = Router(
    path="/api",
    route_handlers=[
        post_analyze,
        post_compare,
        post_convert,
        post_optimize,
        post_search_organisms,
    ],
)
