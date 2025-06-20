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
> uv run mRNArchitect <sequence>
```

For example:

```bash
> uv run mRNArchitect ACTACGAGG
ACCACCAGA
```

### Example Sequences and Results

Additional example sequences and result files can be downloaded from the *mRNArchitect* website at [https://www.basefacility.org.au/software](https://www.basefacility.org.au/software).

## Support and Documentation

For further information, please refer to the **HELP** section available in the *mRNArchitect* interface. For issues, support or feedback, please open a ticket on the [GitHub Issues page](https://github.com/BaseUQ/mRNArchitect/issues) or contact us directly at **basedesign@uq.edu.au**. Please ensure your description is clear and has sufficient instructions to be able to reproduce the issue.

## License

This project is licensed under the MIT License.
