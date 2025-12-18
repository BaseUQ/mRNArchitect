import { AppShell, Container, MantineProvider } from "@mantine/core";
import { lazy, Suspense, useContext, useEffect } from "react";
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
  // useEffect(() => {
  //   /**
  //     * NOTE: This is to prevent people from accessing the app directly
  //     * at https://app.basefacility.org.au.
  //     * If it is running under this domain (and not in an iframe), then
  //     * we redirect them to https://basefacility.org.au where the app
  //     * will load correctly in the iframe and the user must login to access it.
  //     */
  //   // Check if NOT running in an iframe.
  //   if (window.self === window.top) {
  //     // Check if the host is the production URL.
  //     if (window.location.hostname === "app.basefacility.org.au") {
  //       // Check if the `bypass-redirect` parameter is not set.
  //       const url = new URL(window.location.href);
  //       if (!url.searchParams.get("bypass-redirect")) {
  //         // Redirect to the basefacility.org.au/software page.
  //         window.location.href = "https://basefacility.org.au/software";
  //       }
  //     }
  //   }
  // }, []);

  return (
    <MantineProvider>
      <UserDetailsProvider>
        <Content />
      </UserDetailsProvider>
    </MantineProvider>
  );
};

export default App;
