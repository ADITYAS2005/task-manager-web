import { Link } from 'react-router-dom';
import Avatar from '@/components/common/Avatar';

export default function ProjectCard({ project, onEdit, onDelete, isAdmin }) {
  const { _id, name, description, color, stats = {}, members = [], owner } = project;
  const { total = 0, done = 0, overdue = 0 } = stats;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="card p-5 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
          <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
        </div>
        {isAdmin && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(project)} className="btn-ghost btn btn-sm p-1.5" title="Edit">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={() => onDelete(project)} className="btn-ghost btn btn-sm p-1.5 hover:text-red-600 hover:bg-red-50" title="Delete">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mb-4 line-clamp-2 min-h-[2rem]">{description || 'No description'}</p>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>{done}/{total} tasks done</span>
          <span className="font-medium">{pct}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        {/* Member avatars */}
        <div className="flex -space-x-1.5">
          {members.slice(0, 4).map((m, i) => (
            <Avatar key={i} name={m.user?.name || ''} size="xs" className="ring-2 ring-white" />
          ))}
          {members.length > 4 && (
            <div className="w-6 h-6 rounded-full bg-gray-100 ring-2 ring-white flex items-center justify-center text-[10px] text-gray-500 font-medium">
              +{members.length - 4}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {overdue > 0 && (
            <span className="text-xs text-red-500 font-medium">{overdue} overdue</span>
          )}
          <Link
            to={`/projects/${_id}`}
            className="btn-secondary btn btn-sm text-xs"
          >
            Open →
          </Link>
        </div>
      </div>
    </div>
  );
}
