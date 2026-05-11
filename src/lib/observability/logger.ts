import { createHash } from "node:crypto";

type LogLevel = "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

const sensitiveKeyPattern = /token|secret|password|credential|authorization|cookie|uri|url|input|note/i;
const maxStringLength = 160;

export function logInfo(event: string, context: LogContext = {}) {
  writeLog("info", event, context);
}

export function logWarn(event: string, context: LogContext = {}) {
  writeLog("warn", event, context);
}

export function logError(event: string, context: LogContext = {}) {
  writeLog("error", event, context);
}

export function sanitizeLogContext(context: LogContext): LogContext {
  return sanitizeValue(context) as LogContext;
}

export function hashLogValue(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function writeLog(level: LogLevel, event: string, context: LogContext) {
  const entry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...sanitizeLogContext(context)
  };

  const output = JSON.stringify(entry);

  if (level === "error") {
    console.error(output);
    return;
  }

  if (level === "warn") {
    console.warn(output);
    return;
  }

  console.info(output);
}

function sanitizeValue(value: unknown, key = ""): unknown {
  if (sensitiveKeyPattern.test(key)) {
    return "[redacted]";
  }

  if (value instanceof Error) {
    return {
      name: value.name
    };
  }

  if (typeof value === "string") {
    return truncate(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([childKey, childValue]) => [
      childKey,
      sanitizeValue(childValue, childKey)
    ])
  );
}

function truncate(value: string): string {
  if (value.length <= maxStringLength) {
    return value;
  }

  return `${value.slice(0, maxStringLength)}...`;
}
