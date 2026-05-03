import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Spinner from '@/components/common/Spinner';
import { projectsApi } from '@/api/projects.api';
import { PROJECT_COLORS, extractError } from '@/utils/helpers';
import toast from 'react-hot-toast';

export default function ProjectFormModal({ open, onClose, project = null }) {
  const qc = useQueryClient();
  const isEdit = Boolean(project);

  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    color: project?.color || PROJECT_COLORS[0],
    dueDate: project?.dueDate ? project.dueDate.slice(0, 10) : '',
  });
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? projectsApi.update(project._id, data) : projectsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success(isEdit ? 'Project updated!' : 'Project created!');
      onClose();
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const validate = () => {
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate({ ...form, dueDate: form.dueDate || undefined });
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Project' : 'New Project'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Project name *" id="pname" value={form.name} onChange={set('name')} error={errors.name} placeholder="e.g. Website Redesign" autoFocus />

        <div>
          <label className="label" htmlFor="pdesc">Description</label>
          <textarea
            id="pdesc" rows={3}
            className="input resize-none"
            placeholder="What is this project about?"
            value={form.description}
            onChange={set('description')}
          />
        </div>

        <div>
          <label className="label">Color</label>
          <div className="flex gap-2 flex-wrap">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c} type="button"
                onClick={() => setForm((p) => ({ ...p, color: c }))}
                className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        <Input label="Due date" id="pdue" type="date" value={form.dueDate} onChange={set('dueDate')} />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary btn" disabled={mutation.isPending}>
            {mutation.isPending ? <Spinner size="sm" /> : isEdit ? 'Save changes' : 'Create project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
