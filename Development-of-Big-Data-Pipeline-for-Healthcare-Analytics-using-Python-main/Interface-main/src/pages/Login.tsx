import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, Stethoscope, Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react';
import { useHospital } from '@/context/HospitalContext';
import { API_BASE_URL } from '@/config/api';

export default function Login() {
  const navigate = useNavigate();
  const { portal } = useParams<{ portal: 'admin' | 'doctor' }>();
  const { login, state } = useHospital();

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (state.auth.isAuthenticated && state.auth.user) {
      navigate(state.auth.user.role === 'admin' ? '/admin' : '/doctor');
    }
  }, [state.auth, navigate]);

 const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setError('');
            setIsLoading(true);

            try {
              const result = await login(userId, password, portal as 'admin' | 'doctor');

              if (result.success) {
                navigate(portal === 'admin' ? '/admin' : '/doctor', { replace: true });
              } else {
                setError(result.error || 'Invalid credentials');
              }
            } catch (err) {
              console.error(err);
              setError('Server error. Please try again.');
            } finally {
              setIsLoading(false);
            }
          };


  const isAdmin = portal === 'admin';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to portal selection
        </button>

        <div className="card-healthcare p-8">
          <div className="text-center mb-8">
            <div
              className={`inline-flex p-4 rounded-2xl mb-4 ${
                isAdmin ? 'gradient-primary' : 'bg-gradient-to-br from-accent to-primary'
              }`}
            >
              {isAdmin ? (
                <Building2 className="w-8 h-8 text-primary-foreground" />
              ) : (
                <Stethoscope className="w-8 h-8 text-primary-foreground" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {isAdmin ? 'Hospital Admin' : 'Doctor Portal'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isAdmin ? 'Access hospital record management' : 'Access your patient records'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 text-destructive">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                User ID
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder={isAdmin ? 'admin_hospital' : 'dr_username'}
                className="input-healthcare"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-healthcare pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              {isAdmin ? (
                <>
                  Demo:{' '}
                  <code className="px-1 py-0.5 rounded bg-muted">admin_hospital</code> /{' '}
                  <code className="px-1 py-0.5 rounded bg-muted">admin123</code>
                </>
              ) : (
                <>
                  Doctor Login: Use your MongoDB credentials (example:{' '}
                  <code className="px-1 py-0.5 rounded bg-muted">mahe</code> /{' '}
                  <code className="px-1 py-0.5 rounded bg-muted">mahendra</code>)
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
