import { useRouter } from "next/navigation";
import { Task } from "@/types";
import {
  ClipboardCheck,
  Calendar,
  UserCircle2,
  UserCog2,
  CheckCircle,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";

interface TaskCardProps {
  task: Task;
  className?: string;
  learnerCount?: number;
  isLoading?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  className = "",
  learnerCount = 0,
  isLoading = false,
}) => {
  const router = useRouter();
  const isPastDue = task.dueDate ? new Date(task.dueDate) < new Date() : false;

  // Safeguard against negative numbers
  const safeTask = {
    ...task,
    totalSubmissions: Math.max(task.totalSubmissions || 0, 0),
    scoredSubmissions: Math.max(task.scoredSubmissions || 0, 0),
    uniqueSubmissions: Math.max(task.uniqueSubmissions || 0, 0),
  };

  const notSubmitted = Math.max(
    learnerCount - (safeTask.uniqueSubmissions || 0),
    0
  );
  const pendingSubmissions = Math.max(
    safeTask.totalSubmissions - safeTask.scoredSubmissions,
    0
  );

  if (isLoading) {
    return (
      <div
        className={`bg-white rounded-lg border border-border p-5 ${className}`}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="w-full">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3 mt-1" />
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center text-sm">
            <UserCircle2 className="w-4 h-4 mr-1 text-muted-foreground" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex items-center text-sm">
            <ClipboardCheck className="w-4 h-4 mr-1 text-muted-foreground" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>

        <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>

        <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg border border-border p-5 hover:shadow-md transition-all duration-300 cursor-pointer ${className}`}
      onClick={() => router.push(`/course/${task.courseId}/task/${task.id}`)}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium text-lg">{task.title}</h3>
          <p
            className="text-muted-foreground text-sm line-clamp-2 mt-1"
            dangerouslySetInnerHTML={{
              __html:
                task.description
                  .replace(/<[^>]+>/g, "")
                  .replace(/&nbsp;/g, " ")
                  .slice(0, 50) + "...",
            }}
          />
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <UserCircle2 className="w-4 h-4 mr-1" />
          <span>{learnerCount} learners</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <ClipboardCheck className="w-4 h-4 mr-1" />
          <span>
            {safeTask.scoredSubmissions}/{safeTask.totalSubmissions} graded
          </span>
        </div>

        {task.dueDate && (
          <div
            className={`flex items-center text-sm ${
              isPastDue ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            <Calendar className="w-4 h-4 mr-1" />
            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between flex-wrap">
        <Badge
          variant="outline"
          className="text-xs"
        >
          <UserCog2 className="w-4 h-4 mr-1" />
          {safeTask.uniqueSubmissions}
          {safeTask.uniqueSubmissions && safeTask.uniqueSubmissions > 1
            ? " submissions"
            : " submission"}
        </Badge>
        <Badge className="text-xs bg-red-600 text-white">
          {notSubmitted} not submitted
        </Badge>
      </div>
      <div className="mt-4 flex items-center justify-between flex-wrap">
        <Badge
          variant="outline"
          className="text-xs"
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          {safeTask.scoredSubmissions} scored
        </Badge>
        <Badge className="text-xs bg-red-600 text-white">
          {pendingSubmissions} pending
        </Badge>
      </div>
    </div>
  );
};

export default TaskCard;
