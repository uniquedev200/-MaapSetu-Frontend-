import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import { useLang } from '../i18n/LanguageContext';
import { cacheClear } from '../api/httpCache';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'BUSINESS' | 'LMO' | 'GATC' | 'ADMIN';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { t } = useLang();
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Check local storage for mock session
    const storedUser = localStorage.getItem('lm_session');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('lm_session');
      }
    }
    setIsInitializing(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('lm_session', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lm_session');
    // Drop cached API responses so the next account never sees stale data.
    cacheClear();
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-primary text-4xl animate-spin">sync</span>
        <p className="mt-4 font-label-lg text-on-surface-variant">{t('common.loadingSession')}</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
