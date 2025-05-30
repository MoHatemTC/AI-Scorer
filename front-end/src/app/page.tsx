// Home.tsx
"use client";

import { useEffect } from "react";
import { useCoachStore } from "@/store/useCoachStore";
import { useRouter } from "next/navigation";
import { useCoachDashboard } from "@/hooks/useCoachDashboard";
import Link from "next/link";
import {
  ClipboardCheck,
  Users,
  BookOpen,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const { isLoggedIn, coachId, hydrated } = useCoachStore();
  const router = useRouter();

  const {
    stats: dashboardStats,
    journeysSummary,
    isLoading: isDashboardLoading,
    pendingAssignmentsCount,
    scoredAssignmentsCount,
    totalAssignmentsCount,
    assignmentsTranslations,
    error,
    errorMessage,
  } = useCoachDashboard(coachId || "");

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn && hydrated) {
      router.push("/login");
    }
  }, [isLoggedIn, router]);

  // Render error message if there's an error
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10">
          <header className="mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Coach Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your journeys, courses, and learners
            </p>
          </header>
          <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-xl animate-fade-in">
            <p className="font-semibold">Error</p>
            <p>
              {errorMessage ||
                "An unexpected error occurred. Please try again later."}
            </p>
          </div>
        </main>
      </div>
    );
  }

  const isLoading = isDashboardLoading;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10">
        <header className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Coach Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your journeys, courses, and learners
          </p>
        </header>

        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          {/* Summary Cards */}
          <Card className="border border-border/50 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 flex flex-col">
              <div className="rounded-full bg-primary/10 p-2 w-fit mb-4">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Total Journeys
              </h3>
              <p className="text-3xl font-bold text-foreground">
                {isLoading ? "..." : dashboardStats.totalJourneys}
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/50 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 flex flex-col">
              <div className="rounded-full bg-primary/10 p-2 w-fit mb-4">
                <ClipboardCheck className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Tasks Scored
              </h3>
              <p className="text-3xl font-bold text-foreground">
                {isLoading ? "..." : scoredAssignmentsCount + " "}
                <span className="text-sm font-normal text-muted-foreground">
                  / {isLoading ? "..." : totalAssignmentsCount }
                </span>
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/50 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 flex flex-col">
              <div className="rounded-full bg-primary/10 p-2 w-fit mb-4">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Total Learners
              </h3>
              <p className="text-3xl font-bold text-foreground">
                {isLoading ? "..." : dashboardStats.totalLearners}
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/50 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 flex flex-col">
              <div className="rounded-full bg-primary/10 p-2 w-fit mb-4">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Pending Tasks
              </h3>
              <p className="text-3xl font-bold text-foreground">
                {isLoading ? "..." : pendingAssignmentsCount}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8">
          <div
            className="animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            <Card className="border border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-foreground">
                    Pending Tasks
                  </h2>
                  <span className="text-sm font-medium text-muted-foreground">
                    {isLoading
                      ? "..."
                      : `${pendingAssignmentsCount} tasks pending`}
                  </span>
                </div>
                <div className="space-y-4">
                  {assignmentsTranslations.length > 0 ? (
                    assignmentsTranslations.map((item: any) => (
                      <Link
                        key={item.id}
                        href={`/course/${item.courseId}/task/${item.id}`}
                        className="block group"
                      >
                        <div className="flex items-center justify-between p-4 bg-muted/50 border border-border rounded-lg hover:bg-primary/5 hover:border-primary/20 transition-all duration-200">
                          <div className="flex items-center space-x-3">
                            <span className="text-primary">
                              <ClipboardCheck className="h-5 w-5" />
                            </span>
                            <span className="font-medium text-sm text-foreground line-clamp-1">
                              {item.title}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                              {item.count} pending
                            </span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : isLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, index) => (
                        <div
                          key={index}
                          className="p-4 bg-gray-50/50 border border-border rounded-lg animate-pulse"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-5 h-5 bg-gray-200 rounded-full" />
                              <div className="h-4 bg-gray-200 rounded w-3/4" />
                            </div>
                            <div className="h-4 bg-gray-200 rounded w-16" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="mx-auto h-12 w-12 text-muted-foreground bg-muted/50 rounded-full flex items-center justify-center">
                        <ClipboardCheck className="h-6 w-6" />
                      </div>
                      <p className="text-muted-foreground text-sm mt-2">
                        No pending tasks
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {journeysSummary && journeysSummary.length > 0 && (
          <Card
            className="border border-border/50 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-foreground">
                Journey Learners
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                      >
                        Journey
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                      >
                        Total Learners
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {journeysSummary.map((journey, index) => (
                      <tr
                        key={journey.journeyId}
                        className={index % 2 === 0 ? "bg-card" : "bg-muted/20"}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                          {journey.journeyTitle}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {journey.learnersCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
