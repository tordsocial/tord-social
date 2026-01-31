import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, Save, LogIn, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [settings, setSettings] = useState({
    ca: "",
    twitter: "",
    telegram: "",
    discord: "",
    website: "",
    github: "",
  });

  useEffect(() => {
    const savedAuth = localStorage.getItem("adminAuth");
    if (savedAuth) {
      const auth = JSON.parse(savedAuth);
      verifyAuth(auth.username, auth.password);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchSettings();
    }
  }, [isLoggedIn]);

  const verifyAuth = async (user: string, pass: string) => {
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pass }),
      });
      if (res.ok) {
        setIsLoggedIn(true);
        setUsername(user);
        setPassword(pass);
        localStorage.setItem("adminAuth", JSON.stringify({ username: user, password: pass }));
      } else {
        localStorage.removeItem("adminAuth");
      }
    } catch (error) {
      console.error("Auth verification failed:", error);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings({
          ca: data.ca || "",
          twitter: data.twitter || "",
          telegram: data.telegram || "",
          discord: data.discord || "",
          website: data.website || "",
          github: data.github || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        setIsLoggedIn(true);
        localStorage.setItem("adminAuth", JSON.stringify({ username, password }));
      } else {
        setLoginError("Invalid username or password");
      }
    } catch (error) {
      setLoginError("Failed to login");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminAuth: { username, password },
          settings,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername("");
    setPassword("");
    localStorage.removeItem("adminAuth");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-white/10 bg-card/50 p-8 backdrop-blur">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.2)] ring-1 ring-[hsl(var(--primary)/0.4)]">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                  Admin Panel
                </h1>
                <p className="text-sm text-muted-foreground">Login to manage settings</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  required
                  data-testid="input-admin-username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  required
                  data-testid="input-admin-password"
                />
              </div>
              {loginError && (
                <p className="text-sm text-red-400 text-center">{loginError}</p>
              )}
              <Button
                type="submit"
                className="w-full rounded-xl"
                disabled={loading}
                data-testid="button-admin-login"
              >
                <LogIn className="mr-2 h-4 w-4" />
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/">
                <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                  Back to home
                </span>
              </Link>
            </div>
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
          <div className="flex items-center justify-between mb-8">
            <Link href="/">
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
                Back to home
              </span>
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Logout
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-card/50 p-6 backdrop-blur">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.2)] ring-1 ring-[hsl(var(--primary)/0.4)]">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                  Site Settings
                </h1>
                <p className="text-sm text-muted-foreground">Manage CA and social links</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <h2 className="text-lg font-medium mb-4 border-b border-white/10 pb-2">Contract Address</h2>
                <div>
                  <label className="block text-sm font-medium mb-1">CA (Contract Address)</label>
                  <input
                    type="text"
                    value={settings.ca}
                    onChange={(e) => setSettings({ ...settings, ca: e.target.value })}
                    placeholder="0x..."
                    className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-2.5 text-sm font-mono focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                    data-testid="input-ca"
                  />
                </div>
              </div>

              <div>
                <h2 className="text-lg font-medium mb-4 border-b border-white/10 pb-2">Social Links</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Twitter / X</label>
                    <input
                      type="url"
                      value={settings.twitter}
                      onChange={(e) => setSettings({ ...settings, twitter: e.target.value })}
                      placeholder="https://x.com/..."
                      className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                      data-testid="input-twitter"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Telegram</label>
                    <input
                      type="url"
                      value={settings.telegram}
                      onChange={(e) => setSettings({ ...settings, telegram: e.target.value })}
                      placeholder="https://t.me/..."
                      className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                      data-testid="input-telegram"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Discord</label>
                    <input
                      type="url"
                      value={settings.discord}
                      onChange={(e) => setSettings({ ...settings, discord: e.target.value })}
                      placeholder="https://discord.gg/..."
                      className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                      data-testid="input-discord"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Website</label>
                    <input
                      type="url"
                      value={settings.website}
                      onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                      data-testid="input-website"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">GitHub</label>
                    <input
                      type="url"
                      value={settings.github}
                      onChange={(e) => setSettings({ ...settings, github: e.target.value })}
                      placeholder="https://github.com/..."
                      className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                      data-testid="input-github"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  type="submit"
                  className="rounded-xl"
                  disabled={saving}
                  data-testid="button-save-settings"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Settings"}
                </Button>
                {saveSuccess && (
                  <span className="text-sm text-green-400">Settings saved successfully!</span>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
