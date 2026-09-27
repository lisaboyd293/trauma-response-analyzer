import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const publicDir = resolve(process.cwd(), "client/public");

describe("PWA shell assets", () => {
  it("declares a standalone app with install-sized icons", () => {
    const manifest = JSON.parse(readFileSync(resolve(publicDir, "manifest.webmanifest"), "utf8"));
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    expect(manifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ sizes: "192x192", type: "image/png", src: "/icon-192.png" }),
      expect.objectContaining({ sizes: "512x512", type: "image/png", src: "/icon-512.png" }),
    ]));
  });

  it("does not intercept analyzer API requests", () => {
    const worker = readFileSync(resolve(publicDir, "sw.js"), "utf8");
    expect(worker).toContain('url.pathname.startsWith("/api/")');
    expect(worker).toContain('self.skipWaiting()');
  });
});
