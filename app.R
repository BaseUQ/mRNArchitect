source("functions.R")
source("global.R")

ui <- dashboardPage(
  title = "mRNArchitect",
  dashboardHeader(
    title = div(
      style = "position: relative; width: 100%; display: flex; justify-content: space-between; align-items: center;",
      tags$span(
        class = "app-title",
        "mRNArchitect v.0.1"
      ),
      tags$img(src = "images/BASE.png", height = '40px', style = "max-width: 150px; margin-right: 10px; ")
    ),
    titleWidth = "100%"
  ),
  
  
  dashboardSidebar(disable = TRUE), 
  
  dashboardBody(
    shinyjs::useShinyjs(),
    fresh::use_theme(my_theme),
    includeCSS("www/custom.css"),
    div(id = "loader",
        style = "display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 9999;",
        tags$img(src = "images/loading.gif", height = "100px"),
        tags$p("Processing... Please wait.")
    ),
    tabBox(
      id = "mainTabset",
      width = 12,
      tabPanel("Input",
               fluidRow(
                 box(
                   width = 12,
                   title = "Sequence Input", status = "primary", 
                   div(
                     style = "display: flex; align-items: center; margin-bottom: 0px;",
                     tags$label("Coding Sequence", style = "margin-right: 40px;"),
                     radioButtons(
                       "sequence_type",
                       label = NULL,
                       choices = c("Nucleotide", "Amino acid"),
                       selected = "Nucleotide",
                       inline = TRUE
                     )
                   ),
                   textAreaInput("sequenceText", NULL, "", height = "60px"),
                   div(
                     style = "display: flex; align-items: center; margin-bottom: 0px;",
                     tags$label("5'UTR", style = "margin-right: 40px;"),
                     #tags$label("5'UTR (including Kozak sequence)", style = "margin-right: 40px;"),
                     checkboxInput("human_alpha_5", "Human alpha-globin", value = FALSE)
                   ),
                   textAreaInput("UTR5", NULL, "", height = "30px"),
                   div(
                     style = "display: flex; align-items: center; margin-bottom: 0px;",
                     tags$label("3'UTR", style = "margin-right: 40px;"),
                     checkboxInput("human_alpha_3", "Human alpha-globin", value = FALSE)
                   ),
                   textAreaInput("UTR3", NULL, "", height = "30px"),
                   div(
                     style = "display: flex; align-items: center; margin-bottom: 0px;",
                     tags$label("Poly(A) tail", style = "margin-right: 40px;"),
                     radioButtons(
                       "polyA_input_type",
                       label = NULL,
                       choices = c("None", "Generate", "Paste"),
                       selected = "None",
                       inline = TRUE
                     )
                   ),
                   conditionalPanel(
                     condition = "input.polyA_input_type == 'Generate'",
                     numericInput("polyA_length", "Number of A's", value = 120, min = 1)
                   ),
                   conditionalPanel(
                     condition = "input.polyA_input_type == 'Paste'",
                     textInput("polyA_sequence", "Paste your Poly(A) sequence", "")
                   )
                 )
               ),
               fluidRow(
                 box(
                   width = 12,
                   title = "Parameters", status = "primary"),
                 box(
                   width = 3,
                   numericInput("tabs", "Number of sequences", value = 3, min = 1, max = 10, step = 1)
                 ),
                 box(
                   selectInput("organism", "Organism", selected = 'Human', choices = c("Select an organism" = "", organism_index_df$Organism)),
                   width = 3
                 ),
                 box(
                   width = 3,
                   tags$div(
                     tags$label("Uridine depletion", style = "font-size: 16px; display: block;"),  
                     tags$div(
                       class = "custom-checkbox",
                       tags$input(type = "checkbox", id = "uridineDepletion", value = FALSE)  
                     )
                   )
                 ),
                 box(
                   width = 3,
                   tags$div(
                     tags$label("Avoid ribosome slip", style = "font-size: 16px; display: block;"),  
                     tags$div(
                       class = "custom-checkbox",
                       tags$input(type = "checkbox", id = "ribosomeSlip", value = FALSE)  
                     )
                   )
                 )
               ),  
               fluidRow(
                 box(
                   width = 3,
                   numericInput("gc_min", "Minimum GC content", value = 0.4, min = 0, max = 1, step = 0.05)
                 ),
                 box(
                   width = 3,
                   numericInput("gc_max", "Maximum GC content", value = 0.7, min = 0, max = 1, step = 0.05)
                 ),
                 box(
                   width = 3,
                   numericInput("gc_window", "GC content window", value = 100, min = 0)
                 )
               ),
               fluidRow(
                 box(                  
                   width = 3,
                   uiOutput("restrictionSites") 
                 ),
                 box(
                   width = 3,
                   textInput("input_string", "Avoid sequences", placeholder = "e.g. ATGATG")
                 ),
                 box(width = 3,
                     numericInput("kmers_value", "Avoid repeat length", value = 10, min = 6, max = 20, step = 1)
                 )
               ),
               fluidRow(
                 box(width = 3,
                     numericInput("poly_T", "Avoid poly(U)", value = 9, min = 0)
                 ),
                 box(width = 3,
                     numericInput("poly_A", "poly(A)", value = 9, min = 0)
                 ),
                 box(width = 3,
                     numericInput("poly_C", "poly(C)", value = 6, min = 0)
                 ),
                 box(width = 3,
                     numericInput("poly_G", "poly(G)", value = 6, min = 0)
                 )
               ),
               fluidRow(
                 box(width = 3,
                     numericInput("stem_size", "Hairpin stem size", value = 10, min = 0)
                 ),
                 box(width = 3,
                     numericInput("hairpin_window", "Hairpin window", value = 60, min = 0)
                 )
               ),
               fluidRow(
                 column(width = 3, align = "left",
                        actionButton("runButton", "RUN")
                 )
               )
      ),
      tabPanel("Output",
               fluidRow(
                 box(
                   id = "display_results",
                   width = 12,
                 ),
                 uiOutput("tabs"), 
                 box(
                   width = 3, align = "left",
                   downloadButton("downloadTableButton", "DOWNLOAD RESULTS (.txt)", class = "custom-download-button", icon = shiny::icon(""))
                 )
               )
      ),
      tabPanel("Help",
               fluidRow(
                 box(
                   title = "Contact", status = "primary", solidHeader = TRUE, width = 12,
                   tags$div(
                     style = "line-height: 1;",  
                     tags$h4(tags$b("Email: "), "basedesign@uq.edu.au"),
                     tags$h4(tags$b("Github: "), tags$a(href = "https://github.com/BaseUQ/mRNArchitect", 
                                                        "https://github.com/BaseUQ/mRNArchitect", target = "_blank")),
                     tags$h4(tags$b("Example: "), "For guidance on how to design an mRNA, please see the step-by-step example ", tags$a(href = "https://basefacility.org.au/wp-content/uploads/2024/12/mRNArchitect_Example.pdf", 
                                                                                                                                        "here", target = "_blank")), 
                     tags$h4(tags$b("Sequences: "), "Please find useful sequences (promoters, UTRs etc.) ", tags$a(href = "https://basefacility.org.au/wp-content/uploads/2024/08/mRNArchitect_ExampleSequences.txt", 
                                                                                                                   "here", target = "_blank"))
                   )
                 ),
                 box(
                   title = "Input", status = "primary", solidHeader = TRUE, width = 12,
                   reactableOutput("helpTable")
                 ),
                 box(
                   title = "Parameters", status = "primary", solidHeader = TRUE, width = 12,
                   reactableOutput("parametersTable")
                 ),
                 box(
                   title = "Results", status = "primary", solidHeader = TRUE, width = 12,
                   reactableOutput("resultsTableHelp")
                 ),
                 box(
                   title = "References", status = "primary", solidHeader = TRUE, width = 12,
                   tags$ul(
                     tags$li(HTML("Zulkower, V., & Rosser, S. (2020). DNA Chisel, a versatile sequence optimizer. <i>Bioinformatics</i>, 36(16), 2874-2875.")),
                     tags$li(HTML("Sharp, P. M., & Li, W. H. (1987). The Codon Adaptation Index—a measure of directional synonymous codon usage bias, and its potential applications. <i>Nucleic Acids Research</i> 15(3), 1281-1295.")),
                     tags$li(HTML("Lorenz, R., Bernhart, S. H., Höner Zu Siederdissen, C., Tafer, H., Flamm, C., Stadler, P. F., & Hofacker, I. L. (2011). ViennaRNA Package 2.0. <i>Algorithms for Molecular Biology</i>, 6(1), 26.")),
                     tags$li(HTML("Mulroney, T.E., Pöyry, T., Yam-Puc, J.C. et al. (2024). N1-methylpseudouridylation of mRNA causes +1 ribosomal frameshifting.  <i>Nature</i> 625, 189–194."))
                   )
                 )
               )
      )
    )
  )
)

server <- function(input, output, session) {
  
  shinyjs::addClass(selector = "#mainTabset li a[data-value='Output']", class = "transparent-tab")
  
  observeEvent(input$sequence_type, {
    if (input$sequence_type == "Amino acid") {
      updateTextAreaInput(session, "sequenceText", value = "")
    }
  })
  
  observeEvent(input$sequence_type, {
    updateTextAreaInput(session, "sequenceText", value = "")
  })
  
  output$restrictionSites <- renderUI({
    restriction_sites <- names(rest_dict)
    selectInput("restrictionSites", "Avoid cut sites",
                choices = restriction_sites,
                # selected = c("BsaI","XhoI","XbaI"),
                multiple = TRUE)
  })
  
  observeEvent(input$human_alpha_5, {
    if (input$human_alpha_5) {
      updateTextAreaInput(session, "UTR5", value = UTR5_default)
    } else {
      updateTextAreaInput(session, "UTR5", value = "")
    }
  })
  
  observeEvent(input$human_alpha_3, {
    if (input$human_alpha_3) {
      updateTextAreaInput(session, "UTR3", value = UTR3_default)
    } else {
      updateTextAreaInput(session, "UTR3", value = "")
    }
  })
  
  
  optimizeSequence <- function(sequence, species, gc_min, gc_max, gc_window, stem_size, hairpin_window, kmers_value, poly_T, poly_A, poly_C, poly_G, uridineDepletion, ribosomeSlip) {
    
    optimized_records <- list()
    cut_site_constraints <- list()
    custom_pattern_constraints <- list()
    
    for (restricition_site in input$restrictionSites) {
      cut_site_constraints <- append(cut_site_constraints, list(AvoidPattern(paste0(restricition_site, "_site"))))
    }
    
    input_string <- toupper(gsub("\\s+", "", input$input_string))
    if (nchar(input_string) > 0) {
      if (validate_input_string(input_string)) {
        input_patterns <- unlist(strsplit(input_string, ','))
        for (pattern in input_patterns) {
          if (nchar(pattern) > 0) {
            custom_pattern_constraints <- append(custom_pattern_constraints, list(AvoidPattern(pattern)))
          }
        }
      } else {
        showNotification("Error: Input string contains invalid characters. Only 'As', 'Ts', 'Gs', 'Cs', or commas are allowed.", type = "warning")
      }
    }
    
    constraints <- list(
      EnforceGCContent(mini = gc_min, maxi = gc_max), 
      EnforceGCContent(mini = gc_min, maxi = gc_max, window = gc_window), 
      AvoidHairpins(stem_size = stem_size, hairpin_window = hairpin_window),
      AvoidPattern(paste0(poly_A, "xA")),
      AvoidPattern(paste0(poly_C, "xC")),
      AvoidPattern(paste0(poly_G, "xG")),
      EnforceTranslation() 
    )
    
    if (uridineDepletion) {
      constraints <- append(constraints, list(AvoidRareCodons(0.1, codon_usage_table = ud_table)))
    }
    
    if (ribosomeSlip) {
      constraints <- append(constraints, list(AvoidPattern(paste0(3, "xT"))))
    } else {
      constraints <- append(constraints, list(AvoidPattern(paste0(poly_T, "xT"))))
    }
    
    constraints <- append(constraints, cut_site_constraints)
    constraints <- append(constraints, custom_pattern_constraints)
    
    problem <- DnaOptimizationProblem(
      sequence = sequence,
      constraints = constraints,
      objectives = list(
        CodonOptimize(
          species = species,
          method = "use_best_codon"),
        UniquifyAllKmers(as.integer(kmers_value)) 
      )
    )      
    
    before_optimizaton <- list(problem$constraints_text_summary(),problem$objectives_text_summary())
    
    problem.max_random_iters = max_random_iters
    
    if (!tryCatch({
      problem$resolve_constraints()
      TRUE
    }, error = function(e) {
      showMessageModal("Optimization failed", "Error resolving constraints. Sequence cannot be optimised. Please verify your input sequence or adjust input parameters (e.g. increase GC content/window).", type = "error")
      return(FALSE)
    })) {
      final_sequence <- "Sequence cannot be optimised"
      return(final_sequence)
    }
    
    tryCatch({
      problem$optimize()
    }, error = function(e) {
      showMessageModal("Optimization Failed", "Optimization failed. Please adjust your parameters.", type = "error")
      return("")
    })
    
    after_optimizaton <- list(problem$constraints_text_summary(),problem$objectives_text_summary())
    
    final_sequence <- tryCatch(problem$sequence, error = function(e) {
      showMessageModal("Error Retrieving Final Sequence", "Error retrieving final sequence. Please try adjusting your parameters.", type = "error")
      final_sequence <- "Sequence cannot be optimised"
    })
    
    return(final_sequence)
  }
  
  observeEvent(input$runButton, {
    req(input$sequenceText)
    req(input$organism)
    req(input$tabs)
    
    shinyjs::show(id = "display_results")
    
    sequence <- gsub("\\s+", "", toupper(input$sequenceText)) 
    sequence_type <- input$sequence_type
    restriction_sites <- paste(input$restrictionSites, collapse = ", ")
    message <- NULL
    nucleotide_sequence <- NULL
    
    species <- organism_index_df %>%
      dplyr::filter(Organism == input$organism) %>%
      dplyr::select(Species) %>% 
      as.character()
    
    ref_codon_usage <- read.table("data/ref_codon_usage.txt", header = TRUE, stringsAsFactors = FALSE) %>%
      dplyr::select(amino_acid, codon, all_of(species)) %>%
      dplyr::rename(relative_frequency = all_of(species))
    
    codon_table <- select_most_frequent_codons(ref_codon_usage)
    ud_table <- recalculate_frequencies_for_UD(ref_codon_usage)
    
    output$inputSequence <- renderText({ NULL })
    output$tabs <- renderUI({ NULL })
    
    valid <- tryCatch({
      
      if (sequence_type == "Nucleotide") {
        if (!grepl("^[ATCGU]*$", toupper(sequence))) {
          showMessageModal("Invalid Sequence", "Warning: Invalid nucleotide sequence. Please use only A, T, U, C, and G.", type = "error")
          shinyjs::hide("loader")  
          return(FALSE)
        } else if (nchar(sequence) %% 3 != 0) {
          showMessageModal("Invalid Length", "Warning: Nucleotide sequence length must be a multiple of 3.", type = "error")
          shinyjs::hide("loader")  
          return(FALSE)
        } else {
          nucleotide_sequence <- toupper(gsub("[ \t\r\n]+", "", gsub("U", "T", sequence)))
        }
        
      } else if (sequence_type == "Amino acid") {
        if (grepl("^[ACDEFGHIKLMNPQRSTVWY*]*$", sequence)) {
          nucleotide_sequence <- paste(sapply(strsplit(sequence, "")[[1]], function(aa) codon_table[[aa]]), collapse = "")
        } else {
          showMessageModal("Invalid Sequence", "Warning: Invalid amino acid sequence. Please use valid amino acid letters.", type = "error")
          shinyjs::hide("loader")  
          return(FALSE)
        }
      }
      
      UTR5 <- ifelse(input$UTR5 != "", toupper(input$UTR5), "")
      UTR5 <- gsub("U", "T", UTR5)
      if (UTR5 != "" && !grepl("^[ATCG]*$", UTR5)) {
        showMessageModal("Invalid UTR5 Sequence", 
                         "Warning: Invalid 5'UTR nucleotide sequence. Please use only A, T, C, and G.", 
                         type = "error")
        shinyjs::hide("loader")
        return(FALSE)
      }
      
      UTR3 <- ifelse(input$UTR3 != "", toupper(input$UTR3), "")
      UTR3 <- gsub("U", "T", UTR3)
      if (UTR3 != "" && !grepl("^[ATCG]*$", UTR3)) {
        showMessageModal("Invalid UTR3 Sequence", 
                         "Warning: Invalid 3'UTR nucleotide sequence. Please use only A, T, C, and G.", 
                         type = "error")
        shinyjs::hide("loader")
        return(FALSE)
      }
      
      polyA <- if (input$polyA_input_type == "Generate") {
        paste(rep("A", input$polyA_length), collapse = "")
      } else if (input$polyA_input_type == "Paste") {
        toupper(input$polyA_sequence)
      } else {
        ""
      }
      
      if (polyA != "" && !grepl("^[ATCG]*$", polyA)) {
        showMessageModal("Invalid polyA Sequence", 
                         "Warning: Invalid poly(A) tail sequence. Please use only A, T, C, and G.", 
                         type = "error")
        shinyjs::hide("loader")
        return(FALSE)
      }
      
      valid <- TRUE
    }, error = function(e) {
      showMessageModal("Error", conditionMessage(e), type = "error")
      shinyjs::hide("loader") 
      return(FALSE)
    })
    
    if (valid) {
      shinyjs::show(id = "loader")
      
      tabs_no <- input$tabs
      
      optimized_sequences <- vector("list", tabs_no)
      results_list <- vector("list", tabs_no)
      
      start_codon_present <- grepl("^ATG", nucleotide_sequence)
      stop_codon_present <- grepl("(TAA|TAG|TGA)$", nucleotide_sequence)
      if (!start_codon_present || !stop_codon_present) {
        if (!start_codon_present && !stop_codon_present) {
          showMessageModal("Warning", "Both start codon (ATG) and stop codon (TAA, TAG, or TGA) are missing in the sequence. For amino acid sequences, please use 'M' as the start codon or '*' as the stop codon.", "error")
        } else if (!start_codon_present) {
          showMessageModal("Warning", "Start codon (ATG) is missing in the sequence. For amino acid sequences, please use 'M' as the start codon.", "info")
        } else if (!stop_codon_present) {
          showMessageModal("Warning", "Stop codon (TAA, TAG, or TGA) is missing in the sequence. For amino acid sequences, please use '*' to indicate the stop codon.", "info")
        }
      }
      
      if (grepl("GGC", UTR5) & grepl("ATG", UTR5)) {
        showMessageModal("Warning", "GGC and ATG in the 5'UTR can interfere with mRNA translation.", type = "warning")
      } else if (grepl("GGC", UTR5)) {
        showMessageModal("Warning", "GGC trinucleotides in the 5'UTR can interfere with mRNA translation.", type = "warning")
      } else if (grepl("ATG", UTR5)) {
        showMessageModal("Warning", "Start codons (ATG) in the 5'UTR can interfere with mRNA translation.", type = "warning")
      }
      
      results_input <- calculate_properties(nucleotide_sequence, UTR5, UTR3, polyA, ref_codon_usage)
      
      for (i in 1:tabs_no) {
        optimized_sequences[[i]] <- optimizeSequence(
          nucleotide_sequence, species, input$gc_min, input$gc_max, input$gc_window, 
          input$stem_size, input$hairpin_window, input$kmers_value, 
          input$poly_T, input$poly_A, input$poly_C, input$poly_G, 
          input$uridineDepletion, input$ribosomeSlip
        )
        
        if (grepl("^[ATCG]*$", optimized_sequences[[i]])) {
          results_output <- calculate_properties(optimized_sequences[[i]], UTR5, UTR3, polyA, ref_codon_usage)
        } else {
          optimized_sequences[[i]] <- ""
          results_output <- calculate_properties(optimized_sequences[[i]], UTR5, UTR3, polyA, ref_codon_usage)
        }
        
        combined_df <- merge(results_input, results_output, by = "Metric", suffixes = c("_Input", "_Output"), sort = FALSE) 
        results_list[[i]] <- combined_df
      }
      
      values_list <- lapply(results_list, extract_values)
      numeric_values_list <- lapply(values_list, function(x) as.numeric(x))
      values_matrix <- do.call(rbind, numeric_values_list)
      
      sorting_order <- order(-values_matrix[, 1],  # Highest GC ratio
                             -values_matrix[, 2],  # Highest CAI
                             values_matrix[, 3])   # Lowest Total MFE
      
      sorted_results_list <- results_list[sorting_order]
      sorted_optimized_sequences <- optimized_sequences[sorting_order]
      
      output$inputSequence <- renderPrint({
        tagList(
          tags$h4("Input sequence"),
          tags$pre(nucleotide_sequence)
        )
      })
      
      output$tabs <- renderUI({
        tabsetPanel(
          id = "tabset",
          do.call(tabsetPanel, 
                  c(lapply(1:tabs_no, function(i) {
                    tabPanel(title = paste("Output", i),
                             fluidRow(
                               box(
                                 width = 12,
                                 tags$h3(paste0("Optimised mRNA sequence ", i)),
                                 div(class = "wrapped-text", uiOutput(paste0("resultsOutput_", i)))
                               ),
                               box(
                                 width = 12,
                                 reactableOutput(paste0("resultsTable_", i))
                               )
                             )
                    )
                  }))
          )
        )
      })
      
      lapply(1:tabs_no, function(i) {
        local({
          tab_index <- i
          
          output[[paste0("resultsOutput_", tab_index)]] <- renderUI({
            cds <- sorted_optimized_sequences[[tab_index]]
            highlight_parts <- list(
              UTR5 = list(sequence = UTR5, class = "five-utr"),
              cds = list(sequence = cds, class = "cds"),
              UTR3 = list(sequence = UTR3, class = "three-utr"),
              polyA = list(sequence = polyA, class = "poly-a")
            )
            full_sequence <- paste0(UTR5, cds, UTR3, polyA)
            highlighted_full_sequence <- highlight_sequence(full_sequence, highlight_parts)
            HTML(highlighted_full_sequence)
          })
          
          output[[paste0("resultsTable_", tab_index)]] <- renderReactable({
            reactable::reactable(sorted_results_list[[tab_index]],
                                 pagination = FALSE,
                                 highlight = TRUE,
                                 bordered = TRUE,
                                 sortable = FALSE,
                                 class = "reactable-bordered",
                                 columns = list(
                                   Metric = colDef(name = ""),
                                   Value_Input = colDef(name = "Input", align = "left"),
                                   Value_Output = colDef(name = "Optimised", align = "left")
                                 ),
                                 theme = reactableTheme(
                                   cellPadding = "1px 1px"
                                 )
            )
          })
        })
      })
      
      output$downloadTableButton <- downloadHandler(
        filename = function() {
          paste("results_", format(Sys.time(), '%Y-%m-%d_%H:%M:%S'), ".txt", sep = "")
        },
        content = function(file) {
          content <- paste(
            "---mRNArchitect",
            "Version\t\t\t\t0.10",
            paste("Date\t\t\t\t", format(Sys.time(), '%Y-%m-%d %H:%M:%S'), sep = ""),
            "",
            "---Input Sequence",
            paste("CDS\t\t\t\t", gsub("\\s+", "", toupper(input$sequenceText)), sep = ""),
            paste("5UTR\t\t\t\t", UTR5, sep = ""),
            paste("3UTR\t\t\t\t", UTR3, sep = ""),
            paste("PolyA\t\t\t\t", polyA, sep = ""),
            "",
            "---Parameters",
            paste("Number of sequences\t\t", tabs_no, sep = ""),  
            paste("Organism\t\t\t", input$organism, sep = ""),
            paste("Uridine depletion\t\t", input$uridineDepletion, sep = ""),
            paste("Avoid ribosome slip\t\t", input$ribosomeSlip, sep = ""),
            paste("Minimum GC content\t\t", input$gc_min, sep = ""),
            paste("Maximum GC content\t\t", input$gc_max, sep = ""),
            paste("GC content window\t\t", input$gc_window, sep = ""),
            paste("Avoid cut sites\t\t\t", restriction_sites, sep = ""),
            paste("Avoid pattern\t\t\t", input$input_string, sep = ""),
            paste("Avoid repeat length\t\t", input$kmers_value, sep = ""),
            paste("Avoid poly(U)\t\t\t", input$poly_T, sep = ""),
            paste("poly(A)\t\t\t\t", input$poly_A, sep = ""),
            paste("poly(C)\t\t\t\t", input$poly_C, sep = ""),
            paste("poly(G)\t\t\t\t", input$poly_G, sep = ""),
            paste("Hairpin stem size\t\t", input$stem_size, sep = ""),
            paste("Hairpin window\t\t", input$hairpin_window, sep = ""),
            "",
            sep = "\n"
          )
          
          for (tab_index in 1:tabs_no) {
            results_table <- sorted_results_list[[tab_index]]
            results_table_text <- paste(
              apply(results_table, 1, function(row) {
                paste(row, collapse = "\t")
              }),
              collapse = "\n"
            )
            
            tab_content <- paste(
              paste("---Optimised Sequence ", tab_index, sep = ""),
              paste("CDS\t\t", optimized_sequences[[tab_index]], sep = ""),
              paste("Full-length mRNA\t\t", UTR5, optimized_sequences[[tab_index]], UTR3, polyA, sep = ""),
              "",
              "---Results",
              paste("Metric\tInput\tOptimised", sep = ""),
              results_table_text,
              "",
              sep = "\n"
            )
            
            content <- paste(content, tab_content, sep = "\n")
          }
          
          writeLines(content, file)
        }
      )
      
      shinyjs::hide("loader")
      updateTabsetPanel(session, inputId = "mainTabset", selected = "Output")
    }
    
    shinyjs::removeClass(selector = "#mainTabset li a[data-value='Output']", class = "transparent-tab")
  })
  
  output$helpTable <- renderReactable({
    reactable::reactable(
      help_data,
      columns = list(
        INPUT = colDef(name = "", maxWidth = 200, style = list(fontWeight = "bold")), 
        Explanation = colDef(name = "", html = TRUE)  
      ),
      highlight = FALSE,
      bordered = TRUE,
      striped = FALSE,
      sortable = FALSE,
      defaultPageSize = nrow(help_data),
      showPagination = FALSE,
      class = "custom_format_table"
    )
  })
  
  output$parametersTable <- renderReactable({
    reactable::reactable(
      parameters_data, 
      columns = list(
        INPUT = colDef(name = "", maxWidth = 200, style = list(fontWeight = "bold")), 
        Explanation = colDef(name = "", html = TRUE) 
      ),
      highlight = FALSE,
      bordered = TRUE,
      striped = FALSE,
      sortable = FALSE,
      defaultPageSize = nrow(parameters_data),
      showPagination = FALSE,
      class = "custom_format_table"
    )
  })
  
  output$resultsTableHelp <- renderReactable({
    reactable::reactable(
      results_data,
      columns = list(
        INPUT = colDef(name = "", maxWidth = 200, style = list(fontWeight = "bold")),  
        Explanation = colDef(name = "", html = TRUE) 
      ),
      highlight = FALSE,
      bordered = TRUE,
      striped = FALSE,
      sortable = FALSE,
      defaultPageSize = nrow(results_data),
      showPagination = FALSE,
      class = "custom_format_table"
    )
  })
}

shinyApp(ui = ui, server = server)
