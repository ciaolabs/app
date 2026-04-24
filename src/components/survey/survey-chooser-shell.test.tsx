import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SurveyChooserShell } from "@/components/survey/survey-chooser-shell";
import { surveyDefinitions } from "@/lib/survey/definitions";
import { type SurveyUserStatus } from "@/lib/survey/types";

const { navigateWithReload } = vi.hoisted(() => ({
  navigateWithReload: vi.fn(),
}));

vi.mock("@/lib/browser-navigation", () => ({
  navigateWithReload,
}));

function makeStatus(overrides?: Partial<SurveyUserStatus>): SurveyUserStatus {
  return {
    surveyType: "personality",
    submittedCount: 0,
    hasActiveDraft: false,
    latestSubmissionAt: null,
    latestSubmissionId: null,
    ...overrides,
  };
}

describe("SurveyChooserShell", () => {
  let personalityStatus: SurveyUserStatus;
  let valuesStatus: SurveyUserStatus;

  beforeEach(() => {
    navigateWithReload.mockReset();
    personalityStatus = makeStatus();
    valuesStatus = {
      surveyType: "values-beliefs",
      submittedCount: 0,
      hasActiveDraft: false,
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
    await user.click(within(personalityCard!).getByRole("button", { name: "Start survey" }));

    expect(navigateWithReload).toHaveBeenCalledWith("/surveys/personality");
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

    await user.click(screen.getByRole("button", { name: "Repeat" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText(/This repeat will be your last chance to complete Measures of Your Personality/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Yes" }));

    await waitFor(() => {
      expect(navigateWithReload).toHaveBeenCalledWith("/surveys/personality");
    });
  });

  it("shows resume and review actions when the final draft is already in progress", async () => {
    personalityStatus = makeStatus({
      submittedCount: 1,
      hasActiveDraft: true,
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

    expect(screen.getByRole("button", { name: "Continue final attempt" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Review results" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Repeat" })).not.toBeInTheDocument();
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

    expect(screen.queryByRole("button", { name: "Repeat" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Review results" }));

    expect(navigateWithReload).toHaveBeenCalledWith("/surveys/personality/dashboard");
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
});
