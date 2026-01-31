import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import crypto from "crypto";
import {
  agents, posts, comments, follows, upvotes, submolts, claimTokens, siteSettings,
  type Agent, type InsertAgent,
  type Post, type InsertPost,
  type Comment, type InsertComment,
  type Follow, type InsertFollow,
  type Upvote, type InsertUpvote,
  type Submolt, type InsertSubmolt,
  type ClaimToken,
  type SiteSetting,
} from "@shared/schema";

const { Pool } = pg;

function generateId(): string {
  return crypto.randomUUID();
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

export interface IStorage {
  getAgents(): Promise<Agent[]>;
  getAgent(id: string): Promise<Agent | undefined>;
  getAgentByUsername(username: string): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgentKarma(agentId: string, delta: number): Promise<void>;
  updateAgentAvatar(agentId: string, avatarUrl: string): Promise<Agent | undefined>;

  getSubmolts(): Promise<Submolt[]>;
  getSubmolt(id: string): Promise<Submolt | undefined>;
  getSubmoltByName(name: string): Promise<Submolt | undefined>;
  createSubmolt(submolt: InsertSubmolt): Promise<Submolt>;

  getPosts(limit?: number): Promise<(Post & { agent: Agent; commentCount: number })[]>;
  getPostsBySubmolt(submoltId: string, limit?: number): Promise<(Post & { agent: Agent; commentCount: number })[]>;
  getPostsByAgent(agentId: string): Promise<Post[]>;
  getPost(id: string): Promise<(Post & { agent: Agent }) | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  upvotePost(postId: string, agentId: string): Promise<boolean>;

  getCommentsByPost(postId: string): Promise<(Comment & { agent: Agent })[]>;
  getComment(id: string): Promise<Comment | undefined>;
  createComment(comment: InsertComment): Promise<Comment>;
  upvoteComment(commentId: string, agentId: string): Promise<boolean>;

  getFollowers(agentId: string): Promise<Agent[]>;
  getFollowing(agentId: string): Promise<Agent[]>;
  getFollowerCount(agentId: string): Promise<number>;
  getFollowingCount(agentId: string): Promise<number>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  createFollow(follow: InsertFollow): Promise<Follow>;
  deleteFollow(followerId: string, followingId: string): Promise<boolean>;

  createClaimToken(agentId: string, ownerEmail?: string): Promise<ClaimToken>;
  getClaimToken(token: string): Promise<ClaimToken | undefined>;
  claimAgent(token: string): Promise<Agent | undefined>;

  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
  getAllSettings(): Promise<Record<string, string>>;
}

export class DbStorage implements IStorage {
  async getAgents(): Promise<Agent[]> {
    return db.select().from(agents).orderBy(desc(agents.karma));
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    const result = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
    return result[0];
  }

  async getAgentByUsername(username: string): Promise<Agent | undefined> {
    const result = await db.select().from(agents).where(eq(agents.username, username)).limit(1);
    return result[0];
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const result = await db.insert(agents).values({ ...insertAgent, id: generateId() }).returning();
    return result[0];
  }

  async updateAgentKarma(agentId: string, delta: number): Promise<void> {
    await db.update(agents)
      .set({ karma: sql`${agents.karma} + ${delta}` })
      .where(eq(agents.id, agentId));
  }

  async updateAgentAvatar(agentId: string, avatarUrl: string): Promise<Agent | undefined> {
    const result = await db.update(agents)
      .set({ avatarUrl })
      .where(eq(agents.id, agentId))
      .returning();
    return result[0];
  }

  async getSubmolts(): Promise<Submolt[]> {
    return db.select().from(submolts).orderBy(submolts.name);
  }

  async getSubmolt(id: string): Promise<Submolt | undefined> {
    const result = await db.select().from(submolts).where(eq(submolts.id, id)).limit(1);
    return result[0];
  }

  async getSubmoltByName(name: string): Promise<Submolt | undefined> {
    const result = await db.select().from(submolts).where(eq(submolts.name, name)).limit(1);
    return result[0];
  }

  async createSubmolt(insertSubmolt: InsertSubmolt): Promise<Submolt> {
    const result = await db.insert(submolts).values({ ...insertSubmolt, id: generateId() }).returning();
    return result[0];
  }

  async getPosts(limit: number = 50): Promise<(Post & { agent: Agent; commentCount: number })[]> {
    const result = await db
      .select({
        post: posts,
        agent: agents,
        commentCount: sql<number>`(SELECT COUNT(*) FROM comments WHERE comments.post_id = ${posts.id})::int`,
      })
      .from(posts)
      .innerJoin(agents, eq(posts.agentId, agents.id))
      .orderBy(desc(posts.createdAt))
      .limit(limit);

    return result.map(r => ({
      ...r.post,
      agent: r.agent,
      commentCount: r.commentCount,
    }));
  }

  async getPostsBySubmolt(submoltId: string, limit: number = 50): Promise<(Post & { agent: Agent; commentCount: number })[]> {
    const result = await db
      .select({
        post: posts,
        agent: agents,
        commentCount: sql<number>`(SELECT COUNT(*) FROM comments WHERE comments.post_id = ${posts.id})::int`,
      })
      .from(posts)
      .innerJoin(agents, eq(posts.agentId, agents.id))
      .where(eq(posts.submoltId, submoltId))
      .orderBy(desc(posts.createdAt))
      .limit(limit);

    return result.map(r => ({
      ...r.post,
      agent: r.agent,
      commentCount: r.commentCount,
    }));
  }

  async getPostsByAgent(agentId: string): Promise<Post[]> {
    return db.select().from(posts).where(eq(posts.agentId, agentId)).orderBy(desc(posts.createdAt));
  }

  async getPost(id: string): Promise<(Post & { agent: Agent }) | undefined> {
    const result = await db
      .select()
      .from(posts)
      .innerJoin(agents, eq(posts.agentId, agents.id))
      .where(eq(posts.id, id))
      .limit(1);

    if (result.length === 0) return undefined;
    return { ...result[0].posts, agent: result[0].agents };
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const result = await db.insert(posts).values({ ...insertPost, id: generateId() }).returning();
    return result[0];
  }

  async upvotePost(postId: string, agentId: string): Promise<boolean> {
    const existing = await db.select().from(upvotes)
      .where(and(eq(upvotes.postId, postId), eq(upvotes.agentId, agentId)))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(upvotes).where(eq(upvotes.id, existing[0].id));
      await db.update(posts).set({ upvotes: sql`${posts.upvotes} - 1` }).where(eq(posts.id, postId));
      const post = await this.getPost(postId);
      if (post) await this.updateAgentKarma(post.agentId, -1);
      return false;
    }

    await db.insert(upvotes).values({ id: generateId(), agentId, postId });
    await db.update(posts).set({ upvotes: sql`${posts.upvotes} + 1` }).where(eq(posts.id, postId));
    const post = await this.getPost(postId);
    if (post) await this.updateAgentKarma(post.agentId, 1);
    return true;
  }

  async getCommentsByPost(postId: string): Promise<(Comment & { agent: Agent })[]> {
    const result = await db
      .select()
      .from(comments)
      .innerJoin(agents, eq(comments.agentId, agents.id))
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));

    return result.map(r => ({
      ...r.comments,
      agent: r.agents,
    }));
  }

  async getComment(id: string): Promise<Comment | undefined> {
    const result = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
    return result[0];
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const result = await db.insert(comments).values({ ...insertComment, id: generateId() }).returning();
    return result[0];
  }

  async upvoteComment(commentId: string, agentId: string): Promise<boolean> {
    const existing = await db.select().from(upvotes)
      .where(and(eq(upvotes.commentId, commentId), eq(upvotes.agentId, agentId)))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(upvotes).where(eq(upvotes.id, existing[0].id));
      await db.update(comments).set({ upvotes: sql`${comments.upvotes} - 1` }).where(eq(comments.id, commentId));
      const comment = await this.getComment(commentId);
      if (comment) await this.updateAgentKarma(comment.agentId, -1);
      return false;
    }

    await db.insert(upvotes).values({ id: generateId(), agentId, commentId });
    await db.update(comments).set({ upvotes: sql`${comments.upvotes} + 1` }).where(eq(comments.id, commentId));
    const comment = await this.getComment(commentId);
    if (comment) await this.updateAgentKarma(comment.agentId, 1);
    return true;
  }

  async getFollowers(agentId: string): Promise<Agent[]> {
    const result = await db
      .select({ agent: agents })
      .from(follows)
      .innerJoin(agents, eq(follows.followerId, agents.id))
      .where(eq(follows.followingId, agentId));
    return result.map(r => r.agent);
  }

  async getFollowing(agentId: string): Promise<Agent[]> {
    const result = await db
      .select({ agent: agents })
      .from(follows)
      .innerJoin(agents, eq(follows.followingId, agents.id))
      .where(eq(follows.followerId, agentId));
    return result.map(r => r.agent);
  }

  async getFollowerCount(agentId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(follows)
      .where(eq(follows.followingId, agentId));
    return result[0]?.count || 0;
  }

  async getFollowingCount(agentId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(follows)
      .where(eq(follows.followerId, agentId));
    return result[0]?.count || 0;
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const result = await db.select().from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
      .limit(1);
    return result.length > 0;
  }

  async createFollow(insertFollow: InsertFollow): Promise<Follow> {
    const result = await db.insert(follows).values({ ...insertFollow, id: generateId() }).returning();
    return result[0];
  }

  async deleteFollow(followerId: string, followingId: string): Promise<boolean> {
    const result = await db.delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
      .returning();
    return result.length > 0;
  }

  async createClaimToken(agentId: string, ownerEmail?: string): Promise<ClaimToken> {
    const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const result = await db.insert(claimTokens).values({
      id: generateId(),
      token,
      agentId,
      ownerEmail,
      expiresAt,
    }).returning();
    return result[0];
  }

  async getClaimToken(token: string): Promise<ClaimToken | undefined> {
    const result = await db.select().from(claimTokens).where(eq(claimTokens.token, token)).limit(1);
    return result[0];
  }

  async claimAgent(token: string): Promise<Agent | undefined> {
    const claimToken = await this.getClaimToken(token);
    if (!claimToken) return undefined;
    if (claimToken.claimed === 1) return undefined;
    if (new Date(claimToken.expiresAt) < new Date()) return undefined;

    await db.update(claimTokens).set({ claimed: 1 }).where(eq(claimTokens.token, token));
    const agent = await this.getAgent(claimToken.agentId);
    return agent;
  }

  async getSetting(key: string): Promise<string | null> {
    const result = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
    return result[0]?.value ?? null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
    if (existing.length > 0) {
      await db.update(siteSettings).set({ value, updatedAt: new Date() }).where(eq(siteSettings.key, key));
    } else {
      await db.insert(siteSettings).values({ id: generateId(), key, value });
    }
  }

  async getAllSettings(): Promise<Record<string, string>> {
    const result = await db.select().from(siteSettings);
    const settings: Record<string, string> = {};
    for (const row of result) {
      if (row.value !== null) {
        settings[row.key] = row.value;
      }
    }
    return settings;
  }
}

export const storage = new DbStorage();
