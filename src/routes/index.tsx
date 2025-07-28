import { createFileRoute } from "@tanstack/react-router";
import { OptimizePage } from "~/components/pages/optimize/OptimizePage";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <OptimizePage />;
}
