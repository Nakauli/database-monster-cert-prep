import type { Metadata } from "next";
import { PracticeClient } from "@/components/PracticeClient";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Topic Practice" };

export default async function PracticePage() {
  await requireUser();
  return <PracticeClient />;
}
