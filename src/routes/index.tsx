import { createFileRoute } from "@tanstack/react-router";
import { OptimizationFlow } from "~/components/pages/optimizer/OptimizationFlow";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <OptimizationFlow />;
}
