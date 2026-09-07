import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/ToastContext';
import { useLang } from '../i18n/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { signupApi } from '../api';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const { t } = useLang();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      showToast(t('signup.fillRequired'), 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await signupApi({
        name, email, password,
        phone: phone || undefined,
        district: district || undefined,
        business_name: businessName || undefined
      });
      
      // We expect the backend to return { user: { ... }, token: "jwt_token" } upon signup
      login({
        id: response.user?.id || 'USR-000',
        name: response.user?.name || name,
        email: response.user?.email || email,
        role: response.user?.role || 'BUSINESS',
        token: response.token
      } as any);
      
      showToast(t('signup.success'), 'success');
      navigate('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.detail || t('signup.failCreate');
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex justify-end mb-2">
          <LanguageSwitcher />
        </div>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl">person_add</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary font-bold">{t('signup.title')}</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">{t('signup.subtitle')}</p>
        </div>

        <form onSubmit={handleSignup} className="neu-flat p-8 rounded-3xl flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-label-sm text-on-surface-variant ml-1">{t('signup.fullName')}</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">person</span>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full neu-input-container pl-12 pr-4 py-3 rounded-xl font-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/20 bg-transparent transition-all"
                placeholder="Acme Corp"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-label-sm text-on-surface-variant ml-1">{t('signup.businessName')}</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">storefront</span>
              <input 
                type="text" 
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full neu-input-container pl-12 pr-4 py-3 rounded-xl font-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/20 bg-transparent transition-all"
                placeholder="Acme Weighing Co."
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-label-sm text-on-surface-variant ml-1">{t('signup.email')}</label>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm text-on-surface-variant ml-1">{t('signup.phone')}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">call</span>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full neu-input-container pl-12 pr-4 py-3 rounded-xl font-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/20 bg-transparent transition-all"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm text-on-surface-variant ml-1">{t('signup.district')}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">location_on</span>
                <input 
                  type="text" 
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full neu-input-container pl-12 pr-4 py-3 rounded-xl font-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/20 bg-transparent transition-all"
                  placeholder="Kottayam"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-label-sm text-on-surface-variant ml-1">{t('signup.password')}</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">lock</span>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full neu-input-container pl-12 pr-4 py-3 rounded-xl font-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/20 bg-transparent transition-all"
                placeholder={t('signup.passwordPlaceholder')}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 mt-4 neu-flat !bg-primary !text-on-primary font-label-lg font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-70 transition-all shadow-[4px_4px_8px_#dce1eb,-4px_-4px_8px_#ffffff]"
          >
            {isLoading ? <span className="material-symbols-outlined animate-spin">sync</span> : t('signup.createAccount')}
          </button>
        </form>

        <p className="text-center font-body-md text-body-md text-on-surface-variant mt-8">
          {t('signup.haveAccount')} <Link to="/login" className="text-primary font-bold hover:underline">{t('signup.signIn')}</Link>
        </p>
      </div>
    </div>
  );
}
