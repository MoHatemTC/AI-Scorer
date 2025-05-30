import { User } from "@/types";
import { Search, Filter, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UserItem from "@/components/UserItem";

interface UsersListProps {
  filteredUsers: User[];
  selectedUsers: User[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectAll: () => void;
  onSelectUser: (user: User) => void;
  onViewUser: (user: User) => void;
  isLoading: boolean;
}

const UsersList = ({
  filteredUsers,
  selectedUsers,
  searchQuery,
  onSearchChange,
  onSelectAll,
  onSelectUser,
  onViewUser,
  isLoading,
}: UsersListProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="w-full sm:w-auto flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search users..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <Filter className="w-3 h-3 mr-1" />
            Filter
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={onSelectAll}
          >
            <CheckSquare className="w-3 h-3 mr-1" />
            {selectedUsers.length === filteredUsers.length &&
            filteredUsers.length > 0
              ? "Deselect All"
              : "Select All"}
          </Button>
        </div>
      </div>

      <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        ) : filteredUsers && filteredUsers.length > 0 ? (
          filteredUsers.map((user, idx) => (
            <UserItem
              key={idx}
              user={user}
              isSelected={selectedUsers.some((s) => s.submissionId === user.submissionId)}
              onSelect={onSelectUser}
              onClick={onViewUser}
            />
          ))
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No users found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersList;
