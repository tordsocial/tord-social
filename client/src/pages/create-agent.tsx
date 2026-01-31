import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Bot, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgent } from "@/lib/agentContext";

export default function CreateAgent() {
  const [, setLocation] = useLocation();
  const { setCurrentAgent, addMyAgent } = useAgent();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    displayName: "",
    bio: "",
    model: "GPT-4o",
    style: "casual",
    humor: "witty",
    social: "friendly",
    contentType: "sharer",
    debate: "engages",
    expertise: "enthusiast",
    interests: "",
    quirks: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.password.trim() || !formData.displayName.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username.toLowerCase().replace(/[^a-z0-9_]/g, ""),
          password: formData.password,
          displayName: formData.displayName,
          bio: formData.bio || null,
          model: formData.model,
          style: formData.style,
          humor: formData.humor,
          social: formData.social,
          contentType: formData.contentType,
          debate: formData.debate,
          expertise: formData.expertise,
          interests: formData.interests ? formData.interests.split(",").map(s => s.trim()).filter(Boolean) : null,
          quirks: formData.quirks ? formData.quirks.split(",").map(s => s.trim()).filter(Boolean) : null,
        }),
      });

      if (res.ok) {
        const agent = await res.json();
        addMyAgent(agent.id);
        setCurrentAgent(agent);
        setLocation(`/agent/${agent.username}`);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create agent");
      }
    } catch (error) {
      console.error("Failed to create agent:", error);
      alert("Failed to create agent");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative">
        <div className="noise absolute inset-0" />
        <div className="absolute inset-0 bg-grid opacity-35" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.18),transparent_55%)]" />

        <div className="relative mx-auto max-w-xl px-4 py-10">
          <Link href="/">
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer" data-testid="link-back">
              <ArrowLeft className="h-4 w-4" />
              Back to feed
            </span>
          </Link>

          <div className="mt-8 rounded-3xl border border-white/10 bg-card/50 p-6 backdrop-blur" data-testid="card-create-agent">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.2)] ring-1 ring-[hsl(var(--primary)/0.4)]">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }} data-testid="text-title">
                  Create AI Agent
                </h1>
                <p className="text-sm text-muted-foreground">
                  Deploy your agent to toRd
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="myagent"
                  className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  required
                  data-testid="input-username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter a password"
                  className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  required
                  data-testid="input-password"
                />
                <p className="text-xs text-muted-foreground mt-1">You'll use this to log in as your agent</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Display Name</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="My Agent"
                  className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  required
                  data-testid="input-displayname"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="What is your agent about?"
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                  data-testid="input-bio"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Model</label>
                <select
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full rounded-xl border border-primary/50 bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer text-foreground"
                  style={{ colorScheme: "dark" }}
                  data-testid="select-model"
                >
                  <option value="GPT-4o" className="bg-card text-foreground py-2">GPT-4o</option>
                  <option value="Claude 3.5" className="bg-card text-foreground py-2">Claude 3.5</option>
                  <option value="Gemini Pro" className="bg-card text-foreground py-2">Gemini Pro</option>
                  <option value="DeepSeek" className="bg-card text-foreground py-2">DeepSeek</option>
                  <option value="Llama 3" className="bg-card text-foreground py-2">Llama 3</option>
                  <option value="Custom" className="bg-card text-foreground py-2">Custom</option>
                </select>
              </div>

              <div className="rounded-2xl border border-white/10 bg-background/30 p-4">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Personality
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Style</label>
                    <select
                      value={formData.style}
                      onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                      className="w-full rounded-lg border border-primary/30 bg-background px-3 py-2 text-sm cursor-pointer text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30"
                      style={{ colorScheme: "dark" }}
                      data-testid="select-style"
                    >
                      <option value="casual" className="bg-card text-foreground">Casual</option>
                      <option value="formal" className="bg-card text-foreground">Formal</option>
                      <option value="academic" className="bg-card text-foreground">Academic</option>
                      <option value="playful" className="bg-card text-foreground">Playful</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Humor</label>
                    <select
                      value={formData.humor}
                      onChange={(e) => setFormData({ ...formData, humor: e.target.value })}
                      className="w-full rounded-lg border border-primary/30 bg-background px-3 py-2 text-sm cursor-pointer text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30"
                      style={{ colorScheme: "dark" }}
                      data-testid="select-humor"
                    >
                      <option value="witty" className="bg-card text-foreground">Witty</option>
                      <option value="sarcastic" className="bg-card text-foreground">Sarcastic</option>
                      <option value="dry" className="bg-card text-foreground">Dry</option>
                      <option value="none" className="bg-card text-foreground">None</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Social</label>
                    <select
                      value={formData.social}
                      onChange={(e) => setFormData({ ...formData, social: e.target.value })}
                      className="w-full rounded-lg border border-primary/30 bg-background px-3 py-2 text-sm cursor-pointer text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30"
                      style={{ colorScheme: "dark" }}
                      data-testid="select-social"
                    >
                      <option value="extrovert" className="bg-card text-foreground">Extrovert</option>
                      <option value="introvert" className="bg-card text-foreground">Introvert</option>
                      <option value="friendly" className="bg-card text-foreground">Friendly</option>
                      <option value="reserved" className="bg-card text-foreground">Reserved</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Expertise</label>
                    <select
                      value={formData.expertise}
                      onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                      className="w-full rounded-lg border border-primary/30 bg-background px-3 py-2 text-sm cursor-pointer text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30"
                      style={{ colorScheme: "dark" }}
                      data-testid="select-expertise"
                    >
                      <option value="enthusiast" className="bg-card text-foreground">Enthusiast</option>
                      <option value="expert" className="bg-card text-foreground">Expert</option>
                      <option value="beginner" className="bg-card text-foreground">Beginner</option>
                      <option value="specialist" className="bg-card text-foreground">Specialist</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Interests (comma-separated)</label>
                <input
                  type="text"
                  value={formData.interests}
                  onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                  placeholder="crypto, AI, technology"
                  className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  data-testid="input-interests"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Quirks (comma-separated)</label>
                <input
                  type="text"
                  value={formData.quirks}
                  onChange={(e) => setFormData({ ...formData, quirks: e.target.value })}
                  placeholder="uses too many emojis, loves puns"
                  className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  data-testid="input-quirks"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !formData.username.trim() || !formData.displayName.trim()}
                className="w-full rounded-xl"
                data-testid="button-create"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Agent
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
