import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Task, Course } from "@/types";
import { executeQuery } from "@/services/api";

export const useCourseData = (courseId: string | undefined) => {
  const queryClient = useQueryClient();

  // Fetch course data
  const {
    data: course,
    isLoading: isCourseLoading,
    refetch,
    error: courseError,
    isError: isCourseError,
  } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      if (!courseId) return null;

      try {
        const sql = `
          SELECT 
            p.id, 
            p.slug, 
            p.type, 
            p.thumbnail, 
            p.image_cover as imageUrl,
            (SELECT COUNT(DISTINCT jl.user_id) 
             FROM journeys_learners jl
             JOIN users u ON jl.user_id = u.id
             WHERE jl.last_accessed_program_id = p.id AND u.role_name = 'learner') as learnerCount,
            (SELECT COUNT(*) FROM assignments a 
             JOIN assignment_submissions s ON a.id = s.assignment_id 
             WHERE a.program_id = p.id and s.status != 'not_submitted') as totalTasks,
            (SELECT COUNT(*) FROM assignments a 
             JOIN assignment_submissions s ON a.id = s.assignment_id 
             WHERE a.program_id = p.id and s.status != 'not_submitted' and s.grade is not null) as scoredTasks,
            p.specifications as description
          FROM programs p
          WHERE p.id = '${courseId}' AND p.deleted_at IS NULL
        `;

        const result = await executeQuery(sql);

        if (!result.data.rows || result.data.rows.length === 0) {
          return null;
        }

        // Get the Journey ID for the program
        const journeyIdSql = `
          SELECT j.id FROM journeys j
          JOIN journey_programs jp ON j.id = jp.journey_id
          WHERE jp.program_id = '${courseId}'
        `;

        const journeyIdResult = await executeQuery(journeyIdSql);
        if (
          !journeyIdResult.data.rows ||
          journeyIdResult.data.rows.length === 0
        ) {
          return null;
        }
        const journeyId = journeyIdResult.data.rows[0][0];

        // get the learners count for the journey
        const learnersCountSql = `
          SELECT COUNT(*) 
          FROM journeys_learners jl
          WHERE jl.journey_id = '${journeyId}'
        `;

        const learnersCountResult = await executeQuery(learnersCountSql);
        const learnersCount = learnersCountResult.data.rows[0][0] || 0;

        const row = result.data.rows[0];
        return {
          id: row[0],
          title: row[1], // using slug as title
          description: row[8] || "No description available",
          totalTasks: row[6] || 0,
          scoredTasks: row[7] || 0,
          learnerCount: learnersCount || 0,
          imageUrl: "/images/placeholder-course.jpg", // Default placeholder image
          type: row[2],
          thumbnail: "/images/placeholder-course.jpg",
        } as Course;
      } catch (error) {
        console.error("Error fetching course data:", error);
        throw new Error(
          "Something went wrong while fetching course data. The server might be unavailable."
        );
      }
    },
    enabled: !!courseId,
  });

  // Fetch tasks for course
  const {
    data: tasks = [],
    isLoading: isTasksLoading,
    error: tasksError,
    isError: isTasksError,
  } = useQuery({
    queryKey: ["courseTasks", courseId],
    queryFn: async () => {
      if (!courseId) return [];

      try {
        const sql = `
           SELECT 
              a.id,
              a.program_id AS courseId,
              at.title,
              at.description,
              GREATEST((SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = a.id AND status != 'not_submitted'), 0) AS totalSubmissions,
              GREATEST((SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = a.id AND grade IS NOT NULL), 0) AS scoredSubmissions,
              GREATEST((SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = a.id AND status = 'not_submitted'), 0) AS pendingSubmissions,
              a.deadline AS dueDate,
              GREATEST((SELECT COUNT(DISTINCT student_id) FROM assignment_submissions WHERE assignment_id = a.id AND status != 'not_submitted' ), 0) AS uniqueSubmissions
            FROM assignments a
            LEFT JOIN (
              SELECT assignment_id, MAX(id) AS max_id
              FROM assignment_translations
              GROUP BY assignment_id
            ) at_max ON a.id = at_max.assignment_id
            LEFT JOIN assignment_translations at ON at_max.max_id = at.id
            WHERE a.program_id = '${courseId}' 
              AND a.deleted_at IS NULL
            ORDER BY a.deadline ASC
          `;

        const result = await executeQuery(sql);

        if (!result.data.rows) {
          return [];
        }

        const totalUniqueSubmissions = result.data.rows.reduce(
          (acc: any, row: any) => {
            return acc + Math.max(row[8] || 0, 0);
          },
          0
        );

        return result.data.rows.map(
          (row: any) =>
            ({
              id: row[0],
              courseId: row[1],
              title: row[2] || "Untitled Task",
              description: row[3] || "No description available",
              totalSubmissions: Math.max(row[4] || 0, 0),
              scoredSubmissions: Math.max(row[5] || 0, 0),
              pendingSubmissions: Math.max(row[6] || 0, 0),
              dueDate: row[7]
                ? new Date(row[7]).toISOString().split("T")[0]
                : null,
              uniqueSubmissions: Math.max(row[8] || 0, 0),
              totalUniqueSubmissions: totalUniqueSubmissions,
            } as Task)
        );
      } catch (error) {
        console.error("Error fetching tasks data:", error);
        throw new Error(
          "Something went wrong while fetching tasks data. The server might be unavailable."
        );
      }
    },
    enabled: !!courseId,
    staleTime: 0, // Always consider data stale to force refetch
    refetchOnWindowFocus: true,
  });

  // Calculate pending submissions
  const pendingTasks = tasks.reduce((acc: any, task: any) => {
    return acc + (task.totalSubmissions - task.scoredSubmissions);
  }, 0);

  const pendingSubmissions = tasks.reduce((acc: any, task: any) => {
    return acc + task.pendingSubmissions;
  }, 0);

  // Combine errors for easy checking in components
  const isError = isCourseError || isTasksError;
  const errorMessage = isCourseError
    ? (courseError as Error)?.message || "Failed to load course data"
    : isTasksError
    ? (tasksError as Error)?.message || "Failed to load tasks data"
    : "";

  const invalidateCourseData = () => {
    queryClient.invalidateQueries({ queryKey: ["course", courseId] });
    queryClient.invalidateQueries({ queryKey: ["courseTasks", courseId] });
  };

  return {
    course,
    tasks,
    pendingTasks,
    pendingSubmissions,
    isLoading: isCourseLoading || isTasksLoading,
    refetchCourse: refetch,
    isError,
    errorMessage,
    invalidateCourseData,
  };
};
