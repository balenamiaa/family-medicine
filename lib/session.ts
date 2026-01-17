import crypto from "crypto";

export const SESSION_COOKIE_NAME = "medcram_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface SessionPayload {
  userId: string;
  email?: string | null;
  issuedAt: number;
  expiresAt: number;
}

function getSessionSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SESSION_SECRET is not set. Set it to enable secure sessions."
    );
  }
  return secret;
}

function base64UrlEncode(input: Buffer): string {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (padded.length % 4)) % 4);
  return Buffer.from(padded + padding, "base64");
}

function sign(data: string): string {
  const secret = getSessionSecret();
  const digest = crypto.createHmac("sha256", secret).update(data).digest();
  return base64UrlEncode(digest);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function createSessionToken(payload: Omit<SessionPayload, "issuedAt" | "expiresAt">): string {
  const now = Date.now();
  const sessionPayload: SessionPayload = {
    ...payload,
    issuedAt: now,
    expiresAt: now + SESSION_MAX_AGE_SECONDS * 1000,
  };
  const json = JSON.stringify(sessionPayload);
  const encoded = base64UrlEncode(Buffer.from(json));
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function getSessionPayload(token?: string | null): SessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encoded, signature] = parts;
  const expectedSignature = sign(encoded);
  if (!timingSafeEqual(signature, expectedSignature)) return null;

  try {
    const json = base64UrlDecode(encoded).toString("utf8");
    const payload = JSON.parse(json) as SessionPayload;
    if (!payload.userId || !payload.expiresAt) return null;
    if (Date.now() > payload.expiresAt) return null;
    return payload;
  } catch {
    return null;
  }
}
