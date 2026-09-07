import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/ToastContext';
import { loginApi } from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await loginApi({ email, password });
      
      // We expect the backend to return { user: { id, name, email, role }, token: "jwt_token" }
      login({
        id: response.user?.id || 'USR-000',
        name: response.user?.name || email.split('@')[0],
        email: response.user?.email || email,
        role: response.user?.role || 'BUSINESS',
        token: response.token // Ensure the AuthContext stores this in localStorage
      } as any);
      
      showToast('Successfully logged in!', 'success');
      navigate('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Invalid credentials or network error.';
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl">scale</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary font-bold">LM Verify</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleLogin} className="neu-flat p-8 rounded-3xl flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-label-sm text-on-surface-variant ml-1">Email Address</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">mail</span>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full neu-input-container pl-12 pr-4 py-3 rounded-xl font-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/20 bg-transparent transition-all"
                placeholder="owner@business.com"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-label-sm text-on-surface-variant ml-1 flex justify-between">
              Password
              <a href="#" onClick={(e) => { e.preventDefault(); showToast('Password reset link sent.', 'info'); }} className="text-primary hover:underline">Forgot?</a>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">lock</span>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full neu-input-container pl-12 pr-4 py-3 rounded-xl font-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/20 bg-transparent transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 mt-4 neu-flat !bg-primary !text-on-primary font-label-lg font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-70 transition-all shadow-[4px_4px_8px_#dce1eb,-4px_-4px_8px_#ffffff]"
          >
            {isLoading ? <span className="material-symbols-outlined animate-spin">sync</span> : 'Sign In'}
          </button>
        </form>

        <p className="text-center font-body-md text-body-md text-on-surface-variant mt-8">
          Don't have an account? <Link to="/signup" className="text-primary font-bold hover:underline">Register here</Link>
        </p>

        <div className="neu-flat rounded-2xl p-5 mt-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full neu-recessed bg-surface-container-low flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_scanner</span>
          </div>
          <div className="flex-1">
            <p className="font-headline-sm text-headline-sm font-semibold text-primary">Consumer? No login needed.</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Scan the QR on any certificate to verify its authenticity instantly.</p>
          </div>
          <Link to="/scan" className="shrink-0 py-2 px-4 rounded-lg font-label-sm text-label-sm text-primary font-bold neu-flat transition-all active:scale-95">
            Scan QR
          </Link>
        </div>
      </div>
    </div>
  );
}
