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

type MockInsertHelper = {
  __mockKind: "insert-helper";
  rows: Array<Record<string, unknown>>;
  columns: string[];
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

function participantIdForUserId(userId: string) {
  return `participant:${userId}`;
}

function userIdFromParticipantId(participantId: string) {
  return participantId.replace(/^participant:/, "");
}

function surveyVersionIdForSurveyType(surveyType: "personality" | "values-beliefs") {
  return `version:${surveyType}`;
}

function surveyTypeFromVersionId(surveyVersionId: string) {
  return surveyVersionId.replace(/^version:/, "") as "personality" | "values-beliefs";
}

function isTemplateStringsArray(value: unknown): value is TemplateStringsArray {
  return Array.isArray(value) && "raw" in value;
}

function isMockInsertHelper(value: unknown): value is MockInsertHelper {
  return (
    typeof value === "object" &&
    value !== null &&
    "__mockKind" in value &&
    (value as MockInsertHelper).__mockKind === "insert-helper"
  );
}

function upsertAnswerRow(
  database: MockDatabase,
  submissionId: string,
  questionId: string,
  questionOrder: number,
  response: number,
) {
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
}

function createMockSql(database: MockDatabase) {
  const sql = ((strings: TemplateStringsArray | Array<Record<string, unknown>>, ...values: unknown[]) => {
    if (!isTemplateStringsArray(strings)) {
      return {
        __mockKind: "insert-helper",
        rows: strings,
        columns: values as string[],
      } satisfies MockInsertHelper;
    }

    const query = normalizeQuery(strings);

    if (query.startsWith("insert into app_private.user_accounts")) {
      const [, userId] = values as [string, string];
      return Promise.resolve([{ id: `account:${userId}` }]);
    }

    if (query.startsWith("insert into research.participants")) {
      const [accountId] = values as [string, string];
      return Promise.resolve([{ id: participantIdForUserId(accountId.replace(/^account:/, "")) }]);
    }

    if (query.startsWith("insert into research.surveys")) {
      const [surveyType] = values as ["personality" | "values-beliefs", string];
      return Promise.resolve([{ id: `survey:${surveyType}` }]);
    }

    if (query.startsWith("insert into research.survey_versions")) {
      const [surveyId] = values as [string];
      return Promise.resolve([
        { id: surveyVersionIdForSurveyType(surveyId.replace(/^survey:/, "") as "personality" | "values-beliefs") },
      ]);
    }

    if (query.startsWith("insert into research.question_items")) {
      return Promise.resolve([]);
    }

    if (query.startsWith("select count(*) filter")) {
      const [participantId, surveyVersionId] = values as [string, string];
      const userId = userIdFromParticipantId(participantId);
      const surveyType = surveyTypeFromVersionId(surveyVersionId);
      const submissions = database.submissions.filter(
        (submission) => submission.user_id === userId && submission.survey_type === surveyType,
      );
      const submitted = submissions
        .filter((submission) => submission.status === "submitted" && submission.submitted_at)
        .sort((left, right) => String(right.submitted_at).localeCompare(String(left.submitted_at)));

      return Promise.resolve([
        {
          submitted_count: submitted.length,
          has_active_draft: submissions.some((submission) => submission.status === "draft"),
          latest_submission_at: submitted[0]?.submitted_at ?? null,
          latest_submission_id: submitted[0]?.id ?? null,
        },
      ]);
    }

    if (query.startsWith("select id from research.submissions") && query.includes("status = 'draft'")) {
      const hasSubmissionIdFilter = query.includes("where id =");
      const [submissionId, participantId, surveyVersionId] = values as [string, string, string];
      const [resolvedParticipantId, resolvedSurveyVersionId] = hasSubmissionIdFilter
        ? [participantId, surveyVersionId]
        : (values as [string, string]);
      const userId = userIdFromParticipantId(resolvedParticipantId);
      const surveyType = surveyTypeFromVersionId(resolvedSurveyVersionId);
      const draft = database.submissions.find(
        (submission) =>
          submission.user_id === userId &&
          submission.survey_type === surveyType &&
          submission.status === "draft" &&
          (!hasSubmissionIdFilter || submission.id === submissionId),
      );

      return Promise.resolve(draft ? [{ id: draft.id }] : []);
    }

    if (query.includes("from research.submissions s") && query.includes("s.status = 'draft'")) {
      const [participantId, surveyVersionId] = values as [string, string, string];
      const userId = userIdFromParticipantId(participantId);
      const surveyType = surveyTypeFromVersionId(surveyVersionId);
      const draft = database.submissions.find(
        (submission) =>
          submission.user_id === userId &&
          submission.survey_type === surveyType &&
          submission.status === "draft",
      );
      return Promise.resolve(draft ? [buildAggregatedRow(database, draft)] : []);
    }

    if (
      query.includes("from research.submissions s") &&
      query.includes("s.status = 'submitted'") &&
      query.includes("order by s.submitted_at desc") &&
      query.includes("coalesce(")
    ) {
      const [participantId, surveyVersionId] = values as [string, string, string];
      const userId = userIdFromParticipantId(participantId);
      const surveyType = surveyTypeFromVersionId(surveyVersionId);
      const submission = database.submissions
        .filter(
          (row) =>
            row.user_id === userId &&
            row.survey_type === surveyType &&
            row.status === "submitted" &&
            row.submitted_at,
        )
        .sort((left, right) => String(right.submitted_at).localeCompare(String(left.submitted_at)))[0];

      return Promise.resolve(submission ? [buildAggregatedRow(database, submission)] : []);
    }

    if (
      query.includes("from research.submissions s") &&
      query.includes("s.id =") &&
      query.includes("s.status = 'submitted'")
    ) {
      const [submissionId, participantId, surveyVersionId] = values as [string, string, string, string];
      const userId = userIdFromParticipantId(participantId);
      const surveyType = surveyTypeFromVersionId(surveyVersionId);
      const submission = database.submissions.find(
        (row) =>
          row.user_id === userId &&
          row.survey_type === surveyType &&
          row.id === submissionId &&
          row.status === "submitted" &&
          row.submitted_at,
      );

      return Promise.resolve(submission ? [buildAggregatedRow(database, submission)] : []);
    }

    if (
      query.startsWith("select s.id, s.user_id, s.survey_type, s.answer_count, s.created_at, s.updated_at, s.submitted_at") &&
      query.includes("where s.user_id =") &&
      query.includes("s.status = 'submitted'")
    ) {
      const [userId, surveyType] = values as [string, "personality" | "values-beliefs"];
      return Promise.resolve(database.submissions
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
        })));
    }

    if (
      query.startsWith("select s.id, ua.provider_user_id as user_id, svy.slug as survey_type, s.answer_count") &&
      query.includes("s.status = 'submitted'")
    ) {
      const [participantId, surveyVersionId] = values as [string, string, string];
      const userId = userIdFromParticipantId(participantId);
      const surveyType = surveyTypeFromVersionId(surveyVersionId);
      return Promise.resolve(database.submissions
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
        })));
    }

    if (query.startsWith("insert into research.submissions")) {
      const [id, , participantId, surveyVersionId] = values as [string, string, string, string];
      const userId = userIdFromParticipantId(participantId);
      const surveyType = surveyTypeFromVersionId(surveyVersionId);
      const existingDraft = database.submissions.find(
        (submission) =>
          submission.user_id === userId &&
          submission.survey_type === surveyType &&
          submission.status === "draft",
      );

      if (existingDraft && query.includes("on conflict do nothing")) {
        return Promise.resolve([]);
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

      return Promise.resolve([]);
    }

    if (query.startsWith("insert into research.answers")) {
      const insertHelper = values.find(isMockInsertHelper);

      if (insertHelper) {
        insertHelper.rows.forEach((row) => {
          upsertAnswerRow(
            database,
            row.submission_id as string,
            row.question_id as string,
            row.question_order as number,
            row.response as number,
          );
        });

        return Promise.resolve([]);
      }

      const isCatalogInsert = query.includes("from research.question_items q");
      const [submissionId, responseOrQuestionId, surveyVersionIdOrQuestionOrder, questionIdOrResponse, questionOrder] =
        values as [string, number | string, string | number, string | number, number];
      const questionId = isCatalogInsert ? (questionIdOrResponse as string) : (responseOrQuestionId as string);
      const response = isCatalogInsert ? (responseOrQuestionId as number) : (questionIdOrResponse as number);
      const resolvedQuestionOrder = isCatalogInsert
        ? questionOrder
        : (surveyVersionIdOrQuestionOrder as number);
      upsertAnswerRow(database, submissionId, questionId, resolvedQuestionOrder, response);

      return Promise.resolve(isCatalogInsert && query.includes("returning") ? [{ id: questionId }] : []);
    }

    if (query.startsWith("select count(*)::int as count")) {
      const submissionId = values[0] as string;
      return Promise.resolve([
        {
          count: database.answers.filter((answer) => answer.submission_id === submissionId).length,
        },
      ]);
    }

    if (query.startsWith("update research.submissions") && query.includes("set answer_count =")) {
      const isCountingAnswers = query.includes("select count(*)::int from research.answers");
      const [answerCount, submissionId] = isCountingAnswers
        ? [
            database.answers.filter((answer) => answer.submission_id === values[0]).length,
            values[1] as string,
          ]
        : (values as [number, string]);
      const submission = database.submissions.find((row) => row.id === submissionId);

      if (submission) {
        submission.answer_count = answerCount;
        submission.updated_at = nextTimestamp(database);
      }

      return Promise.resolve([]);
    }

    if (query.startsWith("delete from research.answers")) {
      const submissionId = values[0] as string;
      database.answers = database.answers.filter((answer) => answer.submission_id !== submissionId);
      return Promise.resolve([]);
    }

    if (query.startsWith("update research.submissions") && query.includes("set status = 'submitted'")) {
      const [answerCount, submissionId] = values as [number, string];
      const submission = database.submissions.find((row) => row.id === submissionId);

      if (submission) {
        const submittedAt = nextTimestamp(database);
        submission.status = "submitted";
        submission.answer_count = answerCount;
        submission.updated_at = submittedAt;
        submission.submitted_at = submittedAt;
      }

      return Promise.resolve([]);
    }

    throw new Error(`Unhandled postgres query in test: ${query}`);
  }) as unknown as {
    (strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown[]>;
    (rows: Array<Record<string, unknown>>, ...columns: string[]): MockInsertHelper;
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
      activeDraftAnswerCount: 0,
      latestSubmissionAt: secondSubmission.submittedAt,
      latestSubmissionId: secondSubmission.submissionId,
    });
    expect(valuesStatus).toEqual({
      surveyType: "values-beliefs",
      submittedCount: 0,
      hasActiveDraft: true,
      activeDraftAnswerCount: valuesDraft.answerCount,
      latestSubmissionAt: null,
      latestSubmissionId: null,
    });
  });
});
