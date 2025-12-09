import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import jobRecommendRoute from "./routes/jobs/recommend/route";
import { parseResumeProcedure } from "./routes/resume/parse/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  jobs: createTRPCRouter({
    recommend: jobRecommendRoute,
  }),
  resume: createTRPCRouter({
    parse: parseResumeProcedure,
  }),
});

export type AppRouter = typeof appRouter;
