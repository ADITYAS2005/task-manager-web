import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Input from '@/components/common/Input';
import Spinner from '@/components/common/Spinner';
import { extractError } from '@/utils/helpers';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { user, login, signup } = useAuth();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [errors, setErrors] = useState({});

  if (user) return <Navigate to="/dashboard" replace />;

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (isSignup && form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!form.email.match(/^\S+@\S+\.\S+$/)) errs.email = 'Valid email required';
    if (form.password.length < 8) errs.password = 'Min 8 characters';
    if (isSignup && !form.password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)) {
      errs.password = 'Needs uppercase, lowercase and number';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (isSignup) {
        await signup({ name: form.name, email: form.email, password: form.password, role: form.role });
        toast.success('Account created! Welcome aboard.');
      } else {
        await login({ email: form.email, password: form.password });
        toast.success('Welcome back!');
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">TaskFlow</h1>
          <p className="text-sm text-gray-500 mt-1">Team Task Manager</p>
        </div>

        <div className="card p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {isSignup ? 'Create your account' : 'Sign in to your account'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {isSignup ? 'Join your team on TaskFlow' : 'Enter your credentials to continue'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <Input
                label="Full name"
                id="name"
                type="text"
                placeholder="John Smith"
                value={form.name}
                onChange={set('name')}
                error={errors.name}
                autoFocus
              />
            )}

            <Input
              label="Email address"
              id="email"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={set('email')}
              error={errors.email}
              autoFocus={!isSignup}
            />

            <Input
              label="Password"
              id="password"
              type="password"
              placeholder={isSignup ? 'Min 8 chars, upper, lower, number' : '••••••••'}
              value={form.password}
              onChange={set('password')}
              error={errors.password}
            />

            {isSignup && (
              <div>
                <label className="label" htmlFor="role">Role</label>
                <select id="role" className="input" value={form.role} onChange={set('role')}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            <button type="submit" className="btn-primary btn w-full mt-2" disabled={loading}>
              {loading ? <Spinner size="sm" /> : isSignup ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            <button
              type="button"
              onClick={() => { setIsSignup((p) => !p); setErrors({}); }}
              className="text-brand-600 font-medium hover:underline"
            >
              {isSignup ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Demo: admin@demo.com / Admin123 — or create your own account
        </p>
      </div>
    </div>
  );
}
