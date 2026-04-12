import { createRouter, publicProcedure } from "../init";
import { runtime } from "../../runtime-context";

export const runtimeRouter = createRouter({
  capabilities: publicProcedure.query(() => runtime),
});
