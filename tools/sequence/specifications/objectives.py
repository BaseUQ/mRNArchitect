from dnachisel.Location import Location
from dnachisel.Specification import SpecEvaluation, Specification


from tools.sequence.sequence import Sequence


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
