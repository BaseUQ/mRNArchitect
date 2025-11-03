import { AppShell, Container, MantineProvider } from "@mantine/core";
import { lazy, Suspense } from "react";

const OptimizePage = lazy(() =>
  import("~/components/pages/optimize/OptimizePage").then((module) => ({
    default: module.OptimizePage,
  })),
);

const App = () => (
  <MantineProvider>
    <AppShell padding="md">
      <AppShell.Main>
        <Container size="md">
          <Suspense fallback={<div>Loading...</div>}>
            <OptimizePage />
          </Suspense>
        </Container>
      </AppShell.Main>
    </AppShell>
  </MantineProvider>
);

export default App;
