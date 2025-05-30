
import { useState } from 'react';
import { Submission, AutograderResult } from '@/types';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface AutograderPanelProps {
  selectedSubmissions: Submission[];
  onAutogradeComplete: (results: Record<string, AutograderResult>) => void;
}

const AutograderPanel: React.FC<AutograderPanelProps> = ({ 
  selectedSubmissions,
  onAutogradeComplete
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleAutograde = async () => {
    if (selectedSubmissions.length === 0) {
      toast.error("Please select at least one submission to autograde");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Mock autograde process
      const results: Record<string, AutograderResult> = {};
      
      for (let i = 0; i < selectedSubmissions.length; i++) {
        const submission = selectedSubmissions[i];
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock result
        results[submission.id] = {
          score: Math.floor(Math.random() * 100),
          feedback: "Autograder feedback for this submission.",
          detailedFeedback: [
            {
              category: "Code Quality",
              points: Math.floor(Math.random() * 25),
              maxPoints: 25,
              comments: "Code is well structured and follows best practices."
            },
            {
              category: "Functionality",
              points: Math.floor(Math.random() * 50),
              maxPoints: 50,
              comments: "Most features work as expected."
            },
            {
              category: "Documentation",
              points: Math.floor(Math.random() * 25),
              maxPoints: 25,
              comments: "Documentation is clear and comprehensive."
            }
          ]
        };
        
        // Update progress
        setProgress(Math.round(((i + 1) / selectedSubmissions.length) * 100));
      }
      
      toast.success(`Successfully autograded ${selectedSubmissions.length} submissions`);
      onAutogradeComplete(results);
    } catch (err) {
      setError("An error occurred during autograding. Please try again.");
      toast.error("Autograding failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white border border-border rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Autograder</h3>
        {selectedSubmissions.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {selectedSubmissions.length} submission{selectedSubmissions.length !== 1 ? 's' : ''} selected
          </span>
        )}
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-md flex items-center text-sm">
          <AlertTriangle className="w-4 h-4 text-destructive mr-2" />
          <span>{error}</span>
        </div>
      )}
      
      {isProcessing ? (
        <div className="space-y-4">
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Processing submissions...</span>
            <span>{progress}% complete</span>
          </div>
          <Button variant="outline" className="w-full" disabled>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground mb-4">
            Start automatic grading for the selected submissions. This process will analyze each submission and provide a preliminary score and feedback.
          </p>
          <Button 
            className="w-full"
            onClick={handleAutograde}
            disabled={selectedSubmissions.length === 0}
          >
            {selectedSubmissions.length > 0 ? (
              <>
                <RotateCw className="w-4 h-4 mr-2" />
                Run Autograder
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Select Submissions
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AutograderPanel;
