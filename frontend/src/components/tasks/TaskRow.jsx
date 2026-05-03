import Avatar from '@/components/common/Avatar';
import { StatusBadge, PriorityBadge } from '@/components/common/StatusBadge';
import { formatDate } from '@/utils/helpers';

export default function TaskRow({ task, onEdit, onDelete, onView, showProject = false, isAdmin, currentUserId }) {
  const assigneeId = task.assignee?._id?.toString() || task.assignee?.toString();
  const canEdit = isAdmin || assigneeId === currentUserId?.toString();

  return (
    <tr
      className="hover:bg-gray-50 transition-colors cursor-pointer group"
      onClick={() => onView?.(task._id)}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${task.isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
            {task.title}
          </span>
          {task.isOverdue && (
            <span className="badge badge-overdue text-[10px]">Overdue</span>
          )}
          {task.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="hidden sm:inline badge bg-gray-100 text-gray-500 text-[10px]">{tag}</span>
          ))}
        </div>
        {task.description && (
          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{task.description}</p>
        )}
      </td>

      {showProject && (
        <td className="px-4 py-3">
          <span className="text-xs text-gray-500">{task.project?.name || '—'}</span>
        </td>
      )}

      <td className="px-4 py-3">
        {task.assignee ? (
          <div className="flex items-center gap-1.5">
            <Avatar name={task.assignee.name} size="xs" />
            <span className="text-xs text-gray-600 hidden sm:inline">{task.assignee.name}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </td>

      <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
      <td className="px-4 py-3"><StatusBadge status={task.status} /></td>

      <td className="px-4 py-3">
        <span className={`text-xs ${task.isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
          {task.dueDate ? formatDate(task.dueDate) : '—'}
        </span>
      </td>

      <td className="px-4 py-3">
        <div
          className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {canEdit && (
            <button
              onClick={() => onEdit?.(task)}
              className="btn-ghost btn btn-sm p-1"
              title="Edit task"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => onDelete?.(task)}
              className="btn-ghost btn btn-sm p-1 hover:text-red-600 hover:bg-red-50"
              title="Delete task"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
