import { describe, expect, it } from "vitest";

import { humanizeLegalType } from "@/lib/legal";

describe("humanizeLegalType", () => {
  it("maps known canonical types to canonical labels", () => {
    expect(humanizeLegalType("terms-of-service")).toBe("Terms of Service");
    expect(humanizeLegalType("privacy-policy")).toBe("Privacy Policy");
    expect(humanizeLegalType("cookie-policy")).toBe("Cookie Policy");
    expect(humanizeLegalType("dpa")).toBe("Data Processing Agreement");
  });

  it("is case-insensitive for known types", () => {
    expect(humanizeLegalType("Terms-Of-Service")).toBe("Terms of Service");
    expect(humanizeLegalType("PRIVACY-POLICY")).toBe("Privacy Policy");
  });

  it("title-cases unknown slugs", () => {
    expect(humanizeLegalType("acceptable-use-policy")).toBe(
      "Acceptable Use Policy",
    );
    expect(humanizeLegalType("eu_data_addendum")).toBe("Eu Data Addendum");
    expect(humanizeLegalType("custom policy")).toBe("Custom Policy");
  });

  it("collapses repeated separators and trims empties", () => {
    expect(humanizeLegalType("foo--bar__baz")).toBe("Foo Bar Baz");
  });

  it("returns empty string for empty input", () => {
    expect(humanizeLegalType("")).toBe("");
  });
});
