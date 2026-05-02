import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import SurveysLoading from "@/app/surveys/loading";
import PersonalitySurveyLoading from "@/app/surveys/personality/loading";
import ValuesBeliefsSurveyLoading from "@/app/surveys/values-beliefs/loading";

describe("survey route loading fallbacks", () => {
  it("renders the survey chooser fallback", () => {
    render(<SurveysLoading />);

    expect(screen.getByRole("heading", { name: "Preparing your surveys" })).toBeInTheDocument();
    expect(screen.getByText(/loading your saved drafts/i)).toBeInTheDocument();
  });

  it("renders the personality survey fallback", () => {
    render(<PersonalitySurveyLoading />);

    expect(
      screen.getByRole("heading", { name: "Preparing your personality survey" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/opening your latest draft/i)).toBeInTheDocument();
  });

  it("renders the values and beliefs survey fallback", () => {
    render(<ValuesBeliefsSurveyLoading />);

    expect(
      screen.getByRole("heading", { name: "Preparing your values and beliefs survey" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/setting up the response workspace/i)).toBeInTheDocument();
  });
});
