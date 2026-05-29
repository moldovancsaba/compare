import type { StaticImageData } from "next/image";

/** Normalize Next.js static imports for `<img src>` and string-typed model fields. */
export function assetUrl(src: string | StaticImageData): string {
  return typeof src === "string" ? src : src.src;
}
