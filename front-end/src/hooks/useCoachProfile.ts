import { useQuery } from "@tanstack/react-query";
import { executeQuery } from "@/services/api";

export const useCoachProfile = (coachId: number | null) => {
  // Fetch coach profile data
  const {
    data: coachProfile,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
    error: profileError,
    isError: isProfileError,
  } = useQuery({
    queryKey: ["coachProfile", coachId],
    queryFn: async () => {
      if (!coachId) return null;

      const sql = `
        SELECT 
          full_name as fullName, 
          email, 
          mobile as phoneNumber,
          status
        FROM users
        WHERE id = ${coachId}
      `;

      const result = await executeQuery(sql);

       if (result.error) {
        return null;
       }

      if (!result.data.rows || result.data.rows.length === 0) {
        return null;
      }

      return result.data.rows.map((row: any) => {
        return {
          id: coachId,
          fullName: row[0],
          email: row[1],
          phoneNumber: row[2],
          status: row[3],
        };
      })[0];
    },
  });

  return {
    coachProfile,
    isProfileLoading,
    refetchProfile,
    profileError,
    isProfileError,
  };
}