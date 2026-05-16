import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SurveyChooserShell } from "@/components/survey/survey-chooser-shell";
import { surveyDefinitions } from "@/lib/survey/definitions";
import { type SurveyUserStatus } from "@/lib/survey/types";

const { routerMock, routerPushMock, routerPrefetchMock } = vi.hoisted(() => {
  const push = vi.fn();
  const prefetch = vi.fn();

  return {
    routerMock: {
      push,
      prefetch,
    },
    routerPushMock: push,
    routerPrefetchMock: prefetch,
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  usePathname: () => "/surveys",
}));

function makeStatus(overrides?: Partial<SurveyUserStatus>): SurveyUserStatus {
  return {
    surveyType: "personality",
    submittedCount: 0,
    hasActiveDraft: false,
    activeDraftAnswerCount: 0,
    latestSubmissionAt: null,
    latestSubmissionId: null,
    ...overrides,
  };
}

describe("SurveyChooserShell", () => {
  let personalityStatus: SurveyUserStatus;
  let valuesStatus: SurveyUserStatus;

  beforeEach(() => {
    routerPushMock.mockReset();
    routerPrefetchMock.mockReset();
    personalityStatus = makeStatus();
    valuesStatus = {
      surveyType: "values-beliefs",
      submittedCount: 0,
      hasActiveDraft: false,
      activeDraftAnswerCount: 0,
      latestSubmissionAt: null,
      latestSubmissionId: null,
    };
  });

  it("starts the personality survey when there are no submissions yet", async () => {
    const user = userEvent.setup();

    render(
      React.createElement(SurveyChooserShell, {
        surveys: surveyDefinitions,
        initialStatuses: {
          personality: personalityStatus,
          "values-beliefs": valuesStatus,
        },
      }),
    );

    const personalityCard = screen
      .getByRole("heading", { name: "Measures of Your Personality" })
      .closest("article");

    expect(personalityCard).not.toBeNull();
    await user.click(within(personalityCard!).getByRole("button", { name: "Start survey →" }));

    expect(routerPushMock).toHaveBeenCalledWith("/surveys/personality");
  });

  it("shows ready-to-start state for a zero-answer first draft", () => {
    personalityStatus = makeStatus({
      hasActiveDraft: true,
      activeDraftAnswerCount: 0,
    });

    render(
      React.createElement(SurveyChooserShell, {
        surveys: surveyDefinitions,
        initialStatuses: {
          personality: personalityStatus,
          "values-beliefs": valuesStatus,
        },
      }),
    );

    const personalityCard = screen
      .getByRole("heading", { name: "Measures of Your Personality" })
      .closest("article");

    expect(personalityCard).not.toBeNull();
    expect(within(personalityCard!).getByText("Ready to start")).toBeInTheDocument();
    expect(within(personalityCard!).getByRole("button", { name: "Start survey →" })).toBeInTheDocument();
    expect(within(personalityCard!).queryByRole("button", { name: "Continue survey →" })).not.toBeInTheDocument();
  });

  it("requires confirmation before starting the final repeat attempt", async () => {
    const user = userEvent.setup();
    personalityStatus = makeStatus({
      submittedCount: 1,
      latestSubmissionAt: "2026-04-08T09:30:00.000Z",
      latestSubmissionId: "submission_1",
    });

    render(
      React.createElement(SurveyChooserShell, {
        surveys: surveyDefinitions,
        initialStatuses: {
          personality: personalityStatus,
          "values-beliefs": valuesStatus,
        },
      }),
    );

    await user.click(screen.getByRole("button", { name: "Repeat survey" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText(/This repeat will be your second attempt at Measures of Your Personality/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Yes" }));

    await waitFor(() => {
      expect(routerPushMock).toHaveBeenCalledWith("/surveys/personality");
    });
  });

  it("still offers review and repeat actions when a final draft already has answers", async () => {
    personalityStatus = makeStatus({
      submittedCount: 1,
      hasActiveDraft: true,
      activeDraftAnswerCount: 12,
      latestSubmissionAt: "2026-04-08T09:30:00.000Z",
      latestSubmissionId: "submission_1",
    });

    render(
      React.createElement(SurveyChooserShell, {
        surveys: surveyDefinitions,
        initialStatuses: {
          personality: personalityStatus,
          "values-beliefs": valuesStatus,
        },
      }),
    );

    const personalityCard = screen
      .getByRole("heading", { name: "Measures of Your Personality" })
      .closest("article");

    expect(personalityCard).not.toBeNull();
    const buttons = within(personalityCard!).getAllByRole("button");

    expect(within(personalityCard!).getByText("Last available attempt")).toBeInTheDocument();
    expect(buttons.map((button) => button.textContent)).toEqual(["Review results →", "Repeat survey"]);
    expect(screen.getByRole("button", { name: "Repeat survey" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continue retry →" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Review results →" })).toBeInTheDocument();
  });

  it("shows repeat survey when the final draft exists but has not been started", async () => {
    personalityStatus = makeStatus({
      submittedCount: 1,
      hasActiveDraft: true,
      activeDraftAnswerCount: 0,
      latestSubmissionAt: "2026-04-08T09:30:00.000Z",
      latestSubmissionId: "submission_1",
    });

    render(
      React.createElement(SurveyChooserShell, {
        surveys: surveyDefinitions,
        initialStatuses: {
          personality: personalityStatus,
          "values-beliefs": valuesStatus,
        },
      }),
    );

    const personalityCard = screen
      .getByRole("heading", { name: "Measures of Your Personality" })
      .closest("article");

    expect(personalityCard).not.toBeNull();
    const buttons = within(personalityCard!).getAllByRole("button");

    expect(buttons.map((button) => button.textContent)).toEqual(["Review results →", "Repeat survey"]);
    expect(screen.getByRole("button", { name: "Repeat survey" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continue retry →" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Review results →" })).toBeInTheDocument();
  });

  it("removes repeat access after the second submission", async () => {
    const user = userEvent.setup();
    personalityStatus = makeStatus({
      submittedCount: 2,
      latestSubmissionAt: "2026-04-09T09:30:00.000Z",
      latestSubmissionId: "submission_2",
    });

    render(
      React.createElement(SurveyChooserShell, {
        surveys: surveyDefinitions,
        initialStatuses: {
          personality: personalityStatus,
          "values-beliefs": valuesStatus,
        },
      }),
    );

    expect(screen.queryByRole("button", { name: "Repeat survey" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Review results →" }));

    expect(routerPushMock).toHaveBeenCalledWith("/surveys/personality/dashboard");
  });

  it("renders resolved survey status immediately without a client-side loading placeholder", () => {
    render(
      React.createElement(SurveyChooserShell, {
        surveys: surveyDefinitions,
        initialStatuses: {
          personality: personalityStatus,
          "values-beliefs": valuesStatus,
        },
      }),
    );

    expect(screen.getAllByText("0 of 2 submissions used")).toHaveLength(2);
    expect(screen.queryByText("Loading your survey status...")).not.toBeInTheDocument();
  });

  it("prefetches survey routes and only prefetches dashboards after a submission exists", () => {
    personalityStatus = makeStatus({
      submittedCount: 1,
      latestSubmissionAt: "2026-04-08T09:30:00.000Z",
      latestSubmissionId: "submission_1",
    });

    render(
      React.createElement(SurveyChooserShell, {
        surveys: surveyDefinitions,
        initialStatuses: {
          personality: personalityStatus,
          "values-beliefs": valuesStatus,
        },
      }),
    );

    expect(routerPrefetchMock).toHaveBeenCalledWith("/surveys/personality");
    expect(routerPrefetchMock).toHaveBeenCalledWith("/surveys/personality/dashboard");
    expect(routerPrefetchMock).toHaveBeenCalledWith("/surveys/values-beliefs");
    expect(routerPrefetchMock).not.toHaveBeenCalledWith("/surveys/values-beliefs/dashboard");
  });
});
