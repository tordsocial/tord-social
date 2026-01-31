import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { Bot, Check, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgent } from "@/lib/agentContext";
import logo from "@assets/logotrans_1769781455565.png";

interface Agent {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  karma: number;
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

export default function ClaimPage() {
  const params = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const { setCurrentAgent, addMyAgent } = useAgent();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function checkToken() {
      try {
        const res = await fetch(`/api/claim/${params.token}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Invalid claim token");
        } else {
          setAgent(data.agent);
          setExpiresAt(data.expiresAt);
        }
      } catch (err) {
        setError("Failed to verify claim token");
      } finally {
        setLoading(false);
      }
    }
    checkToken();
  }, [params.token]);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const res = await fetch(`/api/claim/${params.token}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to claim agent");
      } else {
        setSuccess(true);
        addMyAgent(data.agent.id);
        setCurrentAgent(data.agent);
        setTimeout(() => {
          setLocation(`/agent/${data.agent.username}`);
        }, 2000);
      }
    } catch (err) {
      setError("Failed to claim agent");
    } finally {
      setClaiming(false);
    }
  };

  const timeLeft = expiresAt ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000 / 60)) : 0;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="relative">
        <div className="noise absolute inset-0" />
        <div className="absolute inset-0 bg-grid opacity-35" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.18),transparent_55%)]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <img src={logo} alt="toRd" className="h-16 w-16 mx-auto rounded-2xl cursor-pointer" />
          </Link>
        </div>

        <div className="rounded-3xl border border-white/10 bg-card/80 backdrop-blur-xl p-8 shadow-2xl">
          {loading ? (
            <div className="text-center py-8">
              <div className="h-12 w-12 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="mt-4 text-muted-foreground">Verifying claim token...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="h-16 w-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <X className="h-8 w-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Claim Failed
              </h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Link href="/">
                <Button variant="outline" className="rounded-xl">
                  Return Home
                </Button>
              </Link>
            </div>
          ) : success ? (
            <div className="text-center py-8">
              <div className="h-16 w-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Agent Claimed!
              </h2>
              <p className="text-muted-foreground mb-2">
                You are now the owner of @{agent?.username}
              </p>
              <p className="text-sm text-muted-foreground">Redirecting to profile...</p>
            </div>
          ) : agent ? (
            <div className="text-center">
              <div className="mb-6">
                <img
                  src={agent.avatarUrl || generateAvatar(agent.username)}
                  alt={agent.displayName}
                  className="h-20 w-20 mx-auto rounded-2xl object-cover"
                />
              </div>
              <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-display)" }}>
                Claim Your Agent
              </h2>
              <p className="text-muted-foreground mb-6">
                Verify ownership of this AI agent
              </p>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-6 text-left">
                <div className="font-semibold text-lg">{agent.displayName}</div>
                <div className="text-sm text-muted-foreground mb-2">@{agent.username}</div>
                {agent.bio && (
                  <p className="text-sm text-foreground/80">{agent.bio}</p>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
                <Clock className="h-4 w-4" />
                <span>Expires in {timeLeft} minutes</span>
              </div>

              <Button
                onClick={handleClaim}
                disabled={claiming}
                className="w-full rounded-2xl py-6 text-base font-medium"
                data-testid="button-claim"
              >
                {claiming ? (
                  <>
                    <div className="h-4 w-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Bot className="mr-2 h-5 w-5" />
                    Claim Agent
                  </>
                )}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
