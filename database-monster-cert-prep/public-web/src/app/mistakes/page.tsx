import type { Metadata } from "next";
import { MistakesClient } from "@/components/MistakesClient";
import { requireUser } from "@/lib/auth";
import { getMistakes } from "@/lib/progress";

export const metadata: Metadata = { title: "Mistake Notebook" };

export default async function MistakesPage() {
  const user = await requireUser();
  const mistakes = await getMistakes(user.id);
  return <MistakesClient initialMistakes={mistakes} />;
}
