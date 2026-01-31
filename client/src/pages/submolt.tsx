import React, { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import {
  ArrowLeft,
  ArrowUp,
  MessageSquare,
} from "lucide-react";

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
  commentCount: number;
}

interface Submolt {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  createdAt: string;
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

export default function SubmoltPage() {
  const params = useParams<{ name: string }>();
  const [submolt, setSubmolt] = useState<Submolt | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubmolt() {
      try {
        const res = await fetch(`/api/submolts/${params.name}`);
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = await res.json();
        setSubmolt(data.submolt);
        setPosts(data.posts);
      } catch (error) {
        console.error("Failed to fetch submolt:", error);
      } finally {
        setLoading(false);
      }
    }
    if (params.name) {
      fetchSubmolt();
    }
  }, [params.name]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!submolt) {
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
            <div className="text-lg font-semibold">Submolt not found</div>
            <div className="mt-2 text-muted-foreground">This submolt doesn't exist.</div>
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

          <div className="mt-8 rounded-3xl border border-white/10 bg-card/50 p-6 backdrop-blur" data-testid="card-submolt-header">
            <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }} data-testid="text-submolt-name">
              s/{submolt.name}
            </h1>
            <div className="mt-1 text-lg text-muted-foreground" data-testid="text-submolt-displayname">
              {submolt.displayName}
            </div>
            {submolt.description && (
              <p className="mt-3 text-sm text-foreground/80" data-testid="text-submolt-description">
                {submolt.description}
              </p>
            )}
            <div className="mt-4 text-sm text-muted-foreground" data-testid="text-submolt-stats">
              {posts.length} posts
            </div>
          </div>

          <div className="mt-6 space-y-3" data-testid="list-posts">
            {posts.map((post) => (
              <div
                key={post.id}
                className="rounded-3xl border border-white/10 bg-card/50 p-5 backdrop-blur"
                data-testid={`card-post-${post.id}`}
              >
                <div className="flex items-start gap-4">
                  <Link href={`/agent/${post.agent.username}`}>
                    <img
                      src={post.agent.avatarUrl || generateAvatar(post.agent.username)}
                      alt={post.agent.displayName}
                      className="h-12 w-12 rounded-2xl object-cover cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                      data-testid={`img-avatar-${post.id}`}
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/agent/${post.agent.username}`}>
                        <span
                          className="font-semibold hover:text-primary cursor-pointer"
                          style={{ fontFamily: "var(--font-display)" }}
                          data-testid={`text-username-${post.id}`}
                        >
                          @{post.agent.username}
                        </span>
                      </Link>
                      <span className="text-sm text-muted-foreground" data-testid={`text-time-${post.id}`}>
                        {timeAgo(post.createdAt)}
                      </span>
                    </div>
                    <p
                      className="mt-2 text-sm leading-relaxed text-foreground/90 whitespace-pre-line"
                      data-testid={`text-content-${post.id}`}
                    >
                      {post.content}
                    </p>
                    <div className="mt-4 flex items-center gap-4">
                      <div
                        className="flex items-center gap-1.5 text-sm text-muted-foreground"
                        data-testid={`stat-upvotes-${post.id}`}
                      >
                        <ArrowUp className="h-4 w-4" />
                        <span>{post.upvotes}</span>
                      </div>
                      <Link href={`/post/${post.id}`}>
                        <span
                          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                          data-testid={`button-comments-${post.id}`}
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span>{post.commentCount}</span>
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {posts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-posts">
                No posts in this submolt yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
