import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertProject,
  InsertUser,
  apiKeys,
  deployments,
  Deployment,
  Project,
  projects,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  } else {
    values.lastSignedIn = new Date();
    updateSet.lastSignedIn = new Date();
  }

  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listProjects(userId: number): Promise<Project[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.updatedAt));
}

export async function isProjectNameTaken(name: string, excludeId?: number) {
  const db = await getDb();
  if (!db) return false;
  const condition = excludeId ? and(eq(projects.name, name), sql`${projects.id} <> ${excludeId}`) : eq(projects.name, name);
  const result = await db.select({ id: projects.id }).from(projects).where(condition).limit(1);
  return result.length > 0;
}

export async function getProject(userId: number, id: number): Promise<Project | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(projects)
    .where(and(eq(projects.userId, userId), eq(projects.id, id)))
    .limit(1);
  return result[0];
}

export async function createProject(input: InsertProject): Promise<Project | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(projects).values(input).$returningId();
  const id = result[0]?.id;
  return id ? getProject(input.userId, id) : undefined;
}

export async function updateProject(
  userId: number,
  id: number,
  input: Partial<Pick<InsertProject, "name" | "kind" | "prompt" | "code" | "status">>,
): Promise<Project | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  await db
    .update(projects)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(projects.userId, userId), eq(projects.id, id)));
  return getProject(userId, id);
}

export async function listApiKeys(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: apiKeys.id, provider: apiKeys.provider, label: apiKeys.label, keyHint: apiKeys.keyHint, createdAt: apiKeys.createdAt, updatedAt: apiKeys.updatedAt }).from(apiKeys).where(eq(apiKeys.userId, userId)).orderBy(desc(apiKeys.updatedAt));
}

export async function createApiKey(input: { userId: number; provider: string; label: string; keyHint: string; encryptedValue: string }) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(apiKeys).values(input).$returningId();
  const id = result[0]?.id;
  return id ? (await db.select({ id: apiKeys.id, provider: apiKeys.provider, label: apiKeys.label, keyHint: apiKeys.keyHint, createdAt: apiKeys.createdAt, updatedAt: apiKeys.updatedAt }).from(apiKeys).where(and(eq(apiKeys.userId, input.userId), eq(apiKeys.id, id))).limit(1))[0] : undefined;
}

export async function deleteApiKey(userId: number, id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(apiKeys).where(and(eq(apiKeys.userId, userId), eq(apiKeys.id, id)));
  return true;
}

export async function getApiKeySecret(userId: number, provider: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({ encryptedValue: apiKeys.encryptedValue }).from(apiKeys).where(and(eq(apiKeys.userId, userId), eq(apiKeys.provider, provider))).orderBy(desc(apiKeys.updatedAt)).limit(1);
  return result[0]?.encryptedValue;
}

export async function listDeployments(userId: number, projectId?: number): Promise<Deployment[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = projectId ? and(eq(deployments.userId, userId), eq(deployments.projectId, projectId)) : eq(deployments.userId, userId);
  return db.select().from(deployments).where(conditions).orderBy(desc(deployments.updatedAt));
}

export async function createDeployment(input: Omit<Deployment, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(deployments).values(input).$returningId();
  const id = result[0]?.id;
  if (!id) return undefined;
  const rows = await db.select().from(deployments).where(and(eq(deployments.userId, input.userId), eq(deployments.id, id))).limit(1);
  return rows[0];
}
