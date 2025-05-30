// useCoachDashboard.ts
import { useQuery } from "@tanstack/react-query";
import { executeQuery } from "@/services/api";
import { useCoachStore } from "@/store/useCoachStore";

export type JourneyLearner = {
  id: string;
  journeyId: string;
  userId: string;
  graduationStatus: string;
};

export type DashboardStats = {
  totalJourneys: number;
  totalLearners: number;
  activeLearnersCount: number;
  graduatedLearnersCount: number;
  inProgressLearnersCount: number;
};

export type CoachJourneySummary = {
  journeyId: string;
  journeyTitle: string;
  learnersCount: number;
};

export const useCoachDashboard = (coachId?: string) => {
  const { coachId: id } = useCoachStore();
  const effectiveCoachId = coachId || id;

  const {
    data,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["coachDashboard", effectiveCoachId],
    queryFn: async () => {
      if (!effectiveCoachId)
        return {
          journeys: [],
          learners: [],
          stats: getEmptyStats(),
          error: false,
          message: null,
        };

      // Fetch journeys
      const journeysSql = `
        SELECT 
          j.id,
          j.slug
        FROM journeys j
        JOIN journey_coaches jc ON j.id = jc.journey_id
        WHERE jc.coach_id = '${effectiveCoachId}'
        AND jc.deleted_at IS NULL
        AND j.deleted_at IS NULL;
      `;

      const journeysResult = await executeQuery(journeysSql);

      // Check for API error
      if (journeysResult.error) {
        return {
          journeys: [],
          learners: [],
          stats: getEmptyStats(),
          error: true,
          message: journeysResult.message,
        };
      }

      if (!journeysResult.data.rows || journeysResult.data.rows.length === 0) {
        return {
          journeys: [],
          learners: [],
          stats: getEmptyStats(),
          error: false,
          message: null,
        };
      }

      const journeys = journeysResult.data.rows.map((row: any) => ({
        id: row[0],
        title: row[1] || "Untitled Journey",
      }));

      const journeyIds = journeys.map((j: any) => j.id).join("','");

      // Fetch learners
      const learnersSql = `
        SELECT 
          jl.id,
          jl.journey_id,
          jl.user_id,
          jl.graduated
        FROM journeys_learners jl
        WHERE jl.journey_id IN ('${journeyIds}');
      `;

      const learnersResult = await executeQuery(learnersSql);

      if (learnersResult.error) {
        return {
          journeys,
          learners: [],
          stats: getEmptyStats(),
          error: true,
          message: learnersResult.message,
        };
      }

      let learners: JourneyLearner[] = [];
      if (learnersResult.data.rows && learnersResult.data.rows.length > 0) {
        learners = learnersResult.data.rows.map((row: any) => ({
          id: row[0],
          journeyId: row[1],
          userId: row[2],
          graduationStatus: row[3] || "in_progress",
        }));
      }

      // Fetch programs
      const programsSql = `
        SELECT 
          jp.journey_id,
          p.id AS program_id
        FROM journey_programs jp
        JOIN programs p ON jp.program_id = p.id
        WHERE jp.journey_id IN ('${journeyIds}')
        AND p.deleted_at IS NULL;
      `;

      const programsResult = await executeQuery(programsSql);

      if (programsResult.error) {
        return {
          journeys,
          learners,
          stats: getEmptyStats(),
          error: true,
          message: programsResult.message,
        };
      }

      const programIds = programsResult.data.rows.map((row: any) => row[1]);
      const programIdsString = programIds.join("','");

      // Fetch assignments
      const assignmentsSql = `
        SELECT 
          a.id,
          a.program_id,
          am.status,
          am.grade
        FROM assignments a
        JOIN assignment_submissions am ON a.id = am.assignment_id
        WHERE a.program_id IN ('${programIdsString}')
        AND a.deleted_at IS NULL;
      `;

      const assignmentsResult = await executeQuery(assignmentsSql);

      if (assignmentsResult.error) {
        return {
          journeys,
          learners,
          stats: getEmptyStats(),
          error: true,
          message: assignmentsResult.message,
        };
      }

      if (
        !assignmentsResult.data.rows ||
        assignmentsResult.data.rows.length === 0
      ) {
        return {
          journeys,
          learners,
          stats: getEmptyStats(),
          error: false,
          message: null,
        };
      }

      // Process pending assignments
      const pendingAssignments = assignmentsResult.data.rows.filter(
        (row: any) => row[2] === "pending" || row[2] === "under_review"
      );
      const pendingAssignmentsCount = pendingAssignments.length;

      const pendingAssignmentsCountMap = new Map<string, number>();
      pendingAssignments.forEach((row: any) => {
        const assignmentId = row[0];
        pendingAssignmentsCountMap.set(
          assignmentId,
          (pendingAssignmentsCountMap.get(assignmentId) || 0) + 1
        );
      });

      const pendingAssignmentsCountArray = Array.from(
        pendingAssignmentsCountMap.entries()
      ).map(([id, count]) => ({ id, count }));

      const pendingAssignmentsIds = pendingAssignments.map(
        (row: any) => row[0]
      );
      const pendingAssignmentsIdsString = pendingAssignmentsIds.join("','");

      // Fetch assignment translations
      const assignmentsTranslationsSql = `
        SELECT 
          a.id,
          a.program_id,
          at.title,
          at.description
        FROM assignments a
        LEFT JOIN (
            SELECT assignment_id, MAX(id) AS max_id
            FROM assignment_translations
            GROUP BY assignment_id
          ) at_max ON a.id = at_max.assignment_id
          LEFT JOIN assignment_translations at ON at_max.max_id = at.id
        WHERE a.id IN ('${pendingAssignmentsIdsString}')
        AND a.deleted_at IS NULL;
      `;

      const assignmentsTranslationsResult = await executeQuery(
        assignmentsTranslationsSql
      );

      if (assignmentsTranslationsResult.error) {
        return {
          journeys,
          learners,
          stats: getEmptyStats(),
          error: true,
          message: assignmentsTranslationsResult.message,
        };
      }

      const assignmentsTranslations =
        assignmentsTranslationsResult.data.rows.map((row: any) => ({
          id: row[0],
          courseId: row[1],
          title: row[2],
          description: row[3],
          count:
            pendingAssignmentsCountArray.find((item) => item.id === row[0])
              ?.count || 0,
        }));

      // Process scored assignments
      const scoredAssignments = assignmentsResult.data.rows.filter(
        (row: any) => row[3] !== null
      );
      const scoredAssignmentsCount = scoredAssignments.length;

      // Calculate stats and summaries
      const stats = calculateStats(journeys, learners);
      const journeysSummary = calculateJourneySummaries(journeys, learners);

      return {
        journeys,
        learners,
        stats,
        journeysSummary,
        pendingAssignmentsCount,
        scoredAssignmentsCount,
        totalAssignmentsCount: pendingAssignmentsCount + scoredAssignmentsCount,
        assignmentsTranslations,
        error: false,
        message: null,
      };
    },
    enabled: !!effectiveCoachId,
  });

  return {
    journeys: data?.journeys || [],
    learners: data?.learners || [],
    stats: data?.stats || getEmptyStats(),
    journeysSummary: data?.journeysSummary || [],
    isLoading,
    error: data?.error || queryError,
    errorMessage: data?.message || queryError?.message,
    pendingAssignmentsCount: data?.pendingAssignmentsCount || 0,
    scoredAssignmentsCount: data?.scoredAssignmentsCount || 0,
    totalAssignmentsCount: data?.totalAssignmentsCount || 0,
    assignmentsTranslations: data?.assignmentsTranslations || [],
  };
};

// Helper functions remain unchanged
const calculateStats = (
  journeys: any[],
  learners: JourneyLearner[]
): DashboardStats => {
  const totalJourneys = journeys.length;
  const totalLearners = learners.length;

  const graduatedLearnersCount = learners.filter(
    (l) => l.graduationStatus === "graduated"
  ).length;

  const inProgressLearnersCount = learners.filter(
    (l) => l.graduationStatus === "in_progress"
  ).length;

  const activeLearnersCount = inProgressLearnersCount;

  return {
    totalJourneys,
    totalLearners,
    activeLearnersCount,
    graduatedLearnersCount,
    inProgressLearnersCount,
  };
};

const calculateJourneySummaries = (
  journeys: any[],
  learners: JourneyLearner[]
): CoachJourneySummary[] => {
  const summaries: CoachJourneySummary[] = [];

  journeys.forEach((journey) => {
    const journeyLearners = learners.filter((l) => l.journeyId === journey.id);

    summaries.push({
      journeyId: journey.id,
      journeyTitle: journey.title,
      learnersCount: journeyLearners.length,
    });
  });

  return summaries;
};

const getEmptyStats = (): DashboardStats => ({
  totalJourneys: 0,
  totalLearners: 0,
  activeLearnersCount: 0,
  graduatedLearnersCount: 0,
  inProgressLearnersCount: 0,
});
