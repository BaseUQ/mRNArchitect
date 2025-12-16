import typing

from mrnarchitect.types import AminoAcid, AminoAcid3, AminoAcidName, Codon

AMINO_ACIDS = set(typing.get_args(AminoAcid))


CODONS = set(typing.get_args(Codon))


AMINO_ACID_SET: list[tuple[AminoAcidName, AminoAcid3, AminoAcid]] = [
    ("Alanine", "Ala", "A"),
    ("Arginine", "Arg", "R"),
    ("Asparagine", "Asn", "N"),
    ("Aspartate", "Asp", "D"),
    ("Cysteine", "Cys", "C"),
    ("Glutamate", "Glu", "E"),
    ("Glutamine", "Gln", "Q"),
    ("Glycine", "Gly", "G"),
    ("Histidine", "His", "H"),
    ("Isoleucine", "Ile", "I"),
    ("Leucine", "Leu", "L"),
    ("Lysine", "Lys", "K"),
    ("Methionine", "Met", "M"),
    ("Phenylalanine", "Phe", "F"),
    ("Proline", "Pro", "P"),
    ("Serine", "Ser", "S"),
    ("Threonine", "Thr", "T"),
    ("Tryptophan", "Trp", "W"),
    ("Tyrosine", "Tyr", "Y"),
    ("Valine", "Val", "V"),
]

AMINO_ACID_TO_CODONS_MAP: dict[AminoAcid, set[Codon]] = {
    "R": {"AGA", "AGG", "CGA", "CGC", "CGG", "CGT"},
    "K": {"AAA", "AAG"},
    "C": {"TGC", "TGT"},
    "A": {"GCA", "GCC", "GCG", "GCT"},
    "V": {"GTA", "GTC", "GTG", "GTT"},
    "Y": {"TAC", "TAT"},
    "G": {"GGA", "GGC", "GGG", "GGT"},
    "*": {"TAA", "TAG", "TGA"},
    "L": {"CTA", "CTC", "CTG", "CTT", "TTA", "TTG"},
    "Q": {"CAA", "CAG"},
    "M": {"ATG"},
    "H": {"CAC", "CAT"},
    "T": {"ACA", "ACC", "ACG", "ACT"},
    "I": {"ATA", "ATC", "ATT"},
    "W": {"TGG"},
    "N": {"AAC", "AAT"},
    "S": {"AGC", "AGT", "TCA", "TCC", "TCG", "TCT"},
    "F": {"TTC", "TTT"},
    "P": {"CCA", "CCC", "CCG", "CCT"},
    "D": {"GAC", "GAT"},
    "E": {"GAA", "GAG"},
}
"""Maps an amino acid 1-letter symbol to a set of codons."""


CODON_TO_AMINO_ACID_MAP: dict[Codon, AminoAcid] = {
    "CGG": "R",
    "CGC": "R",
    "AGA": "R",
    "CGA": "R",
    "AGG": "R",
    "CGT": "R",
    "AAA": "K",
    "AAG": "K",
    "TGC": "C",
    "TGT": "C",
    "GCA": "A",
    "GCC": "A",
    "GCG": "A",
    "GCT": "A",
    "GTC": "V",
    "GTG": "V",
    "GTT": "V",
    "GTA": "V",
    "TAC": "Y",
    "TAT": "Y",
    "GGC": "G",
    "GGA": "G",
    "GGG": "G",
    "GGT": "G",
    "TAA": "*",
    "TAG": "*",
    "TGA": "*",
    "CTA": "L",
    "CTC": "L",
    "CTG": "L",
    "TTG": "L",
    "CTT": "L",
    "TTA": "L",
    "CAG": "Q",
    "CAA": "Q",
    "ATG": "M",
    "CAC": "H",
    "CAT": "H",
    "ACT": "T",
    "ACA": "T",
    "ACC": "T",
    "ACG": "T",
    "ATT": "I",
    "ATA": "I",
    "ATC": "I",
    "TGG": "W",
    "AAC": "N",
    "AAT": "N",
    "TCG": "S",
    "TCA": "S",
    "AGT": "S",
    "TCT": "S",
    "AGC": "S",
    "TCC": "S",
    "TTC": "F",
    "TTT": "F",
    "CCG": "P",
    "CCA": "P",
    "CCT": "P",
    "CCC": "P",
    "GAT": "D",
    "GAC": "D",
    "GAA": "E",
    "GAG": "E",
}
"""Maps a codon to an amino acid 1-letter symbol."""


class CodonTable:
    _names: dict[AminoAcidName, int] = {
        it[0]: index for index, it in enumerate(AMINO_ACID_SET)
    }
    _3s: dict[AminoAcid3, int] = {
        it[1]: index for index, it in enumerate(AMINO_ACID_SET)
    }
    _1s: dict[AminoAcid, int] = {
        it[2]: index for index, it in enumerate(AMINO_ACID_SET)
    }

    @classmethod
    def amino_acid(
        cls, for_: AminoAcid | AminoAcid3 | AminoAcidName | Codon
    ) -> AminoAcid:
        if for_ in AMINO_ACIDS:
            amino_acid = typing.cast(AminoAcid, for_)
        elif for_ in cls._names:
            amino_acid = AMINO_ACID_SET[cls._names[for_]][2]
        elif for_ in cls._3s:
            amino_acid = AMINO_ACID_SET[cls._3s[for_]][2]
        elif for_ in CODON_TO_AMINO_ACID_MAP:
            amino_acid = CODON_TO_AMINO_ACID_MAP[for_]
        else:
            raise RuntimeError(f"Unknown key: {for_}")

        return amino_acid

    @classmethod
    def amino_acid3(
        cls, for_: AminoAcid | AminoAcid3 | AminoAcidName | Codon
    ) -> AminoAcid3:
        return AMINO_ACID_SET[cls._1s[cls.amino_acid(for_)]][1]

    @classmethod
    def amino_acid_name(
        cls, for_: AminoAcid | AminoAcid3 | AminoAcidName | Codon
    ) -> AminoAcidName:
        return AMINO_ACID_SET[cls._1s[cls.amino_acid(for_)]][0]

    @classmethod
    def codons(cls, for_: AminoAcid | AminoAcid3 | AminoAcidName | Codon) -> set[Codon]:
        return AMINO_ACID_TO_CODONS_MAP[cls.amino_acid(for_)]
