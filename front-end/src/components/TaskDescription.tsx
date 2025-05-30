
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

interface TaskDescriptionProps {
  title?: string;
  description?: string;
  isLoading?: boolean;
}

const TaskDescription = ({ title, description, isLoading = false }: TaskDescriptionProps) => {
  if (isLoading) {
    return (
      <Card className="p-6 space-y-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-20 w-full" />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4">{title || "Task Description"}</h3>
      <p className="text-muted-foreground whitespace-pre-wrap" dangerouslySetInnerHTML={{__html: description as string }} />
    </Card>
  );
};

export default TaskDescription;
