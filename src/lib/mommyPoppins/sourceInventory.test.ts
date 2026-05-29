import { describe, expect, it } from "vitest";
import {
  classifySurfaceType,
  collectNycRegionPrefixes,
  extractDrupalRegionMap,
  extractSitemapEntries,
  extractSitemapPageUrls,
  inferRegionScope,
} from "@/lib/mommyPoppins/sourceInventory";

describe("mommyPoppins source inventory helpers", () => {
  it("extracts sitemap index page URLs", () => {
    const xml = `<?xml version="1.0"?><sitemapindex><sitemap><loc>https://mommypoppins.com/sitemap.xml?page=1</loc></sitemap><sitemap><loc>https://mommypoppins.com/sitemap.xml?page=2</loc></sitemap></sitemapindex>`;
    expect(extractSitemapPageUrls(xml)).toEqual([
      "https://mommypoppins.com/sitemap.xml?page=1",
      "https://mommypoppins.com/sitemap.xml?page=2",
    ]);
  });

  it("extracts sitemap entries with lastmod", () => {
    const xml = `<urlset><url><loc>https://mommypoppins.com/new-york-city/queens/astoria</loc><lastmod>2026-05-21</lastmod></url></urlset>`;
    expect(extractSitemapEntries(xml)).toEqual([{ url: "https://mommypoppins.com/new-york-city/queens/astoria", lastmod: "2026-05-21" }]);
  });

  it("extracts drupal region map and nyc prefixes", () => {
    const html = `<script type="application/json" data-drupal-selector="drupal-settings-json">{\"mp_core\":{\"regionMap\":{\"/new-york-city/queens/astoria\":162,\"/boston/boston\":354}}}</script>`;
    const regionMap = extractDrupalRegionMap(html);
    expect(regionMap["/new-york-city/queens/astoria"]).toBe(162);
    expect(collectNycRegionPrefixes(regionMap)).toEqual(["/new-york-city/queens/astoria"]);
  });

  it("classifies surface types and nyc scope", () => {
    const prefixes = ["/new-york-city/queens/astoria"];
    expect(classifySurfaceType("https://mommypoppins.com/anywhere-kids/directory/foo")).toBe("directory");
    expect(classifySurfaceType("https://mommypoppins.com/anywhere-kids/directory/classes/yogi-beans")).toBe("directory");
    expect(classifySurfaceType("https://mommypoppins.com/anywhere-kids/event/events/foo")).toBe("event");
    expect(inferRegionScope("https://mommypoppins.com/new-york-city/queens/astoria/things", prefixes)).toBe("nyc");
    expect(inferRegionScope("https://mommypoppins.com/boston/foo", prefixes)).toBe("non_nyc");
  });
});
