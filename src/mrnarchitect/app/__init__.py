import pathlib
import os

from litestar import Litestar
from litestar.config.compression import CompressionConfig
from litestar.config.cors import CORSConfig
from litestar.openapi import OpenAPIConfig
from litestar.static_files import create_static_files_router

from .routes import post_analyze, post_compare, post_convert, post_optimize


ASSETS_DIR = pathlib.Path("frontend/dist")
ALLOW_ORIGINS = [it for it in os.getenv("ALLOW_ORIGINS", "").split(",") if it]


app = Litestar(
    route_handlers=[
        post_convert,
        post_optimize,
        post_analyze,
        post_compare,
        create_static_files_router(path="/", directories=[ASSETS_DIR], html_mode=True),
    ],
    compression_config=CompressionConfig(backend="gzip", gzip_compress_level=9),
    cors_config=CORSConfig(allow_origins=ALLOW_ORIGINS) if ALLOW_ORIGINS else None,
    openapi_config=OpenAPIConfig(title="mRNArchitect API", version="0.0.1"),
)
