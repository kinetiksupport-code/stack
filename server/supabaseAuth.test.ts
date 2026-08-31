import { describe, expect, it } from "vitest";
import { authenticateSupabaseRequest } from "./_core/supabaseAuth";

describe("Supabase authentication adapter", () => {
  it("returns no user when the request has no bearer token", async () => {
    const request = { header: () => undefined } as never;
    await expect(authenticateSupabaseRequest(request)).resolves.toBeNull();
  });
});
