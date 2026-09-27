import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { analyzeExperience } from "./trauma-analyzer";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  trauma: router({
    analyze: publicProcedure
      .input(
        z.object({
          experience: z.string().trim().min(20, "Please share a little more so the reflection has enough context.").max(4500),
          context: z.string().trim().max(600).optional(),
        }),
      )
      .mutation(({ input }) => analyzeExperience(input.experience, input.context)),
  }),
});

export type AppRouter = typeof appRouter;
