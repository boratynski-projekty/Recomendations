"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import VoteButton from "./VoteButton";
import OwnerControls from "./OwnerControls";
import CommentSection, { type CommentItem } from "./CommentSection";
import Avatar from "./Avatar";
import EditRequestModal from "./EditRequestModal";
import { deleteRequest } from "@/app/actions";
import { useRouter } from "next/navigation";

export type DetailRequest = {
  id: string;
  artist: string;
  title: string;
  youtube_id: string;
  youtube_url: string;
  comment: string | null;
  completed_at: string | null;
  completion_url: string | null;
  created_at: string;
  vote_count: number;
  author: { slug: string; display_name: string; avatar_url: string | null } | null;
  has_my_vote: boolean;
  can_vote: boolean;
};

export default function RequestDetail({
  request,
  comments,
  isOwner,
  isAuthor,
  canEditByAuthor,
  isLoggedIn,
  backHref
}: {
  request: DetailRequest;
  comments: CommentItem[];
  isOwner: boolean;
  isAuthor: boolean;
  canEditByAuthor: boolean;
  isLoggedIn: boolean;
  backHref: string;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onAuthorDelete() {
    if (!confirm("Delete your request?")) return;
    startTransition(async () => {
      await deleteRequest(request.id);
      router.push(backHref);
    });
  }

  return (
    <article className="card overflow-hidden">
      <div className="aspect-video w-full bg-black">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${request.youtube_id}`}
          title={`${request.artist} — ${request.title}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="text-sm text-muted">{request.artist}</div>
            <h1 className="mt-0.5 text-xl font-bold sm:text-2xl">{request.title}</h1>
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted">
              <span>by</span>
              {request.author ? (
                <Link
                  href={`/u/${request.author.slug}`}
                  className="inline-flex items-center gap-1.5 hover:text-white"
                >
                  <Avatar
                    url={request.author.avatar_url}
                    name={request.author.display_name}
                    size="sm"
                  />
                  <span>{request.author.display_name}</span>
                </Link>
              ) : (
                <span>?</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <VoteButton
              requestId={request.id}
              initialCount={request.vote_count}
              initialVoted={request.has_my_vote}
              canVote={request.can_vote}
            />
            <a
              href={request.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn !text-xs"
            >
              Open on YT ↗
            </a>
          </div>
        </div>

        {request.comment && (
          <p className="mt-4 rounded-lg bg-bg p-3 text-sm text-white/90">
            {request.comment}
          </p>
        )}

        {request.completed_at && request.completion_url && (
          <a
            href={request.completion_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-300 hover:bg-green-500/20"
          >
            ✓ Done — watch the reaction
          </a>
        )}

        {isOwner && (
          <div className="mt-4">
            <OwnerControls
              requestId={request.id}
              isCompleted={!!request.completed_at}
            />
          </div>
        )}

        {isAuthor && !isOwner && (
          <div className="mt-4 flex flex-wrap gap-2">
            {canEditByAuthor && (
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="btn !py-1 !text-xs"
              >
                Edit request
              </button>
            )}
            {canEditByAuthor && (
              <button
                type="button"
                onClick={onAuthorDelete}
                disabled={pending}
                className="btn !py-1 !text-xs text-red-300 hover:!border-red-400"
              >
                Delete
              </button>
            )}
            {!canEditByAuthor && (
              <p className="text-xs text-muted">
                Editing is locked once your request gets a vote or is marked as done.
              </p>
            )}
          </div>
        )}

        <h2 className="mt-6 mb-1 text-sm font-semibold uppercase tracking-wide text-muted">
          Comments ({comments.length})
        </h2>
        <CommentSection
          requestId={request.id}
          comments={comments}
          canComment={isLoggedIn}
        />
      </div>

      <EditRequestModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        request={{
          id: request.id,
          artist: request.artist,
          title: request.title,
          comment: request.comment
        }}
      />
    </article>
  );
}
