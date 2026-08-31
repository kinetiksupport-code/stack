import { describe, expect, it } from "vitest";
import { encryptSecret, secretHint } from "./secretBox";

describe("project API secret storage", () => {
  it("encrypts the value and only exposes a short hint", () => {
    const value = "AIzaSyExampleProjectKey1234";
    const encrypted = encryptSecret(value);
    expect(encrypted).not.toContain(value);
    expect(encrypted.split(".")).toHaveLength(3);
    expect(secretHint(value)).toBe("•••• 1234");
  });
});
