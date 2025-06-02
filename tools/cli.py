import sys
import time
import typing

import msgspec

from organism import Organism, Organisms
from sequence import NucleicAcid


if __name__ == "__main__":
    command = sys.argv[1]

    if command == "get-restriction-sites":
        import Bio.Restriction.Restriction_Dictionary

        print(
            msgspec.json.encode(
                Bio.Restriction.Restriction_Dictionary.rest_dict
            ).decode(),
            end="",
        )
    elif command == "generate-organisms":
        organisms = Organisms.load_from_kazusa()
        organisms.save()
    elif command == "convert-sequence-to-nucleic-acid":
        sequence = sys.argv[2]
        organism = typing.cast(Organism, sys.argv[3])
        print(
            msgspec.json.encode(
                str(NucleicAcid.from_amino_acid(sequence, organism))
            ).decode(),
            end="",
        )
    elif command == "analyze-sequence":
        sequence = sys.argv[2]
        organism = sys.argv[3]
        nucleic_acid = NucleicAcid(sequence)
        start = time.time()
        analysis = {
            "a_ratio": nucleic_acid.a_ratio,
            "c_ratio": nucleic_acid.c_ratio,
            "g_ratio": nucleic_acid.g_ratio,
            "t_ratio": nucleic_acid.t_ratio,
            "at_ratio": nucleic_acid.at_ratio,
            "ga_ratio": nucleic_acid.ga_ratio,
            "gc_ratio": nucleic_acid.gc_ratio,
            "uridine_depletion": nucleic_acid.uridine_depletion,
            "codon_adaptation_index": nucleic_acid.codon_adaptation_index(organism),
            "minimum_free_energy": nucleic_acid.minimum_free_energy,
        }
        analysis["debug"] = {"time": time.time() - start}
        print(msgspec.json.encode(analysis).decode(), end="")
    elif command == "optimize-sequence":
        import msgspec

        class OptimizationRequest(msgspec.Struct, kw_only=True, rename="camel"):
            organism: typing.Literal["h_sapiens", "m_musculus"]
            avoid_uridine_depletion: bool
            avoid_ribosome_slip: bool
            gc_content_min: float
            gc_content_max: float
            gc_content_window: int
            avoid_restriction_sites: list[str]
            avoid_sequences: str | list[str]
            avoid_repeat_length: int
            avoid_poly_a: int
            avoid_poly_c: int
            avoid_poly_g: int
            avoid_poly_t: int
            hairpin_stem_size: int
            hairpin_window: int

            def __post_init__(self):
                if isinstance(self.avoid_sequences, str):
                    self.avoid_sequences = self.avoid_sequences.split(",")
                if self.gc_content_min > self.gc_content_max:
                    raise ValueError("GC content minmum must be less than maximum.")

            def to_dict(self):
                return {f: getattr(self, f) for f in self.__struct_fields__}

        sequence = NucleicAcid(sequence=sys.argv[2])
        request = msgspec.json.decode(sys.argv[3], type=OptimizationRequest)
        optimized, debug = sequence.optimize(**request.to_dict())
        print(
            msgspec.json.encode(
                {"output": optimized.sequence, "debug": debug}
            ).decode(),
            end="",
        )
    else:
        raise RuntimeError(f"Unknown command: {command}")
