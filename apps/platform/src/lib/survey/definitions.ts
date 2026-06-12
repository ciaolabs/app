import { getSurveyQuestions } from "@/lib/survey/questions";
import {
  getSurveyApiBasePath,
  getSurveyDashboardRoute,
  getSurveyRoute,
} from "@/lib/survey/routes";
import { type QuestionItem, type QuestionSection, type SurveyType } from "@/lib/survey/types";

export type SurveyAvailability = "active" | "coming-soon";

type SurveyHelpLink = {
  label: string;
  href: string;
};

export type SurveyHelpContent = {
  title: string;
  body: string;
  referencesIntro: string;
  references: readonly SurveyHelpLink[];
};

type BaseSurveyDefinition = {
  type: SurveyType;
  title: string;
  description: string;
  availability: SurveyAvailability;
  maxSubmissions: number | null;
  resultsEnabled: boolean;
  route: string;
  apiBasePath: string;
  ctaLabel: string;
  helpContent: SurveyHelpContent | null;
};

export type ActiveSurveyDefinition = BaseSurveyDefinition & {
  availability: "active";
  dashboardRoute: string;
  questions: readonly QuestionItem[];
  questionCount: number;
  questionsById: ReadonlyMap<string, QuestionItem>;
  questionIds: ReadonlySet<string>;
  sections: readonly QuestionSection[];
  resultsTitle: string;
};

export type ComingSoonSurveyDefinition = BaseSurveyDefinition & {
  availability: "coming-soon";
  dashboardRoute: null;
  questions: null;
  questionCount: 0;
  questionsById: ReadonlyMap<string, QuestionItem>;
  questionIds: ReadonlySet<string>;
  sections: readonly QuestionSection[];
  resultsTitle: null;
};

export type SurveyDefinition = ActiveSurveyDefinition | ComingSoonSurveyDefinition;

function createActiveSurveyDefinition(config: {
  type: SurveyType;
  title: string;
  description: string;
  questions: readonly QuestionItem[];
  maxSubmissions: number;
  ctaLabel: string;
  resultsTitle: string;
  helpContent: SurveyHelpContent;
}): ActiveSurveyDefinition {
  const questionsById = new Map(config.questions.map((question) => [question.id, question]));
  const sections = config.questions.reduce<QuestionSection[]>((currentSections, question) => {
    const section = question.section;

    if (!section || currentSections.some((candidate) => candidate.id === section.id)) {
      return currentSections;
    }

    currentSections.push(section);
    return currentSections;
  }, []);

  return {
    ...config,
    availability: "active",
    resultsEnabled: true,
    route: getSurveyRoute(config.type),
    dashboardRoute: getSurveyDashboardRoute(config.type),
    apiBasePath: getSurveyApiBasePath(config.type),
    questionCount: config.questions.length,
    questionsById,
    questionIds: new Set(config.questions.map((question) => question.id)),
    sections,
  };
}

export const personalitySurveyDefinition = createActiveSurveyDefinition({
  type: "personality",
  title: "Measures of Your Personality",
  description:
    "Complete the AMBI personality survey, review your saved submissions, and use your final repeat when available.",
  questions: getSurveyQuestions("personality"),
  maxSubmissions: 2,
  ctaLabel: "Start survey",
  resultsTitle: "Measures of Your Personality.",
  helpContent: {
    title: "Survey help",
    body:
      "Answer each statement on the 1 to 6 scale. Your responses autosave to the signed-in account as you move through the survey, and each answered item reveals a seeded violin plot for that prompt.",
    referencesIntro: "Need the source reference? The AMBI survey flow in this MVP is based on Tal Yarkoni's 2010 paper.",
    references: [
      {
        label: "Open documentation",
        href: "https://doi.org/10.1016/j.jrp.2010.01.002",
      },
    ],
  },
});

export const valuesBeliefsSurveyDefinition = createActiveSurveyDefinition({
  type: "values-beliefs",
  title: "Personal Values and Beliefs",
  description:
    "Complete the combined beliefs and values survey, save one draft, and review either saved submission from a single dashboard.",
  questions: getSurveyQuestions("values-beliefs"),
  maxSubmissions: 2,
  ctaLabel: "Start survey",
  resultsTitle: "Personal Values and Beliefs",
  helpContent: {
    title: "Survey help",
    body:
      "This survey has two parts. You will answer beliefs-about-the-world items first, then portrait-based values items. Your draft autosaves to your account as you move through the survey.",
    referencesIntro:
      "Need the source references? This survey combines the Primal World Beliefs inventory with the Portrait Values Questionnaire.",
    references: [
      {
        label: "Primal World Beliefs",
        href: "https://doi.org/10.1037/pas0000639",
      },
      {
        label: "Portrait Values Questionnaire",
        href: "https://doi.org/10.1177/1073191121998760",
      },
    ],
  },
});

export const surveyDefinitions: SurveyDefinition[] = [
  personalitySurveyDefinition,
  valuesBeliefsSurveyDefinition,
];

const surveyDefinitionMap = new Map(
  surveyDefinitions.map((definition) => [definition.type, definition]),
);

export function isSurveyType(value: string): value is SurveyType {
  return surveyDefinitionMap.has(value as SurveyType);
}

export function getSurveyDefinition(surveyType: string): SurveyDefinition | null {
  return surveyDefinitionMap.get(surveyType as SurveyType) ?? null;
}

export function getActiveSurveyDefinition(surveyType: string): ActiveSurveyDefinition | null {
  const definition = getSurveyDefinition(surveyType);

  if (!definition || definition.availability !== "active") {
    return null;
  }

  return definition;
}

export function getStoredAnswersKey(surveyType: SurveyType) {
  return `ambi-survey:${surveyType}:answers`;
}

export function getPendingResultsKey(surveyType: SurveyType) {
  return `ambi-survey:${surveyType}:pending-results`;
}
