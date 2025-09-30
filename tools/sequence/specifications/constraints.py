from dnachisel.Location import Location
from dnachisel.Specification import Specification, SpecEvaluation

from tools.organism import CodonUsageTable
from tools.sequence.sequence import Sequence
from tools.types import Organism


class CAIRange(Specification):
    def __init__(
        self,
        codon_usage_table: CodonUsageTable | Organism,
        location: Location | None = None,
        cai_min: float = 0.0,
        cai_max: float = 1.0,
        boost: float = 1.0,
    ):
        self.codon_usage_table = codon_usage_table
        self.location = Location.from_data(location)
        self.cai_min = cai_min
        self.cai_max = cai_max
        self.boost = boost

    def evaluate(self, problem):
        location = self.location
        if location is None:
            location = Location(0, len(problem.sequence))

        sequence = location.extract_sequence(problem.sequence)

        cai = Sequence(sequence).codon_adaptation_index(self.codon_usage_table)
        if cai is None:
            raise RuntimeError
        score = 0.0
        if cai < self.cai_min:
            score -= abs(cai - self.cai_min)
        if cai > self.cai_max:
            score -= abs(cai - self.cai_max)

        if score:
            message = (
                f"Failed - CAI {cai} is outside range [{self.cai_min}, {self.cai_max}]"
            )
        else:
            message = f"Passed - CAI {cai} is in range [{self.cai_min}, {self.cai_max}]"

        return SpecEvaluation(
            self,
            problem,
            score=score,
            locations=[location],
            message=message,
        )
