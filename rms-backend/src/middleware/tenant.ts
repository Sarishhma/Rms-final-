import type { MiddlewareHandler } from "hono";
import type { AppBindings } from "../types.js";
import { tenantContext } from "../utils/context.js";

export const injectTenantContext: MiddlewareHandler<AppBindings> = async (c, next) => {
  const user = c.get("authUser");

  // Run the rest of the request within the ALS context
  await tenantContext.run(
    {
      companyId: user?.companyId ?? undefined,
      userId: user?.id
    },
    async () => {
      await next();
    }
  );
};
