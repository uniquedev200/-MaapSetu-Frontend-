import { useState } from 'react';
import { useToast } from '../components/ToastContext';
import { useLang } from '../i18n/LanguageContext';

export default function Help() {
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const { t } = useLang();

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsTicketOpen(false);
      showToast(t('help.ticketSubmitted'), "success");
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 relative">
      <div className="mb-2">
        <h2 className="font-headline-lg text-headline-lg text-primary">{t('help.title')}</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">{t('help.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="neu-flat rounded-2xl p-6 flex flex-col gap-4">
          <div className="w-12 h-12 rounded-full neu-extruded bg-surface-container flex items-center justify-center text-primary mb-2">
            <span className="material-symbols-outlined">menu_book</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">{t('help.manuals')}</h3>
          <p className="font-body-md text-body-md text-on-surface-variant">{t('help.manualsDesc')}</p>
          <button onClick={() => showToast(t('help.redirectToast'), "info")} className="neu-btn px-4 py-2 mt-auto self-start text-primary font-label-sm font-bold bg-primary/5 rounded-lg inline-flex">{t('help.readGuides')}</button>
        </div>

        <div className="neu-flat rounded-2xl p-6 flex flex-col gap-4">
          <div className="w-12 h-12 rounded-full neu-extruded bg-surface-container flex items-center justify-center text-primary mb-2">
            <span className="material-symbols-outlined">support_agent</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">{t('help.contactSupport')}</h3>
          <p className="font-body-md text-body-md text-on-surface-variant">{t('help.contactDesc')}</p>
          <button onClick={() => setIsTicketOpen(true)} className="neu-btn px-4 py-2 mt-auto self-start text-primary font-label-sm font-bold bg-primary/5 rounded-lg">{t('help.raiseTicket')}</button>
        </div>
      </div>

      <div className="neu-flat rounded-2xl p-8 mt-4">
        <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-primary">quiz</span> {t('help.faq')}
        </h3>
        
        <div className="flex flex-col gap-4">
          <div className="neu-recessed p-4 rounded-xl">
            <h4 className="font-label-lg text-label-lg text-on-surface font-bold mb-2">{t('help.faq1Q')}</h4>
            <p className="font-body-md text-body-md text-on-surface-variant">{t('help.faq1A')}</p>
          </div>
          <div className="neu-recessed p-4 rounded-xl">
            <h4 className="font-label-lg text-label-lg text-on-surface font-bold mb-2">{t('help.faq2Q')}</h4>
            <p className="font-body-md text-body-md text-on-surface-variant">{t('help.faq2A')}</p>
          </div>
        </div>
      </div>

      {/* Raise Ticket Modal */}
      {isTicketOpen && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="neu-flat rounded-2xl w-full max-w-lg p-6 bg-background">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">{t('help.ticketTitle')}</h2>
              <button onClick={() => setIsTicketOpen(false)} className="w-8 h-8 flex items-center justify-center text-on-surface-variant neu-btn rounded-full">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">{t('help.ticketSubject')}</label>
                <input type="text" className="w-full neu-input-container rounded-lg px-4 py-2 text-body-md outline-none focus:ring-2 focus:ring-primary/20" placeholder={t('help.ticketSubjectPlaceholder')} />
              </div>
              <div>
                <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">{t('help.ticketDescription')}</label>
                <textarea className="w-full neu-input-container rounded-lg px-4 py-2 text-body-md outline-none focus:ring-2 focus:ring-primary/20 resize-none h-32" placeholder={t('help.ticketDescPlaceholder')}></textarea>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button onClick={() => setIsTicketOpen(false)} className="px-6 py-2 neu-btn text-on-surface-variant font-label-lg rounded-lg">{t('help.cancel')}</button>
                <button onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2 neu-btn text-primary bg-primary/10 font-label-lg font-bold rounded-lg hover:bg-primary/20 flex items-center gap-2">
                  {isSubmitting ? <span className="material-symbols-outlined animate-spin">sync</span> : null}
                  {isSubmitting ? t('help.submitting') : t('help.submitTicket')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
