import { useQuery } from "@tanstack/react-query";
import { executeQuery } from "@/services/api";

export type Journey = {
  id: string;
  title: string;
  description?: string;
  categoryId: string;
  creatorId: string;
  imageUrl?: string;
  learners: number;
  pendingAssignmentsCount?: number;
};

export type Program = {
  id: string;
  journeyId: string;
  title: string;
  description?: string;
  type: string;
  startDate?: string;
  endDate?: string;
  status: string;
};

type TasksForPrograms = {
  totalScoredAssignmentsCount: number;
  totalScoredAssignmentsByProgramCount: number;
  totalScoredAssignmentsByProgram: Record<string, number>; 
  pendingAssignmentsCount: number;
  pendingAssignmentsByProgram: Record<string, number>;
};

type TasksForJourney = {
  journeyId: string;
  pendingAssignmentsCount: number;
  scoredAssignmentsCount: number;
};

export const useCoachJourneys = (
  coachId?: string,
  selectedJourneyId?: string
) => {
  // Fetch all journeys for a specific coach
  const {
    data: journeysData,
    isLoading: isJourneysLoading,
    error: journeysError,
  } = useQuery({
    queryKey: ["coachJourneys", coachId],
    queryFn: async () => {
      if (!coachId) return { journeys: [], error: false, message: null };

      const sql = `
        SELECT 
          j.id,
          j.slug,
          (
            SELECT COUNT(*) AS count
            FROM journeys_learners jl
            WHERE jl.journey_id = j.id
          ) AS learner_count
        FROM journeys j
        JOIN journey_coaches jc ON j.id = jc.journey_id
        WHERE jc.coach_id = '${coachId}';
      `;

      const result = await executeQuery(sql);

      if (result.error) {
        return {
          journeys: [],
          error: true,
          message: result.message,
        };
      }

      if (!result.data.rows || result.data.rows.length === 0) {
        return { journeys: [], error: false, message: null };
      }

      const journeys = result.data.rows.map((row: any) => ({
        id: row[0],
        title: row[1] || "Untitled Journey",
        learners: row[2] || 0,
      })) as Journey[];

      return { journeys, error: false, message: null };
    },
    enabled: !!coachId,
  });

  // Fetch pending assignments count for all journeys
  const {
    data: tasksForJourneysData,
    isLoading: isTasksForJourneysLoading,
    error: tasksForJourneysError,
  } = useQuery({
    queryKey: ["tasksForJourneys", coachId],
    queryFn: async () => {
      if (!coachId || !journeysData?.journeys.length)
        return { tasks: [], error: false, message: null };

      const journeyIds = journeysData.journeys.map((journey) => journey.id);
      const journeyIdsString = journeyIds.join("','");

      // Fetch programs for all journeys
      const programsSql = `
        SELECT 
          p.id AS program_id,
          jp.journey_id
        FROM journey_programs jp
        JOIN programs p ON jp.program_id = p.id
        WHERE jp.journey_id IN ('${journeyIdsString}')
          AND p.deleted_at IS NULL
          AND jp.deleted_at IS NULL
      `;

      const programsResult = await executeQuery(programsSql);

      if (programsResult.error) {
        return {
          tasks: [],
          error: true,
          message: programsResult.message,
        };
      }

      if (!programsResult.data.rows || programsResult.data.rows.length === 0) {
        return { tasks: [], error: false, message: null };
      }

      const programIds = programsResult.data.rows.map((row: any) => row[0]);
      const programIdsString = programIds.join("','");

      // Fetch assignments for all programs
      const assignmentsSql = `
        SELECT 
          a.id,
          a.program_id,
          am.status,
          am.grade,
          jp.journey_id
        FROM assignments a
        JOIN assignment_submissions am ON a.id = am.assignment_id
        JOIN journey_programs jp ON a.program_id = jp.program_id
        WHERE a.program_id IN ('${programIdsString}')
          AND a.deleted_at IS NULL
          AND jp.deleted_at IS NULL;
      `;

      const assignmentsResult = await executeQuery(assignmentsSql);

      if (assignmentsResult.error) {
        return {
          tasks: [],
          error: true,
          message: assignmentsResult.message,
        };
      }

      if (
        !assignmentsResult.data.rows ||
        assignmentsResult.data.rows.length === 0
      ) {
        return { tasks: [], error: false, message: null };
      }

      // Process pending assignments by journey
      const pendingAssignmentsByJourney = assignmentsResult.data.rows
        .filter((row: any) => row[2] === "pending" || row[2] === "under_review")
        .reduce((acc: Record<string, number>, row: any) => {
          const journeyId = row[4]; // journey_id from JOIN
          acc[journeyId] = (acc[journeyId] || 0) + 1;
          return acc;
        }, {});

        const scoredAssignmentsByJourney = assignmentsResult.data.rows
        .filter((row: any) => row[3] !== null)
        .reduce((acc: Record<string, number>, row: any) => {
          const journeyId = row[4]; 
          acc[journeyId] = (acc[journeyId] || 0) + 1;
          return acc;
        }, {});


      const tasks = journeyIds.map((journeyId) => ({
        journeyId,
        pendingAssignmentsCount: pendingAssignmentsByJourney[journeyId] || 0,
        scoredAssignmentsCount: scoredAssignmentsByJourney[journeyId] || 0,
      })) as TasksForJourney[];

      return { tasks, error: false, message: null };
    },
    enabled: !!coachId && !!journeysData?.journeys.length,
  });

  // Fetch programs for a selected journey
  const {
    data: programsData,
    isLoading: isProgramsLoading,
    error: programsError,
  } = useQuery({
    queryKey: ["journeyPrograms", selectedJourneyId],
    queryFn: async () => {
      if (!selectedJourneyId)
        return { programs: [], error: false, message: null };

      const sql = `
        SELECT 
          p.id AS program_id,
          jp.journey_id,
          jp.id AS journey_program_id,
          pt.title,
          pt.description,
          p.type,
          p.start_date,
          p.status
        FROM journey_programs jp
        JOIN programs p ON jp.program_id = p.id
        JOIN (
          SELECT program_id, MIN(id) AS min_id
          FROM program_translations
          WHERE locale = 'en'
          GROUP BY program_id
        ) pt_min ON p.id = pt_min.program_id
        JOIN program_translations pt ON pt_min.min_id = pt.id
        WHERE jp.journey_id = '${selectedJourneyId}'
          AND p.deleted_at IS NULL
          AND jp.deleted_at IS NULL
        ORDER BY jp.order
      `;

      const result = await executeQuery(sql);

      if (result.error) {
        return {
          programs: [],
          error: true,
          message: result.message,
        };
      }

      if (!result.data.rows || result.data.rows.length === 0) {
        return { programs: [], error: false, message: null };
      }

      const programs = result.data.rows.map((row: any) => ({
        id: row[0],
        journeyId: row[1],
        title: row[3] || "Untitled Program",
        description: row[4] || "No description available",
        type: row[5],
        startDate: row[6],
        status: row[7],
      })) as Program[];

      return { programs, error: false, message: null };
    },
    enabled: !!selectedJourneyId,
  });

  // Fetch tasks for programs in the selected journey
  const {
    data: tasksForProgramsData,
    isLoading: isTasksForProgramsLoading,
    error: tasksForProgramsError,
  } = useQuery({
    queryKey: ["tasksForPrograms", selectedJourneyId],
    queryFn: async () => {
      if (!selectedJourneyId)
        return { tasks: null, error: false, message: null };

      if (!programsData?.programs.length)
        return { tasks: null, error: false, message: null };

      const programsIds = programsData.programs.map(
        (program: Program) => program.id
      );
      const programsIdsString = programsIds.join("','");

      // Fetch assignments
      const assignmentsSql = `
        SELECT 
          a.id,
          a.program_id,
          am.status,
          am.grade
        FROM assignments a
        JOIN assignment_submissions am ON a.id = am.assignment_id
        WHERE a.program_id IN ('${programsIdsString}')
          AND a.deleted_at IS NULL;
      `;

      const assignmentsResult = await executeQuery(assignmentsSql);

      if (assignmentsResult.error) {
        return {
          tasks: null,
          error: true,
          message: assignmentsResult.message,
        };
      }

      if (
        !assignmentsResult.data.rows ||
        assignmentsResult.data.rows.length === 0
      ) {
        return {
          tasks: null,
          error: false,
          message: null,
        };
      }

      // Process pending assignments
      const pendingAssignments = assignmentsResult.data.rows.filter(
        (row: any) => row[2] === "pending" || row[2] === "under_review"
      );

      const totalScoredAssignments = assignmentsResult.data.rows.filter(
        (row: any) => row[3] !== null
      );

      const totalScoredAssignmentsCount = totalScoredAssignments.length;
      const totalScoredAssignmentsByProgram = totalScoredAssignments.reduce(
        (acc: Record<string, number>, row: any) => {
          const programId = row[1];
          acc[programId] = (acc[programId] || 0) + 1;
          return acc;
        },
        {}
      );

      const totalScoredAssignmentsByProgramCount = Object.keys(
        totalScoredAssignmentsByProgram
      ).length;

      const pendingAssignmentsCount = pendingAssignments.length;
      const pendingAssignmentsByProgram = pendingAssignments.reduce(
        (acc: Record<string, number>, row: any) => {
          const programId = row[1];
          acc[programId] = (acc[programId] || 0) + 1;
          return acc;
        },
        {}
      );

      return {
        tasks: {
          totalScoredAssignmentsCount,
          totalScoredAssignmentsByProgramCount,
          totalScoredAssignmentsByProgram,
          pendingAssignmentsCount,
          pendingAssignmentsByProgram,
        } as TasksForPrograms,
        error: false,
        message: null,
      };
    },
    enabled: !!selectedJourneyId && !!programsData?.programs.length,
  });

  // Merge pendingAssignmentsCount into journeys
  const journeysWithTasks =
    journeysData?.journeys.map((journey) => ({
      ...journey,
      pendingAssignmentsCount:
        tasksForJourneysData?.tasks.find(
          (task) => task.journeyId === journey.id
        )?.pendingAssignmentsCount || 0,
      scoredAssignmentsCount:
        tasksForJourneysData?.tasks.find(
          (task) => task.journeyId === journey.id
        )?.scoredAssignmentsCount || 0,
    })) || [];

  return {
    journeys: journeysWithTasks,
    isJourneysLoading,
    journeysError: journeysData?.error || journeysError,
    journeysErrorMessage: journeysData?.message,
    programs: programsData?.programs || [],
    isProgramsLoading,
    programsError: programsData?.error || programsError,
    programsErrorMessage: programsData?.message,
    tasksForPrograms: tasksForProgramsData?.tasks || null,
    isTasksForProgramsLoading,
    tasksForProgramsError: tasksForProgramsData?.error || tasksForProgramsError,
    tasksForProgramsErrorMessage: tasksForProgramsData?.message,
    tasksForJourneys: tasksForJourneysData?.tasks || [],
    isTasksForJourneysLoading,
    tasksForJourneysError: tasksForJourneysData?.error || tasksForJourneysError,
    tasksForJourneysErrorMessage: tasksForJourneysData?.message,
  };
};
