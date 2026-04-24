import { beforeEach, describe, expect, it, vi } from "vitest";

import { personalitySurveyDefinition } from "@/lib/survey/definitions";
import { QUESTION_COUNT } from "@/lib/survey/constants";
import { surveyQuestions } from "@/lib/survey/questions";
import type { SurveyAnswers } from "@/lib/survey/types";

type MockSubmissionRow = {
  id: string;
  user_id: string;
  survey_type: "personality" | "values-beliefs";
  status: "draft" | "submitted";
  answer_count: number;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
};

type MockAnswerRow = {
  submission_id: string;
  question_id: string;
  question_order: number;
  response: number;
  updated_at: string;
};

type MockDatabase = {
  submissions: MockSubmissionRow[];
  answers: MockAnswerRow[];
  schemaBootstrapped: boolean;
  tick: number;
};

const { postgresFactoryMock, mockDatabaseRef } = vi.hoisted(() => ({
  postgresFactoryMock: vi.fn(),
  mockDatabaseRef: { current: null as MockDatabase | null },
}));

vi.mock("postgres", () => ({
  default: postgresFactoryMock,
}));

function buildAnswers(value: SurveyAnswers[string]) {
  return Object.fromEntries(surveyQuestions.map((question) => [question.id, value] as const)) as SurveyAnswers;
}

function nextTimestamp(database: MockDatabase) {
  database.tick += 1;
  return new Date(Date.UTC(2026, 0, 1, 0, 0, database.tick)).toISOString();
}

function normalizeQuery(strings: TemplateStringsArray) {
  return strings.join(" ").replace(/\s+/g, " ").trim().toLowerCase();
}

function buildAggregatedRow(database: MockDatabase, submission: MockSubmissionRow) {
  const answers = Object.fromEntries(
    database.answers
      .filter((answer) => answer.submission_id === submission.id)
      .sort((left, right) => left.question_order - right.question_order)
      .map((answer) => [answer.question_id, answer.response]),
  );

  return {
    ...submission,
    answers,
  };
}

function createMockSql(database: MockDatabase) {
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const query = normalizeQuery(strings);

    if (query.includes("from survey_submissions s") && query.includes("s.status = 'draft'")) {
      const [userId, surveyType] = values as [string, "personality" | "values-beliefs"];
      const draft = database.submissions.find(
        (submission) =>
          submission.user_id === userId &&
          submission.survey_type === surveyType &&
          submission.status === "draft",
      );
      return draft ? [buildAggregatedRow(database, draft)] : [];
    }

    if (
      query.includes("from survey_submissions s") &&
      query.includes("s.status = 'submitted'") &&
      query.includes("order by s.submitted_at desc") &&
      query.includes("coalesce(")
    ) {
      const [userId, surveyType] = values as [string, "personality" | "values-beliefs"];
      const submission = database.submissions
        .filter(
          (row) =>
            row.user_id === userId &&
            row.survey_type === surveyType &&
            row.status === "submitted" &&
            row.submitted_at,
        )
        .sort((left, right) => String(right.submitted_at).localeCompare(String(left.submitted_at)))[0];

      return submission ? [buildAggregatedRow(database, submission)] : [];
    }

    if (
      query.includes("from survey_submissions s") &&
      query.includes("s.id =") &&
      query.includes("s.status = 'submitted'")
    ) {
      const [userId, surveyType, submissionId] = values as [string, "personality" | "values-beliefs", string];
      const submission = database.submissions.find(
        (row) =>
          row.user_id === userId &&
          row.survey_type === surveyType &&
          row.id === submissionId &&
          row.status === "submitted" &&
          row.submitted_at,
      );

      return submission ? [buildAggregatedRow(database, submission)] : [];
    }

    if (
      query.startsWith("select s.id, s.user_id, s.survey_type, s.answer_count, s.created_at, s.updated_at, s.submitted_at") &&
      query.includes("where s.user_id =") &&
      query.includes("s.status = 'submitted'")
    ) {
      const [userId, surveyType] = values as [string, "personality" | "values-beliefs"];
      return database.submissions
        .filter(
          (row) =>
            row.user_id === userId &&
            row.survey_type === surveyType &&
            row.status === "submitted" &&
            row.submitted_at,
        )
        .sort((left, right) => String(right.submitted_at).localeCompare(String(left.submitted_at)))
        .map((submission) => ({
          id: submission.id,
          user_id: submission.user_id,
          survey_type: submission.survey_type,
          answer_count: submission.answer_count,
          created_at: submission.created_at,
          updated_at: submission.updated_at,
          submitted_at: submission.submitted_at as string,
        }));
    }

    if (query.startsWith("insert into survey_submissions")) {
      const [id, userId, surveyType] = values as [string, string, "personality" | "values-beliefs"];
      const existingDraft = database.submissions.find(
        (submission) =>
          submission.user_id === userId &&
          submission.survey_type === surveyType &&
          submission.status === "draft",
      );

      if (existingDraft && query.includes("on conflict do nothing")) {
        return [];
      }

      if (existingDraft) {
        const duplicateError = new Error("duplicate key value violates unique constraint");
        Object.assign(duplicateError, { code: "23505" });
        throw duplicateError;
      }

      const createdAt = nextTimestamp(database);
      database.submissions.push({
        id,
        user_id: userId,
        survey_type: surveyType,
        status: "draft",
        answer_count: 0,
        created_at: createdAt,
        updated_at: createdAt,
        submitted_at: null,
      });

      return [];
    }

    if (query.startsWith("insert into survey_answers")) {
      const [submissionId, questionId, questionOrder, response] = values as [string, string, number, number];
      const updatedAt = nextTimestamp(database);
      const existingIndex = database.answers.findIndex(
        (answer) => answer.submission_id === submissionId && answer.question_id === questionId,
      );

      if (existingIndex >= 0) {
        database.answers[existingIndex] = {
          submission_id: submissionId,
          question_id: questionId,
          question_order: questionOrder,
          response,
          updated_at: updatedAt,
        };
      } else {
        database.answers.push({
          submission_id: submissionId,
          question_id: questionId,
          question_order: questionOrder,
          response,
          updated_at: updatedAt,
        });
      }

      return [];
    }

    if (query.startsWith("select count(*)::int as count")) {
      const submissionId = values[0] as string;
      return [
        {
          count: database.answers.filter((answer) => answer.submission_id === submissionId).length,
        },
      ];
    }

    if (query.startsWith("update survey_submissions") && query.includes("set answer_count =")) {
      const [answerCount, submissionId] = values as [number, string];
      const submission = database.submissions.find((row) => row.id === submissionId);

      if (submission) {
        submission.answer_count = answerCount;
        submission.updated_at = nextTimestamp(database);
      }

      return [];
    }

    if (query.startsWith("delete from survey_answers")) {
      const submissionId = values[0] as string;
      database.answers = database.answers.filter((answer) => answer.submission_id !== submissionId);
      return [];
    }

    if (query.startsWith("update survey_submissions") && query.includes("set status = 'submitted'")) {
      const [answerCount, submissionId] = values as [number, string];
      const submission = database.submissions.find((row) => row.id === submissionId);

      if (submission) {
        const submittedAt = nextTimestamp(database);
        submission.status = "submitted";
        submission.answer_count = answerCount;
        submission.updated_at = submittedAt;
        submission.submitted_at = submittedAt;
      }

      return [];
    }

    throw new Error(`Unhandled postgres query in test: ${query}`);
  }) as unknown as {
    (strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown[]>;
    unsafe: (query: string) => Promise<unknown[]>;
    begin: <T>(callback: (transaction: typeof sql) => Promise<T>) => Promise<T>;
  };

  sql.unsafe = async () => {
    database.schemaBootstrapped = true;
    return [];
  };

  sql.begin = async (callback) => callback(sql);

  return sql;
}

describe("createPostgresSurveyRepository", () => {
  beforeEach(() => {
    vi.resetModules();
    const database: MockDatabase = {
      submissions: [],
      answers: [],
      schemaBootstrapped: false,
      tick: 0,
    };

    mockDatabaseRef.current = database;
    postgresFactoryMock.mockReset();
    postgresFactoryMock.mockImplementation(() => createMockSql(database));
    process.env.DATABASE_URL = "postgres://supabase.example/project";
  });

  it("stores a submitted survey in the normalized postgres schema", async () => {
    const { createPostgresSurveyRepository } = await import("@/lib/survey/storage.postgres");
    const repository = createPostgresSurveyRepository();
    const userId = "user_clerk_123";
    const answers = buildAnswers(4);

    const submission = await repository.submitDraft({ userId, surveyType: "personality", answers });
    const latestSubmission = await repository.getLatestSubmission(userId, "personality");
    const database = mockDatabaseRef.current;

    expect(database?.schemaBootstrapped).toBe(true);
    expect(database?.submissions).toHaveLength(1);
    expect(database?.submissions[0]).toMatchObject({
      user_id: userId,
      survey_type: "personality",
      status: "submitted",
      answer_count: QUESTION_COUNT,
    });
    expect(database?.answers).toHaveLength(QUESTION_COUNT);
    expect(database?.answers.filter((answer) => answer.submission_id === submission.submissionId)).toHaveLength(
      QUESTION_COUNT,
    );
    expect(new Set(database?.answers.map((answer) => answer.question_id)).size).toBe(QUESTION_COUNT);
    expect(latestSubmission?.submissionId).toBe(submission.submissionId);
    expect(latestSubmission?.answers[surveyQuestions[10].id]).toBe(4);
  });

  it("keeps submission history and resolves the newest submitted survey", async () => {
    const { createPostgresSurveyRepository } = await import("@/lib/survey/storage.postgres");
    const repository = createPostgresSurveyRepository();
    const userId = "user_clerk_history";
    const firstAnswers = buildAnswers(4);
    const secondAnswers = buildAnswers(5);

    const firstSubmission = await repository.submitDraft({
      userId,
      surveyType: "personality",
      answers: firstAnswers,
    });
    const valuesDraft = await repository.ensureDraft(userId, "values-beliefs");
    const freshDraft = await repository.ensureDraft(userId, "personality");
    const secondSubmission = await repository.submitDraft({
      userId,
      surveyType: "personality",
      answers: secondAnswers,
    });
    const latestSubmission = await repository.getLatestSubmission(userId, "personality");
    const listedSubmissions = await repository.listSubmissions(userId, "personality");
    const retrievedFirstSubmission = await repository.getSubmissionById(
      userId,
      "personality",
      firstSubmission.submissionId,
    );
    const personalityStatus = await repository.getSurveyStatus(userId, "personality");
    const valuesStatus = await repository.getSurveyStatus(userId, "values-beliefs");
    const database = mockDatabaseRef.current;

    expect(freshDraft.status).toBe("draft");
    expect(valuesDraft.surveyType).toBe("values-beliefs");
    expect(database?.submissions.filter((submission) => submission.status === "submitted")).toHaveLength(2);
    expect(database?.answers.filter((answer) => answer.submission_id === firstSubmission.submissionId)).toHaveLength(
      QUESTION_COUNT,
    );
    expect(database?.answers.filter((answer) => answer.submission_id === secondSubmission.submissionId)).toHaveLength(
      QUESTION_COUNT,
    );
    expect(latestSubmission?.submissionId).toBe(secondSubmission.submissionId);
    expect(latestSubmission?.answers[surveyQuestions[0].id]).toBe(5);
    expect(listedSubmissions.map((submission) => submission.submissionId)).toEqual([
      secondSubmission.submissionId,
      firstSubmission.submissionId,
    ]);
    expect(retrievedFirstSubmission?.answers[surveyQuestions[0].id]).toBe(4);
    expect(personalityStatus).toEqual({
      surveyType: personalitySurveyDefinition.type,
      submittedCount: 2,
      hasActiveDraft: false,
      latestSubmissionAt: secondSubmission.submittedAt,
      latestSubmissionId: secondSubmission.submissionId,
    });
    expect(valuesStatus).toEqual({
      surveyType: "values-beliefs",
      submittedCount: 0,
      hasActiveDraft: true,
      latestSubmissionAt: null,
      latestSubmissionId: null,
    });
  });
});
