# mRNArchitect

*mRNArchitect* is a software toolkit designed for optimizing mRNA vaccines and therapies to enhance stability, translation efficiency, and reduce reactogenicity. The software uses an optimization strategy based on the *DNAChisel* framework to generate and assemble mRNA sequences.

## Getting Started

### Accessing mRNArchitect

You can access *mRNArchitect*:

1. **Online:** Use the web-based interface at [http://www.basefacility.org.au/software](http://www.basefacility.org.au/software).
2. **Local Installation:** Download the source code from the [GitHub repository](https://github.com/BaseUQ/mRNArchitect).

### Docker Image

A Docker image is also available for easy deployment. To use the Docker image:

1. **Pull the Docker Image:**

   ```docker pull basedesign/mrnadesign:latest```
   
2. **Run the Docker Container:**

   ```docker run -d -p 3838:3838 basedesign/mrnarchitect:latest```
  
This command will run the application locally on port **3838**. You can then access the app by navigating to http://localhost:3838 in your web browser.


## Design of mRNA Sequence

The mRNA sequence significantly affects its stability, translation, and reactogenicity. Therefore, optimizing an mRNA sequence is crucial for achieving desired outcomes in various applications. 

### Steps to Use mRNArchitect

1. **Open the Application:**

   Visit the *mRNArchitect* website at [http://www.basefacility.org.au/software](http://www.basefacility.org.au/software).

2. **Input Sequence:**

   In the **Sequence Input** panel, input the sequences for different components of an mRNA. For example, paste the wild-type Firefly luciferase protein sequence (either in nucleotide or amino acid format) into the **Coding Sequence** field.

3. **Select UTR Sequences:**

   Choose the **Human alpha-globin** option for both the 5'UTR and 3'UTR fields. A poly(A) tail is not required for this protocol, as it will be added during PCR amplification.

4. **Modify Parameters:**

   Use the **Parameters** panel to adjust key variables that impact mRNA sequence optimization. Initially, it is recommended to use the default settings, but they can be modified as needed. For more information on each parameter, refer to the **HELP** section in *mRNArchitect*.

5. **Run Optimization:**

   Click **RUN** to start the sequence optimization. Once complete, results will be available under the **OUTPUT** tab, where the optimized sequence can be viewed and downloaded.

6. **Submit for Synthesis:**

   Copy the optimized mRNA sequence and submit it for synthesis by a third-party provider (e.g. IDT, GeneArt, Genscript, etc.).

### Example Sequences and Results

Additional example sequences and result files can be downloaded from the [GitHub repository](https://github.com/BaseUQ/mRNArchitect) or *mRNArchitect* website at [http://www.basefacility.org.au/software](http://www.basefacility.org.au/software).

## Support and Documentation

For further information, please refer to the **HELP** section available in the *mRNArchitect* interface. For issues, support or feedback, please open a ticket on the [GitHub Issues page](https://github.com/BaseUQ/mRNArchitect/issues) or contact us directly at **basedesign@uq.edu.au**. Please ensure your description is clear and has sufficient instructions to be able to reproduce the issue.

## License

This project is licensed under the MIT License.
