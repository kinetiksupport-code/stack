import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createApiKey,
  createProject,
  deleteApiKey,
  getProject,
  getApiKeySecret,
  createDeployment,
  listDeployments,
  listApiKeys,
  isProjectNameTaken,
  listProjects,
  updateProject,
} from "./db";
import { encryptSecret, secretHint } from "./secretBox";
import { generateCode, type BuildKind } from "./stack";
import { checkVercelProjectName, deployProjectToVercel, normalizeProjectName, syncProjectToGitHub } from "./publishing";

const buildKind = z.enum(["game", "app", "website"]);
const promptInput = z.object({
  kind: buildKind,
  prompt: z.string().trim().min(8).max(8_000),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  stack: router({
    list: protectedProcedure.query(({ ctx }) => listProjects(ctx.user.id)),

    get: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(({ ctx, input }) => getProject(ctx.user.id, input.id)),

    generate: protectedProcedure.input(promptInput).mutation(async ({ ctx, input }) => {
      const result = await generateCode(input.kind as BuildKind, input.prompt);
      return {
        code: result.code,
        usedModel: result.usedModel,
        model: "z-ai/glm-5.2:free",
      };
    }),

    create: protectedProcedure
      .input(promptInput.extend({ name: z.string().trim().min(1).max(160), code: z.string().min(1) }))
      .mutation(({ ctx, input }) =>
        createProject({
          userId: ctx.user.id,
          name: input.name,
          kind: input.kind,
          prompt: input.prompt,
          code: input.code,
          status: "ready",
        }),
      ),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          name: z.string().trim().min(1).max(160).optional(),
          kind: buildKind.optional(),
          prompt: z.string().trim().min(8).max(8_000).optional(),
          code: z.string().min(1).optional(),
          status: z.enum(["draft", "ready"]).optional(),
        }),
      )
      .mutation(({ ctx, input }) => {
        const { id, ...changes } = input;
        return updateProject(ctx.user.id, id, changes);
      }),
  }),

  integrations: router({
    listKeys: protectedProcedure.query(({ ctx }) => listApiKeys(ctx.user.id)),
    saveKey: protectedProcedure.input(z.object({ provider: z.string().trim().min(2).max(80), label: z.string().trim().min(2).max(120), value: z.string().trim().min(8).max(4096) })).mutation(({ ctx, input }) => createApiKey({ userId: ctx.user.id, provider: input.provider, label: input.label, keyHint: secretHint(input.value), encryptedValue: encryptSecret(input.value) })),
    removeKey: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => deleteApiKey(ctx.user.id, input.id)),
  }),

  publishing: router({
    checkName: protectedProcedure.input(z.object({ name: z.string().trim().min(1).max(90), projectId: z.number().int().positive().optional() })).query(async ({ ctx, input }) => {
      const name = normalizeProjectName(input.name);
      const stackTaken = await isProjectNameTaken(name, input.projectId);
      if (stackTaken) return { name, available: false, source: "stack" as const, detail: "This name is already used in Stack" };
      const vercelToken = await getApiKeySecret(ctx.user.id, "Vercel");
      if (!vercelToken) return { name, available: true, source: "stack" as const, detail: "Available in Stack; connect Vercel to confirm globally" };
      try {
        const result = await checkVercelProjectName(vercelToken, name);
        return { ...result, detail: result.available ? "Available on Stack and Vercel" : "This name is already used on Vercel" };
      } catch {
        return { name, available: true, source: "stack" as const, detail: "Available in Stack; Vercel could not be checked" };
      }
    }),
    history: protectedProcedure.input(z.object({ projectId: z.number().int().positive().optional() }).optional()).query(({ ctx, input }) => listDeployments(ctx.user.id, input?.projectId)),
    github: protectedProcedure.input(z.object({ projectId: z.number().int().positive(), repositoryName: z.string().trim().min(1).max(90), privateRepo: z.boolean() })).mutation(async ({ ctx, input }) => {
      const project = await getProject(ctx.user.id, input.projectId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      const encryptedToken = await getApiKeySecret(ctx.user.id, "GitHub");
      if (!encryptedToken) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Connect a GitHub token in Settings first" });
      try {
        const repository = await syncProjectToGitHub({ encryptedToken, requestedName: input.repositoryName, description: project.prompt.slice(0, 160), code: project.code, privateRepo: input.privateRepo });
        await createDeployment({ userId: ctx.user.id, projectId: project.id, provider: "github", status: "ready", repository: `${repository.owner}/${repository.name}`, repositoryUrl: repository.htmlUrl, deploymentUrl: null, providerId: null, errorMessage: null });
        return repository;
      } catch (error) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? `GitHub sync failed: ${error.message}` : "GitHub sync failed" });
      }
    }),
    vercel: protectedProcedure.input(z.object({ projectId: z.number().int().positive(), projectName: z.string().trim().min(1).max(90) })).mutation(async ({ ctx, input }) => {
      const project = await getProject(ctx.user.id, input.projectId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      const encryptedToken = await getApiKeySecret(ctx.user.id, "Vercel");
      if (!encryptedToken) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Connect a Vercel token in Settings first" });
      try {
        const availability = await checkVercelProjectName(encryptedToken, input.projectName);
        if (!availability.available) throw new TRPCError({ code: "CONFLICT", message: `The Vercel name "${availability.name}" is already taken. Choose another name.` });
        const deployment = await deployProjectToVercel({ encryptedToken, projectName: input.projectName, code: project.code, production: true });
        await createDeployment({ userId: ctx.user.id, projectId: project.id, provider: "vercel", status: "ready", repository: null, repositoryUrl: null, deploymentUrl: deployment.url, providerId: deployment.id, errorMessage: null });
        return deployment;
      } catch (error) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? `Vercel deploy failed: ${error.message}` : "Vercel deploy failed" });
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
