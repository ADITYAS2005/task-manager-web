import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/api/users.api';
import { useAuth } from '@/contexts/AuthContext';
import { PageSpinner } from '@/components/common/Spinner';
import Avatar from '@/components/common/Avatar';
import { RoleBadge } from '@/components/common/StatusBadge';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { formatDate, extractError } from '@/utils/helpers';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users', search, roleFilter],
    queryFn: () =>
      usersApi.getAll({ ...(search && { search }), ...(roleFilter && { role: roleFilter }) })
        .then((r) => ({ users: r.data.data, total: r.data.pagination?.total || 0 })),
  });

  const toggleRoleMutation = useMutation({
    mutationFn: ({ id, role }) => usersApi.update(id, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Role updated');
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }) => usersApi.update(id, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User status updated');
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => usersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted');
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(extractError(err)),
  });

  if (isLoading) return <PageSpinner />;

  const users = data?.users || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Team Members</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data?.total || 0} users total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <input
          className="input text-sm w-56"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input text-sm w-36"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="member">Member</option>
        </select>
        {(search || roleFilter) && (
          <button className="btn-ghost btn btn-sm text-xs" onClick={() => { setSearch(''); setRoleFilter(''); }}>
            Clear
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['User', 'Role', 'Status', 'Joined', 'Last Login', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {u.name}
                        {u._id === me._id && <span className="ml-1.5 text-xs text-brand-600">(you)</span>}
                      </p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                <td className="px-4 py-3">
                  <span className={`badge ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{u.lastLogin ? formatDate(u.lastLogin) : '—'}</td>
                <td className="px-4 py-3">
                  {u._id !== me._id && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleRoleMutation.mutate({ id: u._id, role: u.role === 'admin' ? 'member' : 'admin' })}
                        className="btn-ghost btn btn-sm text-xs"
                        title="Toggle role"
                      >
                        {u.role === 'admin' ? 'Make Member' : 'Make Admin'}
                      </button>
                      <button
                        onClick={() => toggleActiveMutation.mutate({ id: u._id, isActive: !u.isActive })}
                        className={`btn btn-sm text-xs ${u.isActive ? 'btn-ghost text-amber-600 hover:bg-amber-50' : 'btn-ghost text-green-600 hover:bg-green-50'}`}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(u)}
                        className="btn-ghost btn btn-sm text-xs text-red-400 hover:text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="p-10 text-center text-sm text-gray-400">No users found.</div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?._id)}
        loading={deleteMutation.isPending}
        title="Delete User"
        message={`Permanently delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete User"
      />
    </div>
  );
}
