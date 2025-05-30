
import { useState, useEffect } from 'react';
import { Submission, AutograderResult } from '@/types';
import { toast } from 'sonner';

// Helper function to generate mock submissions (moved from TaskSubmissions)
const generateMockSubmissions = (taskId: string, count: number): Submission[] => {
  const statuses: ("pending" | "autograded" | "reviewed" | "published")[] = ['pending', 'autograded', 'reviewed', 'published'];
  const submissions: Submission[] = [];
  
  for (let i = 0; i < count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    submissions.push({
      id: `${taskId}-${i + 1}`,
      taskId,
      learnerId: `learner-${i + 1}`,
      learnerName: `Learner ${i + 1}`,
      learnerEmail: `learner${i + 1}@example.com`,
      learnerAvatarUrl: i % 5 === 0 ? `https://i.pravatar.cc/150?u=${i}` : undefined,
      submittedAt: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000).toISOString(),
      content: 'This is a submission content with code and explanation...',
      status,
      score: status !== 'pending' ? Math.floor(Math.random() * 100) : undefined,
      feedback: status !== 'pending' ? 'Good work, but could improve in some areas...' : undefined,
      taskDescription: 'This is the task description text that provides detailed instructions for the assignment.',
      deliveryRubric: [
        {
          title: 'Code Quality',
          description: 'Code is well-structured and follows best practices',
          maxPoints: 25
        },
        {
          title: 'Functionality',
          description: 'Implementation meets all the required functionality',
          maxPoints: 25
        }
      ],
      qualityRubric: [
        {
          title: 'Documentation',
          description: 'Code is well-documented with appropriate comments',
          maxPoints: 25
        },
        {
          title: 'Best Practices',
          description: 'Solution follows industry best practices and patterns',
          maxPoints: 25
        }
      ]
    });
  }
  
  return submissions;
};

export const useSubmissions = (taskId: string | undefined, totalSubmissions: number) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [selectedSubmissions, setSelectedSubmissions] = useState<Submission[]>([]);
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [autograderResults, setAutograderResults] = useState<Record<string, AutograderResult>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!taskId) return;
        
        const mockSubmissions = generateMockSubmissions(taskId, totalSubmissions);
        setSubmissions(mockSubmissions);
        setFilteredSubmissions(mockSubmissions);
      } catch (error) {
        console.error('Error fetching submissions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissions();
  }, [taskId, totalSubmissions]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSubmissions(submissions);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = submissions.filter(
        submission => 
          submission.learnerName.toLowerCase().includes(query) ||
          submission.learnerEmail.toLowerCase().includes(query)
      );
      setFilteredSubmissions(filtered);
    }
  }, [searchQuery, submissions]);

  const handleSelectSubmission = (submission: Submission) => {
    if (selectedSubmissions.some(s => s.id === submission.id)) {
      setSelectedSubmissions(selectedSubmissions.filter(s => s.id !== submission.id));
    } else {
      setSelectedSubmissions([...selectedSubmissions, submission]);
    }
  };

  const handleSelectAll = () => {
    if (selectedSubmissions.length === filteredSubmissions.length) {
      setSelectedSubmissions([]);
    } else {
      setSelectedSubmissions([...filteredSubmissions]);
    }
  };

  const handleViewSubmission = (submission: Submission) => {
    setCurrentSubmission(submission);
  };

  const handleAutogradeComplete = (results: Record<string, AutograderResult>) => {
    setAutograderResults(results);
    
    const updatedSubmissions = submissions.map(submission => {
      if (results[submission.id]) {
        return {
          ...submission,
          status: 'autograded' as const,
          score: results[submission.id].score,
          feedback: results[submission.id].feedback
        };
      }
      return submission;
    });
    
    setSubmissions(updatedSubmissions);
    setFilteredSubmissions(
      searchQuery.trim() === '' 
        ? updatedSubmissions 
        : updatedSubmissions.filter(s => 
            s.learnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.learnerEmail.toLowerCase().includes(searchQuery.toLowerCase())
          )
    );
    
    setSelectedSubmissions([]);
    
    toast.success(`${Object.keys(results).length} submissions have been autograded`);
  };

  const handleSaveGradingChanges = (updatedSubmission: Submission) => {
    const updatedSubmissions = submissions.map(submission => 
      submission.id === updatedSubmission.id ? updatedSubmission : submission
    );
    
    setSubmissions(updatedSubmissions);
    setFilteredSubmissions(
      searchQuery.trim() === '' 
        ? updatedSubmissions 
        : updatedSubmissions.filter(s => 
            s.learnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.learnerEmail.toLowerCase().includes(searchQuery.toLowerCase())
          )
    );
    
    setCurrentSubmission(updatedSubmission);
  };

  const handlePublishGrading = (submissionId: string) => {
    const updatedSubmissions = submissions.map(submission => 
      submission.id === submissionId 
        ? { ...submission, status: 'published' as const } 
        : submission
    );
    
    setSubmissions(updatedSubmissions);
    setFilteredSubmissions(
      searchQuery.trim() === '' 
        ? updatedSubmissions 
        : updatedSubmissions.filter(s => 
            s.learnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.learnerEmail.toLowerCase().includes(searchQuery.toLowerCase())
          )
    );
    
    if (currentSubmission && currentSubmission.id === submissionId) {
      setCurrentSubmission({ ...currentSubmission, status: 'published' });
    }
  };

  return {
    submissions,
    filteredSubmissions,
    selectedSubmissions,
    currentSubmission,
    searchQuery,
    autograderResults,
    isLoading,
    setSearchQuery,
    handleSelectSubmission,
    handleSelectAll,
    handleViewSubmission,
    handleAutogradeComplete,
    handleSaveGradingChanges,
    handlePublishGrading,
  };
};
