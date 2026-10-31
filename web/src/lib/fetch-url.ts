import { lookup } from "dns/promises";
import { isIP } from "net";

function blocked(address: string): boolean {
  const value = address.toLowerCase();
  if (value === "::1" || value === "0:0:0:0:0:0:0:1") return true;
  if (value.startsWith("fe80:") || value.startsWith("fc") || value.startsWith("fd")) return true;
  const parts = value.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) return false;
  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

export function htmlToText(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000);
}

export async function fetchPublicText(url: string): Promise<string> {
  const parsed = new URL(url);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only public http and https URLs can be submitted.");
  }
  const host = parsed.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true })).map((entry) => entry.address);
  if (addresses.length === 0 || addresses.some(blocked)) {
    throw new Error("That URL does not resolve to a public address.");
  }
  const response = await fetch(parsed.toString(), {
    redirect: "manual",
    headers: { "User-Agent": "InfraWatchPrototype/0.1" },
    signal: AbortSignal.timeout(12000),
  });
  if (response.status >= 300 && response.status < 400) {
    throw new Error("Redirects are not followed. Paste the article text instead.");
  }
  if (!response.ok) throw new Error(`The URL returned ${response.status}.`);
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text") && !type.includes("html") && !type.includes("json")) {
    throw new Error("The URL did not return text.");
  }
  const text = htmlToText(await response.text());
  if (!text) throw new Error("No text could be read from that URL.");
  return text;
}
