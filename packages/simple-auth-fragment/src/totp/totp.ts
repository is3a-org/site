import { defineRoute, defineRoutes } from "@fragno-dev/core";
import type { AbstractQuery } from "@fragno-dev/db/query";
import { authSchema } from "../schema";
import { z } from "zod";

export interface TotpConfig {
  issuer?: string;
}

type TotpDeps = {
  orm: AbstractQuery<typeof authSchema>;
  config: TotpConfig;
};

// Base32 encoding/decoding utilities
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(encoded: string): Uint8Array {
  const cleanedInput = encoded.toUpperCase().replace(/=+$/, "");
  let bits = 0;
  let value = 0;
  let index = 0;
  const output = new Uint8Array(Math.floor((cleanedInput.length * 5) / 8));

  for (let i = 0; i < cleanedInput.length; i++) {
    const charIndex = BASE32_CHARS.indexOf(cleanedInput[i]);
    if (charIndex === -1) {
      throw new Error("Invalid base32 character");
    }

    value = (value << 5) | charIndex;
    bits += 5;

    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }

  return output;
}

export async function generateTOTP(
  secret: string,
  timeStep: number = 30,
  digits: number = 6,
): Promise<string> {
  const counter = Math.floor(Date.now() / 1000 / timeStep);
  return await generateHOTP(secret, counter, digits);
}

async function generateHOTP(secret: string, counter: number, digits: number = 6): Promise<string> {
  const secretBytes = base32Decode(secret);

  // Convert counter to 8-byte buffer (big-endian)
  const counterBuffer = new Uint8Array(8);
  const counterView = new DataView(counterBuffer.buffer);
  counterView.setBigUint64(0, BigInt(counter), false);

  // Import key for HMAC-SHA1
  // Ensure we have a clean ArrayBuffer by slicing
  const secretBuffer = secretBytes.slice();
  const key = await crypto.subtle.importKey(
    "raw",
    secretBuffer.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );

  // Generate HMAC-SHA1
  const signature = await crypto.subtle.sign("HMAC", key, counterBuffer.buffer);
  const hmac = new Uint8Array(signature);

  // Dynamic truncation
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binaryCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binaryCode % Math.pow(10, digits);
  return otp.toString().padStart(digits, "0");
}

async function verifyTOTP(secret: string, token: string, window: number = 1): Promise<boolean> {
  const timeStep = 30;
  const currentCounter = Math.floor(Date.now() / 1000 / timeStep);

  // Check current time window and ±window for clock drift tolerance
  for (let i = -window; i <= window; i++) {
    const counter = currentCounter + i;
    const expectedToken = await generateHOTP(secret, counter, 6);
    if (expectedToken === token) {
      return true;
    }
  }

  return false;
}

// Backup code utilities (using same approach as password.ts)
async function hashBackupCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iterations = 100000;

  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(code), "PBKDF2", false, [
    "deriveBits",
  ]);

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const saltArray = Array.from(salt);

  return `${saltArray.map((b) => b.toString(16).padStart(2, "0")).join("")}:${iterations}:${hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

async function verifyBackupCode(code: string, storedHash: string): Promise<boolean> {
  const [saltHex, iterationsStr, hashHex] = storedHash.split(":");
  const iterations = parseInt(iterationsStr, 10);

  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
  const storedHashBytes = new Uint8Array(
    hashHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
  );

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(code), "PBKDF2", false, [
    "deriveBits",
  ]);

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );

  const hashArray = new Uint8Array(hashBuffer);

  if (hashArray.length !== storedHashBytes.length) {
    return false;
  }

  let isEqual = true;
  for (let i = 0; i < hashArray.length; i++) {
    if (hashArray[i] !== storedHashBytes[i]) {
      isEqual = false;
    }
  }
  return isEqual;
}

function generateBackupCode(): string {
  // Generate 8-character alphanumeric code
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  const randomBytes = crypto.getRandomValues(new Uint8Array(8));
  for (let i = 0; i < 8; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  return code;
}

export function createTotpServices(orm: AbstractQuery<typeof authSchema>, config: TotpConfig) {
  return {
    enableTotp: async (userId: string) => {
      // Check if TOTP is already enabled
      const existing = await orm.findFirst("totp_secret", (b) =>
        b.whereIndex("idx_totp_user", (eb) => eb("userId", "=", userId)),
      );

      if (existing) {
        throw new Error("TOTP already enabled for this user");
      }

      // Generate secret (20 random bytes)
      const secretBytes = crypto.getRandomValues(new Uint8Array(20));
      const secret = base32Encode(secretBytes);

      // Generate 10 backup codes
      const backupCodes: string[] = [];
      for (let i = 0; i < 10; i++) {
        backupCodes.push(generateBackupCode());
      }

      // Hash backup codes before storing
      const hashedBackupCodes = await Promise.all(backupCodes.map((code) => hashBackupCode(code)));

      // Store in database
      await orm.create("totp_secret", {
        userId,
        secret,
        backupCodes: JSON.stringify(hashedBackupCodes),
      });

      // Generate QR code URL
      const issuer = config.issuer || "SimpleAuth";
      const qrCodeUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(userId)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;

      return {
        secret,
        qrCodeUrl,
        backupCodes, // Return unhashed codes for user to save
      };
    },

    verifyTotp: async (userId: string, code: string) => {
      const totpRecord = await orm.findFirst("totp_secret", (b) =>
        b.whereIndex("idx_totp_user", (eb) => eb("userId", "=", userId)),
      );

      if (!totpRecord) {
        return { valid: false };
      }

      const valid = await verifyTOTP(totpRecord.secret, code, 1);
      return { valid };
    },

    verifyBackupCode: async (userId: string, code: string) => {
      const totpRecord = await orm.findFirst("totp_secret", (b) =>
        b.whereIndex("idx_totp_user", (eb) => eb("userId", "=", userId)),
      );

      if (!totpRecord) {
        return { valid: false };
      }

      const backupCodes: string[] = JSON.parse(totpRecord.backupCodes);

      // Check each backup code
      for (let i = 0; i < backupCodes.length; i++) {
        const isValid = await verifyBackupCode(code.toUpperCase(), backupCodes[i]);
        if (isValid) {
          // Remove the used backup code - delete and recreate
          backupCodes.splice(i, 1);
          await orm.delete("totp_secret", totpRecord.id);
          await orm.create("totp_secret", {
            userId: totpRecord.userId,
            secret: totpRecord.secret,
            backupCodes: JSON.stringify(backupCodes),
          });
          return { valid: true };
        }
      }

      return { valid: false };
    },

    disableTotp: async (userId: string) => {
      const totpRecord = await orm.findFirst("totp_secret", (b) =>
        b.whereIndex("idx_totp_user", (eb) => eb("userId", "=", userId)),
      );

      if (!totpRecord) {
        return false;
      }

      await orm.delete("totp_secret", totpRecord.id);
      return true;
    },

    getTotpStatus: async (userId: string) => {
      const totpRecord = await orm.findFirst("totp_secret", (b) =>
        b.whereIndex("idx_totp_user", (eb) => eb("userId", "=", userId)),
      );

      return {
        enabled: !!totpRecord,
      };
    },
  };
}

export const totpRoutesFactory = defineRoutes<
  TotpConfig,
  TotpDeps,
  ReturnType<typeof createTotpServices>
>().create(({ services }) => {
  return [
    defineRoute({
      method: "POST",
      path: "/totp/enable",
      inputSchema: z.object({
        userId: z.string(),
      }),
      outputSchema: z.object({
        secret: z.string(),
        qrCodeUrl: z.string(),
        backupCodes: z.array(z.string()),
      }),
      errorCodes: ["totp_already_enabled"],
      handler: async ({ input }, { json, error }) => {
        const { userId } = await input.valid();

        try {
          const result = await services.enableTotp(userId);
          return json(result);
        } catch (err) {
          if (err instanceof Error && err.message.includes("already enabled")) {
            return error({ message: "TOTP already enabled", code: "totp_already_enabled" }, 400);
          }
          throw err;
        }
      },
    }),

    defineRoute({
      method: "POST",
      path: "/totp/verify",
      inputSchema: z.object({
        userId: z.string(),
        code: z.string().length(6),
      }),
      outputSchema: z.object({
        valid: z.boolean(),
      }),
      errorCodes: ["totp_not_enabled", "totp_invalid_code"],
      handler: async ({ input }, { json, error }) => {
        const { userId, code } = await input.valid();

        const result = await services.verifyTotp(userId, code);

        if (!result.valid) {
          return error({ message: "Invalid TOTP code", code: "totp_invalid_code" }, 401);
        }

        return json(result);
      },
    }),

    defineRoute({
      method: "POST",
      path: "/totp/verify-backup",
      inputSchema: z.object({
        userId: z.string(),
        code: z.string().length(8),
      }),
      outputSchema: z.object({
        valid: z.boolean(),
      }),
      errorCodes: ["totp_not_enabled", "backup_code_invalid"],
      handler: async ({ input }, { json, error }) => {
        const { userId, code } = await input.valid();

        const result = await services.verifyBackupCode(userId, code);

        if (!result.valid) {
          return error({ message: "Invalid backup code", code: "backup_code_invalid" }, 401);
        }

        return json(result);
      },
    }),

    defineRoute({
      method: "POST",
      path: "/totp/disable",
      inputSchema: z.object({
        userId: z.string(),
      }),
      outputSchema: z.object({
        success: z.boolean(),
      }),
      errorCodes: ["totp_not_enabled"],
      handler: async ({ input }, { json, error }) => {
        const { userId } = await input.valid();

        const success = await services.disableTotp(userId);

        if (!success) {
          return error({ message: "TOTP not enabled", code: "totp_not_enabled" }, 400);
        }

        return json({ success });
      },
    }),

    defineRoute({
      method: "GET",
      path: "/totp/status",
      queryParameters: ["userId"],
      outputSchema: z.object({
        enabled: z.boolean(),
      }),
      errorCodes: [],
      handler: async ({ query }, { json }) => {
        const userId = query.get("userId");

        if (!userId) {
          return json({ enabled: false });
        }

        const result = await services.getTotpStatus(userId);
        return json(result);
      },
    }),
  ];
});
