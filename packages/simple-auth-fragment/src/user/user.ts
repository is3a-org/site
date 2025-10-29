import { defineRoute, defineRoutes } from "@fragno-dev/core";
import type { AbstractQuery } from "@fragno-dev/db/query";
import { authSchema } from "../schema";
import { z } from "zod";
import { hashPassword, verifyPassword } from "./password";

export interface UserConfig {
  sendEmail?: (params: { to: string; subject: string; body: string }) => Promise<void>;
}

type UserDeps = {
  orm: AbstractQuery<typeof authSchema>;
};

export function createUserServices(orm: AbstractQuery<typeof authSchema>) {
  return {
    createUser: async (email: string, password: string) => {
      const passwordHash = await hashPassword(password);
      const id = await orm.create("user", {
        email,
        passwordHash,
      });
      return {
        id: id.valueOf(),
        email,
      };
    },
    getUserByEmail: async (email: string) => {
      const users = await orm.findFirst("user", (b) =>
        b.whereIndex("idx_user_email", (eb) => eb("email", "=", email)),
      );
      return users
        ? {
            id: users.id.valueOf(),
            email: users.email,
            passwordHash: users.passwordHash,
          }
        : null;
    },
  };
}

export const userRoutesFactory = defineRoutes<
  UserConfig,
  UserDeps,
  ReturnType<typeof createUserServices> & {
    createSession: (userId: string) => Promise<{ id: string; userId: string; expiresAt: Date }>;
  }
>().create(({ services }) => {
  return [
    defineRoute({
      method: "POST",
      path: "/sign-up",
      inputSchema: z.object({
        email: z.email(),
        password: z.string().min(8).max(100),
      }),
      outputSchema: z.object({
        sessionId: z.string(),
        userId: z.string(),
        email: z.string(),
      }),
      errorCodes: ["email_already_exists", "invalid_input"],
      handler: async ({ input }, { json, error }) => {
        const { email, password } = await input.valid();

        // Check if user already exists
        const existingUser = await services.getUserByEmail(email);
        if (existingUser) {
          return error({ message: "Email already exists", code: "email_already_exists" }, 400);
        }

        // Create user
        const user = await services.createUser(email, password);
        // Create session
        const session = await services.createSession(user.id);

        return json({
          sessionId: session.id,
          userId: user.id,
          email: user.email,
        });
      },
    }),

    defineRoute({
      method: "POST",
      path: "/sign-in",
      inputSchema: z.object({
        email: z.email(),
        password: z.string().min(8).max(100),
      }),
      outputSchema: z.object({
        sessionId: z.string(),
        userId: z.string(),
        email: z.string(),
      }),
      errorCodes: ["invalid_credentials"],
      handler: async ({ input }, { json, error }) => {
        const { email, password } = await input.valid();

        // Get user by email
        const user = await services.getUserByEmail(email);
        if (!user) {
          return error({ message: "Invalid credentials", code: "invalid_credentials" }, 401);
        }

        // Verify password
        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
          return error({ message: "Invalid credentials", code: "invalid_credentials" }, 401);
        }

        // Create session
        const session = await services.createSession(user.id);

        return json({
          sessionId: session.id,
          userId: user.id,
          email: user.email,
        });
      },
    }),
  ];
});
