import type { Metadata } from "next";
import { LabsClient } from "@/components/LabsClient";

export const metadata: Metadata = { title: "SQL Labs" };

export default function LabsPage() {
  return <LabsClient />;
}

