import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/api/projects.api';
import { useAuth } from '@/contexts/AuthContext';
import { PageSpinner } from '@/components/common/Spinner';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectFormModal from '@/components/projects/ProjectFormModal';
import { extractError } from '@/utils/helpers';
import toast from 'react-hot-toast';

export default function ProjectsPage() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll().then((r) => r.data.data.projects),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => projectsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted');
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(extractError(err)),
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data?.length || 0} projects total</p>
        </div>
        {isAdmin && (
          <button className="btn-primary btn" onClick={() => { setEditProject(null); setShowForm(true); }}>
            + New Project
          </button>
        )}
      </div>

      {data?.length === 0 ? (
        <EmptyState
          icon="📁"
          title="No projects yet"
          description={isAdmin ? 'Create your first project to get started.' : 'You have not been added to any projects yet.'}
          action={isAdmin && (
            <button className="btn-primary btn" onClick={() => setShowForm(true)}>Create Project</button>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              isAdmin={isAdmin}
              onEdit={(p) => { setEditProject(p); setShowForm(true); }}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <ProjectFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditProject(null); }}
        project={editProject}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?._id)}
        loading={deleteMutation.isPending}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All tasks inside will also be deleted. This cannot be undone.`}
        confirmLabel="Delete Project"
      />
    </div>
  );
}
