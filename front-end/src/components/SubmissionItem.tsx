
import { Submission } from '@/types';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDistanceToNow } from 'date-fns';

interface SubmissionItemProps {
  submission: Submission;
  isSelected: boolean;
  onSelect: (submission: Submission) => void;
  onClick: (submission: Submission) => void;
}

const SubmissionItem: React.FC<SubmissionItemProps> = ({ 
  submission, 
  isSelected,
  onSelect,
  onClick
}) => {
  const getStatusIcon = () => {
    switch (submission.status) {
      case 'reviewed':
      case 'published':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'autograded':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'pending':
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (submission.status) {
      case 'reviewed':
        return 'Reviewed';
      case 'published':
        return 'Published';
      case 'autograded':
        return 'Autograded';
      case 'pending':
      default:
        return 'Pending Review';
    }
  };

  return (
    <div 
      className={`border-b border-border p-4 hover:bg-muted/30 transition-colors cursor-pointer ${
        isSelected ? 'bg-muted/50' : ''
      }`}
    >
      <div className="flex items-center">
        <div className="mr-3">
          <Checkbox 
            checked={isSelected}
            onCheckedChange={() => onSelect(submission)}
            onClick={(e) => e.stopPropagation()}
            className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
        </div>

        <div className="flex-1" onClick={() => onClick(submission)}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              {submission.learnerAvatarUrl ? (
                <img 
                  src={submission.learnerAvatarUrl} 
                  alt={submission.learnerName}
                  className="w-8 h-8 rounded-full mr-3 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-3">
                  <span className="text-sm font-medium">{submission.learnerName.charAt(0)}</span>
                </div>
              )}
              <div>
                <div className="font-medium">{submission.learnerName}</div>
                <div className="text-sm text-muted-foreground">{submission.learnerEmail}</div>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true })}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center">
              {getStatusIcon()}
              <span className="text-sm ml-1">{getStatusText()}</span>
            </div>
            
            {submission.score !== undefined && (
              <div className="text-sm font-medium">
                Score: {submission.score}%
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionItem;
