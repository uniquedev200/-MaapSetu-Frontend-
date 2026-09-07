import { useState } from 'react';
import { useToast } from '../components/ToastContext';

export default function Help() {
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsTicketOpen(false);
      showToast("Support ticket submitted successfully. We will get back to you shortly.", "success");
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 relative">
      <div className="mb-2">
        <h2 className="font-headline-lg text-headline-lg text-primary">Help & Support</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">Find answers and get assistance with the verification system.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="neu-flat rounded-2xl p-6 flex flex-col gap-4">
          <div className="w-12 h-12 rounded-full neu-extruded bg-surface-container flex items-center justify-center text-primary mb-2">
            <span className="material-symbols-outlined">menu_book</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">User Manuals</h3>
          <p className="font-body-md text-body-md text-on-surface-variant">Step-by-step guides on how to register instruments, apply for verification, and download certificates.</p>
          <button onClick={() => showToast("Redirecting to documentation portal...", "info")} className="neu-btn px-4 py-2 mt-auto self-start text-primary font-label-sm font-bold bg-primary/5 rounded-lg inline-flex">Read Guides</button>
        </div>

        <div className="neu-flat rounded-2xl p-6 flex flex-col gap-4">
          <div className="w-12 h-12 rounded-full neu-extruded bg-surface-container flex items-center justify-center text-primary mb-2">
            <span className="material-symbols-outlined">support_agent</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Contact Support</h3>
          <p className="font-body-md text-body-md text-on-surface-variant">Need direct assistance? Reach out to our technical support team for help with your account or applications.</p>
          <button onClick={() => setIsTicketOpen(true)} className="neu-btn px-4 py-2 mt-auto self-start text-primary font-label-sm font-bold bg-primary/5 rounded-lg">Raise Ticket</button>
        </div>
      </div>

      <div className="neu-flat rounded-2xl p-8 mt-4">
        <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-primary">quiz</span> Frequently Asked Questions
        </h3>
        
        <div className="flex flex-col gap-4">
          <div className="neu-recessed p-4 rounded-xl">
            <h4 className="font-label-lg text-label-lg text-on-surface font-bold mb-2">How long does verification take?</h4>
            <p className="font-body-md text-body-md text-on-surface-variant">Standard verifications are completed within 5-7 business days from the date of application submission, depending on inspector availability.</p>
          </div>
          <div className="neu-recessed p-4 rounded-xl">
            <h4 className="font-label-lg text-label-lg text-on-surface font-bold mb-2">What happens if my instrument fails?</h4>
            <p className="font-body-md text-body-md text-on-surface-variant">If an instrument fails inspection, you will be notified of the reasons. You must repair or recalibrate the instrument and submit a new verification request.</p>
          </div>
        </div>
      </div>

      {/* Raise Ticket Modal */}
      {isTicketOpen && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="neu-flat rounded-2xl w-full max-w-lg p-6 bg-background">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Submit Support Ticket</h2>
              <button onClick={() => setIsTicketOpen(false)} className="w-8 h-8 flex items-center justify-center text-on-surface-variant neu-btn rounded-full">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Subject</label>
                <input type="text" className="w-full neu-input-container rounded-lg px-4 py-2 text-body-md outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Issue with Application APP-102" />
              </div>
              <div>
                <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Description</label>
                <textarea className="w-full neu-input-container rounded-lg px-4 py-2 text-body-md outline-none focus:ring-2 focus:ring-primary/20 resize-none h-32" placeholder="Please describe the issue in detail..."></textarea>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button onClick={() => setIsTicketOpen(false)} className="px-6 py-2 neu-btn text-on-surface-variant font-label-lg rounded-lg">Cancel</button>
                <button onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2 neu-btn text-primary bg-primary/10 font-label-lg font-bold rounded-lg hover:bg-primary/20 flex items-center gap-2">
                  {isSubmitting ? <span className="material-symbols-outlined animate-spin">sync</span> : null}
                  {isSubmitting ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
