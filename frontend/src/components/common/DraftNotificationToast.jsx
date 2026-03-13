import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { getAllDrafts, discardDraft } from '../../hooks/useFormDraft';

/**
 * DraftNotificationToast — placed once in App.jsx.
 * On mount (login/page load), checks if there are any pending drafts
 * and shows a toast notification so the user knows they have unsaved work.
 */
const DraftNotificationToast = () => {
  const hasShown = useRef(false);

  useEffect(() => {
    if (hasShown.current) return;
    hasShown.current = true;

    // Small delay to let the page settle
    const timer = setTimeout(() => {
      const drafts = getAllDrafts();
      if (drafts.length === 0) return;

      const entityLabels = drafts.map(d => d.label || d.entityType || d.key).slice(0, 3);
      const more = drafts.length > 3 ? ` and ${drafts.length - 3} more` : '';

      toast.info(
        <div>
          <p className="font-semibold text-sm mb-1">
            You have {drafts.length} unsaved draft{drafts.length > 1 ? 's' : ''}
          </p>
          <p className="text-xs opacity-80">
            {entityLabels.join(', ')}{more}
          </p>
          <p className="text-xs opacity-60 mt-1">
            Open the relevant form to restore or discard.
          </p>
        </div>,
        {
          autoClose: 8000,
          closeOnClick: true,
          position: 'top-right',
        }
      );
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return null;
};

export default DraftNotificationToast;
