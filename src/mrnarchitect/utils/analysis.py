from mrnarchitect.sequence.sequence import Sequence


def hydrate(sequence: Sequence, full: bool = True) -> dict:
    if full:
        mfe_result = sequence.minimum_free_energy
        wmfe_result = sequence.windowed_minimum_free_energy()
    else:
        mfe_result = None
        wmfe_result = None
    return {
        "a": sequence.a_ratio,
        "c": sequence.c_ratio,
        "g": sequence.g_ratio,
        "t": sequence.t_ratio,
        "gc": sequence.gc_ratio,
        "gc1": sequence.gc_ratio,
        "gc2": sequence.gc2_ratio,
        "gc3": sequence.gc3_ratio,
        "cpg": sequence.cpg_ratio,
        "uridine_depletion": sequence.uridine_depletion,
        "cai": sequence.codon_adaptation_index(),
        "tai": sequence.trna_adaptation_index(),
        "mfe": mfe_result.energy if mfe_result else None,
        "amfe": mfe_result.average_energy if mfe_result else None,
        "mfe_structure": mfe_result.structure if mfe_result else None,
        "wmfe": wmfe_result.mean_energy if wmfe_result else None,
        "gini": sequence.gini_coefficient,
        "slippery_site_ratio": sequence.slippery_site_ratio,
        "rscu": sequence.relative_synonymous_codon_use,
        "rcbs": sequence.relative_codon_bias_strength,
        "dcbs": sequence.directional_codon_bias_score,
        "rcr": sequence.rare_codon_ratio(),
        "cub": sequence.codon_usage_bias(),
        "cbi": sequence.codon_bias_index(),
    }
