import type { AppLocale } from "@/lib/i18n/config";
import { normalizeLocale } from "@/lib/i18n/config";

export function normalizeLocalePath(pathname: string): string {
  if (!pathname.startsWith("/")) return `/${pathname}`;
  if (pathname === "/") return pathname;
  return pathname;
}

export function stripLocaleFromPathname(pathname: string): string {
  const normalized = normalizeLocalePath(pathname);
  const parts = normalized.split("/").filter(Boolean);
  if (!parts.length) return "/";
  const maybeLocale = parts[0];
  if (normalizeLocale(maybeLocale)) {
    const rest = parts.slice(1).join("/");
    return `/${rest}` || "/";
  }
  return normalized;
}

export function parseLocaleFromPathname(pathname: string): AppLocale {
  const parts = normalizeLocalePath(pathname).split("/").filter(Boolean);
  const maybeLocale = parts[0] ?? "";
  return normalizeLocale(maybeLocale);
}

export function localizePath(path: string, locale: AppLocale): string {
  const normalized = normalizeLocalePath(path);
  if (normalized === "/") {
    return `/${locale}`;
  }
  return `/${locale}${normalized}`;
}

export function withLocaleSearch(path: string, locale: AppLocale, query: URLSearchParams = new URLSearchParams()) {
  const base = localizePath(path, locale);
  const queryString = query.toString();
  return queryString ? `${base}?${queryString}` : base;
}
