import { describe, expect, it } from "vitest";

import { apiRoutes, routes } from "@/lib/routes";

describe("routes", () => {
  it("composes survey destinations from the survey type", () => {
    expect(routes.survey("personality")).toBe("/surveys/personality");
    expect(routes.survey("values-beliefs")).toBe("/surveys/values-beliefs");
    expect(routes.surveyDashboard("personality")).toBe("/surveys/personality/dashboard");
  });

  it("appends the account anchor only when given", () => {
    expect(routes.account()).toBe("/app/account");
    expect(routes.account("models")).toBe("/app/account#models");
  });

  it("appends the docs slug only when given", () => {
    expect(routes.docs()).toBe("/docs");
    expect(routes.docs("getting-started")).toBe("/docs/getting-started");
  });

  it("keeps static page destinations unique", () => {
    const staticDestinations = Object.values(routes).filter(
      (value): value is string => typeof value === "string",
    );
    expect(new Set(staticDestinations).size).toBe(staticDestinations.length);
  });
});

describe("apiRoutes", () => {
  it("composes parameterised endpoints", () => {
    expect(apiRoutes.surveyBase("personality")).toBe("/api/surveys/personality");
    expect(apiRoutes.chatThread("t_123")).toBe("/api/chat/threads/t_123");
    expect(apiRoutes.accountApiKey("anthropic")).toBe("/api/account/api-keys/anthropic");
  });

  it("keeps static API endpoints unique", () => {
    const staticEndpoints = Object.values(apiRoutes).filter(
      (value): value is string => typeof value === "string",
    );
    expect(new Set(staticEndpoints).size).toBe(staticEndpoints.length);
  });
});
