import { AppShell, Container, MantineProvider } from "@mantine/core";
import { lazy, Suspense, useEffect } from "react";

const OptimizePage = lazy(() =>
  import("~/components/pages/optimize/OptimizePage").then((module) => ({
    default: module.OptimizePage,
  })),
);

const App = () => {
  useEffect(() => {
    /**
      * NOTE: This is to prevent people from accessing the app directly
      * at https://app.basefacility.org.au.
      * If it is running under this domain (and not in an iframe), then
      * we redirect them to https://basefacility.org.au where the app
      * will load correctly in the iframe and the user must login to access it.
      */
    // Check if NOT running in an iframe.
    if (window.self === window.top) {
      // Check if the host is the production URL.
      if (window.location.hostname === "app.basefacility.org.au") {
        // Redirect to the basefacility.org.au/software page.
        window.location.href = "https://basefacility.org.au/software";
      }
    }
  }, []);

  return (
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
};

export default App;
