import { AsyncLocalStorage } from "async_hooks";

export type TenantContext = {
  companyId?: string;
  userId?: string;
};

export const tenantContext = new AsyncLocalStorage<TenantContext>();

export const getTenantContext = (): TenantContext => {
  return tenantContext.getStore() || {};
};

export const getCompanyId = (): string | undefined => {
  return getTenantContext().companyId;
};
