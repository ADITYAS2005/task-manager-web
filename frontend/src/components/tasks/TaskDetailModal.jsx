import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import Modal from '@/components/common/Modal';
import Avatar from '@/components/common/Avatar';
import { StatusBadge, PriorityBadge } from '@/components/common/StatusBadge';
import Spinner from '@/components/common/Spinner';
import { tasksApi } from '@/api/tasks.api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, formatRelative, extractError } from '@/utils/helpers';
import toast from 'react-hot-toast';

export default function TaskDetailModal({ open, onClose, taskId }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [comment, setComment] = useState('');

  const { data: task, isLoading } = useQuery({
    queryKey: ['task-detail', taskId],
    queryFn: () => tasksApi.getOne(taskId).then((r) => r.data.data.task),
    enabled: Boolean(taskId) && open,
  });

  const commentMutation = useMutation({
    mutationFn: (text) => tasksApi.addComment(taskId, text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task-detail', taskId] });
      setComment('');
      toast.success('Comment added');
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => tasksApi.deleteComment(taskId, commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task-detail', taskId] }),
    onError: (err) => toast.error(extractError(err)),
  });

  const handleComment = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    commentMutation.mutate(comment.trim());
  };

  return (
    <Modal open={open} onClose={onClose} title="Task Details" size="lg">
      {isLoading && <div className="flex justify-center py-8"><Spinner size="lg" /></div>}
      {task && (
        <div className="space-y-5">
          {/* Header */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">{task.title}</h3>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {task.isOverdue && <span className="badge badge-overdue">Overdue</span>}
              {task.tags?.map((tag) => (
                <span key={tag} className="badge bg-gray-100 text-gray-600">{tag}</span>
              ))}
            </div>
          </div>

          {task.description && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-xs text-gray-400 mb-1">Assignee</p>
              {task.assignee ? (
                <div className="flex items-center gap-2">
                  <Avatar name={task.assignee.name} size="xs" />
                  <span className="text-sm font-medium">{task.assignee.name}</span>
                </div>
              ) : <span className="text-sm text-gray-400">Unassigned</span>}
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Created by</p>
              <div className="flex items-center gap-2">
                <Avatar name={task.createdBy?.name} size="xs" />
                <span className="text-sm font-medium">{task.createdBy?.name}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Due date</p>
              <span className={`text-sm font-medium ${task.isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                {task.dueDate ? formatDate(task.dueDate) : '—'}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Created</p>
              <span className="text-sm text-gray-700">{formatRelative(task.createdAt)}</span>
            </div>
          </div>

          {/* Comments */}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Comments ({task.comments?.length || 0})
            </p>
            <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
              {task.comments?.length === 0 && (
                <p className="text-sm text-gray-400">No comments yet.</p>
              )}
              {task.comments?.map((c) => (
                <div key={c._id} className="flex gap-2.5 group">
                  <Avatar name={c.user?.name} size="xs" className="flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-gray-700">{c.user?.name}</span>
                      <span className="text-xs text-gray-400">{formatRelative(c.createdAt)}</span>
                      {(c.user?._id === user?._id || user?.role === 'admin') && (
                        <button
                          onClick={() => deleteCommentMutation.mutate(c._id)}
                          className="text-xs text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add comment */}
            <form onSubmit={handleComment} className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={1000}
              />
              <button type="submit" className="btn-primary btn btn-sm" disabled={!comment.trim() || commentMutation.isPending}>
                {commentMutation.isPending ? <Spinner size="sm" /> : 'Send'}
              </button>
            </form>
          </div>
        </div>
      )}
    </Modal>
  );
}
