import type { UserRole } from "@prisma/client";

export type CurrentUserDto = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  companyId: string | null;
  phoneNumber?: string |null;
  company: {
    name: string;
    slug: string;
    businessName: string | null;
    businessAddress: string | null;
    taxRegistrationNumber: string | null;
    currency: string;
  } | null;
};
