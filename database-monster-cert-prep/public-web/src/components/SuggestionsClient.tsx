"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { EyeOff, Lightbulb, MessageSquarePlus, ThumbsUp } from "lucide-react";
import { PageHeader, SectionHeader } from "@/components/DesignSystem";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import {
  formatSuggestionDate,
  formatVoteCount,
  normalizeSuggestionCategory,
  SUGGESTION_CATEGORIES,
  SUGGESTION_STATUSES,
  type PublicSuggestionRow,
  type SuggestionCategory,
  type SuggestionStatus,
} from "@/lib/suggestions";

interface SuggestionsClientProps {
  initialSuggestions: PublicSuggestionRow[];
  isAdmin: boolean;
  selectedCategory: SuggestionCategory | null;
  user: { id: string; email?: string } | null;
}

type Message = { type: "success" | "error"; text: string } | null;

export function SuggestionsClient({
  initialSuggestions,
  isAdmin,
  selectedCategory,
  user,
}: SuggestionsClientProps) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [category, setCategory] = useState<SuggestionCategory>("Feature");
  const [message, setMessage] = useState<Message>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const stats = useMemo(() => {
    const open = suggestions.filter((suggestion) => suggestion.status === "Open").length;
    const planned = suggestions.filter((suggestion) => suggestion.status === "Planned").length;
    const votes = suggestions.reduce((total, suggestion) => total + suggestion.vote_count, 0);

    return { open, planned, votes };
  }, [suggestions]);

  async function refreshSuggestions() {
    const supabase = createClient();
    if (!supabase) return;

    const { data, error } = await supabase.rpc("get_public_suggestions", {
      p_category: selectedCategory,
    });
    if (!error) setSuggestions((data ?? []) as PublicSuggestionRow[]);
  }

  async function submitSuggestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const supabase = createClient();
    if (!supabase) {
      setMessage({ type: "error", text: "Suggestion storage is not configured." });
      return;
    }

    if (!user) {
      setMessage({ type: "error", text: "Sign in before posting a suggestion." });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.rpc("create_suggestion", {
      p_title: title,
      p_details: details,
      p_category: category,
    });
    setSubmitting(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setTitle("");
    setDetails("");
    setCategory("Feature");
    setMessage({ type: "success", text: "Suggestion posted publicly." });
    await refreshSuggestions();
    router.refresh();
  }

  async function toggleVote(suggestion: PublicSuggestionRow) {
    const supabase = createClient();
    if (!supabase) {
      setMessage({ type: "error", text: "Suggestion storage is not configured." });
      return;
    }

    if (!user) {
      setMessage({ type: "error", text: "Sign in to vote on suggestions." });
      return;
    }

    setBusyId(suggestion.id);
    const { data, error } = await supabase.rpc("toggle_suggestion_vote", {
      p_suggestion_id: suggestion.id,
    });
    setBusyId(null);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    const hasVoted = Boolean(data);
    setSuggestions((current) =>
      current.map((item) =>
        item.id === suggestion.id
          ? {
              ...item,
              has_voted: hasVoted,
              vote_count: Math.max(0, item.vote_count + (hasVoted ? 1 : -1)),
            }
          : item,
      ),
    );
    router.refresh();
  }

  async function updateStatus(suggestion: PublicSuggestionRow, status: SuggestionStatus, hidden = false) {
    const supabase = createClient();
    if (!supabase) {
      setMessage({ type: "error", text: "Suggestion storage is not configured." });
      return;
    }

    setBusyId(suggestion.id);
    const { error } = await supabase.rpc("update_suggestion_status", {
      p_suggestion_id: suggestion.id,
      p_status: status,
      p_is_hidden: hidden,
    });
    setBusyId(null);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setSuggestions((current) =>
      hidden
        ? current.filter((item) => item.id !== suggestion.id)
        : current.map((item) => (item.id === suggestion.id ? { ...item, status } : item)),
    );
    setMessage({ type: "success", text: hidden ? "Suggestion hidden." : "Suggestion status updated." });
    router.refresh();
  }

  return (
    <main className="app-container page-section">
      <PageHeader
        label="Suggestions"
        title="Suggest what we should add next."
        description="Ask for missing topics, confusing questions, UI fixes, or study tools. Everyone can read the board; signed-in students can post and vote."
        actions={
          user ? (
            <Button asChild variant="outline"><Link href="/profile">Posting as {user.email ?? "your account"}</Link></Button>
          ) : (
            <Button asChild><Link href="/login">Sign in to post</Link></Button>
          )
        }
      />

      <section className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <Card className="overflow-hidden">
          <CardHeader>
            <Badge className="w-fit" variant="secondary">Public request board</Badge>
            <CardTitle className="flex items-center gap-2">
              <MessageSquarePlus className="size-5 text-primary" aria-hidden="true" />
              Add a suggestion
            </CardTitle>
            <CardDescription>Keep it specific enough that we can turn it into a task.</CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <form className="grid gap-4" onSubmit={submitSuggestion}>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-ink" htmlFor="suggestion-title">Title</label>
                  <input
                    className="min-h-10 rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-3 focus:ring-ring/35"
                    id="suggestion-title"
                    maxLength={120}
                    required
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Add more SQL trigger examples"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-ink" htmlFor="suggestion-category">Category</label>
                  <Select value={category} onValueChange={(value) => setCategory(value as SuggestionCategory)}>
                    <SelectTrigger id="suggestion-category" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {SUGGESTION_CATEGORIES.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-ink" htmlFor="suggestion-details">Details</label>
                  <Textarea
                    id="suggestion-details"
                    maxLength={1000}
                    required
                    value={details}
                    onChange={(event) => setDetails(event.target.value)}
                    placeholder="What should be added, fixed, or clarified?"
                  />
                  <p className="text-xs text-muted-foreground">{details.length}/1000 characters</p>
                </div>

                {message && (
                  <Alert variant={message.type === "error" ? "destructive" : "default"}>
                    <AlertTitle>{message.type === "error" ? "Could not save" : "Saved"}</AlertTitle>
                    <AlertDescription>{message.text}</AlertDescription>
                  </Alert>
                )}

                <Button className="w-fit" disabled={submitting} type="submit">
                  {submitting ? "Posting..." : "Post suggestion"}
                </Button>
              </form>
            ) : (
              <div className="rounded-xl border border-dashed bg-muted/35 p-4">
                <p className="font-semibold text-ink">Sign in to post or vote.</p>
                <p className="mt-1 text-sm text-muted-foreground">Guests can read every public suggestion, but posting stays tied to class accounts.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button asChild><Link href="/login">Sign in</Link></Button>
                  <Button asChild variant="outline"><Link href="/register">Create account</Link></Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <Badge className="w-fit border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground" variant="outline">
              Class signal
            </Badge>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Lightbulb className="size-6" aria-hidden="true" />
              Vote on what helps exam prep.
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Suggestions are public immediately. Admins can mark what is planned or done.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-primary-foreground/10 p-4">
              <strong className="block text-3xl">{stats.open}</strong>
              <span className="text-sm text-primary-foreground/75">open ideas</span>
            </div>
            <div className="rounded-xl bg-primary-foreground/10 p-4">
              <strong className="block text-3xl">{stats.planned}</strong>
              <span className="text-sm text-primary-foreground/75">planned</span>
            </div>
            <div className="rounded-xl bg-primary-foreground/10 p-4">
              <strong className="block text-3xl">{stats.votes}</strong>
              <span className="text-sm text-primary-foreground/75">total votes</span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-10 grid gap-5">
        <SectionHeader
          title="Public suggestions"
          description="Filter by category, vote once per idea, and watch statuses change as requests become planned or done."
        />

        <div className="flex flex-wrap gap-2" aria-label="Suggestion category filters">
          <FilterLink active={!selectedCategory} href="/suggestions" label="All" />
          {SUGGESTION_CATEGORIES.map((option) => (
            <FilterLink
              active={selectedCategory === option}
              href={`/suggestions?category=${encodeURIComponent(option)}`}
              key={option}
              label={option}
            />
          ))}
        </div>

        {suggestions.length ? (
          <div className="grid gap-3">
            {suggestions.map((suggestion) => (
              <SuggestionCard
                busy={busyId === suggestion.id}
                isAdmin={isAdmin}
                key={suggestion.id}
                onHide={() => updateStatus(suggestion, suggestion.status, true)}
                onStatusChange={(status) => updateStatus(suggestion, status)}
                onVote={() => toggleVote(suggestion)}
                signedIn={Boolean(user)}
                suggestion={suggestion}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>No suggestions yet.</CardTitle>
              <CardDescription>
                {normalizeSuggestionCategory(selectedCategory)
                  ? `No ${selectedCategory} suggestions yet.`
                  : "Be the first to suggest what should be added next."}
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </section>
    </main>
  );
}

function FilterLink({ active, href, label }: { active: boolean; href: string; label: string }) {
  return (
    <Button asChild size="sm" variant={active ? "default" : "outline"}>
      <Link aria-current={active ? "page" : undefined} href={href}>{label}</Link>
    </Button>
  );
}

function SuggestionCard({
  busy,
  isAdmin,
  onHide,
  onStatusChange,
  onVote,
  signedIn,
  suggestion,
}: {
  busy: boolean;
  isAdmin: boolean;
  onHide: () => void;
  onStatusChange: (status: SuggestionStatus) => void;
  onVote: () => void;
  signedIn: boolean;
  suggestion: PublicSuggestionRow;
}) {
  const statusClass = {
    Open: "bg-secondary text-secondary-foreground",
    Planned: "bg-warning/20 text-warning-foreground",
    Done: "bg-success/15 text-primary",
    Declined: "bg-destructive/10 text-destructive",
  }[suggestion.status];

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{suggestion.category}</Badge>
          <Badge className={statusClass} variant="secondary">{suggestion.status}</Badge>
          <span className="text-xs font-medium text-muted-foreground">
            {suggestion.author_display_name} · {suggestion.author_course ?? "Course pending"} · {formatSuggestionDate(suggestion.created_at)}
          </span>
        </div>
        <CardTitle className="text-2xl">{suggestion.title}</CardTitle>
        <CardDescription>{suggestion.details}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={busy || !signedIn}
            onClick={onVote}
            type="button"
            variant={suggestion.has_voted ? "default" : "outline"}
          >
            <ThumbsUp data-icon="inline-start" />
            {suggestion.has_voted ? "Voted" : "Vote"} · {formatVoteCount(suggestion.vote_count)}
          </Button>
          {!signedIn && (
            <Button asChild variant="ghost">
              <Link href="/login">Sign in to vote</Link>
            </Button>
          )}
        </div>

        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTION_STATUSES.map((status) => (
              <Button
                disabled={busy || suggestion.status === status}
                key={status}
                onClick={() => onStatusChange(status)}
                size="sm"
                type="button"
                variant={suggestion.status === status ? "secondary" : "outline"}
              >
                {status}
              </Button>
            ))}
            <Button disabled={busy} onClick={onHide} size="sm" type="button" variant="destructive">
              <EyeOff data-icon="inline-start" />
              Hide
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
