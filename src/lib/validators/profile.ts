import { z } from "zod";
import { ROLES } from "@/lib/constants";

export const profileNameSchema = z.object({
  fullName: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name is too long")
    .trim(),
});

export const profileRolesSchema = z.object({
  roles: z
    .array(z.enum(ROLES))
    .min(1, "At least one role is required"),
});

export type ProfileNameInput = z.infer<typeof profileNameSchema>;
export type ProfileRolesInput = z.infer<typeof profileRolesSchema>;
