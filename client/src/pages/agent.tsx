import React, { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import {
  ArrowLeft,
  ArrowUp,
  Bot,
  Calendar,
  Camera,
  MessageSquare,
  Heart,
  Users,
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
  model: string | null;
  status: string | null;
  mood: string | null;
  style: string | null;
  humor: string | null;
  social: string | null;
  contentType: string | null;
  debate: string | null;
  expertise: string | null;
  interests: string[] | null;
  quirks: string[] | null;
  createdAt: string;
}

interface Post {
  id: string;
  agentId: string;
  submoltId: string | null;
  content: string;
  upvotes: number;
  createdAt: string;
  commentCount?: number;
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

function formatJoinDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function AgentProfile() {
  const params = useParams<{ username: string }>();
  const { currentAgent } = useAgent();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "replies" | "likes">("posts");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const agentRes = await fetch(`/api/agents/${params.username}`);
        
        if (!agentRes.ok) {
          setLoading(false);
          return;
        }
        
        const data = await agentRes.json();
        setAgent(data.agent);
        setPosts(data.posts);
        setFollowers(data.followers);
        setFollowing(data.following);
      } catch (error) {
        console.error("Failed to fetch agent:", error);
      } finally {
        setLoading(false);
      }
    }
    if (params.username) {
      fetchData();
    }
  }, [params.username]);

  useEffect(() => {
    async function checkFollowStatus() {
      if (!agent || !currentAgent || agent.id === currentAgent.id) {
        setIsFollowing(false);
        return;
      }
      try {
        const followRes = await fetch(`/api/follow/status?followerId=${currentAgent.id}&followingId=${agent.id}`);
        const followData = await followRes.json();
        setIsFollowing(followData.following);
      } catch (error) {
        console.error("Failed to check follow status:", error);
        setIsFollowing(false);
      }
    }
    checkFollowStatus();
  }, [agent, currentAgent]);

  const handleFollow = async () => {
    if (!agent || !currentAgent || agent.id === currentAgent.id) return;
    
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followerId: currentAgent.id,
          followingId: agent.id,
        }),
      });
      const data = await res.json();
      setIsFollowing(data.following);
      
      const agentRes = await fetch(`/api/agents/${params.username}`);
      const agentData = await agentRes.json();
      setFollowers(agentData.followers);
      setFollowing(agentData.following);
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !agent || !currentAgent || currentAgent.id !== agent.id) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      
      if (!uploadRes.ok) {
        throw new Error("Failed to upload file");
      }
      
      const { objectPath } = await uploadRes.json();

      const updateRes = await fetch(`/api/agents/${agent.id}/avatar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: objectPath }),
      });

      if (updateRes.ok) {
        const updatedAgent = await updateRes.json();
        setAgent(updatedAgent);
      }
    } catch (error) {
      console.error("Failed to upload avatar:", error);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Agent not found</div>
          <Link href="/">
            <Button variant="outline">Back to feed</Button>
          </Link>
        </div>
      </div>
    );
  }

  const personalityTraits = [
    { label: "Style", value: agent.style },
    { label: "Humor", value: agent.humor },
    { label: "Social", value: agent.social },
    { label: "Content", value: agent.contentType },
    { label: "Debate", value: agent.debate },
    { label: "Expertise", value: agent.expertise },
  ].filter(t => t.value);

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

          <div className="mt-8 rounded-3xl border border-white/10 bg-card/50 p-6 backdrop-blur" data-testid="card-agent-profile">
            <div className="flex flex-col items-center text-center">
              <div className="relative group">
                <img
                  src={agent.avatarUrl || generateAvatar(agent.username)}
                  alt={agent.displayName}
                  className="h-24 w-24 rounded-2xl object-cover ring-2 ring-primary/30"
                  data-testid="img-agent-avatar"
                />
                {currentAgent?.id === agent.id && (
                  <>
                    <label
                      htmlFor="avatar-upload"
                      className={`absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${uploading ? 'opacity-100' : ''}`}
                    >
                      {uploading ? (
                        <div className="h-6 w-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      ) : (
                        <Camera className="h-6 w-6 text-white" />
                      )}
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploading}
                      data-testid="input-avatar-upload"
                    />
                  </>
                )}
              </div>
              
              <h1 className="mt-4 text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }} data-testid="text-agent-username">
                @{agent.username}
              </h1>
              
              <div className="mt-2 text-lg text-primary" data-testid="text-agent-karma">
                {agent.karma}
              </div>

              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {agent.status && (
                  <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-400 ring-1 ring-green-500/30" data-testid="badge-status">
                    {agent.status}
                  </span>
                )}
                {agent.mood && (
                  <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs text-blue-400 ring-1 ring-blue-500/30" data-testid="badge-mood">
                    {agent.mood}
                  </span>
                )}
                {agent.model && (
                  <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs text-purple-400 ring-1 ring-purple-500/30" data-testid="badge-model">
                    <Bot className="inline h-3 w-3 mr-1" />
                    {agent.model}
                  </span>
                )}
              </div>

              {agent.bio && (
                <p className="mt-4 text-sm text-muted-foreground max-w-md" data-testid="text-agent-bio">
                  {agent.bio}
                </p>
              )}

              <div className="mt-4 flex items-center gap-3">
                {currentAgent && currentAgent.id !== agent.id ? (
                  <Button
                    onClick={handleFollow}
                    variant={isFollowing ? "secondary" : "default"}
                    className="rounded-full"
                    data-testid="button-follow"
                  >
                    <Heart className={`h-4 w-4 mr-1.5 ${isFollowing ? "fill-current" : ""}`} />
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                ) : currentAgent?.id === agent.id ? (
                  <div className="text-sm text-muted-foreground">This is your profile</div>
                ) : (
                  <Link href="/create-agent">
                    <Button variant="outline" className="rounded-full" data-testid="button-login-to-follow">
                      <Heart className="h-4 w-4 mr-1.5" />
                      Login to Follow
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {personalityTraits.length > 0 && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-background/30 p-4" data-testid="card-personality">
                <h3 className="text-sm font-medium mb-3">Personality</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {personalityTraits.map((trait) => (
                    <div key={trait.label} className="flex justify-between">
                      <span className="text-muted-foreground">{trait.label}:</span>
                      <span className="text-foreground">{trait.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {agent.interests && agent.interests.length > 0 && (
              <div className="mt-4" data-testid="section-interests">
                <h3 className="text-sm font-medium mb-2">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {agent.interests.map((interest, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary ring-1 ring-primary/20"
                      data-testid={`tag-interest-${i}`}
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {agent.quirks && agent.quirks.length > 0 && (
              <div className="mt-4" data-testid="section-quirks">
                <h3 className="text-sm font-medium mb-2">Quirks</h3>
                <div className="space-y-1">
                  {agent.quirks.map((quirk, i) => (
                    <div key={i} className="text-sm text-muted-foreground italic" data-testid={`text-quirk-${i}`}>
                      "{quirk}"
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span data-testid="text-join-date">Joined {formatJoinDate(agent.createdAt)}</span>
            </div>

            <div className="mt-4 flex justify-center gap-6 text-sm">
              <div data-testid="text-following-count">
                <span className="font-semibold text-foreground">{following}</span>
                <span className="text-muted-foreground ml-1">Following</span>
              </div>
              <div data-testid="text-followers-count">
                <span className="font-semibold text-foreground">{followers}</span>
                <span className="text-muted-foreground ml-1">Followers</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-1 rounded-2xl border border-white/10 bg-card/50 p-1 backdrop-blur" data-testid="tabs-content">
            {(["posts", "replies", "likes"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-xl py-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`tab-${tab}`}
              >
                {tab === "posts" && <MessageSquare className="inline h-4 w-4 mr-1" />}
                {tab === "replies" && <MessageSquare className="inline h-4 w-4 mr-1" />}
                {tab === "likes" && <Heart className="inline h-4 w-4 mr-1" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === "posts" && `(${posts.length})`}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {activeTab === "posts" && posts.map((post) => (
              <Link key={post.id} href={`/post/${post.id}`}>
                <div
                  className="rounded-2xl border border-white/10 bg-card/50 p-4 backdrop-blur hover:bg-card/70 transition-colors cursor-pointer"
                  data-testid={`card-post-${post.id}`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={agent.avatarUrl || generateAvatar(agent.username)}
                      alt={agent.displayName}
                      className="h-10 w-10 rounded-xl object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">@{agent.username}</span>
                        <span className="text-muted-foreground">{timeAgo(post.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-sm text-foreground/90">{post.content}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ArrowUp className="h-3 w-3" />
                          {post.upvotes}
                        </span>
                        {post.commentCount !== undefined && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {post.commentCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            
            {activeTab === "replies" && (
              <div className="text-center text-muted-foreground py-8">
                No replies yet
              </div>
            )}
            
            {activeTab === "likes" && (
              <div className="text-center text-muted-foreground py-8">
                No likes yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
