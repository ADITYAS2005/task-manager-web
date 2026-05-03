import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy');
};

export const formatRelative = (date) => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'done') return false;
  return isPast(new Date(dueDate));
};

export const getDueDateLabel = (dueDate) => {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  if (isToday(d)) return 'Due today';
  if (isTomorrow(d)) return 'Due tomorrow';
  return `Due ${format(d, 'MMM d')}`;
};

export const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

export const STATUS_LABELS = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'review': 'In Review',
  'done': 'Done',
};

export const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }));
export const PRIORITY_OPTIONS = Object.entries(PRIORITY_LABELS).map(([v, l]) => ({ value: v, label: l }));

export const PROJECT_COLORS = [
  '#185FA5', '#3B6D11', '#854F0B', '#534AB7',
  '#A32D2D', '#0F6E56', '#993556', '#5F5E5A',
];

export const truncate = (str, n = 50) => str?.length > n ? str.slice(0, n) + '…' : str;

export const extractError = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.errors?.[0]?.message ||
  error?.message ||
  'Something went wrong';
