import timeit

import msgspec

from mrnarchitect.organism import CodonUsageTable
from mrnarchitect.sequence import GCWindowStats, MinimumFreeEnergy, Sequence
from mrnarchitect.types import Organism


class Analysis(msgspec.Struct, kw_only=True):
    class Debug(msgspec.Struct, kw_only=True):
        time_seconds: float

    a_ratio: float
    c_ratio: float
    g_ratio: float
    t_ratio: float
    at_ratio: float
    ga_ratio: float
    gc_ratio: float
    uridine_depletion: float | None
    codon_adaptation_index: float | None
    trna_adaptation_index: float | None
    minimum_free_energy: MinimumFreeEnergy
    gc_ratio_window: GCWindowStats
    debug: Debug


def analyze(
    sequence: Sequence,
    codon_usage_table: CodonUsageTable | Organism = "homo-sapiens",
    gc_content_window_size: int = 100,
):
    start = timeit.default_timer()
    minimum_free_energy = sequence.minimum_free_energy
    return Analysis(
        a_ratio=sequence.a_ratio,
        c_ratio=sequence.c_ratio,
        g_ratio=sequence.g_ratio,
        t_ratio=sequence.t_ratio,
        at_ratio=sequence.at_ratio,
        ga_ratio=sequence.ga_ratio,
        gc_ratio=sequence.gc_ratio,
        uridine_depletion=sequence.uridine_depletion,
        codon_adaptation_index=sequence.codon_adaptation_index(codon_usage_table),
        trna_adaptation_index=sequence.trna_adaptation_index(codon_usage_table),
        minimum_free_energy=minimum_free_energy,
        gc_ratio_window=sequence.gc_ratio_window(gc_content_window_size),
        debug=Analysis.Debug(time_seconds=timeit.default_timer() - start),
    )
