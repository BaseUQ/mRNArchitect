import csv
import itertools
import multiprocessing


from ..sequence import Sequence, OptimizationConfiguration


def _optimize(
    index: int,
    sequence: str,
    enable_uridine_depletion: bool,
    avoid_ribosome_slip: bool,
    gc_content_min: float,
    gc_content_max: float,
    gc_content_window: int,
    avoid_repeat_length: int,
) -> tuple[dict, dict | None, Exception | None]:
    print(f"#{index}: Starting...")
    input = {
        "sequence": sequence,
        "enable_uridine_depletion": enable_uridine_depletion,
        "avoid_ribosome_slip": avoid_ribosome_slip,
        "gc_content_min": gc_content_min,
        "gc_content_max": gc_content_max,
        "gc_content_window": gc_content_window,
        "avoid_repeat_length": avoid_repeat_length,
    }
    result, error = None, None
    try:
        optimized = Sequence.from_amino_acid_sequence(sequence).optimize(
            OptimizationConfiguration(
                gc_content_min=gc_content_min,
                gc_content_max=gc_content_max,
                gc_content_window=gc_content_window,
                enable_uridine_depletion=enable_uridine_depletion,
                avoid_ribosome_slip=avoid_ribosome_slip,
                avoid_repeat_length=avoid_repeat_length,
            )
        )
        result = {
            "output_sequence": optimized.output.nucleic_acid_sequence,
            "a_ratio": optimized.output.a_ratio,
            "c_ratio": optimized.output.c_ratio,
            "g_ratio": optimized.output.g_ratio,
            "t_ratio": optimized.output.t_ratio,
            "at_ratio": optimized.output.at_ratio,
            "ga_ratio": optimized.output.ga_ratio,
            "gc_ratio": optimized.output.gc_ratio,
            "uridine_depletion": optimized.output.uridine_depletion,
            "cai": optimized.output.codon_adaptation_index("h_sapiens"),
            "mfe": optimized.output.minimum_free_energy.energy,
        }
    except Exception as e:
        error = e
    print(f"#{index}: Complete!")
    return input, result, error


if __name__ == "__main__":
    sequence = "MEDAKNIKKGPAPFYPLEDGTAGEQLHKAMKRYALVPGTIAFTDAHIEVDITYAEYFEMSVRLAEAMKRYGLNTNHRIVVCSENSLQFFMPVLGALFIGVAVAPANDIYNERELLNSMGISQPTVVFVSKKGLQKILNVQKKLPIIQKIIIMDSKTDYQGFQSMYTFVTSHLPPGFNEYDFVPESFDRDKTIALIMNSSGSTGLPKGVALPHRTACVRFSHARDPIFGNQIIPDTAILSVVPFHHGFGMFTTLGYLICGFRVVLMYRFEEELFLRSLQDYKIQSALLVPTLFSFFAKSTLIDKYDLSNLHEIASGGAPLSKEVGEAVAKRFHLPGIRQGYGLTETTSAILITPEGDDKPGAVGKVVPFFEAKVVDLDTGKTLGVNQRGELCVRGPMIMSGYVNNPEATNALIDKDGWLHSGDIAYWDEDEHFFIVDRLKSLIKYKGYQVAPAELESILLQHPNIFDAGVAGLPDDDAGELPAAVVVLEHGKTMTEKEIVDYVASQVTTAKKLRGGVVFVDEVPKGLTGKLDARKIREILIKAKKGGKIAV"
    """Luciferase"""

    enable_uridine_depletion_range = [True, False]
    avoid_ribosome_slip_range = [True, False]
    gc_content_min_range = list(i / 20 for i in range(0, 21))
    gc_content_max_range = list(i / 20 for i in range(0, 21))
    gc_content_window = list(range(0, 201, 20))
    avoid_repeat_length_range = list(range(5, 16))

    parameters = list(
        p
        for p in itertools.product(
            [sequence],
            enable_uridine_depletion_range,
            avoid_ribosome_slip_range,
            gc_content_min_range,
            gc_content_max_range,
            gc_content_window,
            avoid_repeat_length_range,
        )
        if p[3] <= p[4]
    )
    parameters = [(index, *p) for index, p in enumerate(parameters)]
    print(f"Starting {len(parameters)} optimizations...")
    with multiprocessing.Pool() as pool:
        results = pool.starmap(_optimize, parameters)

        formatted_results = [
            {
                "status": "success" if not error else "failure",
                "reason": str(error) if error else "",
                **input,
                **(result if result else {}),
            }
            for input, result, error in results
        ]
        with open("/home/jon/Downloads/luciferase.csv", "w") as f:
            writer = csv.DictWriter(
                f,
                fieldnames=[
                    "status",
                    "reason",
                    "enable_uridine_depletion",
                    "avoid_ribosome_slip",
                    "gc_content_min",
                    "gc_content_max",
                    "gc_content_window",
                    "avoid_repeat_length",
                    "output_sequence",
                    "a_ratio",
                    "c_ratio",
                    "g_ratio",
                    "t_ratio",
                    "at_ratio",
                    "ga_ratio",
                    "gc_ratio",
                    "cai",
                    "mfe",
                ],
                extrasaction="ignore",
                restval="",
            )
            writer.writeheader()
            for r in formatted_results:
                writer.writerow(r)
