import { useState, useEffect } from 'react';
import { fetchSettings, updateSettings, changePassword } from '../api';
import { useToast } from '../components/ToastContext';
import { useLang } from '../i18n/LanguageContext';
import { useTheme, type Theme } from '../i18n/ThemeContext';

export default function Settings() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const { showToast } = useToast();
  const { t } = useLang();
  const { setTheme } = useTheme();

  useEffect(() => {
    fetchSettings().then(data => {
      setSettings(data);
      setLoading(false);
      const savedTheme: Theme | undefined = data?.theme;
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
        setTheme(savedTheme);
      }
    }).catch(() => setLoading(false));
  }, [setTheme]);

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      const saved = await updateSettings({
        notifications: settings.notifications,
        two_factor_auth: settings.two_factor_auth,
        theme: settings.theme
      });
      setSettings(saved);
      showToast(t('settings.saveSuccess'), 'success');
    } catch (error: any) {
      showToast(error?.response?.data?.detail || t('settings.saveFailed'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showToast(t('settings.pwMismatch'), 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast(t('settings.pwTooShort'), 'error');
      return;
    }
    setPwSaving(true);
    try {
      await changePassword({ old_password: oldPassword, new_password: newPassword });
      showToast(t('settings.pwChanged'), 'success');
      setPwOpen(false);
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (error: any) {
      showToast(error?.response?.data?.detail || t('settings.pwChangeFailed'), 'error');
    } finally {
      setPwSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center">{t('settings.loading')}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 relative">
      <div className="mb-2">
        <h2 className="font-headline-lg text-headline-lg text-primary">{t('settings.title')}</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">{t('settings.subtitle')}</p>
      </div>

      <div className="neu-flat rounded-xl p-6 flex flex-col gap-6">
        <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">notifications</span> {t('settings.notifSection')}
        </h3>
        
        <div className="flex flex-col gap-4 pl-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-label-lg text-label-lg text-on-surface">{t('settings.emailNotif')}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">{t('settings.emailNotifSub')}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer group">
              <input type="checkbox" checked={settings.notifications?.email} onChange={() => setSettings({...settings, notifications: {...settings.notifications, email: !settings.notifications.email}})} className="sr-only peer" />
              <div className="w-14 h-8 bg-surface-container rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-primary after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all neu-recessed peer-checked:bg-primary-container/20"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-label-lg text-label-lg text-on-surface">{t('settings.smsNotif')}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">{t('settings.smsNotifSub')}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer group">
              <input type="checkbox" checked={settings.notifications?.sms} onChange={() => setSettings({...settings, notifications: {...settings.notifications, sms: !settings.notifications.sms}})} className="sr-only peer" />
              <div className="w-14 h-8 bg-surface-container rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-primary after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all neu-recessed peer-checked:bg-primary-container/20"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="neu-flat rounded-xl p-6 flex flex-col gap-6">
        <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">security</span> {t('settings.securitySection')}
        </h3>
        
        <div className="flex flex-col gap-4 pl-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-label-lg text-label-lg text-on-surface">{t('settings.twoFactor')}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">{t('settings.twoFactorSub')}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer group">
              <input type="checkbox" checked={settings.two_factor_auth} onChange={() => setSettings({...settings, two_factor_auth: !settings.two_factor_auth})} className="sr-only peer" />
              <div className="w-14 h-8 bg-surface-container rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-primary after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all neu-recessed peer-checked:bg-primary-container/20"></div>
            </label>
          </div>

          <div className="mt-2">
            <button onClick={() => setPwOpen(o => !o)} className="neu-btn px-6 py-2 text-primary font-label-lg rounded-lg">{t('settings.changePassword')}</button>
          </div>

          {pwOpen && (
            <div className="neu-recessed rounded-xl p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-label-lg text-label-lg text-on-surface pl-1">{t('settings.currentPassword')}</label>
                <div className="neu-input-container rounded-lg flex items-center px-4 h-12">
                  <input type="password" className="neu-input w-full text-on-surface font-body-md placeholder-outline h-full border-none focus:ring-0 outline-none" placeholder={t('settings.currentPwPlaceholder')} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-lg text-label-lg text-on-surface pl-1">{t('settings.newPassword')}</label>
                <div className="neu-input-container rounded-lg flex items-center px-4 h-12">
                  <input type="password" className="neu-input w-full text-on-surface font-body-md placeholder-outline h-full border-none focus:ring-0 outline-none" placeholder={t('settings.newPwPlaceholder')} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-lg text-label-lg text-on-surface pl-1">{t('settings.confirmNewPassword')}</label>
                <div className="neu-input-container rounded-lg flex items-center px-4 h-12">
                  <input type="password" className="neu-input w-full text-on-surface font-body-md placeholder-outline h-full border-none focus:ring-0 outline-none" placeholder={t('settings.confirmPwPlaceholder')} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
              </div>
              <button onClick={handleChangePassword} disabled={pwSaving} className="neu-btn self-start px-6 py-2.5 text-primary font-label-lg font-bold rounded-lg flex items-center gap-2">
                {pwSaving ? t('settings.updating') : t('settings.updatePassword')}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="neu-flat rounded-xl p-6 flex flex-col gap-6">
        <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">palette</span> {t('settings.preferencesSection')}
        </h3>
        
        <div className="flex flex-col gap-4 pl-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-label-lg text-label-lg text-on-surface">{t('settings.theme')}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">{t('settings.themeSub')}</p>
            </div>
            <div className="flex gap-2">
               <select 
                 className="neu-input-container rounded-lg px-4 py-2 border-none outline-none font-body-md text-on-surface bg-transparent"
                 value={settings.theme}
                 onChange={(e) => {
                   const next = e.target.value as Theme;
                   setTheme(next);
                   setSettings({...settings, theme: next});
                 }}
               >
                 <option value="light">{t('settings.themeLight')}</option>
                 <option value="dark">{t('settings.themeDark')}</option>
                 <option value="system">{t('settings.themeSystem')}</option>
               </select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-4 mt-4">
        <button onClick={() => window.history.back()} className="neu-btn px-8 py-3 text-on-surface font-label-lg rounded-lg">{t('settings.cancel')}</button>
        <button onClick={handleSave} disabled={isSaving} className="neu-btn px-8 py-3 text-primary font-label-lg font-bold bg-primary/10 rounded-lg flex items-center gap-2">
          {isSaving ? <span className="material-symbols-outlined animate-spin">sync</span> : null}
          {isSaving ? t('settings.saving') : t('settings.saveChanges')}
        </button>
      </div>
    </div>
  );
}