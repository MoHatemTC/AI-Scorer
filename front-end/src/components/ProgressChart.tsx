
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ProgressChartProps {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

const ProgressChart: React.FC<ProgressChartProps> = ({ 
  completed, 
  total, 
  size = 100, 
  strokeWidth = 8,
  className = ""
}) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  const data = [
    { name: 'Completed', value: completed },
    { name: 'Remaining', value: total - completed }
  ];
  
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))'];
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 rounded shadow-md text-sm">
          <p>{`${payload[0].name}: ${payload[0].value} (${Math.round((payload[0].value / total) * 100)}%)`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size / 2 - strokeWidth}
            outerRadius={size / 2}
            paddingAngle={2}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-2xl font-semibold">{percentage}%</span>
        <span className="text-xs text-muted-foreground mt-1">Completed</span>
      </div>
    </div>
  );
};

export default ProgressChart;
