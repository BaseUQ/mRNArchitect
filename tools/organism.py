import csv
import re
import typing

import msgspec

Codon = typing.Literal[
    "AAA",
    "AAC",
    "AAG",
    "AAT",
    "ACA",
    "ACC",
    "ACG",
    "ACT",
    "AGA",
    "AGC",
    "AGG",
    "AGT",
    "ATA",
    "ATC",
    "ATG",
    "ATT",
    "CAA",
    "CAC",
    "CAG",
    "CAT",
    "CCA",
    "CCC",
    "CCG",
    "CCT",
    "CGA",
    "CGC",
    "CGG",
    "CGT",
    "CTA",
    "CTC",
    "CTG",
    "CTT",
    "GAA",
    "GAC",
    "GAG",
    "GAT",
    "GCA",
    "GCC",
    "GCG",
    "GCT",
    "GGA",
    "GGC",
    "GGG",
    "GGT",
    "GTA",
    "GTC",
    "GTG",
    "GTT",
    "TAA",
    "TAC",
    "TAG",
    "TAT",
    "TCA",
    "TCC",
    "TCG",
    "TCT",
    "TGA",
    "TGC",
    "TGG",
    "TGT",
    "TTA",
    "TTC",
    "TTG",
    "TTT",
]
"""The three letter codon (DNA-style, i.e with "T" instead of "U")."""

CODONS = set(typing.get_args(Codon))

AminoAcid = typing.Literal[
    "*",
    "A",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "K",
    "L",
    "M",
    "N",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "V",
    "W",
    "Y",
]
"""The 1-letter symbol for an amino acid."""

AMINO_ACIDS = set(typing.get_args(AminoAcid))

CODON_TO_AMINO_ACID_MAP: dict[Codon, AminoAcid] = {
    "TAA": "*",
    "TAG": "*",
    "TGA": "*",
    "GCA": "A",
    "GCC": "A",
    "GCG": "A",
    "GCT": "A",
    "TGC": "C",
    "TGT": "C",
    "GAC": "D",
    "GAT": "D",
    "GAA": "E",
    "GAG": "E",
    "TTC": "F",
    "TTT": "F",
    "GGA": "G",
    "GGC": "G",
    "GGG": "G",
    "GGT": "G",
    "CAC": "H",
    "CAT": "H",
    "ATA": "I",
    "ATC": "I",
    "ATT": "I",
    "AAA": "K",
    "AAG": "K",
    "CTA": "L",
    "CTC": "L",
    "CTG": "L",
    "CTT": "L",
    "TTA": "L",
    "TTG": "L",
    "ATG": "M",
    "AAC": "N",
    "AAT": "N",
    "CCA": "P",
    "CCC": "P",
    "CCG": "P",
    "CCT": "P",
    "CAA": "Q",
    "CAG": "Q",
    "AGA": "R",
    "AGG": "R",
    "CGA": "R",
    "CGC": "R",
    "CGG": "R",
    "CGT": "R",
    "AGC": "S",
    "AGT": "S",
    "TCA": "S",
    "TCC": "S",
    "TCG": "S",
    "TCT": "S",
    "ACA": "T",
    "ACC": "T",
    "ACG": "T",
    "ACT": "T",
    "GTA": "V",
    "GTC": "V",
    "GTG": "V",
    "GTT": "V",
    "TGG": "W",
    "TAC": "Y",
    "TAT": "Y",
}
"""Maps a codon to an amino acid 1-letter symbol."""

Organism = typing.Literal["h_sapiens", "m_musculus"]
"""Supported organisms."""


class CodonUsage(msgspec.Struct, frozen=True):
    """Codon usage for a particular codon and organism."""

    codon: Codon
    """The codon this usage relates to."""

    organism: Organism
    """The organism this codon usage relates to."""

    number: int
    """The raw number of codons."""

    frequency: float
    """The frequency of this codon relative to other codons for the same amino acid."""

    def __post_init__(self):
        if self.codon not in CODONS:
            raise ValueError(f"`codon` is not valid: {self.codon}")
        if self.organism not in typing.get_args(Organism):
            raise ValueError(f"`organism` is not valid: {self.organism}")

    @property
    def amino_acid(self) -> str:
        """The 1-letter amino acid symbol for this codon."""
        return CODON_TO_AMINO_ACID_MAP[self.codon]


CodonUsageTable = dict[Codon, CodonUsage]
"""Maps a codon to it's usage."""

MaxCodonUsageTable = dict[AminoAcid, CodonUsage]
"""Maps an amino acid to the maximum codon usage amongs all codons for that amino acid."""


class OrganismTable(msgspec.Struct, frozen=True):
    codon_usage_table: CodonUsageTable
    max_codon_usage_table: MaxCodonUsageTable


OrganismTables = dict[Organism, OrganismTable]
"""Maps an organism to its codon usage tables."""


class Organisms(msgspec.Struct, frozen=True):
    tables: OrganismTables

    def weight(self, organism: Organism, codon: Codon) -> float:
        amino_acid = CODON_TO_AMINO_ACID_MAP[codon]
        return (
            self.tables[organism].codon_usage_table[codon].number
            / self.tables[organism].max_codon_usage_table[amino_acid].number
        )

    def max_codon(self, organism: Organism, amino_acid: AminoAcid) -> Codon:
        return self.tables[organism].max_codon_usage_table[amino_acid].codon

    def save(self):
        with open("data/organisms.json", "wb") as f:
            f.write(msgspec.json.encode(self))

    @classmethod
    def load(cls) -> "Organisms":
        return msgspec.json.decode(open("data/organisms.json", "rb").read(), type=cls)

    @classmethod
    def load_from_kazusa(cls) -> "Organisms":
        import urllib.request
        from string import Template

        KAZUSA_URL = Template(
            "https://www.kazusa.or.jp/codon/cgi-bin/showcodon.cgi?species=$SPECIES_ID&aa=1&style=GCG"
        )

        ORGANISMS: dict[Organism, int] = {
            "h_sapiens": 9606,
            "m_musculus": 10090,
        }

        TABLE_REGEX = r"(?:<PRE>)([\s\S]*)(?:</PRE>)"

        def _fetch_codon_table(organism: Organism, species_id: int) -> OrganismTable:
            contents = (
                urllib.request.urlopen(
                    KAZUSA_URL.substitute({"SPECIES_ID": species_id})
                )
                .read()
                .decode("utf-8")
            )
            if (match := re.search(TABLE_REGEX, contents)) is None:
                raise RuntimeError(f"Could not parse {organism}")
            table_string = match.group(1)
            table_rows = list(
                csv.DictReader(
                    [line for line in table_string.split("\n") if line.strip()],
                    delimiter=" ",
                    skipinitialspace=True,
                )
            )

            codon_usages: list[CodonUsage] = [
                CodonUsage(
                    codon=typing.cast(Codon, row["Codon"].upper().replace("U", "T")),
                    organism=organism,
                    number=int(float(row["Number"])),
                    frequency=float(row["Number"])
                    / sum(
                        float(r["Number"])
                        for r in table_rows
                        if r["AmAcid"] == row["AmAcid"]
                    ),
                )
                for row in table_rows
            ]
            codon_usage_table: CodonUsageTable = {it.codon: it for it in codon_usages}

            max_codon_usage_table: MaxCodonUsageTable = {
                amino_acid: sorted(
                    (it for it in codon_usages if it.amino_acid == amino_acid),
                    key=lambda x: x.number,
                )[-1]
                for amino_acid in AMINO_ACIDS
            }

            return OrganismTable(
                codon_usage_table=codon_usage_table,
                max_codon_usage_table=max_codon_usage_table,
            )

        return cls(
            tables={
                organism: _fetch_codon_table(organism, species_id)
                for organism, species_id in ORGANISMS.items()
            }
        )
