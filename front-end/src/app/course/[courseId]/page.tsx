"use client";

import { useParams, useRouter } from "next/navigation";
import TaskCard from "@/components/TaskCard";
import ProgressChart from "@/components/ProgressChart";
import { ArrowLeft, Users, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCourseData } from "@/hooks/useCourseData";
import { Course, Task } from "@/types";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function CourseView() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const queryClient = useQueryClient();

  const {
    course,
    tasks,
    pendingTasks,
    isLoading,
    refetchCourse,
    invalidateCourseData,
  } = useCourseData(courseId);

  // Add placeholder image path
  const placeholderImage = "/images/placeholder-course.jpg";

  // Invalidate and refetch course data when the component mounts
  useEffect(() => {
    invalidateCourseData();
    refetchCourse();
  }, [courseId, invalidateCourseData, refetchCourse]);

  const CourseLoadingSkeleton = () => (
    <div className="space-y-6 bg-gray-300 animate-pulse">
      {/* Course header skeleton */}
      <div className="relative rounded-xl overflow-hidden mb-8 animate-pulse-slow">
        <div className="h-48 bg-muted"></div>
        <div className="absolute bottom-0 left-0 p-6 w-full">
          <div className="h-8 bg-muted rounded-md w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded-md w-3/4"></div>
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-5 rounded-xl bg-gray-200 animate-pulse-slow flex items-center"
          >
            <div className="w-12 h-12 rounded-full bg-muted-foreground/20 mr-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted-foreground/20 rounded w-24"></div>
              <div className="h-6 bg-muted-foreground/20 rounded w-12"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Tasks section skeleton */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="space-y-2">
            <div className="h-6 bg-muted rounded w-40"></div>
            <div className="h-4 bg-muted rounded w-64"></div>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="w-[100px] h-[100px] rounded-full bg-muted"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-40 bg-muted rounded-xl animate-pulse-slow"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10">
        <Button
          variant="ghost"
          className="mb-6 -ml-3 animate-fade-in"
          onClick={() => router.push("/course")}
          style={{ animationDelay: "0.1s" }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Button>

        {isLoading ? (
          <CourseLoadingSkeleton />
        ) : course ? (
          <>
            <div className="relative rounded-xl overflow-hidden mb-8 animate-fade-in">
              <div className="h-48 overflow-hidden">
                <img
                  src={placeholderImage}
                  alt={course.title}
                  className="w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = placeholderImage;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70" />
              </div>
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <h1 className="text-3xl font-bold">{course.title}</h1>
                <p className="text-white/80 mt-2 max-w-3xl">
                  {course.description}
                </p>
              </div>
            </div>

            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="glass-card p-5 rounded-xl flex items-center">
                <div className="mr-4 bg-primary/10 p-3 rounded-full">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Learners
                  </h3>
                  <p className="text-2xl font-semibold">
                    {course.learnerCount}
                  </p>
                </div>
              </div>

              <div className="glass-card p-5 rounded-xl flex items-center">
                <div className="mr-4 bg-primary/10 p-3 rounded-full">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Tasks Scored
                  </h3>
                  <p className="text-2xl font-semibold">
                    {course.scoredTasks}{" "}
                  </p>
                </div>
              </div>

              <div className="glass-card p-5 rounded-xl flex items-center">
                <div className="mr-4 bg-primary/10 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Pending
                  </h3>
                  <p className="text-2xl font-semibold">{pendingTasks} </p>
                </div>
              </div>
            </div>

            <div
              className="bg-white rounded-xl p-6 shadow-sm mb-8 animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                  <h2 className="text-2xl font-semibold">Course Tasks</h2>
                  <p className="text-muted-foreground mt-1">
                    Manage and grade tasks for this course
                  </p>
                </div>
                <div className="mt-4 md:mt-0">
                  <ProgressChart
                    completed={course.scoredTasks}
                    total={course.totalTasks}
                    size={100}
                    strokeWidth={8}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isLoading ? (
                  // Show loading skeleton cards
                  [...Array(4)].map((_, index) => (
                    <TaskCard
                      key={index}
                      task={{} as Task}
                      learnerCount={0}
                      isLoading={true}
                    />
                  ))
                ) : tasks.length > 0 ? (
                  tasks.map((task: Task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      learnerCount={course?.learnerCount || 0}
                      isLoading={false}
                    />
                  ))
                ) : (
                  <div className="col-span-2 p-12 text-center border rounded-xl border-dashed">
                    <h3 className="font-medium text-lg">No tasks found</h3>
                    <p className="text-muted-foreground mt-1">
                      This course doesn't have any tasks yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <h2 className="text-2xl font-bold mb-2">Course not found</h2>
            <p className="text-muted-foreground mb-6">
              The course you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push("/")}>
              Return to Dashboard
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
