#' Check and Install Required Packages
#'
#' This function checks if the specified R packages are installed. If not, it attempts
#' to install them from CRAN. If a package is unavailable on CRAN, it tries to install
#' it from Bioconductor. If installation fails, an error message is displayed.
#'
#' @param packages A character vector of package names to check and install if needed.
#'
#' @return None (invisible `NULL`), but installs missing packages.
#' @export
#'
#' @examples
#' check_and_install_packages(c("shiny", "ggplot2", "Biostrings"))
check_and_install_packages <- function(packages) {
  if (!requireNamespace("BiocManager", quietly = TRUE)) {
    install.packages("BiocManager")
  }
  
  for (pkg in packages) {
    if (!requireNamespace(pkg, quietly = TRUE)) {
      message(paste("Installing missing package:", pkg))
      tryCatch({
        install.packages(pkg)
        if (!requireNamespace(pkg, quietly = TRUE)) {
          stop(paste("Failed to install", pkg, "from CRAN. Trying Bioconductor..."))
        }
      }, error = function(e) {
        message(paste("Trying to install", pkg, "from Bioconductor..."))
        tryCatch({
          BiocManager::install(pkg)
          if (!requireNamespace(pkg, quietly = TRUE)) {
            stop(paste("Failed to install", pkg, "from Bioconductor. Please install it manually."))
          }
        }, error = function(e) {
          stop(paste("Installation failed for package:", pkg, ". Please install it manually."))
        })
      })
    }
  }
}

#' Get Sequence Properties
#'
#' Calculates the nucleotide base ratios and other properties of a given nucleotide sequence.
#'
#' @param sequence A character string representing the nucleotide sequence. The sequence should contain only nucleotide characters (A, T, C, G, or U).
#' @return A list containing the ratios of A, T/U, G, C bases, as well as AT, GC, and GA ratios.
#' @export

get_seq_properties <- function(sequence) {
  sequence <- toupper(sequence)  # Convert once to uppercase for case insensitivity
  seq_length <- nchar(sequence)
  
  A_s <- stringr::str_count(sequence, "A")
  T_s <- stringr::str_count(sequence, "[TU]")
  G_s <- stringr::str_count(sequence, "G")
  C_s <- stringr::str_count(sequence, "C")
  
  base_ratio <- c(A = A_s, TU = T_s, G = G_s, C = C_s) / seq_length
  
  GC_ratio <- base_ratio["G"] + base_ratio["C"]
  GA_ratio <- base_ratio["G"] + base_ratio["A"]
  AT_ratio <- 1 - GC_ratio
  
  properties <- list(
    A_ratio = round(base_ratio["A"], 2),
    TU_ratio = round(base_ratio["TU"], 2),
    G_ratio = round(base_ratio["G"], 2),
    C_ratio = round(base_ratio["C"], 2),
    AT_ratio = round(AT_ratio, 2),
    GC_ratio = round(GC_ratio, 2),
    GA_ratio = round(GA_ratio, 2)
  )
  return(properties)
}

#' Calculate Uridine Depletion
#'
#' Calculates the uridine depletion (uridine at the third nucleotide position in codon) of a given nucleotide sequence.
#'
#' @param sequence A string representing the nucleotide sequence.
#' @return A numeric value representing the uridine depletion.
#' @export

calculate_u_depletion <- function(sequence) { 
  codons <- substring(sequence, seq(1, nchar(sequence) - 2, by = 3), seq(3, nchar(sequence), by = 3)) 
  u_depletion <- mean(substr(codons, 3, 3) %in% c("U", "T")) 
  return(u_depletion) 
}

#' Recalculate Codon Frequencies and Return Formatted List
#'
#' This function sets the relative frequencies of all codons ending with "T" to 0, 
#' recalculates the relative frequencies for the remaining codons for each amino acid, 
#' and returns the result as a list with specific formatting.
#'
#' @param codon_table A data frame containing the following columns:
#'   - `amino_acid`: Character column with amino acid abbreviations (e.g., "A", "R").
#'   - `codon`: Character column with codon sequences (e.g., "GCC", "AGA").
#'   - `relative_frequency`: Numeric column with the relative frequency of each codon.
#'
#' @return A list formatted such that each amino acid is a named element, and its 
#' codons are named sub-elements with recalculated relative frequencies.
#' @export

recalculate_frequencies_for_UD <- function(codon_table) {
  codon_table %>%
    dplyr::mutate(relative_frequency = if_else(str_ends(codon, "T"), 0, relative_frequency)) %>%
    dplyr::group_by(amino_acid) %>%
    dplyr::mutate(relative_frequency = relative_frequency / sum(relative_frequency, na.rm = TRUE)) %>%
    dplyr::ungroup() %>%
    dplyr::group_by(amino_acid) %>%
    dplyr::summarise(
      codons = list(setNames(as.list(relative_frequency), codon))
    ) %>%
    tibble::deframe()
}

#' Select the Most Frequent Codons for Each Amino Acid
#'
#' This function selects the codon with the highest relative frequency for each amino acid 
#' from a given codon table. It returns a named vector where the names are amino acid abbreviations 
#' and the values are the corresponding codons.
#'
#' @param codon_table A data frame containing at least the following columns:
#'   - `amino_acid`: Character column with amino acid abbreviations (e.g., "A", "R").
#'   - `codon`: Character column with codon sequences (e.g., "GCC", "AGA").
#'   - `relative_frequency`: Numeric column with the relative frequency of each codon.
#'
#' @return A named vector where the names are amino acid abbreviations and the values are the most frequent codons.
#' @export

select_most_frequent_codons <- function(codon_table) {
  codon_table %>%
    dplyr::group_by(amino_acid) %>%
    dplyr::filter(relative_frequency == max(relative_frequency)) %>% 
    dplyr::ungroup() %>%
    dplyr::select(amino_acid, codon) %>% 
    tibble::deframe() 
}

#' Reverse Translate Protein Sequence
#'
#' Converts a protein sequence to a nucleotide sequence using a codon table.
#'
#' @param protein_sequence A string representing the protein sequence.
#' @param codon_table A list where each amino acid corresponds to a list of codons.
#' @return A string representing the nucleotide sequence.
#' @export

reverse_translate <- function(protein_sequence, codon_table) {
  amino_acids <- strsplit(protein_sequence, NULL)[[1]]
  codons <- sapply(amino_acids, function(aa) sample(codon_table[[toupper(aa)]], 1))
  nucleotide_sequence <- paste(codons, collapse = "")
  return(nucleotide_sequence)
}

#' Translate Nucleotide Sequence
#'
#' Converts a nucleotide sequence into a protein sequence.
#'
#' @param sequence A string representing the nucleotide sequence.
#' @return A string representing the protein sequence.
#' @export

translate_sequence <- function(sequence) {
  protein_sequence <- paste(seqinr::translate(seqinr::s2c(sequence)), collapse = "")
  return(protein_sequence)
}

#' Validate Input String
#'
#' Validates the input string to ensure it contains only allowed characters (A, T, G, C, and commas).
#'
#' @param input_string A string representing the input sequence.
#' @return TRUE if the input string is valid, otherwise FALSE.
#' @export

validate_input_string <- function(input_string) {
  allowed_chars <- c('A', 'T', 'G', 'C', ',')
  validate <- all(strsplit(toupper(trimws(input_string)), NULL)[[1]] %in% allowed_chars)
  return(validate) 
}

#' Process Substring
#'
#' This function takes a substring, trims any spaces (leading, trailing, and internal), 
#' and converts the string to uppercase.
#'
#' @param substring A character string that needs to be processed.
#'
#' @return A character string that has been trimmed of whitespace and converted to uppercase.
#' @export

process_substring <- function(substring) {
  processed_string <- gsub("\\s+", "", substring) 
  return(toupper(processed_string))
}

#' Calculate Codon Adaptation Index (CAI)
#'
#' This function calculates the Codon Adaptation Index (CAI) for a given nucleotide sequence.
#' The CAI is a measure of the relative adaptiveness of the codon usage of a gene
#' to the codon usage of a reference set of genes.
#'
#' @param sequence A character string representing the nucleotide sequence. The sequence should be a multiple of three in length, containing only nucleotide characters (A, T, C, G).
#' @param ref_codon_usage A data frame with columns `codon`, `amino_acid`, and `relative_frequency`, representing the reference codon usage table.
#'
#' @return A numeric value representing the Codon Adaptation Index (CAI) for the given sequence.
#' @export

calculate_cai <- function(sequence, ref_codon_usage) {
  codons <- toupper(sapply(seq(1, nchar(sequence), by = 3), function(i) substr(sequence, i, i + 2)))
  # Function to get the maximum frequency for each amino acid
  get_max_frequency <- function(codon) {
    amino_acid <- ref_codon_usage$amino_acid[ref_codon_usage$codon == codon]
    if (length(amino_acid) == 0) return(NA)
    max_freq <- max(ref_codon_usage$relative_frequency[ref_codon_usage$amino_acid == amino_acid])
    return(max_freq)
  }
  # Calculate the normalized frequency for each codon
  codon_frequencies <- sapply(codons, function(codon) {
    freq <- ref_codon_usage$relative_frequency[ref_codon_usage$codon == codon]
    max_freq <- get_max_frequency(codon)
    if (length(freq) == 0 || is.na(max_freq)) return(NA)
    return(freq / max_freq)
  })
  # Remove NA values and calculate the geometric mean of the normalized frequencies
  codon_frequencies <- codon_frequencies[!is.na(codon_frequencies)]
  cai <- exp(mean(log(codon_frequencies)))
  return(cai)
}

#' Calculate Sequence Properties
#'
#' This function calculates various properties of a coding DNA sequence (CDS) and its associated UTRs (Untranslated Regions). 
#' The properties include nucleotide composition ratios, Uridine depletion, Codon Adaptation Index (CAI), and Minimum Free Energy (MFE) of the CDS, UTRs and full sequence.
#'
#' @param sequence A character string representing the coding DNA sequence (CDS). The sequence should be a multiple of three in length, containing only nucleotide characters (A, T, C, G).
#' @param UTR5 A character string representing the 5' Untranslated Region (5'UTR) of the sequence.
#' @param UTR3 A character string representing the 3' Untranslated Region (3'UTR) of the sequence.
#' @param polyA A character string representing the poly(A) tail.
#' @param ref_codon_usage A data frame with columns `codon`, `amino_acid`, and `relative_frequency`, representing the reference codon usage table.
#'
#' @return A data frame containing various metrics related to the sequence and UTRs, including:
#' \itemize{
#'   \item \code{A ratio}: Ratio of Adenine (A) nucleotides in the CDS.
#'   \item \code{T/U ratio}: Ratio of Thymine (T) or Uracil (U) nucleotides in the CDS.
#'   \item \code{G ratio}: Ratio of Guanine (G) nucleotides in the CDS.
#'   \item \code{C ratio}: Ratio of Cytosine (C) nucleotides in the CDS.
#'   \item \code{AT ratio}: Ratio of Adenine-Thymine (A-T) pairs in the CDS.
#'   \item \code{GA ratio}: Ratio of Guanine-Adenine (G-A) pairs in the CDS.
#'   \item \code{GC ratio}: Ratio of Guanine-Cytosine (G-C) pairs in the CDS.
#'   \item \code{Uridine depletion}: Measure of uridine depletion in the CDS.
#'   \item \code{CAI}: Codon Adaptation Index (CAI) of the CDS.
#'   \item \code{CDS MFE (kcal/mol)}: Minimum Free Energy (MFE) of the CDS in kcal/mol.
#'   \item \code{5'UTR MFE (kcal/mol)}: MFE of the 5'UTR in kcal/mol.
#'   \item \code{3'UTR MFE (kcal/mol)}: MFE of the 3'UTR in kcal/mol.
#'   \item \code{Total MFE (kcal/mol)}: MFE of the full sequence (5' UTR, coding sequence, 3' UTR and poly(A) in kcal/mol.
#' }
#' @export

calculate_properties <- function(sequence, UTR5, UTR3, polyA, ref_codon_usage) { 
  if (!nchar(sequence) == 0) {
    properties <- get_seq_properties(sequence)
    u_depletion <- round(calculate_u_depletion(sequence), 2)
    cai <- round(calculate_cai(sequence, ref_codon_usage), 2)
    rna <- gsub("T", "U", sequence)
    fold <- viennarna$fold_compound(rna)
    mfe <- round(fold$mfe()[[2]], 2)
    } else {
      properties <- list(
        A_ratio = "NA",
        TU_ratio = "NA",
        G_ratio = "NA",
        C_ratio = "NA",
        AT_ratio = "NA",
        GC_ratio = "NA",
        GA_ratio = "NA"
        )
      u_depletion <- "NA"
      cai <- "NA"
      mfe <- "NA"
    }
  
  if(UTR5 != "") {
    utr5_rna <- gsub("T", "U", UTR5)
    utr5_fold <- viennarna$fold_compound(utr5_rna)
    utr5_mfe <- round(utr5_fold$mfe()[[2]], digits = 3)
  } else {
    utr5_mfe <- "NA"
  }
  
  if(UTR3 != "") {
    utr3_rna <- gsub("T", "U", UTR3)
    utr3_fold <- viennarna$fold_compound(utr3_rna)
    utr3_mfe <- round(utr3_fold$mfe()[[2]], digits = 3)
  } else {
    utr3_mfe <- "NA"
  }
  
  full_seq <- paste0(UTR5, sequence, UTR3, polyA)
  full_seq_rna <- gsub("T", "U", full_seq)
  full_seq_fold <- viennarna$fold_compound(full_seq_rna)
  full_seq_mfe <- round(full_seq_fold$mfe()[[2]], digits = 3)
  
  data.frame(
    Metric = c("A ratio", "T/U ratio", "G ratio", "C ratio", "AT ratio", "GA ratio", "GC ratio", "Uridine depletion", "CAI", "CDS MFE (kcal/mol)", "5'UTR MFE (kcal/mol)", "3'UTR MFE (kcal/mol)", "Total MFE (kcal/mol)"),
    Value = c(
      properties$A_ratio,
      properties$TU_ratio,
      properties$G_ratio,
      properties$C_ratio,
      properties$AT_ratio,
      properties$GA_ratio,
      properties$GC_ratio,
      u_depletion,
      cai,
      mfe,
      utr5_mfe, 
      utr3_mfe,
      full_seq_mfe
    )
  )
}

#' Highlight Sequences in a Given String
#'
#' This function takes a sequence and highlights specific parts of it based on the provided
#' parts and their corresponding CSS classes. The function wraps each specified part of the 
#' sequence in a `<span>` tag with a class that applies the desired styling.
#'
#' @param sequence A string representing the full sequence in which parts will be highlighted.
#' @param parts A named list where each element is a list with two components:
#'   \itemize{
#'     \item \code{sequence}: A substring of the main sequence to be highlighted.
#'     \item \code{class}: The CSS class to apply to the highlighted part.
#'   }
#'   The names of the list elements represent the names of the parts.
#'
#' @return A string where the specified parts of the sequence are wrapped in `<span>` tags
#'   with the corresponding CSS classes applied.
#' @export

highlight_sequence <- function(sequence, parts) {
  highlighted_sequence <- sequence
  
  for (part_name in names(parts)) {
    part_info <- parts[[part_name]]
    part_seq <- part_info$sequence
    css_class <- part_info$class
    
    if (nzchar(part_seq)) {  # Only wrap in <span> if the sequence is not empty
      part_seq_escaped <- gsub("([\\[\\]\\^\\$\\*\\+\\?\\.\\|\\(\\)\\\\])", "\\\\\\1", part_seq)
      
      highlighted_sequence <- sub(part_seq_escaped, 
                                  paste0('<span class="', css_class, '">', part_seq, '</span>'), 
                                  highlighted_sequence, fixed = TRUE)
    }
  }
  return(highlighted_sequence)
}

#' Extract Specific Metrics from Data Frame
#'
#' Extracts numeric values for "GC ratio," "CAI," and "Total MFE (kcal/mol)" 
#' from the `Value_Output` column of a data frame based on matching rows in the `Metric` column.
#' It returns the extracted values in a specific order: "GC ratio," "CAI," and "CDS MFE."
#'
#' @param df A data frame containing columns `Metric` and `Value_Output`, where `Metric` 
#' specifies the metric type and `Value_Output` provides the corresponding value.
#' @return A numeric vector with values for "GC ratio," "CAI," and "Total MFE (kcal/mol)", 
#' in that order. 
#' @importFrom dplyr filter arrange pull
#' @export

extract_values <- function(df) {
  values <- df %>%
    dplyr::filter(Metric %in% c("GC ratio", "CAI", "Total MFE (kcal/mol)")) %>%
    dplyr::arrange(match(Metric, c("GC ratio", "CAI", "Total MFE (kcal/mol)"))) %>%  
    dplyr::pull(Value_Output) %>%
    as.numeric() 
  
  return(values)
}

#' Show a Message Modal
#'
#' Displays a modal dialog with a customizable message and icon.
#'
#' @param title A character string specifying the title of the modal dialog.
#' @param message A character string containing the message to be displayed in the modal.
#' @param type A character string specifying the type of the message. This determines the icon to be used. 
#'             Options are "error", "success", or "info". Defaults to "info".
#'
#' @return This function does not return any value. It displays a modal dialog in the Shiny app.
#' @export

showMessageModal <- function(title, message, type = "info") {
  icon <- switch(type,
                 "error" = icon("exclamation-triangle", class = "text-danger"),
                 "success" = icon("check-circle", class = "text-success"),
                 "info" = icon("info-circle", class = "text-info"),
                 icon("info-circle", class = "text-info"))  # Default to info

  showModal(modalDialog(
    title = div(
      icon,
      span(title, style = "font-weight: bold; font-size: 20px;") 
    ),
    tags$p(message),
    easyClose = FALSE,
    footer = tagList(
      tags$div(
      modalButton("OK")
      )
    ),
    class = "custom-modal"
  ))
}
