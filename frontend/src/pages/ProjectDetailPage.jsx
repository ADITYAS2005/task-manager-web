import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/api/projects.api';
import { tasksApi } from '@/api/tasks.api';
import { usersApi } from '@/api/users.api';
import { useAuth } from '@/contexts/AuthContext';
import { PageSpinner } from '@/components/common/Spinner';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Avatar from '@/components/common/Avatar';
import { RoleBadge } from '@/components/common/StatusBadge';
import TaskRow from '@/components/tasks/TaskRow';
import TaskFormModal from '@/components/tasks/TaskFormModal';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import { STATUS_OPTIONS, extractError } from '@/utils/helpers';
import toast from 'react-hot-toast';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteTask, setDeleteTask] = useState(null);
  const [viewTaskId, setViewTaskId] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [activeTab, setActiveTab] = useState('tasks');

  const { data: project, isLoading: projLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.getOne(id).then((r) => r.data.data.project),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', id, statusFilter],
    queryFn: () =>
      tasksApi.getByProject(id, statusFilter ? { status: statusFilter } : {})
        .then((r) => r.data.data),   // paginated → r.data.data is the array
  });

  // Load ALL users for the add-member picker (admin only, triggered when panel opens)
  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['all-users-picker'],
    queryFn: () =>
      usersApi.getAll({ limit: 200 }).then((r) => r.data.data), // paginated → array
    enabled: isAdmin && showAddMember,
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => tasksApi.delete(taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', id] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Task deleted');
      setDeleteTask(null);
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const addMemberMutation = useMutation({
    mutationFn: (userId) => projectsApi.addMember(id, { userId }),
    onSuccess: (_, userId) => {
      qc.invalidateQueries({ queryKey: ['project', id] });
      qc.invalidateQueries({ queryKey: ['project-members', id] });
      toast.success('Member added to project');
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId) => projectsApi.removeMember(id, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', id] });
      toast.success('Member removed');
    },
    onError: (err) => toast.error(extractError(err)),
  });

  if (projLoading) return <PageSpinner />;
  if (!project) return <div className="text-red-500 p-4">Project not found.</div>;

  const taskList = Array.isArray(tasks) ? tasks : [];
  const total = taskList.length;
  const done = taskList.filter((t) => t.status === 'done').length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  // Current project member IDs for filtering the picker
  const currentMemberIds = new Set(
    (project.members || []).map((m) => m.user?._id?.toString() || m.user?.toString())
  );

  // Filter allUsers to exclude already-members, then apply search
  const filteredUsers = (Array.isArray(allUsers) ? allUsers : []).filter((u) => {
    if (currentMemberIds.has(u._id?.toString())) return false;
    if (!memberSearch) return true;
    const q = memberSearch.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link to="/projects" className="hover:text-brand-600">Projects</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{project.name}</span>
      </div>

      {/* Project header */}
      <div className="card p-5 mb-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: project.color }} />
            <div>
              <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-gray-400 mt-0.5">{project.description}</p>
              )}
            </div>
          </div>
          <button
            className="btn-primary btn btn-sm"
            onClick={() => { setEditTask(null); setShowTaskForm(true); }}
          >
            + Add Task
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{done}/{total} tasks completed</span>
            <span className="font-medium">{pct}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: project.color }}
            />
          </div>
        </div>

        {/* Members row */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {(project.members || []).slice(0, 6).map((m, i) => (
              <Avatar key={i} name={m.user?.name || ''} size="xs" className="ring-2 ring-white" />
            ))}
          </div>
          <span className="text-xs text-gray-400">
            {project.members?.length} member{project.members?.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-100">
        {['tasks', 'members'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'text-brand-600 border-brand-600'
                : 'text-gray-400 border-transparent hover:text-gray-700'
            }`}
          >
            {tab}
            <span className="ml-1.5 text-xs text-gray-400">
              ({tab === 'tasks' ? total : project.members?.length})
            </span>
          </button>
        ))}
      </div>

      {/* ── Tasks Tab ───────────────────────────────────────────── */}
      {activeTab === 'tasks' && (
        <div className="card">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Tasks</h2>
            <select
              className="input text-xs py-1.5 w-36"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {tasksLoading ? (
            <div className="flex justify-center py-10"><PageSpinner /></div>
          ) : taskList.length === 0 ? (
            <EmptyState
              icon="✅"
              title="No tasks yet"
              description="Add the first task to this project."
              action={
                <button className="btn-primary btn btn-sm" onClick={() => setShowTaskForm(true)}>
                  Add Task
                </button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Task', 'Assignee', 'Priority', 'Status', 'Due Date', ''].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {taskList.map((task) => (
                    <TaskRow
                      key={task._id}
                      task={task}
                      isAdmin={isAdmin}
                      currentUserId={user?._id}
                      onEdit={(t) => { setEditTask(t); setShowTaskForm(true); }}
                      onDelete={setDeleteTask}
                      onView={setViewTaskId}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Members Tab ─────────────────────────────────────────── */}
      {activeTab === 'members' && (
        <div className="card">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Team Members</h2>
            {isAdmin && (
              <button
                className="btn-primary btn btn-sm"
                onClick={() => { setShowAddMember(true); setMemberSearch(''); }}
              >
                + Add Member
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-50">
            {(project.members || []).map((m, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={m.user?.name || ''} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.user?.name}</p>
                    <p className="text-xs text-gray-400">{m.user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RoleBadge role={m.role} />
                  {isAdmin &&
                    m.user?._id !== project.owner?._id &&
                    m.user?._id !== user?._id && (
                      <button
                        onClick={() => removeMemberMutation.mutate(m.user?._id)}
                        className="btn-ghost btn btn-sm text-xs text-red-400 hover:text-red-600 hover:bg-red-50"
                        disabled={removeMemberMutation.isPending}
                      >
                        Remove
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Add Member Panel ─────────────────────────────────────── */}
      {showAddMember && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddMember(false)} />
          <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-md z-10">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-base font-semibold">Add Member to Project</h3>
              <button
                onClick={() => setShowAddMember(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5">
              {/* Search input */}
              <input
                className="input mb-3"
                placeholder="Search by name or email..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                autoFocus
              />

              {/* User list */}
              <div className="border border-gray-100 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                {usersLoading && (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full border-2 border-gray-200 border-t-brand-600 h-6 w-6" />
                  </div>
                )}

                {!usersLoading && filteredUsers.length === 0 && (
                  <div className="py-8 text-center text-sm text-gray-400">
                    {memberSearch
                      ? `No users matching "${memberSearch}"`
                      : 'All users are already members of this project'}
                  </div>
                )}

                {!usersLoading && filteredUsers.map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RoleBadge role={u.role} />
                      <button
                        onClick={() => addMemberMutation.mutate(u._id)}
                        disabled={addMemberMutation.isPending}
                        className="btn-primary btn btn-sm text-xs"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400 mt-3">
                {currentMemberIds.size} current member{currentMemberIds.size !== 1 ? 's' : ''} ·{' '}
                {filteredUsers.length} available to add
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <TaskFormModal
        open={showTaskForm}
        onClose={() => { setShowTaskForm(false); setEditTask(null); }}
        task={editTask}
        projectId={id}
      />

      <TaskDetailModal
        open={Boolean(viewTaskId)}
        onClose={() => setViewTaskId(null)}
        taskId={viewTaskId}
      />

      <ConfirmDialog
        open={Boolean(deleteTask)}
        onClose={() => setDeleteTask(null)}
        onConfirm={() => deleteTaskMutation.mutate(deleteTask?._id)}
        loading={deleteTaskMutation.isPending}
        title="Delete Task"
        message={`Delete "${deleteTask?.title}"? This cannot be undone.`}
        confirmLabel="Delete Task"
      />
    </div>
  );
}
