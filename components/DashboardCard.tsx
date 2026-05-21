interface DashboardCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
}

export default function DashboardCard({ title, value, icon, color }: DashboardCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`${color} p-4 rounded-full text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
