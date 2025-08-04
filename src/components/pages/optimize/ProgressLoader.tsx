import { Center, Loader, Stack, Text } from "@mantine/core";
import { useInterval } from "@mantine/hooks";
import { formatDuration, intervalToDuration } from "date-fns";
import { useState } from "react";

interface ProgressLoaderProps {
  estimatedTimeInSeconds: number;
}

export const ProgressLoader = ({
  estimatedTimeInSeconds,
}: ProgressLoaderProps) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const _elapsedInterval = useInterval(
    () => setElapsedSeconds((s) => s + 1),
    1000,
    { autoInvoke: true },
  );

  const formattedEstimatedTime = formatDuration(
    intervalToDuration({ start: 0, end: estimatedTimeInSeconds * 1000 }),
    { format: ["minutes"] },
  );
  const formattedElapsedTime = formatDuration(
    intervalToDuration({ start: 0, end: elapsedSeconds * 1000 }),
    { format: ["minutes", "seconds"], zero: true },
  );

  return (
    <Center p="lg">
      <Stack align="center">
        <Loader type="dots" />
        <Text>Optimisation in progress...</Text>
        <Text size="s">{`Estimated time: < ${formattedEstimatedTime}`}</Text>
        <Text size="s">{`Elapsed time: ${formattedElapsedTime}`}</Text>
      </Stack>
    </Center>
  );
};
