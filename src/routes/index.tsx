import { createFileRoute } from "@tanstack/react-router";
import { FieldApp } from "@/components/field-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <FieldApp />;
}
