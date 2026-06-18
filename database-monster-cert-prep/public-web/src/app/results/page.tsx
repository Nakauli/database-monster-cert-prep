import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ResultsClient } from "@/components/ResultsClient";
import { requireUser } from "@/lib/auth";
import { getAttemptResult } from "@/lib/progress";

export const metadata: Metadata = { title: "Results" };

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const user = await requireUser();
  const { id } = await searchParams;
  if (!id) redirect("/history");
  const result = await getAttemptResult(user.id, id);
  if (!result) notFound();
  return <ResultsClient result={result} />;
}
