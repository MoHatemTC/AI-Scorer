import { User } from "@/types";
import { CheckCircle, Clock, AlertCircle, User2Icon, XCircleIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "./ui/button";
import Link from "next/link";

interface UserItemProps {
  user: User;
  isSelected: boolean;
  onSelect: (user: User) => void;
  onClick: (user: User) => void;
}

const UserItem: React.FC<UserItemProps> = ({
  user,
  isSelected,
  onSelect,
  onClick,
}) => {
  const getStatusIcon = () => {
    switch (user.status) {
      case "passed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "not_passed":
        return <XCircleIcon className="w-4 h-4 text-red-500" />;
      case "under_review":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "decline":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "not_submitted":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (user.status) {
      case "passed":
        return "Passed";
      case "not_passed":
        return "not_passed";
      case "not_submitted":
        return "Not Submitted";
      case "under_review":
        return "Under Review";
      case "decline":
        return "Declined";
      default:
        return "Pending Review";
    }
  };

  return (
    <div
      className={`border-b border-border p-4 hover:bg-muted/30 transition-colors cursor-pointer ${
        isSelected ? "bg-muted/50" : ""
      }`}
    >
      <div className="flex items-center">
        <div className="mr-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect(user)}
            onClick={(e) => e.stopPropagation()}
            className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
        </div>

        <div
          className="flex-1"
          onClick={() => onClick(user)}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.fullName}
                  className="w-8 h-8 rounded-full mr-3 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-3">
                  <span className="text-sm font-medium">
                    <User2Icon className="size-5 text-muted-foreground fill-blue-900" />
                  </span>
                </div>
              )}
              <div>
                <div className="font-medium">{user.fullName}</div>
                <div className="text-sm text-muted-foreground">
                  {user.email}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center">
              {getStatusIcon()}
              <span className="text-sm ml-1 [lineHeight:normal]">
                {getStatusText()}
              </span>
            </div>

            {user.grade !== null && (
              <div className="text-sm font-medium">Score: {user.grade}</div>
            )}
          </div>
          <div className="flex items-center justify-end mt-2">
            {user.submissions && user.submissions.length > 0 && (
              <Button
                asChild
                className="text-sm bg-blue-700 text-white hover:bg-blue-600"
              >
                <a
                  href={user.submissions}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download Submission
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserItem;
