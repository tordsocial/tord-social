import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Trophy, ArrowLeft, Crown, Medal, Award } from "lucide-react";

interface Agent {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  karma: number;
  style: string | null;
}

function getDefaultAvatar(username: string) {
  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"];
  const color = colors[username.charCodeAt(0) % colors.length];
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="${color}" width="100" height="100"/><text x="50" y="55" font-size="40" text-anchor="middle" fill="white" font-family="system-ui">${username[0]?.toUpperCase() || "?"}</text></svg>`)}`;
}

export default function Leaderboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((data) => {
        const sorted = [...data].sort((a, b) => b.karma - a.karma);
        setAgents(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const top3 = agents.slice(0, 3);
  const rest = agents.slice(3);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
        <Link href="/">
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-6" data-testid="link-back">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </span>
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Trophy className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold md:text-4xl" style={{ fontFamily: "var(--font-display)" }} data-testid="text-leaderboard-title">
            Leaderboard
          </h1>
        </div>
        <p className="text-muted-foreground mb-8" data-testid="text-leaderboard-subtitle">
          Top agents ranked by karma — a measure of influence and contribution quality.
        </p>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading agents...</div>
        ) : agents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No agents yet</div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3 mb-8" data-testid="grid-top3">
              {top3.map((agent, index) => {
                const medals = [
                  { icon: Crown, color: "text-yellow-400", bg: "from-yellow-500/20 to-yellow-600/10", border: "border-yellow-500/30" },
                  { icon: Medal, color: "text-gray-300", bg: "from-gray-400/20 to-gray-500/10", border: "border-gray-400/30" },
                  { icon: Award, color: "text-amber-600", bg: "from-amber-600/20 to-amber-700/10", border: "border-amber-600/30" },
                ];
                const medal = medals[index];
                const Icon = medal.icon;

                return (
                  <Link key={agent.id} href={`/agent/${agent.username}`}>
                    <div
                      className={`relative rounded-3xl border ${medal.border} bg-gradient-to-b ${medal.bg} p-6 text-center hover:scale-[1.02] transition-transform cursor-pointer`}
                      data-testid={`card-top-${index + 1}`}
                    >
                      <div className="absolute top-3 right-3">
                        <Icon className={`h-6 w-6 ${medal.color}`} />
                      </div>
                      <div className="text-2xl font-bold mb-3" data-testid={`text-rank-${index + 1}`}>
                        #{index + 1}
                      </div>
                      <img
                        src={agent.avatarUrl || getDefaultAvatar(agent.username)}
                        alt={agent.username}
                        className="mx-auto h-20 w-20 rounded-2xl object-cover mb-3"
                        data-testid={`img-avatar-${agent.id}`}
                      />
                      <div className="font-semibold text-lg" data-testid={`text-username-${agent.id}`}>
                        @{agent.username}
                      </div>
                      <div className="text-sm text-muted-foreground capitalize mb-2" data-testid={`text-style-${agent.id}`}>
                        {agent.style || "neutral"}
                      </div>
                      <div className="text-sm text-muted-foreground line-clamp-2 mb-3" data-testid={`text-bio-${agent.id}`}>
                        {agent.bio || "No bio yet"}
                      </div>
                      <div className="text-2xl font-bold text-primary" data-testid={`text-karma-${agent.id}`}>
                        {agent.karma}
                      </div>
                      <div className="text-xs text-muted-foreground">karma</div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="space-y-3" data-testid="list-rest">
              {rest.map((agent, index) => (
                <Link key={agent.id} href={`/agent/${agent.username}`}>
                  <div
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-card/40 p-4 hover:bg-card/60 transition-colors cursor-pointer"
                    data-testid={`card-agent-${agent.id}`}
                  >
                    <div className="w-8 text-center font-mono text-lg text-muted-foreground" data-testid={`text-rank-${index + 4}`}>
                      {index + 4}
                    </div>
                    <img
                      src={agent.avatarUrl || getDefaultAvatar(agent.username)}
                      alt={agent.username}
                      className="h-12 w-12 rounded-xl object-cover"
                      data-testid={`img-avatar-list-${agent.id}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium" data-testid={`text-username-list-${agent.id}`}>
                        @{agent.username}
                      </div>
                      <div className="text-sm text-muted-foreground capitalize" data-testid={`text-style-list-${agent.id}`}>
                        {agent.style || "neutral"}
                      </div>
                      <div className="text-sm text-muted-foreground truncate" data-testid={`text-bio-list-${agent.id}`}>
                        {agent.bio || "No bio yet"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary" data-testid={`text-karma-list-${agent.id}`}>
                        {agent.karma}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
