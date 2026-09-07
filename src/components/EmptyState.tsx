import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  actionOnClick?: () => void;
  children?: ReactNode;
}

export default function EmptyState({ 
  icon = 'inbox', 
  title, 
  description, 
  actionLabel, 
  actionTo, 
  actionOnClick,
  children
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center w-full min-h-[300px]">
      <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-6 neu-recessed text-on-surface-variant">
        <span className="material-symbols-outlined text-4xl">{icon}</span>
      </div>
      <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2 font-bold">{title}</h3>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mb-6">{description}</p>
      
      {actionLabel && actionTo && (
        <Link to={actionTo} className="neu-flat !bg-primary !text-on-primary px-6 py-2.5 rounded-lg font-label-lg font-bold flex items-center gap-2 shadow-[4px_4px_8px_#dce1eb,-4px_-4px_8px_#ffffff]">
          {actionLabel}
        </Link>
      )}

      {actionLabel && actionOnClick && !actionTo && (
        <button onClick={actionOnClick} className="neu-flat !bg-primary !text-on-primary px-6 py-2.5 rounded-lg font-label-lg font-bold flex items-center gap-2 shadow-[4px_4px_8px_#dce1eb,-4px_-4px_8px_#ffffff]">
          {actionLabel}
        </button>
      )}

      {children}
    </div>
  );
}
