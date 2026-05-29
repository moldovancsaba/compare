/** Accepted ImgBB host patterns for stored HTTPS raster URLs. */
const IMG_BB_HOST_SUFFIXES = [".ibb.co"];

export function isImgBbHttpsImageUrl(url: string): boolean {
  const u = url.trim();
  if (!/^https:\/\//i.test(u)) return false;
  try {
    const host = new URL(u).hostname.toLowerCase();
    if (host === "i.ibb.co" || host === "ibb.co" || host === "image.ibb.co") return true;
    return IMG_BB_HOST_SUFFIXES.some((s) => host.endsWith(s));
  } catch {
    return false;
  }
}

/** Non-empty strings must be ImgBB HTTPS URLs. */
export function imgbbImageFieldError(label: string, url: string | undefined | null): string | null {
  const v = url?.trim();
  if (!v) return null;
  if (!isImgBbHttpsImageUrl(v)) {
    return `${label} must be an https URL on imgbb.com (e.g. https://i.ibb.co/...), not: ${v.slice(0, 96)}`;
  }
  return null;
}

export function validateProviderImages(doc: Partial<{ image?: string; galleryImages?: string[] }>): string | null {
  const e1 = imgbbImageFieldError("provider.image", doc.image);
  if (e1) return e1;
  if (Array.isArray(doc.galleryImages)) {
    for (let i = 0; i < doc.galleryImages.length; i++) {
      const g = doc.galleryImages[i];
      if (typeof g !== "string") return `provider.galleryImages[${i}] must be a string`;
      const e = imgbbImageFieldError(`provider.galleryImages[${i}]`, g);
      if (e) return e;
    }
  }
  return null;
}

export function validateMeetupCover(doc: Partial<{ coverImageUrl?: string }>): string | null {
  return imgbbImageFieldError("meetupGroup.coverImageUrl", doc.coverImageUrl);
}

export function validateSiteRasterUrls(site: Partial<Record<string, unknown>>): string | null {
  const logo = site.logoUrl;
  if (typeof logo === "string" && logo.trim()) {
    const e = imgbbImageFieldError("site.logoUrl", logo);
    if (e) return e;
  }
  const hh = site.homeHeroUrl;
  if (typeof hh === "string" && hh.trim()) {
    const e = imgbbImageFieldError("site.homeHeroUrl", hh);
    if (e) return e;
  }
  const dh = site.discoverHeroUrl;
  if (typeof dh === "string" && dh.trim()) {
    const e = imgbbImageFieldError("site.discoverHeroUrl", dh);
    if (e) return e;
  }
  const guides = site.guides;
  if (Array.isArray(guides)) {
    for (let i = 0; i < guides.length; i++) {
      const g = guides[i] as Record<string, unknown> | undefined;
      if (!g || typeof g !== "object") continue;
      const u = g.imageUrl;
      if (typeof u === "string" && u.trim()) {
        const e = imgbbImageFieldError(`site.guides[${i}].imageUrl`, u);
        if (e) return e;
      }
    }
  }
  const locationHeroImages = site.locationHeroImages;
  if (Array.isArray(locationHeroImages)) {
    for (let i = 0; i < locationHeroImages.length; i++) {
      const image = locationHeroImages[i] as Record<string, unknown> | undefined;
      if (!image || typeof image !== "object") continue;
      const u = image.imageUrl;
      if (typeof u === "string" && u.trim()) {
        const e = imgbbImageFieldError(`site.locationHeroImages[${i}].imageUrl`, u);
        if (e) return e;
      }
    }
  }
  return null;
}
