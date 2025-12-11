import pytest

from mrnarchitect.codon_table import codon_usage_bias
from mrnarchitect.data import load_codon_usage_table
from mrnarchitect.sequence import Sequence

TEST_SEQUENCES = {
    "REC_A": "ATGGCTATCGACGAAAACAAACAGAAAGCGTTGGCGGCAGCACTGGGCCAGATTGAGAAACAATTTGGTAAAGGCTCCATCATGCGCCTGGGTGAAGACCGTTCCATGGATGTGGAAACCATCTCTACCGGTTCGCTTTCACTGGATATCGCGCTTGGGGCAGGTGGTCTGCCGATGGGCCGTATCGTCGAAATCTACGGACCGGAATCTTCCGGTAAAACCACGCTGACGCTGCAGGTGATCGCCGCAGCGCAGCGTGAAGGTAAAACCTGTGCGTTTATCGATGCTGAACACGCGCTGGACCCAATCTACGCACGTAAACTGGGCGTCGATATCGACAACCTGCTGTGCTCCCAGCCGGACACCGGCGAGCAGGCACTGGAAATCTGTGACGCCCTGGCGCGTTCTGGCGCAGTAGACGTTATCGTCGTTGACTCCGTGGCGGCACTGACGCCGAAAGCGGAAATCGAAGGCGAAATCGGCGACTCTCACATGGGCCTTGCGGCACGTATGATGAGCCAGGCGATGCGTAAGCTGGCGGGTAACCTGAAGCAGTCCAACACGCTGCTGATCTTCATCAACCAGATCCGTATGAAAATTGGTGTGATGTTCGGTAACCCGGAAACCACTACCGGTGGTAACGCGCTGAAATTCTACGCCTCTGTTCGTCTCGACATCCGTCGTATCGGCGCGGTGAAAGAGGGCGAAAACGTGGTGGGTAGCGAAACCCGCGTGAAAGTGGTGAAGAACAAAATCGCTGCGCCGTTTAAACAGGCTGAATTCCAGATCCTCTACGGCGAAGGTATCAACTTCTACGGCGAACTGGTTGACCTGGGCGTAAAAGAGAAGCTGATCGAGAAAGCAGGCGCGTGGTACAGCTACAAAGGTGAGAAGATCGGTCAGGGTAAAGCGAATGCGACTGCCTGGCTGAAAGATAACCCGGAAACCGCGAAAGAGATCGAGAAGAAAGTACGTGAGTTGCTGCTGAGCAACCCGAACTCAACGCCGGATTTCTCTGTAGATGATAGCGAAGGCGTAGCAGAAACTAACGAAGATTTTTAA",
    "DNA_K": "ATGGGTAAAATAATTGGTATCGACCTGGGTACTACCAACTCTTGTGTAGCGATTATGGATGGCACCACTCCTCGCGTGCTGGAGAACGCCGAAGGCGATCGCACCACGCCTTCTATCATTGCCTATACCCAGGATGGTGAAACTCTAGTTGGTCAGCCGGCTAAACGTCAGGCAGTGACGAACCCGCAAAACACTCTGTTTGCGATTAAACGCCTGATTGGTCGCCGCTTCCAGGACGAAGAAGTACAGCGTGATGTTTCCATCATGCCGTTCAAAATTATTGCTGCTGATAACGGCGACGCATGGGTCGAAGTTAAAGGCCAGAAAATGGCACCGCCGCAGATTTCTGCTGAAGTGCTGAAAAAAATGAAGAAAACCGCTGAAGATTACCTGGGTGAACCGGTAACTGAAGCTGTTATCACCGTACCGGCATACTTTAACGATGCTCAGCGTCAGGCAACCAAAGACGCAGGCCGTATCGCTGGTCTGGAAGTAAAACGTATCATCAACGAACCGACCGCAGCTGCGCTGGCTTACGGTCTGGACAAAGGCACTGGCAACCGTACTATCGCGGTTTATGACCTGGGTGGTGGTACTTTCGATATTTCTATTATCGAAATCGACGAAGTTGACGGCGAAAAAACCTTCGAAGTTCTGGCAACCAACGGTGATACCCACCTGGGGGGTGAAGACTTCGACAGCCGTCTGATCAACTATCTGGTTGAAGAATTCAAGAAAGATCAGGGCATTGACCTGCGCAACGATCCGCTGGCAATGCAGCGCCTGAAAGAAGCGGCAGAAAAAGCGAAAATCGAACTGTCTTCCGCTCAGCAGACCGACGTTAACCTGCCATACATCACTGCAGACGCGACCGGTCCGAAACACATGAACATCAAAGTGACTCGTGCGAAACTGGAAAGCCTGGTTGAAGATCTGGTAAACCGTTCCATTGAGCCGCTGAAAGTTGCACTGCAGGACGCTGGCCTGTCCGTATCTGATATCGACGACGTTATCCTCGTTGGTGGTCAGACTCGTATGCCAATGGTTCAGAAGAAAGTTGCTGAGTTCTTTGGTAAAGAGCCGCGTAAAGACGTTAACCCGGACGAAGCTGTAGCAATCGGTGCTGCTGTTCAGGGTGGTGTTCTGACTGGTGACGTAAAAGACGTACTGCTGCTGGACGTTACCCCGCTGTCTCTGGGTATCGAAACCATGGGCGGTGTGATGACGACGCTGATCGCGAAAAACACCACTATCCCGACCAAGCACAGCCAGGTGTTCTCTACCGCTGAAGACAACCAGTCTGCGGTAACCATCCATGTGCTGCAGGGTGAACGTAAACGTGCGGCTGATAACAAATCTCTGGGTCAGTTCAACCTAGATGGTATCAACCCGGCACCGCGCGGCATGCCGCAGATCGAAGTTACCTTCGATATCGATGCTGACGGTATCCTGCACGTTTCCGCGAAAGATAAAAACAGCGGTAAAGAGCAGAAGATCACCATCAAGGCTTCTTCTGGTCTGAACGAAGATGAAATCCAGAAAATGGTACGCGACGCAGAAGCTAACGCCGAAGCTGACCGTAAGTTTGAAGAGCTGGTACAGACTCGCAACCAGGGCGACCATCTGCTGCACAGCACCCGTAAGCAGGTTGAAGAAGCAGGCGACAAACTGCCGGCTGACGACAAAACTGCTATCGAGTCTGCGCTGACTGCACTGGAAACTGCTCTGAAAGGTGAAGACAAAGCCGCTATCGAAGCGAAAATGCAGGAACTGGCACAGGTTTCCCAGAAACTGATGGAAATCGCCCAGCAGCAACATGCCCAGCAGCAGACTGCCGGTGCTGATGCTTCTGCAAACAACGCGAAAGATGACGATGTTGTCGACGCTGAATTTGAAGAAGTCAAAGACAAAAAATAA",
}
"""Test sequences from GenScript.
see: https://www.genscript.com/tools/rare-codon-analysis
"""


@pytest.mark.parametrize(
    ["organism_f", "organism_c", "codon_usage_bias_result"],
    [
        ["homo-sapiens", "homo-sapiens", 0.0],
        ["mus-musculus", "mus-musculus", 0.0],
        ["homo-sapiens", "mus-musculus", 0.04141041],
        ["mus-musculus", "homo-sapiens", 0.04127556],
    ],
)
def test_codon_usage_bias_organism(organism_f, organism_c, codon_usage_bias_result):
    assert codon_usage_bias(
        load_codon_usage_table(organism_f),
        load_codon_usage_table(organism_c),
    ) == pytest.approx(codon_usage_bias_result)


@pytest.mark.parametrize(
    ["sequence_name", "organism", "codon_usage_bias_result"],
    [
        ["REC_A", "homo-sapiens", 0.68],
        ["REC_A", "mus-musculus", 0.68],
        ["DNA_K", "homo-sapiens", 0.73],
        ["DNA_K", "mus-musculus", 0.72],
    ],
)
def test_codon_usage_bias_sequence(sequence_name, organism, codon_usage_bias_result):
    sequence = Sequence.create(TEST_SEQUENCES[sequence_name])
    assert sequence.is_amino_acid_sequence
    assert sequence.codon_usage_bias(organism) == pytest.approx(
        codon_usage_bias_result, abs=10**-2
    )


@pytest.mark.parametrize(
    ["sequence_name", "organism", "codon_bias_index_result"],
    [
        ["REC_A", "homo-sapiens", 0.21],
        ["REC_A", "mus-musculus", 0.21],
        ["DNA_K", "homo-sapiens", 0.11],
        ["DNA_K", "mus-musculus", 0.12],
    ],
)
def test_codon_bias_index(sequence_name, organism, codon_bias_index_result):
    sequence = Sequence.create(TEST_SEQUENCES[sequence_name])
    assert sequence.is_amino_acid_sequence
    assert sequence.codon_bias_index(organism) == pytest.approx(
        codon_bias_index_result, abs=10**-2
    )


@pytest.mark.parametrize(
    ["sequence_name", "relative_synonymous_codon_use_result"],
    [
        ["REC_A", 1.85],
        ["DNA_K", 1.92],
    ],
)
def test_relative_synonymous_codon_use(
    sequence_name, relative_synonymous_codon_use_result
):
    sequence = Sequence.create(TEST_SEQUENCES[sequence_name])
    assert sequence.is_amino_acid_sequence
    assert sequence.relative_synonymous_codon_use == pytest.approx(
        relative_synonymous_codon_use_result, rel=3e-2
    )


@pytest.mark.parametrize(
    ["sequence_name", "relative_codon_bias_strength_result"],
    [
        ["REC_A", 0.62],
        ["DNA_K", 0.66],
    ],
)
def test_relative_codon_bias_strength(
    sequence_name, relative_codon_bias_strength_result
):
    sequence = Sequence.create(TEST_SEQUENCES[sequence_name])
    assert sequence.is_amino_acid_sequence
    assert sequence.relative_codon_bias_strength == pytest.approx(
        relative_codon_bias_strength_result, rel=2e-2
    )


@pytest.mark.parametrize(
    ["sequence_name", "directional_codon_bias_score_result"],
    [
        ["REC_A", 2.39],
        ["DNA_K", 2.39],
    ],
)
def test_directional_codon_bias_strength(
    sequence_name, directional_codon_bias_score_result
):
    sequence = Sequence.create(TEST_SEQUENCES[sequence_name])
    assert sequence.is_amino_acid_sequence
    assert sequence.directional_codon_bias_score == pytest.approx(
        directional_codon_bias_score_result, rel=1e-2
    )


@pytest.mark.parametrize(
    ["sequence_name", "gc1", "gc2", "gc3"],
    [
        ["REC_A", 0.6, 0.39, 0.63],
        ["DNA_K", 0.64, 0.37, 0.52],
    ],
)
def test_gc1_gc2_gc3(sequence_name, gc1, gc2, gc3):
    sequence = Sequence.create(TEST_SEQUENCES[sequence_name])
    assert sequence.is_amino_acid_sequence
    assert sequence.gc1_ratio == pytest.approx(gc1, rel=2e-2)
    assert sequence.gc2_ratio == pytest.approx(gc2, rel=2e-2)
    assert sequence.gc3_ratio == pytest.approx(gc3, rel=2e-2)


@pytest.mark.parametrize(
    ["sequence_name", "organism", "trna_adaptation_index_result"],
    [
        ["REC_A", "homo-sapiens", 0.333],
        ["REC_A", "mus-musculus", 0.171],
        ["DNA_K", "homo-sapiens", 0.344],
        ["DNA_K", "mus-musculus", 0.171],
    ],
)
def test_trna_adaptation_index(sequence_name, organism, trna_adaptation_index_result):
    sequence = Sequence.create(TEST_SEQUENCES[sequence_name])
    assert sequence.is_amino_acid_sequence
    assert sequence.trna_adaptation_index(organism) == pytest.approx(
        trna_adaptation_index_result, rel=1e-2
    )
