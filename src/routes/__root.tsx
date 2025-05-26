import mantineCssUrl from "@mantine/core/styles.css?url";

import {
  AppShell,
  Burger,
  Button,
  ColorSchemeScript,
  Container,
  Flex,
  Grid,
  Group,
  MantineProvider,
  Modal,
  type ModalProps,
  Stack,
  Text,
  Title,
  Tooltip,
  mantineHtmlProps,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { DnaIcon, LinkIcon } from "@phosphor-icons/react";
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
  useRouterState,
} from "@tanstack/react-router";
import { type ReactNode, useEffect } from "react";
import { BASELogo } from "../components/logos/BASELogo";
import { BASELogoSmall } from "../components/logos/BASELogoSmall";

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
        href: "/public/favicon.png",
      },
      {
        rel: "stylesheet",
        href: mantineCssUrl,
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <MantineProvider>
        <Shell />
      </MantineProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
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
}

const ContactUsModal = (props: ModalProps) => (
  <Modal {...props}>
    <Modal.Body>
      <Grid>
        <Grid.Col span={{ base: 12, sm: 2 }}>
          <Text fw={"bold"}>Email</Text>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 10 }}>
          <a href="mailto:basedesign@uq.edu.au">basedesign@uq.edu.au</a>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 2 }}>
          <Text fw={"bold"}>GitHub</Text>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 10 }}>
          <a href="https://github.com/BaseUQ/mRNArchitect">
            https://github.com/BaseUQ/mRNArchitect
          </a>
        </Grid.Col>
      </Grid>
    </Modal.Body>
  </Modal>
);

const Menu = () => {
  return (
    <Stack gap="xs">
      <Link to="/optimizer" style={{ textDecoration: "none" }}>
        {({ isActive }) => (
          <Button
            component="span"
            variant={isActive ? "light" : "subtle"}
            leftSection={<DnaIcon size={14} />}
            justify="left"
            fullWidth
          >
            Optimizer
          </Button>
        )}
      </Link>
    </Stack>
  );
};

const Shell = () => {
  const [contactUsOpened, { open: contactUsOpen, close: contactUsClose }] =
    useDisclosure(false);
  const [navBarOpened, { close: navBarClose, toggle: navBarToggle }] =
    useDisclosure(false);

  const routerState = useRouterState();
  useEffect(() => {
    if (routerState.isLoading) {
      navBarClose();
    }
  }, [routerState, navBarClose]);

  return (
    <AppShell
      header={{ height: "80" }}
      padding="md"
      navbar={{
        width: 240,
        breakpoint: "sm",
        collapsed: { mobile: !navBarOpened },
      }}
      footer={{
        height: 40,
      }}
    >
      <AppShell.Header>
        <Group justify="space-between" align="center" h="100%" pl="md" pr="md">
          <Group gap="xs">
            <Burger
              opened={navBarOpened}
              onClick={navBarToggle}
              hiddenFrom="sm"
              size="sm"
            />
            <BASELogoSmall width={30} height={30} />
            <Title order={5}>mRNArchitect</Title>
          </Group>
          <Group>
            <Tooltip label="Contact us">
              <Button variant="outline" radius="xl" onClick={contactUsOpen}>
                <LinkIcon />
              </Button>
            </Tooltip>
            <ContactUsModal
              opened={contactUsOpened}
              onClose={contactUsClose}
              title="Contact us"
            />
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <Menu />
      </AppShell.Navbar>
      <AppShell.Main>
        <Container size="md">
          <Outlet />
        </Container>
      </AppShell.Main>
      <AppShell.Footer>
        <Flex w="100%" h="100%" p="md" justify="end" align="center">
          <a href="https://basefacility.org.au">
            <BASELogo width={70} style={{ display: "block" }} />
          </a>
        </Flex>
      </AppShell.Footer>
    </AppShell>
  );
};
