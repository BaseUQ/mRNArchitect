# mRNArchitect

*mRNArchitect* is a software toolkit designed for optimizing mRNA vaccines and therapies to enhance stability, translation efficiency, and reduce reactogenicity. The software uses an optimization strategy based on the *DNAChisel* framework to generate and assemble mRNA sequences.

The mRNA sequence significantly affects its stability, translation, and reactogenicity. Therefore, optimizing an mRNA sequence is crucial for achieving desired outcomes in various applications. 

## Getting Started

### Online

The easiest way to start optimizing is by using the online tool, available for free at [https://www.basefacility.org.au/software](https://www.basefacility.org.au/software).

### Local

You can also install and use the tool locally.

First, [install the `uv` package manager](https://docs.astral.sh/uv/getting-started/installation/).

Then, you can invoke the tool from the command line:

```bash
> uv run mRNArchitect --help
usage: mRNArchitect [-h] [--sequence-type {amino-acid,nucleic-acid}] [--organism {human,mouse}] [--enable-uridine-depletion | --no-enable-uridine-depletion] [--avoid-ribosome-slip | --no-avoid-ribosome-slip]
                    [--gc-content-min GC_CONTENT_MIN] [--gc-content-max GC_CONTENT_MAX] [--gc-content-window GC_CONTENT_WINDOW]
                    sequence

A toolkit to optimize mRNA sequences.

positional arguments:
  sequence              The sequence to optimize.

options:
  -h, --help            show this help message and exit
  --sequence-type {amino-acid,nucleic-acid}
                        The type of sequence given.
  --organism {human,mouse}
                        The organism/codon usage table to optimize for.
  --enable-uridine-depletion, --no-enable-uridine-depletion
                        If set, will enable uridine depletion.
  --avoid-ribosome-slip, --no-avoid-ribosome-slip
                        If set, will avoid sequences that may cause ribosome slippage.
  --gc-content-min GC_CONTENT_MIN
                        The minimum GC-ratio (global and windowed).
  --gc-content-max GC_CONTENT_MAX
                        The maximum GC-ratio (global and windowed).
  --gc-content-window GC_CONTENT_WINDOW
                        The GC-ratio window size.
```

For example:

```bash
> uv run mRNArchitect ACTACGAGG
ACCACCAGA

> uv run mRNArchitect MILK --sequence-type amino-acid
ATGATCCTGAAG
```

### Example Sequences and Results

Additional example sequences and result files can be downloaded from the *mRNArchitect* website at [https://www.basefacility.org.au/software](https://www.basefacility.org.au/software).

## Support and Documentation

For further information, please refer to the **HELP** section available in the *mRNArchitect* interface. For issues, support or feedback, please open a ticket on the [GitHub Issues page](https://github.com/BaseUQ/mRNArchitect/issues) or contact us directly at **basedesign@uq.edu.au**. Please ensure your description is clear and has sufficient instructions to be able to reproduce the issue.

## License

This project is licensed under the MIT License.
