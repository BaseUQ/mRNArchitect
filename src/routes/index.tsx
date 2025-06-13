import { createFileRoute } from "@tanstack/react-router";
import { OptimizeForm } from "~/components/pages/optimizer/OptimizationForm";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <OptimizeForm />;
}
