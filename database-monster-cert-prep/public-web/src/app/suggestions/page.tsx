import type { Metadata } from "next";
import { SuggestionsClient } from "@/components/SuggestionsClient";
import { getCurrentUser } from "@/lib/auth";
import { getPublicSuggestions, isSuggestionAdmin } from "@/lib/suggestions-server";
import { normalizeSuggestionCategory } from "@/lib/suggestions";

export const metadata: Metadata = {
  title: "Suggestions",
  description: "Public class suggestions for Database Monster exam prep improvements.",
};

export default async function SuggestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const selectedCategory = normalizeSuggestionCategory(category);
  const [user, suggestions, admin] = await Promise.all([
    getCurrentUser(),
    getPublicSuggestions(selectedCategory).catch(() => []),
    isSuggestionAdmin(),
  ]);

  return (
    <SuggestionsClient
      initialSuggestions={suggestions}
      isAdmin={admin}
      key={selectedCategory ?? "all"}
      selectedCategory={selectedCategory}
      user={user}
    />
  );
}
