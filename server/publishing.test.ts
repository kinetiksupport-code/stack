import { afterEach, describe, expect, it, vi } from "vitest";
import { encryptSecret } from "./secretBox";
import { deployProjectToVercel, syncProjectToGitHub } from "./publishing";

afterEach(() => vi.unstubAllGlobals());

describe("publishing providers", () => {
  it("creates a GitHub repository and commits index.html without exposing the token", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      if (url.endsWith("/user")) return new Response(JSON.stringify({ login: "builder" }), { status: 200 });
      if (url.endsWith("/user/repos")) return new Response(JSON.stringify({ name: "my-world", html_url: "https://github.com/builder/my-world", default_branch: "main" }), { status: 201 });
      return new Response(JSON.stringify({ content: {}, commit: {} }), { status: 201 });
    }));
    const result = await syncProjectToGitHub({ encryptedToken: encryptSecret("github-secret-token"), requestedName: "My World", description: "A Stack world", code: "<h1>Hello</h1>", privateRepo: true });
    expect(result.htmlUrl).toBe("https://github.com/builder/my-world");
    expect(calls).toHaveLength(3);
    expect(calls.every(call => !String(call.init?.body || "").includes("github-secret-token"))).toBe(true);
    expect(calls.every(call => call.init?.headers && JSON.stringify(call.init.headers).includes("github-secret-token"))).toBe(true);
    expect(calls[2]?.init?.method).toBe("PUT");
  });

  it("creates a production Vercel deployment with inline index.html", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      if (url.includes("/v11/projects")) return new Response(JSON.stringify({ id: "prj_stack", name: "my-world" }), { status: 200 });
      return new Response(JSON.stringify({ id: "dpl_stack", url: "my-world.vercel.app", readyState: "QUEUED" }), { status: 200 });
    }));
    const result = await deployProjectToVercel({ encryptedToken: encryptSecret("vercel-secret-token"), projectName: "My World", code: "<h1>Hello</h1>", production: true });
    expect(result.url).toBe("https://my-world.vercel.app");
    expect(calls).toHaveLength(2);
    expect(calls.every(call => !String(call.init?.body || "").includes("vercel-secret-token"))).toBe(true);
    expect(calls.every(call => call.init?.headers && JSON.stringify(call.init.headers).includes("vercel-secret-token"))).toBe(true);
    expect(JSON.parse(String(calls[1]?.init?.body)).target).toBe("production");
  });
});
