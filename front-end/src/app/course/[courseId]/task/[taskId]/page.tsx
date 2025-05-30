"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useRef } from "react";
import { ArrowLeft, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTaskData } from "@/hooks/useTaskData";
import UsersList from "@/components/UsersList";
import { useUsers } from "@/hooks/useUsers";
import { Textarea } from "@/components/ui/textarea";
import { Task, User } from "@/types";
import TaskDescription from "@/components/TaskDescription";
import RubricSection from "@/components/RubricSection";
import { Card, CardContent } from "@/components/ui/card";
import * as XLSX from "xlsx";

interface GeneratedCriterion {
  name: string;
  weight: number;
  levels: Array<{
    description: string;
    range: [number, number];
  }>;
}

interface GeneratedRubric {
  rubric: GeneratedCriterion[];
}

interface GradingResults {
  user_id: string;
  scope_score: number;
  scope_comment: string;
  quality_score: number;
  quality_comment: string;
}

interface NewGradingResult {
  user_id: number;
  scope: {
    criteria: Array<{
      name: string;
      grade: number;
      chosen_level: number;
      comment: string;
    }>;
    overall_grade: number;
    overall_comment: string;
  };
  quality: {
    criteria: Array<{
      name: string;
      grade: number;
      chosen_level: number;
      comment: string;
    }>;
    overall_grade: number;
    overall_comment: string;
  };
}

export default function TaskSubmissionsPage() {
  const router = useRouter();
  const params = useParams();

  const courseId = params.courseId as string;
  const taskId = params.taskId as string;

  const [deliverableRubric, setDeliverableRubric] = useState<
    GeneratedCriterion[] | null
  >(null);
  const [qualityRubric, setQualityRubric] = useState<
    GeneratedCriterion[] | null
  >(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [solutionText, setSolutionText] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [grading, setGrading] = useState(false);
  const [gradingResults, setGradingResults] = useState<NewGradingResult[] | null>(
    null
  );
  const [currentResultIndex, setCurrentResultIndex] = useState<number>(0);
  const [gradedUsers, setGradedUsers] = useState<User[] | null>(null);
  const [savingRubrics, setSavingRubrics] = useState(false);
  const [solutionUrl, setSolutionUrl] = useState<string | null>(null);
  const [isSolutionUrl, setIsSolutionUrl] = useState(false);

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  const generateRubrics = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${BASE_URL}/generate_rubric`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          task_id: taskId,
          task_description: task?.description,
        }),
      });
      if (!res.ok) {
        console.log("Error:", res);
      }
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const text = await res.text();
        console.error("Expected JSON, got:", text);
        return;
      }
      const data = await res.json();

      console.log("Generated rubrics:", data);

      setDeliverableRubric(data.rubric.Scope || null);
      setQualityRubric(data.rubric.Quality || null);
      toast.success("Rubrics generated successfully!");
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const saveRubricsToDatabase = async () => {
    if (!deliverableRubric || !qualityRubric) {
      toast.error("Rubrics not generated yet. Please generate them first.");
      return;
    }
    setSavingRubrics(true);
    try {
      const res = await fetch(`${BASE_URL}/save_rubric`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          task_id: taskId,
          deliverable_rubric: JSON.stringify(deliverableRubric),
          quality_rubric: JSON.stringify(qualityRubric),
        }),
      });
      if (!res.ok) {
        console.log("Error:", res);
      }
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const text = await res.text();
        console.error("Expected JSON, got:", text);
        return;
      }
      const data = await res.json();
      toast.success("Rubrics saved successfully!");
    } catch (err) {
      console.error(err);
    } finally {
      setSavingRubrics(false);
    }
  };

  const gradingSelectedUsers = async () => {
    if (selectedUsers.length === 0) {
      toast.error("No users selected for grading.");
      return;
    }
    if (selectedUsers.length > 3) {
      toast.error("Please select at most three users for grading.");
      return;
    }
    // if (selectedUsers[0].status == "passed" || selectedUsers[0].status == "not_passed" ) {
    //   toast.error("This user has already been graded. Please select another user.");
    //   return;
    // }
    // if (!solutionText && !solutionUrl) {
    //   toast.error(
    //     "No solution provided. Please upload a file or provide a URL."
    //   );
    //   return;
    // }
    // if (solutionText && solutionUrl) {
    //   toast.error("Please provide either a file or a URL, not both.");
    //   return;
    // }
    // if (solutionUrl) {
    //   const urlPattern = /^(https?:\/\/).*\.py$/;
    //   if (!urlPattern.test(solutionUrl)) {
    //     toast.error("Please provide a valid URL to a .py file.");
    //     return;
    //   }
    // }
    if (!deliverableRubric || !qualityRubric) {
      toast.error("Rubrics not generated yet. Please generate them first.");
      return;
    }

    const user = selectedUsers[0];
    setGradedUsers(user ? [user] : null);
    setGradingResults(null);
    setCurrentResultIndex(0);
    setGradedUsers(selectedUsers);
    toast.info("Grading in progress. Please wait...");

    setGrading(true);
    try {
      const res = await fetch(`${BASE_URL}/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          task_description: task?.description,
          scope_rubric: JSON.stringify(deliverableRubric),
          requirements_rubric: JSON.stringify(qualityRubric),
          ...(solutionText
            ? { solution: solutionText }
            : { solution_url: solutionUrl }),
          journey_name: task?.title,
          users: selectedUsers,
        }),
      });

      if (!res.ok) {
        console.log("Error:", res);
        toast.error("Error grading submissions. Please try again.");
        return;
      }
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const text = await res.text();
        console.error("Expected JSON, got:", text);
        return;
      }
      const data = await res.json();
      console.log("Grading data:", data);

      toast.success("Grading completed successfully!");
      setGradingResults(data);
    } catch (err) {
      console.error(err);
      toast.error("Error grading submissions. Please try again.");
    } finally {
      setGrading(false);
    }
  };

  const {
    filteredUsers,
    selectedUsers,
    searchQuery: userSearchQuery,
    setSearchQuery: setUserSearchQuery,
    isLoading: isUsersLoading,
    handleViewUser,
    handleSelectAll: handleSelectAllUsers,
    handleSelectUser,
  } = useUsers(taskId);

  const {
    task,
    course,
    isLoading: isTaskDataLoading,
  } = useTaskData(taskId, courseId);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSolutionText(reader.result as string);
      };
      reader.readAsText(file);
    }
  };

  const isLoading = isTaskDataLoading;

  // Add a function to handle exporting results to Excel
  const handleExportResults = () => {
    if (!gradingResults || !gradedUsers) {
      toast.error("No grading results to export");
      return;
    }

    try {
      const exportData = gradingResults.map((result) => {
        const user = gradedUsers.find(
          (u) => u.id.toString() === result.user_id.toString()
        );

        return {
          user_id: result.user_id,
          user_name: user?.fullName || "Unknown Username",
          user_email: user?.email || "Unknown Email",
          task_id: taskId,
          scope_overall_grade: result.scope.overall_grade,
          scope_overall_comment: result.scope.overall_comment,
          quality_overall_grade: result.quality.overall_grade,
          quality_overall_comment: result.quality.overall_comment,
          // Add individual criteria scores
          scope_criteria: result.scope.criteria.map(c => `${c.name}: ${c.grade} - ${c.comment}`).join(' | '),
          quality_criteria: result.quality.criteria.map(c => `${c.name}: ${c.grade} - ${c.comment}`).join(' | '),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Grading Results");

      const maxWidth = 50;
      const colWidths: { [key: string]: number } = {};

      exportData.forEach((row: any) => {
        Object.keys(row).forEach((key: any) => {
          const value = String(row[key]);
          colWidths[key] = Math.min(
            Math.max(colWidths[key] || 0, value.length),
            maxWidth
          );
        });
      });

      worksheet["!cols"] = Object.keys(exportData[0]).map((key) => ({
        wch: Math.max(key.length, colWidths[key] || 10),
      }));

      XLSX.writeFile(
        workbook,
        `grading-results-${taskId}-${
          new Date().toISOString().split("T")[0]
        }.xlsx`
      );

      toast.success("Grading results exported successfully");
    } catch (error) {
      console.error("Error exporting results:", error);
      toast.error("Failed to export grading results");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10">
        <Button
          variant="ghost"
          className="mb-6 -ml-3 animate-fade-in"
          onClick={() => router.push(`/course/${courseId}`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Course
        </Button>

        {isLoading ? (
          <div className="space-y-6">
            <div className="h-24 bg-muted rounded-xl animate-pulse-slow"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-muted rounded-xl animate-pulse-slow"></div>
              <div className="h-96 bg-muted rounded-xl animate-pulse-slow"></div>
            </div>
          </div>
        ) : task && course ? (
          <>
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6 animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h2 className="text-2xl font-semibold">{task.title}</h2>
                  <p className="text-muted-foreground mt-1">{course.title}</p>
                </div>
                <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="text-sm"
                    onClick={handleExportResults}
                    disabled={!gradingResults || gradingResults.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  {/* <Button
                    variant="outline"
                    className="text-sm cursor-pointer"
                    onClick={() => {
                      setIsSolutionUrl(!isSolutionUrl);
                      setSolutionText("");
                      setSolutionUrl(null);
                    }}
                  >
                    {isSolutionUrl ? "Use File" : "Use URL"}
                  </Button> */}
                </div>
              </div>
            </div>

            {/* <div className="mt-6">
              <h3 className="text-lg font-medium">Solution</h3>
              {isSolutionUrl ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Enter URL to Python file"
                    value={solutionUrl || ""}
                    onChange={(e) => setSolutionUrl(e.target.value)}
                    className="w-full mt-2 p-2 border rounded-md"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="text-sm cursor-pointer"
                    onClick={handleImportClick}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </Button>
                  <input
                    type="file"
                    accept=".txt,.py"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              )}
              {!isSolutionUrl && solutionText && (
                <div className="mt-4">
                  <h4 className="text-md font-medium">Solution Content</h4>
                  <Textarea
                    className="w-full mt-2"
                    value={solutionText}
                    onChange={(e) => setSolutionText(e.target.value)}
                    rows={10}
                  />
                </div>
              )}
            </div> */}

            <div className="space-y-6">
              <Button
                onClick={generateRubrics}
                disabled={generating}
                className="animate-fade-in mt-4 bg-blue-700 text-white hover:bg-blue-600 cursor-pointer"
              >
                Get / Generate Rubrics
              </Button>

              <TaskDescription
                title="Task Description"
                description={task.description}
                isLoading={isLoading}
              />

              {deliverableRubric && (
                <RubricSection
                  items={deliverableRubric}
                  header="Deliverable Rubric"
                  isLoading={isLoading}
                  onItemsChange={(newItems) => {
                    setDeliverableRubric([...newItems]);
                  }}
                />
              )}

              {qualityRubric && (
                <RubricSection
                  header="Quality Rubric"
                  items={qualityRubric}
                  isLoading={isLoading}
                  onItemsChange={(newItems) => setQualityRubric([...newItems])}
                />
              )}

              {deliverableRubric && qualityRubric && (
                <Button
                  onClick={saveRubricsToDatabase}
                  disabled={generating || savingRubrics}
                  className="animate-fade-in bg-blue-700 text-white hover:bg-blue-600 cursor-pointer"
                >
                  Save Rubrics to Database
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              <div
                className="lg:col-span-2 space-y-6 animate-fade-in"
                style={{ animationDelay: "0.1s" }}
              >
                <UsersList
                  filteredUsers={filteredUsers}
                  selectedUsers={selectedUsers}
                  searchQuery={userSearchQuery}
                  onSearchChange={setUserSearchQuery}
                  onSelectAll={handleSelectAllUsers}
                  onSelectUser={handleSelectUser}
                  onViewUser={handleViewUser}
                  isLoading={isUsersLoading}
                />
              </div>

              <div
                className="animate-fade-in flex flex-col gap-1.5"
                style={{ animationDelay: "0.2s" }}
              >
                <Card className="p-6 shadow-sm">
                  <CardContent className="space-y-4">
                    <h3 className="text-lg font-medium">Grading</h3>
                    {selectedUsers.length > 0 ? (
                      <div className="text-lg font-medium">
                        Selected Users Names:
                        {selectedUsers.map((user, idx) => (
                          <p key={idx}>{user.fullName}</p>
                        ))}
                        <p>Total Selected Users: {selectedUsers.length}</p>
                      </div>
                    ) : (
                      <p>No users selected</p>
                    )}
                    <Button
                      onClick={gradingSelectedUsers}
                      disabled={grading || selectedUsers.length === 0}
                      className="animate-fade-in bg-blue-700 text-white hover:bg-blue-600 cursor-pointer"
                    >
                      {grading ? "Grading..." : "Grade Selected Users"}
                    </Button>
                  </CardContent>
                </Card>
                {gradingResults && gradingResults.length > 0 && gradedUsers && (
                  <GradingResults
                    results={gradingResults}
                    currentIndex={currentResultIndex}
                    onChangeIndex={setCurrentResultIndex}
                    taskId={taskId}
                    gradedUsers={gradedUsers}
                    onChange={(updatedResult) => {
                      const newResults = [...gradingResults];
                      newResults[currentResultIndex] = updatedResult;
                      setGradingResults(newResults);
                    }}
                  />
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <h2 className="text-2xl font-bold mb-2">Task not found</h2>
            <p className="text-muted-foreground mb-6">
              The task you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push(`/course/${courseId}`)}>
              Return to Course
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

interface GradingResultsProps {
  results: NewGradingResult[];
  currentIndex: number;
  onChangeIndex: (index: number) => void;
  taskId: string;
  gradedUsers: User[];
  onChange: (updatedResult: NewGradingResult) => void;
}

function GradingResults({
  results,
  currentIndex,
  onChangeIndex,
  taskId,
  gradedUsers,
  onChange,
}: GradingResultsProps) {
  const currentResult = results[currentIndex];

  const currentUser = gradedUsers.find(
    (user) => user.id.toString() === currentResult.user_id.toString()
  );

  const handleScopeGradeChange = (value: number) => {
    onChange({ 
      ...currentResult, 
      scope: { 
        ...currentResult.scope, 
        overall_grade: Math.max(0, Math.min(100, value)) 
      } 
    });
  };

  const handleQualityGradeChange = (value: number) => {
    onChange({ 
      ...currentResult, 
      quality: { 
        ...currentResult.quality, 
        overall_grade: Math.max(0, Math.min(100, value)) 
      } 
    });
  };

  const handleScopeCommentChange = (value: string) => {
    onChange({ 
      ...currentResult, 
      scope: { 
        ...currentResult.scope, 
        overall_comment: value 
      } 
    });
  };

  const handleQualityCommentChange = (value: string) => {
    onChange({ 
      ...currentResult, 
      quality: { 
        ...currentResult.quality, 
        overall_comment: value 
      } 
    });
  };

  // Handle individual criterion changes for scope
  const handleScopeCriterionChange = (index: number, field: string, value: any) => {
    const newCriteria = [...currentResult.scope.criteria];
    newCriteria[index] = {
      ...newCriteria[index],
      [field]: field === 'chosen_level' ? Number(value) : value
    };
    
    onChange({
      ...currentResult,
      scope: {
        ...currentResult.scope,
        criteria: newCriteria
      }
    });
  };

  // Handle individual criterion changes for quality
  const handleQualityCriterionChange = (index: number, field: string, value: any) => {
    const newCriteria = [...currentResult.quality.criteria];
    newCriteria[index] = {
      ...newCriteria[index],
      [field]: field === 'chosen_level' ? Number(value) : value
    };
    
    onChange({
      ...currentResult,
      quality: {
        ...currentResult.quality,
        criteria: newCriteria
      }
    });
  };

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  const handleSaveChanges = () => {
    if (!currentUser) {
      toast.error("No user found that matches the result ID.");
      return;
    }
    
    const updatedResults = {
      user_id: currentResult.user_id,
      scope_overall_grade: currentResult.scope.overall_grade,
      scope_overall_comment: currentResult.scope.overall_comment,
      quality_overall_grade: currentResult.quality.overall_grade,
      quality_overall_comment: currentResult.quality.overall_comment,
      taskId: taskId,
      user: currentUser,
      scope_criteria: currentResult.scope.criteria,
      quality_criteria: currentResult.quality.criteria,
    };

    fetch(`${BASE_URL}/save_grading_results`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(updatedResults),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to save grading results");
        }
        return res.json();
      })
      .then((data) => {
        toast.success(data.message || "Grading results saved");
      })
      .catch((error) => {
        console.error("Error saving grading results:", error);
        toast.error("Error saving grading results. Please try again.");
      });
  };

  // Add function to export individual user grading report
  const handleExportUserReport = () => {
    if (!currentUser || !currentResult) {
      toast.error("No user data to export");
      return;
    }

    try {
      // Create the exact structure as shown in the image
      const exportData = [];

      // Scope Grading Report Header
      exportData.push(["Scope Grading Report", "", "", ""]);
      exportData.push(["Criteria", "Grade", "Chosen Level", "Comment"]);
      
      // Add scope criteria
      currentResult.scope.criteria.forEach((criterion) => {
        exportData.push([
          criterion.name,
          criterion.grade,
          criterion.chosen_level,
          criterion.comment
        ]);
      });
      
      // Add scope overall grade and comment
      exportData.push(["Overall Grade", currentResult.scope.overall_grade, "", ""]);
      exportData.push(["Overall Comment", "", "", currentResult.scope.overall_comment]);
      
      // Empty row
      exportData.push(["", "", "", ""]);
      
      // Quality Grading Report Header
      exportData.push(["Quality Grading Report", "", "", ""]);
      exportData.push(["Criteria", "Grade", "Chosen Level", "Comment"]);
      
      // Add quality criteria
      currentResult.quality.criteria.forEach((criterion) => {
        exportData.push([
          criterion.name,
          criterion.grade,
          criterion.chosen_level,
          criterion.comment
        ]);
      });
      
      // Add quality overall grade and comment
      exportData.push(["Overall Grade", currentResult.quality.overall_grade, "", ""]);
      exportData.push(["Overall Comment", "", "", currentResult.quality.overall_comment]);
      
      // Empty rows at the end
      exportData.push(["", "", "", ""]);
      exportData.push(["", "", "", ""]);

      // Create workbook and worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      
      // Set column widths
      worksheet["!cols"] = [
        { wch: 30 }, // Criteria column
        { wch: 10 }, // Grade column
        { wch: 40 }, // Chosen Level column
        { wch: 50 }  // Comment column
      ];

      // Style the headers
      const scopeHeaderCell = "A1";
      const qualityHeaderCell = `A${3 + currentResult.scope.criteria.length + 3}`;
      
      if (worksheet[scopeHeaderCell]) {
        worksheet[scopeHeaderCell].s = {
          font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4472C4" } }, // Blue background
          alignment: { horizontal: "center", vertical: "center" }
        };
      }
      
      if (worksheet[qualityHeaderCell]) {
        worksheet[qualityHeaderCell].s = {
          font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "70AD47" } }, // Green background
          alignment: { horizontal: "center", vertical: "center" }
        };
      }

      // Style the column headers
      const scopeColumnsRow = 2;
      const qualityColumnsRow = 4 + currentResult.scope.criteria.length + 3;
      
      for (let col = 0; col < 4; col++) {
        const scopeColCell = XLSX.utils.encode_cell({ r: scopeColumnsRow - 1, c: col });
        const qualityColCell = XLSX.utils.encode_cell({ r: qualityColumnsRow - 1, c: col });
        
        if (worksheet[scopeColCell]) {
          worksheet[scopeColCell].s = {
            font: { bold: true, sz: 12 },
            fill: { fgColor: { rgb: "D9E2F3" } }, // Light blue background
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin" },
              bottom: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" }
            }
          };
        }
        
        if (worksheet[qualityColCell]) {
          worksheet[qualityColCell].s = {
            font: { bold: true, sz: 12 },
            fill: { fgColor: { rgb: "E2EFDA" } }, // Light green background
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin" },
              bottom: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" }
            }
          };
        }
      }

      // Add borders to all data cells
      exportData.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
          if (worksheet[cellAddress] && rowIndex > 0) { // Skip header styling
            if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};
            worksheet[cellAddress].s.border = {
              top: { style: "thin" },
              bottom: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" }
            };
            
            // Add wrap text for comment and chosen level columns
            if (colIndex === 2 || colIndex === 3) {
              worksheet[cellAddress].s.alignment = { 
                wrapText: true, 
                vertical: "top",
                horizontal: "left"
              };
            }
          }
        });
      });

      // Merge cells for headers
      const scopeHeaderRange = `A1:D1`;
      const qualityHeaderRange = `A${qualityColumnsRow - 1}:D${qualityColumnsRow - 1}`;
      
      if (!worksheet["!merges"]) worksheet["!merges"] = [];
      worksheet["!merges"].push(XLSX.utils.decode_range(scopeHeaderRange));
      worksheet["!merges"].push(XLSX.utils.decode_range(qualityHeaderRange));

      // Set row heights for better readability
      const rowHeights = exportData.map((row, index) => {
        if (index === 0 || index === qualityColumnsRow - 1) return { hpt: 25 }; // Headers
        if (index === 1 || index === qualityColumnsRow) return { hpt: 20 }; // Column headers
        return { hpt: 60 }; // Data rows
      });
      worksheet["!rows"] = rowHeights;

      XLSX.utils.book_append_sheet(workbook, worksheet, "Grading Report");

      // Generate filename with user name and date
      const fileName = `Grading_Report_${currentUser.fullName.replace(/\s+/g, "_")}_${taskId}_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;

      // Download the file
      XLSX.writeFile(workbook, fileName);

      toast.success(`Grading report exported for ${currentUser.fullName}`);
    } catch (error) {
      console.error("Error exporting user report:", error);
      toast.error("Failed to export grading report");
    }
  };

  return (
    <Card className="animate-fade-in">
      <CardContent className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Grading Results</h3>

          <div className="flex items-center space-x-2">
            {/* Add Export User Report Button */}
            {results.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onChangeIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  {currentIndex + 1} of {results.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onChangeIndex(
                      Math.min(results.length - 1, currentIndex + 1)
                    )
                  }
                >
                  Next
                </Button>
              </>
            )}
          </div>
        </div>

        <p className="text-lg font-medium">
          For {currentUser?.fullName || `User ID: ${currentResult.user_id}`}
        </p>


        <Button
          variant="outline"
          size="sm"
          onClick={handleExportUserReport}
          disabled={!currentUser || !currentResult}
        >
          Export Report
        </Button>

        <div className="space-y-8">
          {/* Scope Section */}
          <div className="border rounded-lg p-6 space-y-6 bg-blue-50/30">
            <div className="flex justify-between items-center border-b pb-4">
              <h4 className="text-xl font-bold text-blue-700">
                Scope Assessment
              </h4>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleScopeGradeChange(
                      currentResult.scope.overall_grade - 5
                    )
                  }
                >
                  -5
                </Button>
                <span className="text-2xl font-bold text-blue-700 min-w-[80px] text-center">
                  {currentResult.scope.overall_grade}/100
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleScopeGradeChange(
                      currentResult.scope.overall_grade + 5
                    )
                  }
                >
                  +5
                </Button>
              </div>
            </div>

            {/* Scope Criteria */}
            <div className="space-y-4">
              <h5 className="text-lg font-semibold text-gray-800">
                Criteria Breakdown:
              </h5>
              {currentResult.scope.criteria.map((criterion, idx) => (
                <div
                  key={idx}
                  className="bg-white border rounded-lg p-4 space-y-4 shadow-sm"
                >
                  {/* Criterion Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Criterion Name:
                    </label>
                    <input
                      type="text"
                      value={criterion.name}
                      onChange={(e) =>
                        handleScopeCriterionChange(idx, "name", e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter criterion name"
                    />
                  </div>

                  {/* Grade */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade:
                    </label>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleScopeCriterionChange(
                            idx,
                            "grade",
                            Math.max(0, criterion.grade - 1)
                          )
                        }
                      >
                        -1
                      </Button>
                      <input
                        type="number"
                        value={criterion.grade}
                        onChange={(e) =>
                          handleScopeCriterionChange(
                            idx,
                            "grade",
                            Math.max(0, parseInt(e.target.value) || 0)
                          )
                        }
                        className="w-20 p-2 border border-gray-300 rounded-md text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        max="100"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleScopeCriterionChange(
                            idx,
                            "grade",
                            Math.min(100, criterion.grade + 1)
                          )
                        }
                      >
                        +1
                      </Button>
                      <span className="text-sm text-gray-600">points</span>
                    </div>
                  </div>

                  {/* Chosen Level - Updated to number input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chosen Level:
                    </label>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleScopeCriterionChange(
                            idx,
                            "chosen_level",
                            Math.max(0, criterion.chosen_level - 1)
                          )
                        }
                      >
                        -1
                      </Button>
                      <input
                        type="number"
                        value={criterion.chosen_level}
                        onChange={(e) =>
                          handleScopeCriterionChange(
                            idx,
                            "chosen_level",
                            Math.max(0, parseInt(e.target.value) || 0)
                          )
                        }
                        className="w-20 p-2 border border-gray-300 rounded-md text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        max="10"
                        placeholder="0"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleScopeCriterionChange(
                            idx,
                            "chosen_level",
                            Math.min(10, criterion.chosen_level + 1)
                          )
                        }
                      >
                        +1
                      </Button>
                      <span className="text-sm text-gray-600">level</span>
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comment:
                    </label>
                    <Textarea
                      value={criterion.comment}
                      onChange={(e) =>
                        handleScopeCriterionChange(
                          idx,
                          "comment",
                          e.target.value
                        )
                      }
                      className="w-full resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Add specific feedback for this criterion"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Overall Scope Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Scope Comment:
              </label>
              <Textarea
                className="w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={currentResult.scope.overall_comment}
                onChange={(e) => handleScopeCommentChange(e.target.value)}
                rows={3}
                placeholder="Overall scope assessment comment..."
              />
            </div>
          </div>

          {/* Quality Section */}
          <div className="border rounded-lg p-6 space-y-6 bg-green-50/30">
            <div className="flex justify-between items-center border-b pb-4">
              <h4 className="text-xl font-bold text-green-700">
                Quality Assessment
              </h4>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleQualityGradeChange(
                      currentResult.quality.overall_grade - 5
                    )
                  }
                >
                  -5
                </Button>
                <span className="text-2xl font-bold text-green-700 min-w-[80px] text-center">
                  {currentResult.quality.overall_grade}/100
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleQualityGradeChange(
                      currentResult.quality.overall_grade + 5
                    )
                  }
                >
                  +5
                </Button>
              </div>
            </div>

            {/* Quality Criteria */}
            <div className="space-y-4">
              <h5 className="text-lg font-semibold text-gray-800">
                Criteria Breakdown:
              </h5>
              {currentResult.quality.criteria.map((criterion, idx) => (
                <div
                  key={idx}
                  className="bg-white border rounded-lg p-4 space-y-4 shadow-sm"
                >
                  {/* Criterion Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Criterion Name:
                    </label>
                    <input
                      type="text"
                      value={criterion.name}
                      onChange={(e) =>
                        handleQualityCriterionChange(
                          idx,
                          "name",
                          e.target.value
                        )
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter criterion name"
                    />
                  </div>

                  {/* Grade */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade:
                    </label>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleQualityCriterionChange(
                            idx,
                            "grade",
                            Math.max(0, criterion.grade - 1)
                          )
                        }
                      >
                        -1
                      </Button>
                      <input
                        type="number"
                        value={criterion.grade}
                        onChange={(e) =>
                          handleQualityCriterionChange(
                            idx,
                            "grade",
                            Math.max(0, parseInt(e.target.value) || 0)
                          )
                        }
                        className="w-20 p-2 border border-gray-300 rounded-md text-center focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        min="0"
                        max="100"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleQualityCriterionChange(
                            idx,
                            "grade",
                            Math.min(100, criterion.grade + 1)
                          )
                        }
                      >
                        +1
                      </Button>
                      <span className="text-sm text-gray-600">points</span>
                    </div>
                  </div>

                  {/* Chosen Level - Updated to number input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chosen Level:
                    </label>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleQualityCriterionChange(
                            idx,
                            "chosen_level",
                            Math.max(0, criterion.chosen_level - 1)
                          )
                        }
                      >
                        -1
                      </Button>
                      <input
                        type="number"
                        value={criterion.chosen_level}
                        onChange={(e) =>
                          handleQualityCriterionChange(
                            idx,
                            "chosen_level",
                            Math.max(0, parseInt(e.target.value) || 0)
                          )
                        }
                        className="w-20 p-2 border border-gray-300 rounded-md text-center focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        min="0"
                        max="10"
                        placeholder="0"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleQualityCriterionChange(
                            idx,
                            "chosen_level",
                            Math.min(10, criterion.chosen_level + 1)
                          )
                        }
                      >
                        +1
                      </Button>
                      <span className="text-sm text-gray-600">level</span>
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comment:
                    </label>
                    <Textarea
                      value={criterion.comment}
                      onChange={(e) =>
                        handleQualityCriterionChange(
                          idx,
                          "comment",
                          e.target.value
                        )
                      }
                      className="w-full resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      rows={3}
                      placeholder="Add specific feedback for this criterion"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Overall Quality Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Quality Comment:
              </label>
              <Textarea
                className="w-full focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={currentResult.quality.overall_comment}
                onChange={(e) => handleQualityCommentChange(e.target.value)}
                rows={3}
                placeholder="Overall quality assessment comment..."
              />
            </div>
          </div>

          {/* Final Grade Summary */}
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-6 border">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-gray-800">
                Final Grade:
              </span>
              <span className="text-3xl font-bold text-purple-700">
                {Math.round(
                  (currentResult.scope.overall_grade +
                    currentResult.quality.overall_grade) /
                    2
                )}
                /100
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              (Scope: {currentResult.scope.overall_grade} + Quality:{" "}
              {currentResult.quality.overall_grade}) ÷ 2
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button
              className="bg-blue-600 hover:bg-blue-500 px-8 py-2"
              onClick={handleSaveChanges}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
