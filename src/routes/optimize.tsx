import { createFileRoute } from "@tanstack/react-router";
import { OptimizeFlow } from "~/components/pages/optimizer/OptimizeFlow";

export const Route = createFileRoute("/optimize")({
  component: RouteComponent,
});

function RouteComponent() {
  return <OptimizeFlow />;
}
