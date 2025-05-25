import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/another-tool")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/another-tool"!</div>;
}
