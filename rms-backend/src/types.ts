import type { UserRole } from "@prisma/client";

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  name: string | null;
  companyId: string | null;
};

export type AppBindings = {
  Variables: {
    authUser: AuthUser;
  };
};
