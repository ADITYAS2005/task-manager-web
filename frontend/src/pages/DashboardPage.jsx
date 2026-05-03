import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { tasksApi } from '@/api/tasks.api';
import { useAuth } from '@/contexts/AuthContext';
import { PageSpinner } from '@/components/common/Spinner';
import { StatusBadge, PriorityBadge } from '@/components/common/StatusBadge';
import Avatar from '@/components/common/Avatar';
import { formatDate, isOverdue } from '@/utils/helpers';

function StatCard({ label, value, sub, color = 'text-gray-900' }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => tasksApi.getDashboardStats().then((r) => r.data.data.stats),
  });

  if (isLoading) return <PageSpinner />;
  if (error) return <div className="text-red-500 p-4">Failed to load dashboard.</div>;

  const { totalTasks, myTasks, overdueTasks, statusBreakdown = {}, recentTasks = [] } = data;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-gray-500 mt-0.5">Here's what's happening across your projects</p>
        </div>
        <Link to="/projects" className="btn-primary btn btn-sm">+ New Project</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Tasks" value={totalTasks} sub="across all projects" />
        <StatCard label="My Tasks" value={myTasks} sub="assigned to me" color="text-brand-600" />
        <StatCard label="In Progress" value={statusBreakdown['in-progress'] || 0} sub="actively worked on" color="text-amber-600" />
        <StatCard label="Overdue" value={overdueTasks} sub="need attention" color={overdueTasks > 0 ? 'text-red-600' : 'text-gray-900'} />
      </div>

      {/* Status breakdown */}
      <div className="card p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Task Status Overview</h2>
        <div className="grid grid-cols-4 gap-3">
          {[
            { key: 'todo', label: 'To Do', color: 'bg-gray-200' },
            { key: 'in-progress', label: 'In Progress', color: 'bg-blue-400' },
            { key: 'review', label: 'In Review', color: 'bg-amber-400' },
            { key: 'done', label: 'Done', color: 'bg-green-400' },
          ].map(({ key, label, color }) => {
            const count = statusBreakdown[key] || 0;
            const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
            return (
              <div key={key}>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{label}</span>
                  <span className="font-medium text-gray-700">{count}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent tasks */}
      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Recent Tasks</h2>
          <Link to="/my-tasks" className="text-xs text-brand-600 hover:underline">View all →</Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentTasks.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-400">No tasks yet.</div>
          )}
          {recentTasks.map((task) => (
            <div key={task._id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium truncate ${task.isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                    {task.title}
                  </p>
                  {task.isOverdue && (
                    <span className="badge-overdue badge text-[10px]">Overdue</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {task.project && (
                    <span className="text-xs text-gray-400">{task.project.name}</span>
                  )}
                  {task.dueDate && (
                    <span className="text-xs text-gray-400">· {formatDate(task.dueDate)}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <PriorityBadge priority={task.priority} />
                <StatusBadge status={task.status} />
                {task.assignee && <Avatar name={task.assignee.name} size="xs" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
