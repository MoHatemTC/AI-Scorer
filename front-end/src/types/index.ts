export interface Coach {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  totalTasks: number;
  scoredTasks: number;
  learnerCount: number;
  imageUrl: string;
  type?: string;
  thumbnail?: string;
}

export interface Task {
  id: string;
  courseId: string;
  title: string;
  description: string;
  totalSubmissions: number;
  scoredSubmissions: number;
  dueDate: string | null;
  maxPoints?: number;
  deliveryRubric?: any[];
  qualityRubric?: any[];
  type?: string;
  submissionTypes?: string;
  uniqueSubmissions?: number;
  totalUniqueSubmissions?: number;
}

export interface RubricLevel {
  description: string;
  range: [number, number];
}

export interface RubricCriterion {
  name: string;
  weight: number;
  levels: RubricLevel[];
}

export interface GeneratedRubric {
  Scope: RubricCriterion[];
  Quality: RubricCriterion[];
  max_score?: number;
  passed_score?: number;
  final_score?: number;
}

export interface RubricCriteria {
  title: string;
  description: string;
  maxPoints: number;
}

export interface Submission {
  id: string;
  taskId: string;
  learnerId: string;
  learnerName: string;
  learnerEmail: string;
  learnerAvatarUrl?: string;
  submittedAt: string;
  content: string;
  attachments?: string[];
  score?: number;
  feedback?: string;
  status: "pending" | "autograded" | "reviewed" | "published";
  taskDescription?: string;
  deliveryRubric?: RubricCriteria[];
  qualityRubric?: RubricCriteria[];
}

export interface AutograderResult {
  score: number;
  feedback: string;
  detailedFeedback: {
    category: string;
    points: number;
    maxPoints: number;
    comments: string;
  }[];
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  profilePicture: string | null;
  status: string;
  grade: number | null;
  submissions: string | null;
  submissionId?: string | null;
}

export interface GradingCriterion {
  name: string;
  grade: number;
  chosen_level: string;
  comment: string;
}

export interface GradingSection {
  criteria: GradingCriterion[];
  overall_grade: number;
  overall_comment: string;
}

export interface NewGradingResult {
  user_id: number;
  scope: GradingSection;
  quality: GradingSection;
}
