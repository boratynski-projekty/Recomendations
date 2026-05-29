"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import YoutubeModal from "./YoutubeModal";
import VoteButton from "./VoteButton";
import OwnerControls from "./OwnerControls";
import CommentSection, { type CommentItem } from "./CommentSection";
import { formatRelative } from "@/lib/format";

export type RequestRow = {
  id: string;
  artist: string;
  title: string;
  youtube_url: string;
  youtube_id: string;
  comment: string | null;
  completed_at: string | null;
  completion_url: string | null;
  created_at: string;
  created_by: string;
  vote_count: number;
  author: { slug: string; display_name: string; avatar_url: string | null } | null;
  has_my_vote: boolean;
  can_vote: boolean;
  comments: CommentItem[];
};

type SortMode = "newest" | "artist" | "votes";
type Tab = "active" | "completed";

export default function RequestsView({
  rows,
  isOwner,
  isLoggedIn
}: {
  rows: RequestRow[];
  isOwner: boolean;
  isLoggedIn: boolean;
}) {
  const [tab, setTab] = useState<Tab>("active");
  const [sort, setSort] = useState<SortMode>("votes");
  const [playing, setPlaying] = useState<string | null>(null);

  const active = useMemo(() => rows.filter((r) => !r.completed_at), [rows]);
  const completed = useMemo(() => rows.filter((r) => r.completed_at), [rows]);

  const visible = tab === "active" ? active : completed;

  const sorted = useMemo(() => {
    const copy = [...visible];
    switch (sort) {
      case "newest":
        copy.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "artist":
        copy.sort((a, b) =>
          a.artist.localeCompare(b.artist, "pl", { sensitivity: "base" })
        );
        break;
      case "votes":
        copy.sort((a, b) => b.vote_count - a.vote_count);
        break;
    }
    return copy;
  }, [visible, sort]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" className="flex gap-1 rounded-lg border border-border bg-surface p-1">
          <button
            role="tab"
            aria-selected={tab === "active"}
            onClick={() => setTab("active")}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              tab === "active" ? "bg-accent text-black" : "text-muted hover:text-white"
            }`}
          >
            Aktywne ({active.length})
          </button>
          <button
            role="tab"
            aria-selected={tab === "completed"}
            onClick={() => setTab("completed")}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              tab === "completed" ? "bg-accent text-black" : "text-muted hover:text-white"
            }`}
          >
            Zrealizowane ({completed.length})
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted">
          Sortuj:
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="input !w-auto !py-1 !text-xs"
          >
            <option value="votes">Najwięcej głosów</option>
            <option value="newest">Najnowsze</option>
            <option value="artist">Artysta (A→Z)</option>
          </select>
        </label>
      </div>

      {sorted.length === 0 ? (
        <div className="card p-8 text-center text-muted">
          {tab === "active"
            ? "Nic tu jeszcze nie ma. Bądź pierwszy z propozycją!"
            : "Brak zrealizowanych pozycji."}
        </div>
      ) : (
        <ul className="grid gap-3">
          {sorted.map((r) => (
            <li key={r.id} className="card overflow-hidden">
              <div className="flex gap-3 p-4">
                <VoteButton
                  requestId={r.id}
                  initialCount={r.vote_count}
                  initialVoted={r.has_my_vote}
                  canVote={r.can_vote}
                />
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setPlaying(r.youtube_id)}
                    className="group block w-full text-left"
                    title="Odtwórz w pop-upie"
                  >
                    <div className="flex items-start gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://i.ytimg.com/vi/${r.youtube_id}/mqdefault.jpg`}
                        alt=""
                        className="hidden h-16 w-28 flex-shrink-0 rounded-md object-cover sm:block"
                      />
                      <div className="min-w-0">
                        <div className="text-xs text-muted">{r.artist}</div>
                        <div className="font-semibold leading-tight group-hover:text-accent">
                          {r.title} <span className="text-muted">▶</span>
                        </div>
                        <div className="mt-1 text-xs text-muted">
                          dodał{" "}
                          {r.author ? (
                            <Link
                              href={`/u/${r.author.slug}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:text-white"
                            >
                              {r.author.display_name}
                            </Link>
                          ) : (
                            "?"
                          )}{" "}
                          · {formatRelative(r.created_at)}
                        </div>
                      </div>
                    </div>
                  </button>

                  {r.comment && (
                    <p className="mt-2 rounded-lg bg-bg p-2 text-sm text-white/90">
                      {r.comment}
                    </p>
                  )}

                  {r.completed_at && r.completion_url && (
                    <a
                      href={r.completion_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-300 hover:bg-green-500/20"
                    >
                      ✓ Zrealizowano — zobacz reakcję
                    </a>
                  )}

                  {isOwner && (
                    <div className="mt-3">
                      <OwnerControls
                        requestId={r.id}
                        isCompleted={!!r.completed_at}
                      />
                    </div>
                  )}

                  <CommentSection
                    requestId={r.id}
                    comments={r.comments}
                    canComment={isLoggedIn}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <YoutubeModal videoId={playing} onClose={() => setPlaying(null)} />
    </div>
  );
}
