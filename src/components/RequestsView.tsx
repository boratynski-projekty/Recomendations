"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import YoutubeModal from "./YoutubeModal";
import VoteButton from "./VoteButton";
import OwnerControls from "./OwnerControls";
import Avatar from "./Avatar";
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
  comment_count: number;
  author: { slug: string; display_name: string; avatar_url: string | null } | null;
  has_my_vote: boolean;
  can_vote: boolean;
};

type SortMode = "newest" | "artist" | "votes";
type Tab = "active" | "completed";

export default function RequestsView({
  rows,
  isOwner,
  isLoggedIn,
  basePath
}: {
  rows: RequestRow[];
  isOwner: boolean;
  isLoggedIn: boolean;
  /** np. `/u/jan/8k2x4p` — używane do budowania linków do detail page */
  basePath: string;
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
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          className="flex gap-1 rounded-lg border border-border bg-surface p-1"
        >
          <button
            role="tab"
            aria-selected={tab === "active"}
            onClick={() => setTab("active")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm transition sm:flex-initial ${
              tab === "active" ? "bg-accent text-black" : "text-muted hover:text-white"
            }`}
          >
            Aktywne ({active.length})
          </button>
          <button
            role="tab"
            aria-selected={tab === "completed"}
            onClick={() => setTab("completed")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm transition sm:flex-initial ${
              tab === "completed"
                ? "bg-accent text-black"
                : "text-muted hover:text-white"
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
          {sorted.map((r) => {
            const detailHref = `${basePath}/r/${r.id}`;
            return (
              <li key={r.id} className="card overflow-hidden">
                <div className="flex gap-3 p-3 sm:p-4">
                  <VoteButton
                    requestId={r.id}
                    initialCount={r.vote_count}
                    initialVoted={r.has_my_vote}
                    canVote={r.can_vote}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => setPlaying(r.youtube_id)}
                        className="group relative flex-shrink-0"
                        title="Odtwórz w pop-upie"
                        aria-label="Odtwórz"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://i.ytimg.com/vi/${r.youtube_id}/mqdefault.jpg`}
                          alt=""
                          className="h-14 w-24 rounded-md object-cover sm:h-16 sm:w-28"
                        />
                        <span className="absolute inset-0 flex items-center justify-center rounded-md bg-black/0 text-2xl text-white opacity-70 transition group-hover:bg-black/40 group-hover:opacity-100">
                          ▶
                        </span>
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs text-muted">{r.artist}</div>
                        <Link
                          href={detailHref}
                          className="block font-semibold leading-tight hover:text-accent"
                        >
                          {r.title}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                          <span className="inline-flex items-center gap-1">
                            dodał
                            {r.author ? (
                              <Link
                                href={`/u/${r.author.slug}`}
                                className="inline-flex items-center gap-1.5 hover:text-white"
                              >
                                <Avatar
                                  url={r.author.avatar_url}
                                  name={r.author.display_name}
                                  size="xs"
                                />
                                <span>{r.author.display_name}</span>
                              </Link>
                            ) : (
                              <span>?</span>
                            )}
                          </span>
                          <span>·</span>
                          <span>{formatRelative(r.created_at)}</span>
                          <span>·</span>
                          <Link
                            href={detailHref}
                            className="hover:text-white"
                            aria-label={`${r.comment_count} komentarzy`}
                          >
                            💬 {r.comment_count}
                          </Link>
                        </div>
                      </div>
                    </div>

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
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <YoutubeModal videoId={playing} onClose={() => setPlaying(null)} />
    </div>
  );
}
