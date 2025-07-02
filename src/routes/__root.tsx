import {
  AppShell,
  ColorSchemeScript,
  Container,
  MantineProvider,
  mantineHtmlProps,
} from "@mantine/core";
// @ts-ignore
import mantineCssUrl from "@mantine/core/styles.css?url";
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

const RootComponent = () => {
  return (
    <RootDocument>
      <MantineProvider>
        <Shell />
      </MantineProvider>
    </RootDocument>
  );
};

const RootDocument = ({ children }: Readonly<{ children: ReactNode }>) => {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
};

const Shell = () => {
  return (
    <AppShell padding="md">
      <AppShell.Main>
        <Container size="md">
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
};

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "mRNArchitect - BASE mRNA facility",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.png",
      },
      {
        rel: "stylesheet",
        href: mantineCssUrl,
      },
    ],
  }),
  component: RootComponent,
});
