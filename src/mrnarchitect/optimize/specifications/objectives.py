from dnachisel import NoSolutionError
from dnachisel.Location import Location
from dnachisel.Specification import SpecEvaluation, Specification

from mrnarchitect.sequence import Sequence
from mrnarchitect.types import Organism


class OptimizeTAI(Specification):
    def __init__(
        self,
        target_tai: float = 1.0,
        organism: Organism = "homo-sapiens",
        location: Location | None = None,
        boost: float = 1.0,
    ):
        self.target_tai = target_tai
        self.organism = organism
        self.location = location
        self.boost = boost

    def evaluate(self, problem):
        location = self.location or Location(0, len(problem.sequence))

        sequence = location.extract_sequence(problem.sequence)

        tai = Sequence(sequence).trna_adaptation_index(organism=self.organism)

        if tai is None:
            raise NoSolutionError("tAI cannot be calculated for sequence.", problem)

        tai_diff = abs(tai - self.target_tai)

        message = f"tAI {tai} is {tai_diff} off target {self.target_tai}"

        return SpecEvaluation(
            self,
            problem,
            score=-tai_diff,
            locations=[location],
            message=message,
        )


class TargetPseudoMFE(Specification):
    def __init__(
        self,
        target_pseudo_mfe: float,
        window_size: int = 40,
        step: int = 4,
        location: Location | None = None,
        boost: float = 1.0,
    ):
        self.target_pseudo_mfe = target_pseudo_mfe
        self.window_size = window_size
        self.step = step
        self.location = location
        self.boost = boost

    def evaluate(self, problem):
        location = self.location
        if location is None:
            location = Location(0, len(problem.sequence))

        sequence = location.extract_sequence(problem.sequence)

        pseudo_mfe = Sequence(sequence).pseudo_minimum_free_energy

        pseudo_mfe_diff = abs(pseudo_mfe - self.target_pseudo_mfe)

        if pseudo_mfe_diff:
            message = f"Failed - target pseudo-MFE {self.target_pseudo_mfe} is {pseudo_mfe_diff} off {pseudo_mfe}"
        else:
            message = f"Success - target pseudo-MFE matched {self.target_pseudo_mfe}"

        return SpecEvaluation(
            self,
            problem,
            score=-pseudo_mfe_diff,
            locations=[location],
            message=message,
        )
