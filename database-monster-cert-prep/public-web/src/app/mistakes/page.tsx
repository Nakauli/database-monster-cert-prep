import type { Metadata } from "next";
import { MistakesClient } from "@/components/MistakesClient";

export const metadata: Metadata = { title: "Mistake Notebook" };

export default function MistakesPage() {
  return <MistakesClient />;
}

