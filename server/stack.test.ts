import { describe, expect, it } from "vitest";
import { localStarter, stripCodeFences } from "./stack";

describe("Stack generation engine", () => {
  it("strips markdown fences from generated HTML", () => {
    expect(stripCodeFences("```html\n<!doctype html><html></html>\n```"))
      .toBe("<!doctype html><html></html>");
  });

  it("creates a runnable game starter with the World Model contract", () => {
    const code = localStarter("game", "A small exploration game");
    expect(code).toContain("const state=");
    expect(code).toContain("actionSpace");
    expect(code).toContain("function transition");
    expect(code).toContain("function render");
    expect(code).toContain("function gameLoop");
    expect(code).toContain("function checkGoals");
    expect(code).toContain("requestAnimationFrame(gameLoop)");
  });

  it("creates interactive starters for apps and websites", () => {
    for (const kind of ["app", "website"] as const) {
      const code = localStarter(kind, "A collaborative workspace");
      expect(code).toContain("Try the main action");
      expect(code).toContain("onclick");
      expect(code).toContain("A collaborative workspace");
    }
  });
});
