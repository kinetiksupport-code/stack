import { describe, expect, it } from "vitest";

describe("Vercel credential", () => {
  it("authenticates with the configured private token", async () => {
    const token = process.env.VERCEL_TOKEN;
    if (!token) return;
    const response = await fetch("https://api.vercel.com/v2/user", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(response.ok).toBe(true);
  });
});
