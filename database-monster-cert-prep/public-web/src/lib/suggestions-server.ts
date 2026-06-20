import { createClient } from "@/lib/supabase/server";
import { normalizeSuggestionCategory, type PublicSuggestionRow } from "@/lib/suggestions";

export async function getPublicSuggestions(category?: string | null): Promise<PublicSuggestionRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase.rpc("get_public_suggestions", {
    p_category: normalizeSuggestionCategory(category),
  });
  if (error) throw new Error(error.message);

  return (data ?? []) as PublicSuggestionRow[];
}

export async function isSuggestionAdmin(): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) return false;

  const { data, error } = await supabase.rpc("is_suggestion_admin");
  if (error) return false;

  return Boolean(data);
}
