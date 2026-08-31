import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createApiKey,
  createProject,
  deleteApiKey,
  getProject,
  listApiKeys,
  listProjects,
  updateProject,
} from "./db";
import { encryptSecret, secretHint } from "./secretBox";
import { generateCode, type BuildKind } from "./stack";

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
});

export type AppRouter = typeof appRouter;
