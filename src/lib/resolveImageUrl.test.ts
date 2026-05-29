import { describe, expect, it } from "vitest";
import { resolveImageUrl } from "./resolveImageUrl";

describe("resolveImageUrl", () => {
  it("returns undefined for empty", () => {
    expect(resolveImageUrl("")).toBeUndefined();
    expect(resolveImageUrl("   ")).toBeUndefined();
    expect(resolveImageUrl(undefined)).toBeUndefined();
  });

  it("normalizes protocol-relative and http", () => {
    expect(resolveImageUrl("//cdn.example.com/x.jpg")).toBe("https://cdn.example.com/x.jpg");
    expect(resolveImageUrl("http://x.com/a.png")).toBe("https://x.com/a.png");
    expect(resolveImageUrl("https://x.com/a.png")).toBe("https://x.com/a.png");
  });

  it("resolves root-relative with base", () => {
    expect(resolveImageUrl("/img/hero.jpg", "example.com")).toBe("https://example.com/img/hero.jpg");
    expect(resolveImageUrl("/a.webp", "https://venue.org")).toBe("https://venue.org/a.webp");
  });

  it("treats /images/cms as same-origin app assets even with a resolve base", () => {
    expect(resolveImageUrl("/images/cms/x.jpg", "https://venue.com")).toBe("https://venue.com/images/cms/x.jpg");
  });

  it("passes through other root-relative paths when no base is set", () => {
    expect(resolveImageUrl("/assets/hero.jpg", null)).toBe("/assets/hero.jpg");
  });

  it("resolves path-like relatives with base", () => {
    expect(resolveImageUrl("wp-content/uploads/a.jpg", "https://blog.com")).toBe("https://blog.com/wp-content/uploads/a.jpg");
    expect(resolveImageUrl("thumb.png", "mysite.com")).toBe("https://mysite.com/thumb.png");
    expect(resolveImageUrl("./rel.jpg", "https://x.com/y/z")).toBe("https://x.com/y/rel.jpg");
  });

  it("adds https for www host", () => {
    expect(resolveImageUrl("www.foo.com/i.jpg")).toBe("https://www.foo.com/i.jpg");
  });

  it("passes through data and blob", () => {
    expect(resolveImageUrl("data:image/png;base64,abcd", null)).toBe("data:image/png;base64,abcd");
    expect(resolveImageUrl("blob:http://localhost/uuid", null)).toBe("blob:http://localhost/uuid");
  });
});
