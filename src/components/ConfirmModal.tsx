
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="neu-flat rounded-2xl w-full max-w-md p-6 relative z-10 animate-slide-up flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDestructive ? 'bg-error-container text-error' : 'bg-primary-container text-on-primary-container'}`}>
            <span className="material-symbols-outlined">
              {isDestructive ? 'warning' : 'help'}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">{title}</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">{message}</p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-4">
          <button 
            onClick={onCancel}
            className="neu-btn px-6 py-2.5 font-label-lg text-label-lg text-on-surface-variant"
          >
            {cancelLabel}
          </button>
          <button 
            onClick={onConfirm}
            className={`neu-flat px-6 py-2.5 font-label-lg text-label-lg font-bold shadow-[4px_4px_8px_#dce1eb,-4px_-4px_8px_#ffffff] ${
              isDestructive 
                ? '!bg-error !text-on-error' 
                : '!bg-primary !text-on-primary'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
