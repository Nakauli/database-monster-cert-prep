import type { Metadata } from "next";
import { ResultsClient } from "@/components/ResultsClient";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Results" };

export default async function ResultsPage() {
  await requireUser();
  return <ResultsClient />;
}
