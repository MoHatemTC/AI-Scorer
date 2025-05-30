import { useQuery } from "@tanstack/react-query";
import { Task, Course } from "@/types";
import { executeQuery } from "@/services/api";

export const useTaskData = (
  taskId: string | undefined,
  courseId: string | undefined
) => {
  // Fetch assignment (task) data
  const { data: task, isLoading: isTaskLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      if (!taskId) return null;

      const sql = `
        SELECT 
          a.id,
          a.program_id,
          at.title,
          at.description,
          (SELECT COUNT(*) FROM assignment_submissions s WHERE assignment_id = a.id and s.status != 'not_submitted') as totalSubmissions,
          (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = a.id AND grade is not null) as scoredSubmissions,
          deadline as dueDate,
          grade as maxPoints,
          scope_evaluation,
          quality_evaluation,
          type,
          submission_types
        FROM assignments a
        LEFT JOIN (
            SELECT assignment_id, MAX(id) AS max_id
            FROM assignment_translations
            GROUP BY assignment_id
          ) at_max ON a.id = at_max.assignment_id
          LEFT JOIN assignment_translations at ON at_max.max_id = at.id
        WHERE a.id = '${taskId}' AND deleted_at IS NULL
      `;

      const result = await executeQuery(sql);

      if (!result.data.rows || result.data.rows.length === 0) {
        return null;
      }

      const row = result.data.rows[0];

      // Parse JSON fields if they exist
      let deliveryRubric = [];
      let qualityRubric = [];

      try {
        if (row[8]) {
          // scope_evaluation
          deliveryRubric = JSON.parse(row[8]);
        }
      } catch (e) {
        console.warn("Failed to parse scope_evaluation JSON:", e);
      }

      try {
        if (row[9]) {
          // quality_evaluation
          qualityRubric = JSON.parse(row[9]);
        }
      } catch (e) {
        console.warn("Failed to parse quality_evaluation JSON:", e);
      }

      return {
        id: row[0],
        courseId: row[1], // program_id in your schema
        title: row[2] || "Untitled Task",
        description: row[3] || "No description available",
        totalSubmissions: row[4],
        scoredSubmissions: row[5],
        maxPoints: row[7],
        deliveryRubric,
        qualityRubric,
        type: row[10],
        submissionTypes: row[11],
      } as Task;
    },
    enabled: !!taskId,
  });

  // Fetch course data
  const { data: course, isLoading: isCourseLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      if (!courseId) return null;

      const sql = `
        SELECT 
          id, 
          slug, 
          type, 
          thumbnail, 
          image_cover as imageUrl,
          capacity as learnerCount,
          (SELECT COUNT(*) FROM assignments WHERE program_id = programs.id AND deleted_at IS NULL) as totalTasks,
          (SELECT COUNT(*) FROM assignments a 
           JOIN assignment_submissions s ON a.id = s.assignment_id 
           WHERE a.program_id = programs.id AND s.status = 'graded') as scoredTasks,
          specifications as description
        FROM programs
        WHERE id = '${courseId}' AND deleted_at IS NULL
      `;

      const result = await executeQuery(sql);

      if (!result.data.rows || result.data.rows.length === 0) {
        return null;
      }

      const row = result.data.rows[0];
      return {
        id: row[0],
        title: row[1], // using slug as title
        description: row[8],
        totalTasks: row[6],
        scoredTasks: row[7],
        learnerCount: row[5],
        imageUrl: row[4],
        type: row[2],
        thumbnail: row[3],
      } as Course;
    },
    enabled: !!courseId,
  });

  // Fetch Users who submitted the task

  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ["users", taskId],
    queryFn: async () => {
      if (!taskId) return null;

      const sql = `
        SELECT 
          u.id,
          u.full_name as fullName,
          u.email,
          u.avatar as profilePicture,
          s.status,
          s.grade,
          sd.submissions,
          sd.id
        FROM assignment_submissions s
        JOIN users u ON s.student_id = u.id
        JOIN assignment_submission_data sd ON s.id = sd.assignment_submission_id
        WHERE s.assignment_id = '${taskId}'
      `;

      const result = await executeQuery(sql);

      if (!result.data.rows || result.data.rows.length === 0) {
        return null;
      }

      return result.data.rows.map((row: any) => {
        const submissionData = row[6];
        let filePath = null;

        try {
          const parsed = JSON.parse(submissionData);
          // Find the first key in the parsed object and get the first file path
          const submissionKey = Object.keys(parsed)[0];
          if (submissionKey && Array.isArray(parsed[submissionKey])) {
            filePath = parsed[submissionKey][0] || null;
          }
        } catch (error) {
          console.error("Failed to parse submission data:", error);
        }

        return {
          id: row[0],
          fullName: row[1],
          email: row[2],
          profilePicture: row[3] || null,
          status: row[4],
          grade: row[5] || null,
          submissions: filePath
            ? `https://sprintscdn-fnh2cugtb8a4deba.z02.azurefd.net/production/${filePath.replace(
                /^\/?/,
                ""
              )}`
            : null,
          submissionId: row[7] || null,
        };
      });
    },
    enabled: !!taskId,
  });

  return {
    task,
    course,
    isLoading: isTaskLoading || isCourseLoading,
    users,
    isUsersLoading,
  };
};
