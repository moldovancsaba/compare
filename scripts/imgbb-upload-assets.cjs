#!/usr/bin/env node
/**
 * Upload bundled raster assets to ImgBB and print NEXT_PUBLIC_* lines for .env.local
 * and Vercel. Requires IMGBB_API_KEY (same as admin upload).
 *
 *   npm run imgbb:upload-assets
 *
 * Source files: scripts/imgbb-asset-sources/*.jpg (see mapping below).
 */
require("./load-env.cjs");
const fs = require("fs");
const path = require("path");

const key = (process.env.IMGBB_API_KEY || "").trim();
if (!key) {
  console.error("Missing IMGBB_API_KEY in .env / .env.local");
  process.exit(1);
}

const ROOT = path.join(__dirname, "imgbb-asset-sources");
const MAP = [
  ["home-hero.jpg", "NEXT_PUBLIC_IMG_BB_HOME_HERO"],
  ["discover-hero.jpg", "NEXT_PUBLIC_IMG_BB_DISCOVER_HERO"],
  ["default-listing.jpg", "NEXT_PUBLIC_IMG_BB_FALLBACK_LISTING"],
  ["meetup-cover.jpg", "NEXT_PUBLIC_IMG_BB_FALLBACK_MEETUP"],
  ["guide-play.jpg", "NEXT_PUBLIC_IMG_BB_GUIDE_CARD"],
];

async function uploadFile(filePath) {
  const buf = fs.readFileSync(filePath);
  const image = buf.toString("base64");
  const body = new URLSearchParams();
  body.set("key", key);
  body.set("image", image);
  const res = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || json.error || `HTTP ${res.status}`);
  }
  const url = json.data?.url || json.data?.display_url;
  if (!url || typeof url !== "string") throw new Error("ImgBB response missing url");
  return url;
}

async function main() {
  console.log("# Add these to .env.local (and optionally Vercel) then redeploy:\n");
  for (const [file, envName] of MAP) {
    const fp = path.join(ROOT, file);
    if (!fs.existsSync(fp)) {
      console.error("Missing file:", fp);
      process.exit(1);
    }
    const url = await uploadFile(fp);
    console.log(`${envName}=${url}`);
  }
  console.log("\n# Then: npm run vercel:env:push (plain vars) or paste in Vercel dashboard.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
