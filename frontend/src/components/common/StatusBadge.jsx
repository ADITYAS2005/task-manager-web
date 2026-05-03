import { STATUS_LABELS, PRIORITY_LABELS } from '@/utils/helpers';

export function StatusBadge({ status }) {
  const classMap = {
    'todo': 'badge-todo',
    'in-progress': 'badge-progress',
    'review': 'badge-review',
    'done': 'badge-done',
  };
  return (
    <span className={`badge ${classMap[status] || 'badge-todo'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const classMap = {
    low: 'badge-low',
    medium: 'badge-medium',
    high: 'badge-high',
    critical: 'badge-critical',
  };
  const icons = { low: '↓', medium: '→', high: '↑', critical: '⚡' };
  return (
    <span className={`badge ${classMap[priority] || 'badge-medium'}`}>
      {icons[priority]} {PRIORITY_LABELS[priority] || priority}
    </span>
  );
}

export function RoleBadge({ role }) {
  return (
    <span className={`badge ${role === 'admin' ? 'badge-admin' : 'badge-member'}`}>
      {role === 'admin' ? 'Admin' : 'Member'}
    </span>
  );
}
