import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import jobRecommendRoute from "./routes/jobs/recommend/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  jobs: createTRPCRouter({
    recommend: jobRecommendRoute,
  }),
});

export type AppRouter = typeof appRouter;
