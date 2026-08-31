import { decryptSecret } from "./secretBox";

const GITHUB_API = "https://api.github.com";
const VERCEL_API = "https://api.vercel.com";

type GitHubRepository = { owner: string; name: string; htmlUrl: string; defaultBranch: string };
type VercelDeployment = { id: string; url: string; readyState?: string };

async function providerRequest<T>(url: string, token: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    headers: { accept: "application/vnd.github+json", "content-type": "application/json", authorization: `Bearer ${token}`, ...(init.headers || {}) },
  });
  const payload = await response.json().catch(() => ({})) as T & { message?: string; error?: { message?: string } };
  if (!response.ok) throw new Error(`${response.status}: ${payload?.message || payload?.error?.message || "Provider request failed"}`);
  return payload;
}

function normalizeRepoName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90) || `stack-project-${Date.now()}`;
}

export async function syncProjectToGitHub(input: { encryptedToken: string; requestedName: string; description: string; code: string; privateRepo: boolean }): Promise<GitHubRepository> {
  const token = decryptSecret(input.encryptedToken);
  const profile = await providerRequest<{ login: string }>(`${GITHUB_API}/user`, token);
  const name = normalizeRepoName(input.requestedName);
  let repository: { html_url: string; default_branch?: string; name: string };
  try {
    repository = await providerRequest(`${GITHUB_API}/user/repos`, token, { method: "POST", body: JSON.stringify({ name, description: input.description, private: input.privateRepo, auto_init: true }) });
  } catch (error) {
    if (!(error instanceof Error) || !error.message.startsWith("422")) throw error;
    repository = await providerRequest(`${GITHUB_API}/repos/${encodeURIComponent(profile.login)}/${encodeURIComponent(name)}`, token);
  }
  const content = Buffer.from(input.code, "utf8").toString("base64");
  await providerRequest(`${GITHUB_API}/repos/${encodeURIComponent(profile.login)}/${encodeURIComponent(repository.name)}/contents/index.html`, token, { method: "PUT", body: JSON.stringify({ message: "Publish project from Stack", content, branch: repository.default_branch || "main" }) });
  return { owner: profile.login, name: repository.name, htmlUrl: repository.html_url, defaultBranch: repository.default_branch || "main" };
}

export async function deployProjectToVercel(input: { encryptedToken: string; projectName: string; code: string; production: boolean }): Promise<VercelDeployment> {
  const token = decryptSecret(input.encryptedToken);
  const name = normalizeRepoName(input.projectName);
  let project: { id?: string; name: string };
  try {
    project = await providerRequest(`${VERCEL_API}/v11/projects`, token, { method: "POST", body: JSON.stringify({ name, framework: null, buildCommand: null, installCommand: null, devCommand: null }) });
  } catch (error) {
    if (!(error instanceof Error) || !error.message.startsWith("409")) throw error;
    project = await providerRequest(`${VERCEL_API}/v9/projects/${encodeURIComponent(name)}`, token);
  }
  const payload = await providerRequest<{ id: string; url: string; readyState?: string }>(`${VERCEL_API}/v13/deployments?forceNew=1`, token, { method: "POST", body: JSON.stringify({ name, project: project.id || project.name, target: input.production ? "production" : undefined, files: [{ file: "index.html", data: Buffer.from(input.code, "utf8").toString("base64"), encoding: "base64" }], projectSettings: { framework: null } }) });
  return { id: payload.id, url: payload.url.startsWith("http") ? payload.url : `https://${payload.url}`, readyState: payload.readyState };
}
