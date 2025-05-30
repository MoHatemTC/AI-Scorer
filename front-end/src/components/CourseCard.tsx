
import { Course } from '@/types';
import ProgressChart from './ProgressChart';
import { Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CourseCardProps {
  course: Course;
  className?: string;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, className = "" }) => {
  const router = useRouter()
  return (
    <div 
      className={`glass-card rounded-xl overflow-hidden hover-scale transition-all duration-300 cursor-pointer ${className}`}
      onClick={() => router.push(`/course/${course.id}`)}
    >
      <div className="relative h-40 overflow-hidden">
        <img 
          src={course.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80"} 
          alt={course.title} 
          className="object-cover w-full h-full transform hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 p-4 text-white">
          <h3 className="text-xl font-semibold line-clamp-1">{course.title}</h3>
        </div>
      </div>
      <div className="p-5">
        <p className="text-muted-foreground line-clamp-2 h-12 mb-4">{course.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{course.learnerCount} Learners</span>
          </div>
          <div className="flex items-center space-x-3">
            <ProgressChart 
              completed={course.scoredTasks} 
              total={course.totalTasks} 
              size={60} 
              strokeWidth={6} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
