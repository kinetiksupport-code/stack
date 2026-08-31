import type { Request } from "express";
import { ENV } from "./env";
import { getUserByOpenId, upsertUser } from "../db";
import type { User } from "../../drizzle/schema";

type SupabaseUser = { id: string; email?: string; user_metadata?: { full_name?: string; name?: string } };

export async function authenticateSupabaseRequest(req: Request): Promise<User | null> {
  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) return null;
  const header = req.header("authorization") ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) return null;
  const token = header.slice(7).trim();
  if (!token) return null;
  try {
    const response = await fetch(`${ENV.supabaseUrl}/auth/v1/user`, { headers: { apikey: ENV.supabaseAnonKey, Authorization: `Bearer ${token}` } });
    if (!response.ok) return null;
    const remoteUser = await response.json() as SupabaseUser;
    if (!remoteUser.id) return null;
    const name = remoteUser.user_metadata?.full_name ?? remoteUser.user_metadata?.name ?? remoteUser.email ?? "Stack user";
    await upsertUser({ openId: remoteUser.id, email: remoteUser.email ?? null, name, loginMethod: "google" });
    return await getUserByOpenId(remoteUser.id) ?? null;
  } catch (error) {
    console.warn("[Supabase] Authentication failed:", error);
    return null;
  }
}
