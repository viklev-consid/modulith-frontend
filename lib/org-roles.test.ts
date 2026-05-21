import { describe, expect, it } from "vitest";

import {
  isHigherOrEqualRank,
  isOrgRole,
  ORG_ROLES,
  roleRank,
  rolesBelow,
} from "./org-roles";

describe("org-roles", () => {
  it("recognises known roles", () => {
    expect(isOrgRole("Owner")).toBe(true);
    expect(isOrgRole("Admin")).toBe(true);
    expect(isOrgRole("Member")).toBe(true);
    expect(isOrgRole("Guest")).toBe(false);
    expect(isOrgRole("")).toBe(false);
  });

  it("ranks Owner > Admin > Member", () => {
    expect(roleRank("Owner")).toBeGreaterThan(roleRank("Admin"));
    expect(roleRank("Admin")).toBeGreaterThan(roleRank("Member"));
    expect(roleRank("Member")).toBeGreaterThan(0);
  });

  it("returns 0 for unknown roles so they sort below everything", () => {
    expect(roleRank("Guest")).toBe(0);
    expect(roleRank("")).toBe(0);
  });

  it("rolesBelow returns only strictly-lower roles (no equals)", () => {
    expect(rolesBelow("Owner")).toEqual(["Admin", "Member"]);
    expect(rolesBelow("Admin")).toEqual(["Member"]);
    expect(rolesBelow("Member")).toEqual([]);
  });

  it("rolesBelow returns empty for unknown roles", () => {
    expect(rolesBelow("Guest")).toEqual([]);
  });

  it("isHigherOrEqualRank allows demoting equals but not promoting above", () => {
    expect(isHigherOrEqualRank("Owner", "Admin")).toBe(true);
    expect(isHigherOrEqualRank("Admin", "Admin")).toBe(true);
    expect(isHigherOrEqualRank("Admin", "Owner")).toBe(false);
  });

  it("exports a stable ORG_ROLES tuple", () => {
    expect(ORG_ROLES).toEqual(["Owner", "Admin", "Member"]);
  });
});
