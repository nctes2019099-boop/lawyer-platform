import { describe, it, expect } from "vitest";
import { getInitials, formatDate, cn } from "../utils";

describe("getInitials", () => {
  it("returns first letter of single name", () => {
    expect(getInitials("أحمد")).toBe("أ");
  });
  it("returns initials of full name", () => {
    expect(getInitials("أحمد محمد")).toBe("أم");
  });
  it("handles empty string", () => {
    expect(getInitials("")).toBe("");
  });
});

describe("formatDate", () => {
  it("formats date correctly", () => {
    const result = formatDate("2024-01-15");
    expect(result).toContain("٢٠٢٤");
  });
});

describe("cn", () => {
  it("merges classes correctly", () => {
    expect(cn("a", "b")).toBe("a b");
  });
  it("handles conditional classes", () => {
    const showB = false;
    expect(cn("a", showB && "b", "c")).toBe("a c");
  });
});
