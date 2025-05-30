import { useQuery } from "@tanstack/react-query";
import { Course } from "@/types";
import { executeQuery } from "@/services/api";
import { useCoachStore } from "@/store/useCoachStore";

export const useCoachCourses = () => {
  const { coachId } = useCoachStore();

  // Fetch all courses where the logged-in user is a coach
  const {
    data: courses = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["coachCourses", coachId],
    queryFn: async () => {
      if (!coachId) return [];

      const sql = `
        SELECT 
          p.id, 
          p.slug as title, 
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
        WHERE p.coach_id = '${coachId}' 
        ORDER BY p.created_at DESC
      `;

      const result = await executeQuery(sql);

      if (!result.data.rows) {
        return [];
      }

      console.log("Fetched ", result);
      

      return result.data.rows.map(
        (row: any) =>
          ({
            id: row[0],
            title: row[1],
            description: row[8] || "No description available",
            totalTasks: row[6] || 0,
            scoredTasks: row[7] || 0,
            learnerCount: row[5] || 0,
            imageUrl: "/images/placeholder-course.jpg",
            type: row[2],
            thumbnail: row[3],
          } as Course)
      );
    },
    enabled: !!coachId,
  });

  // Calculate total stats across all courses
  const totalStats = courses.reduce(
    (acc: any, course: any) => {
      return {
        totalTasks: acc.totalTasks + course.totalTasks,
        scoredTasks: acc.scoredTasks + course.scoredTasks,
        totalLearners: acc.totalLearners + course.learnerCount,
        pendingTasks:
          acc.pendingTasks + (course.totalTasks - course.scoredTasks),
      };
    },
    {
      totalTasks: 0,
      scoredTasks: 0,
      totalLearners: 0,
      pendingTasks: 0,
    }
  );

  // Get courses with pending tasks to display in the dashboard
  const pendingTasksByCourse = courses
    .filter((course: any) => course.totalTasks > course.scoredTasks)
    .map((course: any) => ({
      course: course.title,
      pending: course.totalTasks - course.scoredTasks,
    }))
    .sort((a: any, b: any) => b.pending - a.pending); // Sort by most pending tasks first

  console.log("pendingTasksByCourse", pendingTasksByCourse);

  console.log("Total Stats", totalStats);
  console.log("Courses", courses);

  return {
    courses,
    totalStats,
    pendingTasksByCourse,
    isLoading,
    isError,
    error,
    refetch,
  };
};
