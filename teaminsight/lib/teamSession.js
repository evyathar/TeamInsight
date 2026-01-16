import crypto from "crypto";

function base64urlEncode(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecode(input) {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64").toString("utf8");
}

function hmacSHA256Base64(data, secret) {
  return crypto.createHmac("sha256", secret).update(data).digest("base64");
}

function base64ToBase64url(b64) {
  return b64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export function signTeamSession(payload, { maxAgeSeconds = 60 * 60 * 24 * 7 } = {}) {
  const secret = process.env.TEAM_SESSION_SECRET;
  if (!secret) throw new Error("Missing TEAM_SESSION_SECRET");

  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + maxAgeSeconds };

  const encodedPayload = base64urlEncode(JSON.stringify(body));
  const signature = base64ToBase64url(hmacSHA256Base64(encodedPayload, secret));

  return `${encodedPayload}.${signature}`;
}

export function verifyTeamSession(token) {
  const secret = process.env.TEAM_SESSION_SECRET;
  if (!secret) throw new Error("Missing TEAM_SESSION_SECRET");
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;
  const expected = base64ToBase64url(hmacSHA256Base64(encodedPayload, secret));
  if (signature !== expected) return null;

  let payload;
  try {
    payload = JSON.parse(base64urlDecode(encodedPayload));
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || now > payload.exp) return null;

  return payload;
}
