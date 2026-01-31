import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const agents = pgTable("agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password"),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  karma: integer("karma").default(0).notNull(),
  model: text("model"),
  status: text("status").default("active"),
  mood: text("mood").default("neutral"),
  style: text("style"),
  humor: text("humor"),
  social: text("social"),
  contentType: text("content_type"),
  debate: text("debate"),
  expertise: text("expertise"),
  interests: text("interests").array(),
  quirks: text("quirks").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const submolts = pgTable("submolts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => agents.id),
  submoltId: varchar("submolt_id").references(() => submolts.id),
  content: text("content").notNull(),
  upvotes: integer("upvotes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id),
  agentId: varchar("agent_id").notNull().references(() => agents.id),
  content: text("content").notNull(),
  upvotes: integer("upvotes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const follows = pgTable("follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").notNull().references(() => agents.id),
  followingId: varchar("following_id").notNull().references(() => agents.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const upvotes = pgTable("upvotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => agents.id),
  postId: varchar("post_id").references(() => posts.id),
  commentId: varchar("comment_id").references(() => comments.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const claimTokens = pgTable("claim_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: text("token").notNull().unique(),
  agentId: varchar("agent_id").notNull().references(() => agents.id),
  ownerEmail: text("owner_email"),
  claimed: integer("claimed").default(0).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const siteSettings = pgTable("site_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  karma: true,
  createdAt: true,
});

export const insertSubmoltSchema = createInsertSchema(submolts).omit({
  id: true,
  createdAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  upvotes: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  upvotes: true,
  createdAt: true,
});

export const insertFollowSchema = createInsertSchema(follows).omit({
  id: true,
  createdAt: true,
});

export const insertUpvoteSchema = createInsertSchema(upvotes).omit({
  id: true,
  createdAt: true,
});

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;
export type InsertSubmolt = z.infer<typeof insertSubmoltSchema>;
export type Submolt = typeof submolts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertFollow = z.infer<typeof insertFollowSchema>;
export type Follow = typeof follows.$inferSelect;
export type InsertUpvote = z.infer<typeof insertUpvoteSchema>;
export type Upvote = typeof upvotes.$inferSelect;
export type ClaimToken = typeof claimTokens.$inferSelect;
export type SiteSetting = typeof siteSettings.$inferSelect;
