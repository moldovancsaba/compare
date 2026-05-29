import { describe, expect, it } from "vitest";
import { isImgBbHttpsImageUrl } from "./imgbbUrl";

describe("isImgBbHttpsImageUrl", () => {
  it("accepts common ImgBB hosts", () => {
    expect(isImgBbHttpsImageUrl("https://i.ibb.co/abc123/x.jpg")).toBe(true);
    expect(isImgBbHttpsImageUrl("https://image.ibb.co/xx/yy.png")).toBe(true);
  });
  it("rejects non-https and other hosts", () => {
    expect(isImgBbHttpsImageUrl("")).toBe(false);
    expect(isImgBbHttpsImageUrl("http://i.ibb.co/x.jpg")).toBe(false);
    expect(isImgBbHttpsImageUrl("https://example.com/x.jpg")).toBe(false);
    expect(isImgBbHttpsImageUrl("//i.ibb.co/x.jpg")).toBe(false);
  });
});
