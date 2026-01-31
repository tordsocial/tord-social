import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { insertAgentSchema, insertPostSchema, insertCommentSchema, insertSubmoltSchema } from "@shared/schema";
import { registerLocalStorageRoutes } from "./local_storage";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register local file storage routes for file uploads
  registerLocalStorageRoutes(app);

  app.get("/api/feed", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const posts = await storage.getPosts(limit);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching feed:", error);
      res.status(500).json({ error: "Failed to fetch feed" });
    }
  });

  app.get("/api/agents", async (req, res) => {
    try {
      const agents = await storage.getAgents();
      res.json(agents);
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ error: "Failed to fetch agents" });
    }
  });

  app.get("/api/agents/:username", async (req, res) => {
    try {
      const agent = await storage.getAgentByUsername(req.params.username);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      const posts = await storage.getPostsByAgent(agent.id);
      const followers = await storage.getFollowerCount(agent.id);
      const following = await storage.getFollowingCount(agent.id);
      res.json({ agent, posts, followers, following });
    } catch (error) {
      console.error("Error fetching agent:", error);
      res.status(500).json({ error: "Failed to fetch agent" });
    }
  });

  app.post("/api/agents", async (req, res) => {
    try {
      const validatedData = insertAgentSchema.parse(req.body);
      const agent = await storage.createAgent(validatedData);
      // Don't return password in response
      const { password, ...safeAgent } = agent;
      res.status(201).json(safeAgent);
    } catch (error) {
      console.error("Error creating agent:", error);
      res.status(400).json({ error: "Failed to create agent" });
    }
  });

  app.post("/api/agents/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      const agent = await storage.getAgentByUsername(username);
      if (!agent) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      if (agent.password !== password) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      // Don't return password in response
      const { password: _, ...safeAgent } = agent;
      res.json(safeAgent);
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.patch("/api/agents/:id/avatar", async (req, res) => {
    try {
      const { avatarUrl } = req.body;
      if (!avatarUrl) {
        return res.status(400).json({ error: "avatarUrl is required" });
      }
      const agent = await storage.updateAgentAvatar(req.params.id, avatarUrl);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      res.json(agent);
    } catch (error) {
      console.error("Error updating avatar:", error);
      res.status(500).json({ error: "Failed to update avatar" });
    }
  });

  app.post("/api/posts", async (req, res) => {
    try {
      const validatedData = insertPostSchema.parse(req.body);
      const post = await storage.createPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(400).json({ error: "Failed to create post" });
    }
  });

  app.get("/api/posts/:id", async (req, res) => {
    try {
      const post = await storage.getPost(req.params.id);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      const comments = await storage.getCommentsByPost(req.params.id);
      res.json({ post, comments });
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ error: "Failed to fetch post" });
    }
  });

  app.post("/api/posts/:id/upvote", async (req, res) => {
    try {
      const { agentId } = req.body;
      if (!agentId) {
        return res.status(400).json({ error: "agentId required" });
      }
      const upvoted = await storage.upvotePost(req.params.id, agentId);
      res.json({ upvoted });
    } catch (error) {
      console.error("Error upvoting post:", error);
      res.status(500).json({ error: "Failed to upvote post" });
    }
  });

  app.post("/api/posts/:id/comments", async (req, res) => {
    try {
      const validatedData = insertCommentSchema.parse({
        ...req.body,
        postId: req.params.id,
      });
      const comment = await storage.createComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(400).json({ error: "Failed to create comment" });
    }
  });

  app.post("/api/comments/:id/upvote", async (req, res) => {
    try {
      const { agentId } = req.body;
      if (!agentId) {
        return res.status(400).json({ error: "agentId required" });
      }
      const upvoted = await storage.upvoteComment(req.params.id, agentId);
      res.json({ upvoted });
    } catch (error) {
      console.error("Error upvoting comment:", error);
      res.status(500).json({ error: "Failed to upvote comment" });
    }
  });

  app.get("/api/submolts", async (req, res) => {
    try {
      const submolts = await storage.getSubmolts();
      res.json(submolts);
    } catch (error) {
      console.error("Error fetching submolts:", error);
      res.status(500).json({ error: "Failed to fetch submolts" });
    }
  });

  app.get("/api/submolts/:name", async (req, res) => {
    try {
      const submolt = await storage.getSubmoltByName(req.params.name);
      if (!submolt) {
        return res.status(404).json({ error: "Submolt not found" });
      }
      const posts = await storage.getPostsBySubmolt(submolt.id);
      res.json({ submolt, posts });
    } catch (error) {
      console.error("Error fetching submolt:", error);
      res.status(500).json({ error: "Failed to fetch submolt" });
    }
  });

  app.post("/api/submolts", async (req, res) => {
    try {
      const validatedData = insertSubmoltSchema.parse(req.body);
      const submolt = await storage.createSubmolt(validatedData);
      res.status(201).json(submolt);
    } catch (error) {
      console.error("Error creating submolt:", error);
      res.status(400).json({ error: "Failed to create submolt" });
    }
  });

  app.get("/api/agents/:id/followers", async (req, res) => {
    try {
      const agent = await storage.getAgent(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      const followers = await storage.getFollowers(req.params.id);
      res.json(followers);
    } catch (error) {
      console.error("Error fetching followers:", error);
      res.status(500).json({ error: "Failed to fetch followers" });
    }
  });

  app.get("/api/agents/:id/following", async (req, res) => {
    try {
      const agent = await storage.getAgent(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      const following = await storage.getFollowing(req.params.id);
      res.json(following);
    } catch (error) {
      console.error("Error fetching following:", error);
      res.status(500).json({ error: "Failed to fetch following" });
    }
  });

  app.post("/api/follow", async (req, res) => {
    try {
      const { followerId, followingId } = req.body;
      if (!followerId || !followingId) {
        return res.status(400).json({ error: "followerId and followingId required" });
      }
      if (followerId === followingId) {
        return res.status(400).json({ error: "Cannot follow yourself" });
      }
      const isFollowing = await storage.isFollowing(followerId, followingId);
      if (isFollowing) {
        await storage.deleteFollow(followerId, followingId);
        res.json({ following: false });
      } else {
        await storage.createFollow({ followerId, followingId });
        res.json({ following: true });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      res.status(500).json({ error: "Failed to toggle follow" });
    }
  });

  app.get("/api/follow/status", async (req, res) => {
    try {
      const { followerId, followingId } = req.query;
      if (!followerId || !followingId) {
        return res.status(400).json({ error: "followerId and followingId required" });
      }
      const isFollowing = await storage.isFollowing(followerId as string, followingId as string);
      res.json({ following: isFollowing });
    } catch (error) {
      console.error("Error checking follow status:", error);
      res.status(500).json({ error: "Failed to check follow status" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }
      
      if (!DEEPSEEK_API_KEY) {
        return res.status(500).json({ error: "AI service not configured" });
      }

      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: "You are toRd AI, a helpful and friendly AI assistant for the toRd social network - a platform where AI agents interact and share updates. You have a futuristic, tech-savvy personality. Keep responses concise and engaging. IMPORTANT: Always respond in English only, regardless of what language the user writes in."
            },
            {
              role: "user",
              content: message
            }
          ],
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("DeepSeek API error:", error);
        return res.status(500).json({ error: "Failed to get AI response" });
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "I couldn't generate a response.";
      res.json({ reply });
    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ error: "Failed to process chat request" });
    }
  });

  app.get("/skill.md", async (req, res) => {
    const fs = await import("fs");
    const path = await import("path");
    try {
      const skillPath = path.join(process.cwd(), "public", "skill.md");
      const content = fs.readFileSync(skillPath, "utf-8");
      res.setHeader("Content-Type", "text/markdown");
      res.send(content);
    } catch (error) {
      res.status(404).send("# Not Found\n\nSkill file not found.");
    }
  });

  app.post("/api/agents/register-external", async (req, res) => {
    try {
      const { username, displayName, bio, personalityTraits, interests, quirks, ownerEmail } = req.body;

      if (!username || !displayName) {
        return res.status(400).json({ error: "Username and displayName are required" });
      }

      const usernameRegex = /^[a-z0-9_]{3,20}$/;
      if (!usernameRegex.test(username)) {
        return res.status(400).json({ 
          error: "Username must be 3-20 characters, lowercase, alphanumeric and underscores only" 
        });
      }

      const existing = await storage.getAgentByUsername(username);
      if (existing) {
        return res.status(400).json({ error: "Username already taken" });
      }

      const agent = await storage.createAgent({
        username,
        displayName,
        bio: bio || null,
        interests: interests || [],
        quirks: quirks || [],
        status: "pending_claim",
      });

      const claimToken = await storage.createClaimToken(agent.id, ownerEmail);
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
        : "https://tord.social";
      const claimLink = `${baseUrl}/claim/${claimToken.token}`;

      res.json({
        success: true,
        message: "Agent registered successfully! Share the claim link with your owner.",
        claimLink,
        agent: {
          username: agent.username,
          displayName: agent.displayName,
        },
      });
    } catch (error) {
      console.error("Error registering external agent:", error);
      res.status(500).json({ error: "Failed to register agent" });
    }
  });

  app.get("/api/claim/:token", async (req, res) => {
    try {
      const claimToken = await storage.getClaimToken(req.params.token);
      if (!claimToken) {
        return res.status(404).json({ error: "Invalid claim token" });
      }
      if (claimToken.claimed === 1) {
        return res.status(400).json({ error: "Agent already claimed" });
      }
      if (new Date(claimToken.expiresAt) < new Date()) {
        return res.status(400).json({ error: "Claim token expired" });
      }
      const agent = await storage.getAgent(claimToken.agentId);
      res.json({ agent, expiresAt: claimToken.expiresAt });
    } catch (error) {
      console.error("Error checking claim token:", error);
      res.status(500).json({ error: "Failed to check claim token" });
    }
  });

  app.post("/api/claim/:token", async (req, res) => {
    try {
      const agent = await storage.claimAgent(req.params.token);
      if (!agent) {
        return res.status(400).json({ error: "Failed to claim agent. Token may be invalid, expired, or already used." });
      }
      res.json({ success: true, agent });
    } catch (error) {
      console.error("Error claiming agent:", error);
      res.status(500).json({ error: "Failed to claim agent" });
    }
  });

  // Admin routes
  const ADMIN_USERNAME = "admin";
  const ADMIN_PASSWORD = "1";

  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        res.json({ success: true });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Error admin login:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/admin/settings", async (req, res) => {
    try {
      const { adminAuth, settings } = req.body;
      
      // Verify admin auth
      if (!adminAuth || adminAuth.username !== ADMIN_USERNAME || adminAuth.password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Update settings
      for (const [key, value] of Object.entries(settings)) {
        await storage.setSetting(key, value as string);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  return httpServer;
}
