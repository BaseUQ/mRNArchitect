library(shiny)
library(shinydashboard)
library(shinyjs)
library(shinyBS)
library(shinyWidgets)
library(shinycustomloader)

library(reticulate)
library(stringr)
library(dplyr)
library(fresh)
library(seqinr)
library(reactable)
library(readr)
library(tidyr)
library(tibble)
library(Biostrings)
library(future)

PYTHON_DEPENDENCIES = c('numpy==1.26.4', 'biopython==1.83', 'dnachisel==3.2.11', 'viennarna==2.6.4')

# Run the installation in the background
future::plan(future::multisession)
future::future(reticulate::py_install(PYTHON_DEPENDENCIES))

Bio <- reticulate::import("Bio")
Bio.Restriction <- reticulate::import("Bio.Restriction.Restriction_Dictionary")
rest_dict <- Bio.Restriction$rest_dict
dnachisel <- reticulate::import("dnachisel")
viennarna <- reticulate::import("RNA")

# Import necessary Python modules
DnaOptimizationProblem <- dnachisel$DnaOptimizationProblem
EnforceGCContent <- dnachisel$EnforceGCContent
AvoidHairpins <- dnachisel$AvoidHairpins
AvoidPattern <- dnachisel$AvoidPattern
AvoidRareCodons <- dnachisel$AvoidRareCodons
CodonOptimize <- dnachisel$CodonOptimize
EnforceTranslation <- dnachisel$EnforceTranslation
UniquifyAllKmers <- dnachisel$UniquifyAllKmers
Location <- dnachisel$Location

organism_index_df <- data.frame(
  Organism = c("Human", "Mouse"),
  Species = c("h_sapiens", "m_musculus"),
  stringsAsFactors = FALSE
)

my_theme = fresh::create_theme(
  fresh::adminlte_color(
    light_blue = "#FFFFFF"
  ),
  fresh::adminlte_sidebar(
    width = "200px",
    dark_bg = "#234A8A",
    dark_hover_bg = "#D8DEE9",
    dark_color = "#FFFFFF"
  ),
  fresh::adminlte_global(
    content_bg = "#FFFFFF",
    box_bg = "#FFFFFF",
    info_box_bg = "#FFFFFF"
  )
)

max_random_iters = 20000

UTR5_default <- "ACTCTTCTGGTCCCCACAGACTCAGAGAGAACCCACC"
UTR3_default <- "GCTGGAGCCTCGGTGGCCATGCTTCTTGCCCCTTGGGCCTCCCCCCAGCCCCTCCTCCCCTTCCTGCACCCGTACCCCCGTGGTCTTTGAATAAAGTCTGAGTGGGCGGCA"


ud_table <- list(
  '*' = list('TAA' = 0.276, 'TAG' = 0.223, 'TGA' = 0.5),
  'A' = list('GCA' = 0.349, 'GCC' = 0.53, 'GCG' = 0.121, 'GCT' = 0),
  'C' = list('TGC' = 1.0, 'TGT' = 0),
  'D' = list('GAC' = 1.0, 'GAT' = 0),
  'E' = list('GAA' = 0.459, 'GAG' = 0.541),
  'F' = list('TTC' = 1.0, 'TTT' = 0),
  'G' = list('GGA' = 0.328, 'GGC' = 0.379, 'GGG' = 0.294, 'GGT' = 0),
  'H' = list('CAC' = 1.0, 'CAT' = 0),
  'I' = list('ATA' = 0.302, 'ATC' = 0.698, 'ATT' = 0),
  'K' = list('AAA' = 0.464, 'AAG' = 0.536),
  'L' = list('CTA' = 0.089, 'CTC' = 0.213, 'CTG' = 0.432, 'TTA' = 0.104, 'TTG' = 0.161, 'CTT' = 0),
  'M' = list('ATG' = 1.0),
  'N' = list('AAC' = 1.0, 'AAT' = 0),
  'P' = list('CCA' = 0.427, 'CCC' = 0.432, 'CCG' = 0.141, 'CCT' = 0),
  'Q' = list('CAA' = 0.284, 'CAG' = 0.716),
  'R' = list('AGA' = 0.259, 'AGG' = 0.236, 'CGA' = 0.125, 'CGC' = 0.17, 'CGG' = 0.21, 'CGT' = 0),
  'S' = list('AGC' = 0.357, 'TCA' = 0.256, 'TCC' = 0.314, 'TCG' = 0.073, 'AGT' = 0, 'TCT' = 0),
  'T' = list('ACA' = 0.413, 'ACC' = 0.447, 'ACG' = 0.14, 'ACT' = 0),
  'V' = list('GTA' = 0.163, 'GTC' = 0.286, 'GTG' = 0.551, 'GTT' = 0),
  'W' = list('TGG' = 1.0),
  'Y' = list('TAC' = 1.0, 'TAT' = 0)
)

help_data <- data.frame(
  INPUT = c("CDS", "5'UTR", "3'UTR", "Poly(A) tail"),
  Explanation = c(
    "Add your coding sequence of interest here. You can paste either the amino acid, RNA or DNA sequence. You may also want to consider adding useful sequence elements such as nuclear localization signals, signal peptides, or other tags. Ensure your coding sequence starts with a MET codon and ends with a STOP codon. You may want to use two different stop codons for efficient termination (e.g., UAG/UGA).",
    "Add your 5’ untranslated sequence here. The 5’UTR is bound and scanned by the ribosome and is needed for translation. By default, we use the human alpha-globin (<i>HBA1</i>; Gene ID 3039) 5’UTR that has been validated in different cell types and applications.",
    "Paste your 3’ untranslated sequence here. The 3'UTR is regulated by microRNAs and RNA-binding proteins and plays a key role in cell-specific mRNA stability and expression. By default, we use the human alpha-globin (<i>HBA1</i>; Gene ID 3039) 3’UTR that has been validated in different cell types and applications.",
    "Specify the length of the poly(A) tail or alternatively paste more complex designs. The length of the poly(A) tail plays a critical role in mRNA translation and stability. By default, no tail will be added."
  ),
  stringsAsFactors = FALSE
)

parameters_data <- data.frame(
  INPUT = c( "Number of sequences", "Organism", "Uridine depletion", "Avoid ribosome slip",
             "Min/Max GC content", "GC window",
            "Avoid cut sites", "Avoid sequences", "Avoid repetitive",  
            "Avoid PolyA/U/C/T", 
            "Hairpin stem size", "Hairpin window"),
  Explanation = c( "The number of optimized output mRNA sequences to generate. Please note that more sequences takes longer and there is a maximum of 10.",
                   "Select the target organism to be used for codon optimisation. The mRNA will be optimised using the preferred codon usage of highly expressed genes in this selected organism (1). By default, we use human codon optimisation.",
                   "If selected, this minimizes the use of uridine nucleosides in the mRNA sequence. This is achieved by avoiding codons that encode uridine at the third wobble position and can impact reactogenicity of the mRNA sequence.",
                   "Avoid more than 3 Us in the open-reading frame, where ribosomes can +1 frameshift at consecutive N1-methylpseudouridines (Mulroney et. al., 2024).",
                   "Defines the minimum or maximum fraction of the mRNA sequence comprising G/C nucleotides that is associated with stability and hairpins of the mRNA. We recommend 0.4 and 0.7.",
                   "The window size across which the min/max GC content is calculated and imposed. We recommend 100.",
                   "Avoid restriction enzyme sites in the sequence.",
                   "Specify sequences that should be avoided in the mRNA sequence.",
                   "Avoid repeating any sequences longer than this length within the mRNA. We recommend 10 nucleotides.",
                   "Avoid homopolymer tracts that can be difficult to synthesise and translate. We recommend 9 for poly(U)/poly(A) and 6 for poly(C)/poly(G).",
                   "Avoid stable hairpins longer than this length. We recommend 10.",
                   "Window size used to measure hairpins. We recommend 60.")
                   )

results_data <- data.frame(
  INPUT = c("Full-length mRNA", "Feature", "A/U/G/C ratio", "AT/GA/GC ratio", "Uridine depletion", "CAI", "CDS MFE", "5'UTR MFE", "3'UTR MFE", "Total MFE"),
  Explanation = c("These are the output mRNA sequences that have been assembled and optimized according to the user parameters.",
                  "  ",
                  "The nucleotide composition of the input and output optimised mRNA sequences. High GC content is correlated with stable secondary structure, and low U associated with reactogenicity.",
                  "The dinucleotide composition of the input and output mRNA sequences. High GC content is correlated with stable secondary structure.",
                  "The fraction of codons with uridine in the third nucleotide position. Maximum and minimum values are 1 (all) and 0 (no) codons with uridine in third nucleotide position.",
                  "The Codon Adaptation Index (CAI) is a measure of deviation between the codon usage of the mRNA sequence from the preferred codon usage of the organism (2). The CAI score ranges from 0 (totally dissimilar) to 1 (all mRNA codons match the organism's codon usage reference table).",
                  "The Minimum Free Energy (MFE) is the lowest Gibbs free energy change associated with the formation of secondary structures in RNA molecules due to intramolecular base pairing (3). Lower values of MFE are associated with the formation of more stable secondary structures and hairpins that can occlude translation and expression.",
                  "The Minimum Free Energy of the 5' UTR sequences. Lower values of MFE are associated with reduced secondary structures.",
                  "The Minimum Free Energy of the 3' UTR sequences. Lower values of MFE are associated with reduced secondary structures.",
                  "The Minimum Free Energy of the full sequence (5' UTR, coding sequence, 3' UTR and poly(A) tail). Lower values of MFE are associated with reduced secondary structures.")
)