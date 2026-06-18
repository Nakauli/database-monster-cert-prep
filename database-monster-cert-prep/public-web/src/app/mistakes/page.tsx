import type { Metadata } from "next";
import { MistakesClient } from "@/components/MistakesClient";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Mistake Notebook" };

export default async function MistakesPage() {
  await requireUser();
  return <MistakesClient />;
}
