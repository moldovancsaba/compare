import packageJson from "../../../package.json";

export const appName = "{compare}";
export const appVersion = packageJson.version;
export const appVersionLabel = `v${appVersion}`;

function normalizeOrigin(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed.replace(/\/+$/, "");
  }

  if (trimmed.startsWith("localhost") || trimmed.startsWith("127.0.0.1")) {
    return `http://${trimmed.replace(/\/+$/, "")}`;
  }

  return `https://${trimmed.replace(/\/+$/, "")}`;
}

export const appOrigin =
  normalizeOrigin(process.env.NEXT_PUBLIC_APP_ORIGIN) ??
  normalizeOrigin(process.env.APP_ORIGIN) ??
  normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
  normalizeOrigin(process.env.VERCEL_URL) ??
  "http://localhost:3000";

export const appMetadataBase = new URL(appOrigin);
