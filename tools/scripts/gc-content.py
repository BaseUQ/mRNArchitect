import plotnine as p9
import polars as pl
import urllib.request


# from ..constants import SEQUENCES as CONSTANT_SEQUENCES
from ..organism import CODON_TO_AMINO_ACID_MAP
from ..sequence import Sequence

WINDOW_SIZE = 100


def download_uniprot(sequence_id: str) -> tuple[str, str]:
    with urllib.request.urlopen(
        f"https://rest.uniprot.org/uniprotkb/{sequence_id}.fasta"
    ) as response:
        data = response.read().decode().split("\n")
        name = data[0].split("|")[2].split(" ")[0]
        sequence = "".join(data[1:])
        return (name, sequence)


def generate_sequence(sequence: Sequence, gc_depletion: bool):
    return Sequence(
        "".join(
            sorted(
                [
                    c
                    for c, aa in CODON_TO_AMINO_ACID_MAP.items()
                    if aa == CODON_TO_AMINO_ACID_MAP[codon]
                ],
                key=lambda x: len([it for it in x if it in ["G", "C"]]),
            )[0 if gc_depletion else -1]
            for codon in sequence.codons
        )
    )


def main():
    # SEQUENCES = CONSTANT_SEQUENCES
    # with open("data/uniprot-100.txt", "r") as f:
    # sequence_ids = [it.strip() for it in f.readlines() if it]
    # SEQUENCES = dict(download_uniprot(sequence_id) for sequence_id in sequence_ids)
    with open("data/uniprot-100.json", "r") as f:
        import json

        SEQUENCES = json.loads(f.read())

    df = (
        pl.DataFrame(
            {"Name": name, "Sequence": Sequence.from_amino_acid_sequence(sequence)}
            for name, sequence in SEQUENCES.items()
        )
        .with_columns(
            pl.col("Sequence")
            .map_elements(
                lambda x: generate_sequence(x, gc_depletion=True),
                return_dtype=pl.Object,
            )
            .alias("Sequence (GC depleted)"),
            pl.col("Sequence")
            .map_elements(
                lambda x: generate_sequence(x, gc_depletion=False),
                return_dtype=pl.Object,
            )
            .alias("Sequence (GC enriched)"),
            pl.col("Sequence")
            .map_elements(lambda x: x.gc_ratio, return_dtype=pl.Float64)
            .alias("GC-ratio (Max CAI)"),
        )
        .with_columns(
            pl.col("Sequence (GC depleted)")
            .map_elements(lambda x: x.gc_ratio, return_dtype=pl.Float64)
            .alias("GC-ratio (GC depleted)"),
            pl.col("Sequence (GC depleted)")
            .map_elements(
                lambda x: min(
                    x[i : i + WINDOW_SIZE].gc_ratio for i in range(len(x) - WINDOW_SIZE)
                ),
                return_dtype=pl.Float64,
            )
            .alias(f"Minimum window GC-ratio (GC depleted, n={WINDOW_SIZE})"),
            pl.col("Sequence (GC depleted)")
            .map_elements(
                lambda x: max(
                    x[i : i + WINDOW_SIZE].gc_ratio for i in range(len(x) - WINDOW_SIZE)
                ),
                return_dtype=pl.Float64,
            )
            .alias(f"Maximum window GC-ratio (GC depleted, n={WINDOW_SIZE})"),
            pl.col("Sequence (GC enriched)")
            .map_elements(lambda x: x.gc_ratio, return_dtype=pl.Float64)
            .alias("GC-ratio (GC enriched)"),
            pl.col("Sequence (GC enriched)")
            .map_elements(
                lambda x: min(
                    x[i : i + WINDOW_SIZE].gc_ratio for i in range(len(x) - WINDOW_SIZE)
                ),
                return_dtype=pl.Float64,
            )
            .alias(f"Minimum window GC-ratio (GC enriched, n={WINDOW_SIZE})"),
            pl.col("Sequence (GC enriched)")
            .map_elements(
                lambda x: max(
                    x[i : i + WINDOW_SIZE].gc_ratio for i in range(len(x) - WINDOW_SIZE)
                ),
                return_dtype=pl.Float64,
            )
            .alias(f"Maximum window GC-ratio (GC enriched, n={WINDOW_SIZE})"),
            pl.col("Sequence")
            .map_elements(
                lambda x: min(
                    x[i : i + WINDOW_SIZE].gc_ratio for i in range(len(x) - WINDOW_SIZE)
                ),
                return_dtype=pl.Float64,
            )
            .alias(f"Minimum window GC-ratio (Max CAI, n={WINDOW_SIZE})"),
            pl.col("Sequence")
            .map_elements(
                lambda x: max(
                    x[i : i + WINDOW_SIZE].gc_ratio for i in range(len(x) - WINDOW_SIZE)
                ),
                return_dtype=pl.Float64,
            )
            .alias(f"Maximum window GC-ratio (Max CAI, n={WINDOW_SIZE})"),
        )
    ).sort(pl.col("GC-ratio (Max CAI)"), descending=True)

    print(df)

    plot = (
        p9.ggplot(
            df,
            p9.aes(
                y="Name",
                yend="Name",
            ),
        )
        # + p9.geom_segment(
        #    p9.aes(
        #        x=f"Minimum window GC-ratio (GC depleted, n={WINDOW_SIZE})",
        #        xend=f"Maximum window GC-ratio (GC enriched, n={WINDOW_SIZE})",
        #        color="'lightblue'",
        #    ),
        #    size=2,
        #    lineend="round",
        # )
        # + p9.geom_segment(
        #    p9.aes(
        #        x="GC-ratio (GC depleted)",
        #        xend="GC-ratio (GC enriched)",
        #        color="'steelblue'",
        #    ),
        #    size=3,
        #    lineend="round",
        # )
        + p9.geom_segment(
            p9.aes(
                x=f"Minimum window GC-ratio (Max CAI, n={WINDOW_SIZE})",
                xend=f"Maximum window GC-ratio (Max CAI, n={WINDOW_SIZE})",
                color="'pink'",
            ),
            size=1,
            lineend="round",
        )
        + p9.geom_point(p9.aes(x="GC-ratio (Max CAI)", color="'red'"), size=3)
        + p9.geom_vline(xintercept=[0.4, 0.7], color="black", linetype="dotted")
        + p9.scale_y_discrete(limits=df["Name"].to_list())
        + p9.labs(
            x="GC-ratio",
            y="Sequence",
            title="GC-ratio per sequence",
        )
        + p9.scale_color_identity(
            guide="legend",
            name="Legend",
            breaks=["lightblue", "steelblue", "pink", "red"],
            labels=[
                "Min/max windowed GC-ratio (n=100)",
                "Min/max global GC-ratio",
                "Max CAI windowed GC-ratio",
                "Max CAI global GC-ratio",
            ],
        )
        + p9.theme_gray()
    )

    plot.save("gc-ratio.svg", width=24, height=12)
    plot.save("gc-ratio.png", width=24, height=12, dpi=300)

    windows = (
        df.select(
            "Name", "Sequence", "Sequence (GC depleted)", "Sequence (GC enriched)"
        )
        .with_columns(
            pl.col("Sequence (GC depleted)")
            .map_elements(
                lambda x: [
                    x[i : i + WINDOW_SIZE].gc_ratio for i in range(len(x) - WINDOW_SIZE)
                ],
                return_dtype=pl.List(pl.Float64),
            )
            .alias("Windowed GC-ratio (GC depleted)"),
            pl.col("Sequence (GC enriched)")
            .map_elements(
                lambda x: [
                    x[i : i + WINDOW_SIZE].gc_ratio for i in range(len(x) - WINDOW_SIZE)
                ],
                return_dtype=pl.List(pl.Float64),
            )
            .alias("Windowed GC-ratio (GC enriched)"),
            pl.col("Sequence")
            .map_elements(
                lambda x: [
                    x[i : i + WINDOW_SIZE].gc_ratio for i in range(len(x) - WINDOW_SIZE)
                ],
                return_dtype=pl.List(pl.Float64),
            )
            .alias("Windowed GC-ratio (Max CAI)"),
        )
        .explode(
            "Windowed GC-ratio (GC depleted)",
            "Windowed GC-ratio (GC enriched)",
            "Windowed GC-ratio (Max CAI)",
        )
    )
    print(windows)

    window_plot = p9.ggplot(windows, p9.aes(y="Name", yend="Name")) + p9.geom_line(
        p9.aes(x="Windowed GC-ratio (GC depleted)", color="'red'")
    )

    window_plot.save("gc-ratio-window.png", width=20, height=10, dpi=300)


if __name__ == "__main__":
    main()
