
import { useState, useEffect } from 'react';
import { Submission, AutograderResult } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Save, Send } from 'lucide-react';

interface GradingFormProps {
  submission: Submission;
  autograderResult?: AutograderResult;
  onSave: (updatedSubmission: Submission) => void;
  onPublish: (submissionId: string) => void;
}

const GradingForm: React.FC<GradingFormProps> = ({ 
  submission, 
  autograderResult,
  onSave,
  onPublish
}) => {
  const [score, setScore] = useState<number>(submission.score || (autograderResult?.score || 0));
  const [feedback, setFeedback] = useState<string>(submission.feedback || (autograderResult?.feedback || ''));
  const [isEdited, setIsEdited] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  useEffect(() => {
    // Reset form when submission changes
    setScore(submission.score || (autograderResult?.score || 0));
    setFeedback(submission.feedback || (autograderResult?.feedback || ''));
    setIsEdited(false);
  }, [submission, autograderResult]);
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const updatedSubmission: Submission = {
        ...submission,
        score,
        feedback,
        status: 'reviewed'
      };
      
      onSave(updatedSubmission);
      setIsEdited(false);
      toast.success("Feedback saved successfully");
    } catch (error) {
      toast.error("Failed to save feedback");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      onPublish(submission.id);
      toast.success("Feedback published to learner");
    } catch (error) {
      toast.error("Failed to publish feedback");
    } finally {
      setIsPublishing(false);
    }
  };
  
  return (
    <div className="bg-white border border-border rounded-lg p-5 shadow-sm space-y-5">
      <div>
        <h3 className="text-lg font-medium mb-4">Review & Grade</h3>
        
        <div className="mb-4">
          <Label htmlFor="score" className="mb-1 block">Score ({score}%)</Label>
          <Slider
            id="score"
            min={0}
            max={100}
            step={1}
            value={[score]}
            onValueChange={(value) => {
              setScore(value[0]);
              setIsEdited(true);
            }}
            className="mb-1"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
        
        <div className="mb-4">
          <Label htmlFor="feedback" className="mb-1 block">Feedback</Label>
          <Textarea
            id="feedback"
            value={feedback}
            onChange={(e) => {
              setFeedback(e.target.value);
              setIsEdited(true);
            }}
            placeholder="Provide feedback to the learner..."
            className="resize-none"
            rows={5}
          />
        </div>
      </div>
      
      {autograderResult && (
        <div className="border-t border-border pt-4">
          <h4 className="font-medium mb-3">Autograder Detailed Feedback</h4>
          <div className="space-y-3">
            {autograderResult.detailedFeedback.map((item, index) => (
              <div key={index} className="border border-border rounded-md p-3">
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{item.category}</span>
                  <span className="text-sm">{item.points}/{item.maxPoints}</span>
                </div>
                <p className="text-sm text-muted-foreground">{item.comments}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex gap-3 pt-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={handleSave}
          disabled={!isEdited || isSaving}
        >
          {isSaving ? (
            <span className="flex items-center">
              <span className="animate-spin mr-2">◌</span>
              Saving...
            </span>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save
            </>
          )}
        </Button>
        
        <Button 
          className="flex-1"
          onClick={handlePublish}
          disabled={isPublishing || (submission.status !== 'reviewed' && submission.status !== 'autograded')}
        >
          {isPublishing ? (
            <span className="flex items-center">
              <span className="animate-spin mr-2">◌</span>
              Publishing...
            </span>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Publish
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default GradingForm;
