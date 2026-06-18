import type { Metadata } from "next";
import { PracticeClient } from "@/components/PracticeClient";

export const metadata: Metadata = { title: "Topic Practice" };

export default function PracticePage() {
  return <PracticeClient />;
}

