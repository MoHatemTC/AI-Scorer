import { useState } from "react";
import { Task, GeneratedRubric } from "@/types";
import TaskDescription from "./TaskDescription";
import RubricSection from "./RubricSection";
import { Button } from "./ui/button";

interface TaskOverviewProps {
  task: Task;
  isLoading?: boolean;
}

const TaskOverview = ({ task, isLoading = false }: TaskOverviewProps) => {
  const [rubricData, setRubricData] = useState<GeneratedRubric | null>(null);
  const [generating, setGenerating] = useState(false);
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
          task_id: task.id,
          task_description: task.description,
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
      setRubricData(data.rubric);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button
        onClick={generateRubrics}
        disabled={generating}
      >
        Generate Rubrics
      </Button>

      <TaskDescription
        title="Task Description"
        description={task.description}
        isLoading={isLoading}
      />

      {rubricData?.Scope && (
        <RubricSection
          header="Scope Rubric"
          items={rubricData.Scope}
          isLoading={isLoading}
          onItemsChange={(newItems) =>
            setRubricData((prev) =>
              prev ? { ...prev, Scope: newItems } : prev
            )
          }
        />
      )}

      {rubricData?.Quality && (
        <RubricSection
          header="Quality Rubric"
          items={rubricData.Quality}
          isLoading={isLoading}
          onItemsChange={(newItems) =>
            setRubricData((prev) =>
              prev ? { ...prev, Quality: newItems } : prev
            )
          }
        />
      )}
    </div>
  );
};

export default TaskOverview;
