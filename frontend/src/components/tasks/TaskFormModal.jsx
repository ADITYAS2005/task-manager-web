import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Spinner from '@/components/common/Spinner';
import { tasksApi } from '@/api/tasks.api';
import { projectsApi } from '@/api/projects.api';
import { STATUS_OPTIONS, PRIORITY_OPTIONS, extractError } from '@/utils/helpers';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function TaskFormModal({ open, onClose, task = null, projectId }) {
  const { isAdmin, user } = useAuth();
  const qc = useQueryClient();
  const isEdit = Boolean(task);

  // Determine if this member is the assignee
  const assigneeId = task?.assignee?._id?.toString() || task?.assignee?.toString();
  const isMemberAssignee = !isAdmin && isEdit && assigneeId === user?._id?.toString();
  // Members editing their own task: status-only form
  const memberStatusOnly = !isAdmin && isEdit;

  const [form, setForm] = useState({
    title: '',
    description: '',
    assignee: '',
    priority: 'medium',
    status: 'todo',
    dueDate: '',
    tags: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm({
        title: task?.title || '',
        description: task?.description || '',
        assignee: task?.assignee?._id || task?.assignee || '',
        priority: task?.priority || 'medium',
        status: task?.status || 'todo',
        dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
        tags: task?.tags?.join(', ') || '',
      });
      setErrors({});
    }
  }, [open, task]);

  const pid = projectId || task?.project?._id || task?.project;

  const { data: members } = useQuery({
    queryKey: ['project-members', pid],
    queryFn: () => projectsApi.getMembers(pid).then((r) => r.data.data.members),
    enabled: Boolean(pid) && open && isAdmin,
  });

  const memberOptions = [
    { value: '', label: 'Unassigned' },
    ...(members || []).map((m) => ({
      value: m.user?._id || m.user,
      label: m.user?.name || 'Unknown',
    })),
  ];

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!memberStatusOnly && form.title.trim().length < 2) {
      errs.title = 'Title must be at least 2 characters';
    }
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit
        ? tasksApi.update(task._id, data)
        : tasksApi.create(pid, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', pid] });
      qc.invalidateQueries({ queryKey: ['my-tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success(isEdit ? 'Task updated!' : 'Task created!');
      onClose();
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Members can only send status
    if (memberStatusOnly) {
      mutation.mutate({ status: form.status });
      return;
    }

    const tags = form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
    mutation.mutate({
      title: form.title,
      description: form.description,
      assignee: form.assignee || null,
      priority: form.priority,
      status: form.status,
      dueDate: form.dueDate || null,
      tags,
    });
  };

  // ── Member editing their task: status-only form ─────────────────────────
  if (memberStatusOnly) {
    return (
      <Modal open={open} onClose={onClose} title="Update Task Status" size="sm">
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-0.5">Task</p>
          <p className="text-sm font-medium text-gray-900">{task?.title}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Status"
            id="tstatus"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={set('status')}
          />
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-secondary btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary btn" disabled={mutation.isPending}>
              {mutation.isPending ? <Spinner size="sm" /> : 'Update Status'}
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  // ── Admin / create: full form ────────────────────────────────────────────
  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Task' : 'New Task'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Task title *"
          id="ttitle"
          value={form.title}
          onChange={set('title')}
          error={errors.title}
          placeholder="e.g. Implement login page"
          autoFocus
        />

        <div>
          <label className="label" htmlFor="tdesc">Description</label>
          <textarea
            id="tdesc"
            rows={3}
            className="input resize-none"
            placeholder="Add more details..."
            value={form.description}
            onChange={set('description')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Priority"
            id="tpriority"
            options={PRIORITY_OPTIONS}
            value={form.priority}
            onChange={set('priority')}
          />
          <Select
            label="Status"
            id="tstatus"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={set('status')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Assignee"
            id="tassignee"
            options={memberOptions}
            value={form.assignee}
            onChange={set('assignee')}
          />
          <Input
            label="Due date"
            id="tdue"
            type="date"
            value={form.dueDate}
            onChange={set('dueDate')}
          />
        </div>

        <Input
          label="Tags (comma-separated)"
          id="ttags"
          value={form.tags}
          onChange={set('tags')}
          placeholder="frontend, bug, urgent"
        />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary btn" disabled={mutation.isPending}>
            {mutation.isPending ? <Spinner size="sm" /> : isEdit ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
