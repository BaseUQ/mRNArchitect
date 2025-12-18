import { AppShell, Container, MantineProvider } from "@mantine/core";
import { lazy, Suspense, useContext } from "react";
import { UserDetailsContext, UserDetailsProvider } from "./context/UserDetails";

const AnalyticsPage = lazy(() =>
  import("~/components/pages/analytics/AnalyticsPage").then((module) => ({
    default: module.AnalyticsPage,
  })),
);

const OptimizePage = lazy(() =>
  import("~/components/pages/optimize/OptimizePage").then((module) => ({
    default: module.OptimizePage,
  })),
);

const Content = () => {
  const { userDetails } = useContext(UserDetailsContext);

  return (
    <AppShell padding="md">
      <AppShell.Main>
        <Container size="md">
          <Suspense fallback={<div>Loading...</div>}>
            {userDetails.email ? <OptimizePage /> : <AnalyticsPage />}
          </Suspense>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
};

const App = () => {
  return (
    <MantineProvider>
      <UserDetailsProvider>
        <Content />
      </UserDetailsProvider>
    </MantineProvider>
  );
};

export default App;
