import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/api/tasks.api';
import { useAuth } from '@/contexts/AuthContext';
import { PageSpinner } from '@/components/common/Spinner';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import TaskRow from '@/components/tasks/TaskRow';
import TaskFormModal from '@/components/tasks/TaskFormModal';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import { STATUS_OPTIONS, PRIORITY_OPTIONS, extractError } from '@/utils/helpers';
import toast from 'react-hot-toast';

export default function MyTasksPage() {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [editTask, setEditTask] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTask, setDeleteTask] = useState(null);
  const [viewTaskId, setViewTaskId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['my-tasks', statusFilter, priorityFilter],
    queryFn: () =>
      tasksApi.getMyTasks({
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
      }).then((r) => r.data.data.tasks),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => tasksApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Task deleted');
      setDeleteTask(null);
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const tasks = data || [];
  const overdueCount = tasks.filter((t) => t.isOverdue).length;

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isAdmin ? 'All Tasks' : 'My Tasks'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {tasks.length} tasks
            {overdueCount > 0 && <span className="text-red-500 ml-1">· {overdueCount} overdue</span>}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <select
          className="input text-sm w-40"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          className="input text-sm w-36"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All priorities</option>
          {PRIORITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {(statusFilter || priorityFilter) && (
          <button
            className="btn-ghost btn btn-sm text-xs"
            onClick={() => { setStatusFilter(''); setPriorityFilter(''); }}
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="card">
        {tasks.length === 0 ? (
          <EmptyState
            icon="🎉"
            title={statusFilter || priorityFilter ? 'No matching tasks' : 'No tasks assigned to you'}
            description="Tasks assigned to you will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Task', 'Project', 'Assignee', 'Priority', 'Status', 'Due Date', ''].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tasks.map((task) => (
                  <TaskRow
                    key={task._id}
                    task={task}
                    showProject
                    isAdmin={isAdmin}
                    currentUserId={user?._id}
                    onEdit={(t) => { setEditTask(t); setShowForm(true); }}
                    onDelete={setDeleteTask}
                    onView={setViewTaskId}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TaskFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditTask(null); }}
        task={editTask}
        projectId={editTask?.project?._id || editTask?.project}
      />

      <TaskDetailModal
        open={Boolean(viewTaskId)}
        onClose={() => setViewTaskId(null)}
        taskId={viewTaskId}
      />

      <ConfirmDialog
        open={Boolean(deleteTask)}
        onClose={() => setDeleteTask(null)}
        onConfirm={() => deleteMutation.mutate(deleteTask?._id)}
        loading={deleteMutation.isPending}
        title="Delete Task"
        message={`Delete "${deleteTask?.title}"?`}
        confirmLabel="Delete"
      />
    </div>
  );
}
