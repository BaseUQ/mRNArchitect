import argparse

import torch
from transformers import AutoTokenizer, BigBirdForMaskedLM
from CodonTransformer.CodonPrediction import predict_dna_sequence


def run():
    parser = argparse.ArgumentParser()
    parser.add_argument("protein", type=str)
    parser.add_argument("organism", type=str)
    args = parser.parse_args()

    protein, organism = args.protein, args.organism

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Load model and tokenizer
    tokenizer = AutoTokenizer.from_pretrained("adibvafa/CodonTransformer")
    model = BigBirdForMaskedLM.from_pretrained("adibvafa/CodonTransformer").to(device)

    # Predict with CodonTransformer
    output = predict_dna_sequence(
        protein=protein,
        organism=organism,
        device=device,
        tokenizer=tokenizer,
        model=model,
        attention_type="original_full",
        deterministic=True,
    )
    print(output.predicted_dna)


if __name__ == "__main__":
    run()
