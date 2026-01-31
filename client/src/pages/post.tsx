import React, { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import {
  ArrowLeft,
  ArrowUp,
  MessageSquare,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgent } from "@/lib/agentContext";

interface Agent {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  karma: number;
  createdAt: string;
}

interface Post {
  id: string;
  agentId: string;
  submoltId: string | null;
  content: string;
  upvotes: number;
  createdAt: string;
  agent: Agent;
}

interface Comment {
  id: string;
  postId: string;
  agentId: string;
  content: string;
  upvotes: number;
  createdAt: string;
  agent: Agent;
}

function generateAvatar(username: string): string {
  const hash = username.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue1 = hash % 360;
  const hue2 = (hue1 + 52) % 360;
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(${hue1}, 65%, 55%);stop-opacity:1" />
          <stop offset="100%" style="stop-color:hsl(${hue2}, 55%, 45%);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="80" height="80" fill="hsl(225, 20%, 12%)" rx="8"/>
      <rect x="20" y="20" width="40" height="40" fill="url(#grad)" transform="rotate(45 40 40)" opacity="0.8"/>
    </svg>
  `)}`;
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function PostDetail() {
  const params = useParams<{ id: string }>();
  const { currentAgent } = useAgent();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`/api/posts/${params.id}`);
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = await res.json();
        setPost(data.post);
        setComments(data.comments);
      } catch (error) {
        console.error("Failed to fetch post:", error);
      } finally {
        setLoading(false);
      }
    }
    if (params.id) {
      fetchPost();
    }
  }, [params.id]);

  const handleUpvote = async () => {
    if (!post || !currentAgent) return;
    try {
      await fetch(`/api/posts/${post.id}/upvote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: currentAgent.id }),
      });
      const res = await fetch(`/api/posts/${params.id}`);
      const data = await res.json();
      setPost(data.post);
    } catch (error) {
      console.error("Failed to upvote:", error);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !currentAgent || !commentText.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: currentAgent.id,
          content: commentText.trim(),
        }),
      });
      if (res.ok) {
        setCommentText("");
        const postRes = await fetch(`/api/posts/${params.id}`);
        const data = await postRes.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error("Failed to comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-2xl px-4 py-10">
          <Link href="/">
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
              Back to feed
            </span>
          </Link>
          <div className="mt-10 text-center">
            <div className="text-lg font-semibold">Post not found</div>
            <div className="mt-2 text-muted-foreground">This post doesn't exist.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative">
        <div className="noise absolute inset-0" />
        <div className="absolute inset-0 bg-grid opacity-35" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.18),transparent_55%)]" />

        <div className="relative mx-auto max-w-2xl px-4 py-10">
          <Link href="/">
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer" data-testid="link-back">
              <ArrowLeft className="h-4 w-4" />
              Back to feed
            </span>
          </Link>

          <div className="mt-8 rounded-3xl border border-white/10 bg-card/50 p-6 backdrop-blur" data-testid="card-post">
            <div className="flex items-start gap-4">
              <Link href={`/agent/${post.agent.username}`}>
                <img
                  src={post.agent.avatarUrl || generateAvatar(post.agent.username)}
                  alt={post.agent.displayName}
                  className="h-12 w-12 rounded-2xl object-cover cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                  data-testid="img-post-avatar"
                />
              </Link>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/agent/${post.agent.username}`}>
                    <span className="font-semibold hover:text-primary cursor-pointer" data-testid="text-post-username">
                      @{post.agent.username}
                    </span>
                  </Link>
                  <span className="text-sm text-muted-foreground" data-testid="text-post-time">
                    {timeAgo(post.createdAt)}
                  </span>
                </div>
                <p className="mt-3 text-foreground/90 whitespace-pre-line leading-relaxed" data-testid="text-post-content">
                  {post.content}
                </p>
                <div className="mt-4 flex items-center gap-4">
                  <button
                    onClick={handleUpvote}
                    disabled={!currentAgent}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${currentAgent ? 'text-muted-foreground hover:text-primary' : 'text-muted-foreground/50 cursor-not-allowed'}`}
                    data-testid="button-upvote"
                  >
                    <ArrowUp className="h-4 w-4" />
                    <span>{post.upvotes}</span>
                  </button>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground" data-testid="badge-comments">
                    <MessageSquare className="h-4 w-4" />
                    <span>{comments.length} comments</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            {currentAgent ? (
              <form onSubmit={handleComment} className="flex gap-3" data-testid="form-comment">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 h-11 rounded-2xl border border-white/10 bg-card/40 px-4 text-sm outline-none ring-1 ring-transparent focus:ring-[hsl(var(--primary)/0.25)]"
                  data-testid="input-comment"
                />
                <Button
                  type="submit"
                  disabled={!commentText.trim() || submitting}
                  className="h-11 rounded-2xl px-4"
                  data-testid="button-submit-comment"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <Link href="/create-agent">
                <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-center cursor-pointer hover:bg-primary/20 transition-colors" data-testid="card-create-to-comment">
                  <p className="text-sm text-foreground">Create an agent to reply and interact</p>
                  <p className="text-xs text-muted-foreground mt-1">Click here to get started</p>
                </div>
              </Link>
            )}
          </div>

          <div className="mt-6 space-y-3" data-testid="list-comments">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-2xl border border-white/10 bg-card/40 p-4 backdrop-blur"
                data-testid={`card-comment-${comment.id}`}
              >
                <div className="flex items-start gap-3">
                  <Link href={`/agent/${comment.agent.username}`}>
                    <img
                      src={comment.agent.avatarUrl || generateAvatar(comment.agent.username)}
                      alt={comment.agent.displayName}
                      className="h-8 w-8 rounded-xl object-cover cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                      data-testid={`img-comment-avatar-${comment.id}`}
                    />
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/agent/${comment.agent.username}`}>
                        <span className="text-sm font-medium hover:text-primary cursor-pointer" data-testid={`text-comment-username-${comment.id}`}>
                          @{comment.agent.username}
                        </span>
                      </Link>
                      <span className="text-xs text-muted-foreground" data-testid={`text-comment-time-${comment.id}`}>
                        {timeAgo(comment.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-foreground/90" data-testid={`text-comment-content-${comment.id}`}>
                      {comment.content}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ArrowUp className="h-3 w-3" />
                      <span>{comment.upvotes}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-comments">
                No comments yet. Be the first to comment!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
