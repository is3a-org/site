import { defineRoute, defineRoutes } from "@fragno-dev/core";
import type { AbstractQuery } from "@fragno-dev/db/query";
import { authSchema } from "../schema";
import { z } from "zod";

export interface SessionConfig {
  sendEmail?: (params: { to: string; subject: string; body: string }) => Promise<void>;
}

type SessionDeps = {
  orm: AbstractQuery<typeof authSchema>;
};

export function createSessionServices(orm: AbstractQuery<typeof authSchema>) {
  return {
    createSession: async (userId: string) => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

      const id = await orm.create("session", {
        userId,
        expiresAt,
      });

      return {
        id: id.valueOf(),
        userId,
        expiresAt,
      };
    },
    validateSession: async (sessionId: string) => {
      const session = await orm.findFirst("session", (b) =>
        b
          .whereIndex("primary", (eb) => eb("id", "=", sessionId))
          .join((j) => j.sessionOwner((b) => b.select(["id", "email"]))),
      );

      if (!session) {
        return null;
      }

      // Check if session has expired
      if (session.expiresAt < new Date()) {
        await orm.delete("session", session.id);
        return null;
      }

      if (!session.sessionOwner) {
        return null;
      }

      return {
        id: session.id.valueOf(),
        userId: session.userId as unknown as string,
        user: {
          id: session.sessionOwner.id.valueOf(),
          email: session.sessionOwner.email,
        },
      };
    },
    invalidateSession: async (sessionId: string) => {
      const session = await orm.findFirst("session", (b) =>
        b.whereIndex("primary", (eb) => eb("id", "=", sessionId)),
      );

      if (!session) {
        return false;
      }

      await orm.delete("session", session.id);
      return true;
    },
  };
}

export const sessionRoutesFactory = defineRoutes<
  SessionConfig,
  SessionDeps,
  ReturnType<typeof createSessionServices>
>().create(({ services }) => {
  return [
    defineRoute({
      method: "POST",
      path: "/sign-out",
      inputSchema: z.object({
        sessionId: z.string(),
      }),
      outputSchema: z.object({
        success: z.boolean(),
      }),
      errorCodes: ["session_not_found"],
      handler: async ({ input }, { json, error }) => {
        const { sessionId } = await input.valid();

        const success = await services.invalidateSession(sessionId);

        if (!success) {
          return error({ message: "Session not found", code: "session_not_found" }, 404);
        }

        return json({ success: true });
      },
    }),

    defineRoute({
      method: "GET",
      path: "/me",
      queryParameters: ["sessionId"],
      outputSchema: z
        .object({
          userId: z.string(),
          email: z.string(),
        })
        .nullable(),
      errorCodes: ["session_invalid"],
      handler: async ({ query }, { json, error }) => {
        const sessionId = query.get("sessionId");

        if (!sessionId) {
          return error({ message: "Session ID required", code: "session_invalid" }, 400);
        }

        const session = await services.validateSession(sessionId);

        if (!session) {
          return error({ message: "Session ID required", code: "session_invalid" }, 400);
        }

        return json({
          userId: session.user.id,
          email: session.user.email,
        });
      },
    }),
  ];
});
