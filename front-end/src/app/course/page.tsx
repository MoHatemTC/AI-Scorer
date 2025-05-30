"use client";

import { useState } from "react";
import { useCoachJourneys } from "@/hooks/useCoachJourneys";
import Link from "next/link";
import { useCoachStore } from "@/store/useCoachStore";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, UserCog2 } from "lucide-react";

export default function CoursesPage() {
  const { coachId } = useCoachStore();
  const [selectedJourneyId, setSelectedJourneyId] = useState<
    string | undefined
  >();

  const {
    journeys,
    isJourneysLoading,
    programs,
    isProgramsLoading,
    journeysError,
    programsError,
    journeysErrorMessage,
    programsErrorMessage,
    isTasksForProgramsLoading,
    tasksForProgramsError,
    tasksForPrograms,
    isTasksForJourneysLoading,
    tasksForJourneysError,
  } = useCoachJourneys(coachId || "", selectedJourneyId);

  const handleJourneyClick = (journeyId: string) => {
    setSelectedJourneyId(journeyId);
  };

  console.log("tasksForPrograms", tasksForPrograms);

  if (journeysError) {
    return (
      <div className="mt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold mb-6">My Journeys</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
            <p className="font-semibold">Error</p>
            <p>
              {journeysErrorMessage ||
                "An unexpected error occurred while fetching journeys. Please try again later."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold mb-6">My Journeys</h1>

        {isJourneysLoading || isTasksForJourneysLoading ? (
          <p>Loading journeys...</p>
        ) : journeys && journeys.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {journeys.map((journey) => (
              <div
                key={journey.id}
                className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 shadow-sm transition-all min-h-[160px] flex flex-col justify-between ${
                  selectedJourneyId === journey.id
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : ""
                }`}
                onClick={() => handleJourneyClick(journey.id)}
              >
                <div className="overflow-hidden">
                  <h2 className="text-lg font-semibold truncate">
                    {journey.title}
                  </h2>
                  {journey.description && (
                    <p className="text-gray-600 mt-2 text-sm line-clamp-3 overflow-ellipsis">
                      {journey.description}
                    </p>
                  )}
                  <p className="text-gray-500 mt-2 text-sm">
                    {journey.learners} Learners
                  </p>
                </div>
                <div className="mt-3 pt-2 flex gap-4 justify-between flex-wrap">
                  {tasksForJourneysError ? (
                    <Badge variant="destructive">Error</Badge>
                  ) : journey.pendingAssignmentsCount ? (
                    <Badge
                      variant="outline"
                      className="text-xs bg-red-600 text-white"
                    >
                      <UserCog2 className="w-4 h-4 mr-1" />
                      {journey.pendingAssignmentsCount} Pending
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      <UserCog2 className="w-4 h-4 mr-1" />
                      No Pending
                    </Badge>
                  )}
                  {journey.scoredAssignmentsCount ? (
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {journey.scoredAssignmentsCount} Scored
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      No Scored
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No journeys found.</p>
        )}

        {selectedJourneyId && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">
              Programs in Selected Journey
            </h2>
            {programsError ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
                <p className="font-semibold">Error</p>
                <p>
                  {programsErrorMessage ||
                    "An unexpected error occurred while fetching programs. Please try again later."}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                >
                  Retry
                </button>
              </div>
            ) : isProgramsLoading ? (
              <p>Loading programs...</p>
            ) : programs && programs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {programs.map((program) => (
                  <Link
                    key={program.id}
                    href={`/course/${program.id}`}
                    className="p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <h3 className="font-semibold">{program.title}</h3>
                      {program.description && (
                        <p className="text-sm text-gray-600 mt-2">
                          {program.description}
                        </p>
                      )}
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="capitalize">{program.type}</span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                          {program.status}
                        </span>
                      </div>
                      {(program.startDate || program.endDate) && (
                        <p className="text-sm text-gray-500 mt-2">
                          {program.startDate &&
                            `From: ${new Date(
                              program.startDate
                            ).toLocaleDateString()}`}
                          {program.endDate &&
                            ` To: ${new Date(
                              program.endDate
                            ).toLocaleDateString()}`}
                        </p>
                      )}
                      {isTasksForProgramsLoading ? (
                        <div className="mt-2 animate-pulse flex space-x-2">
                          <div className="h-6 w-20 bg-gray-200 rounded"></div>
                          <div className="h-6 w-20 bg-gray-200 rounded"></div>
                        </div>
                      ) : tasksForProgramsError ? (
                        <Badge
                          variant="destructive"
                          className="mt-2"
                        >
                          Error
                        </Badge>
                      ) : (
                        <div className="mt-2 flex gap-4 justify-between flex-wrap">
                          {tasksForPrograms?.pendingAssignmentsByProgram[
                            program.id
                          ] ? (
                            <Badge
                              className="text-xs bg-red-600 text-white"
                              aria-label={`${
                                tasksForPrograms.pendingAssignmentsByProgram[
                                  program.id
                                ]
                              } pending submission${
                                tasksForPrograms.pendingAssignmentsByProgram[
                                  program.id
                                ] > 1
                                  ? "s"
                                  : ""
                              }`}
                            >
                              <UserCog2 className="w-4 h-4 mr-1" />
                              {
                                tasksForPrograms.pendingAssignmentsByProgram[
                                  program.id
                                ]
                              }{" "}
                              pending
                              {tasksForPrograms.pendingAssignmentsByProgram[
                                program.id
                              ] > 1
                                ? " submissions"
                                : " submission"}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-xs"
                              aria-label="No pending submissions"
                            >
                              <UserCog2 className="w-4 h-4 mr-1" />
                              No pending
                            </Badge>
                          )}
                          {tasksForPrograms?.totalScoredAssignmentsByProgram[
                            program.id
                          ] ? (
                            <Badge
                              variant="outline"
                              className="text-xs"
                              aria-label={`${
                                tasksForPrograms
                                  .totalScoredAssignmentsByProgram[program.id]
                              } scored submission${
                                tasksForPrograms
                                  .totalScoredAssignmentsByProgram[program.id] >
                                1
                                  ? "s"
                                  : ""
                              }`}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {
                                tasksForPrograms
                                  .totalScoredAssignmentsByProgram[program.id]
                              }{" "}
                              scored
                              {tasksForPrograms.totalScoredAssignmentsByProgram[
                                program.id
                              ] > 1
                                ? " submissions"
                                : " submission"}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-xs"
                              aria-label="No scored submissions"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              No scored
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p>No programs found for this journey.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
