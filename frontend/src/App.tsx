import { AppShell, Container, MantineProvider } from "@mantine/core";
import { OptimizePage } from "~/components/pages/optimize/OptimizePage";

const App = () => (
  <MantineProvider>
    <AppShell padding="md">
      <AppShell.Main>
        <Container size="md">
          <OptimizePage />
        </Container>
      </AppShell.Main>
    </AppShell>
  </MantineProvider>
);

export default App;
