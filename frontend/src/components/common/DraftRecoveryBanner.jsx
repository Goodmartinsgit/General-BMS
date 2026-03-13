import React from 'react';
import { RotateCcw, X, Clock } from 'lucide-react';

/**
 * DraftRecoveryBanner — shown inside a form/modal when an auto-saved draft is detected.
 *
 * Props:
 *   visible   - whether to show the banner
 *   label     - human-readable description, e.g. "New Product"
 *   updatedAt - timestamp of the draft (from draftData)
 *   onRestore - callback to apply the draft
 *   onDiscard - callback to delete the draft
 */
const DraftRecoveryBanner = ({ visible, label, updatedAt, onRestore, onDiscard }) => {
  if (!visible) return null;

  const timeAgo = updatedAt ? formatTimeAgo(updatedAt) : '';

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
          <RotateCcw size={15} className="text-amber-500" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-theme-primary truncate">
            Unsaved draft found{label ? `: ${label}` : ''}
          </p>
          {timeAgo && (
            <p className="text-xs text-theme-muted flex items-center gap-1 mt-0.5">
              <Clock size={10} />
              Last edited {timeAgo}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={onRestore}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
        >
          <RotateCcw size={12} />
          Restore
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-theme-muted hover:text-red-500 bg-theme-primary border border-theme rounded-lg hover:border-red-500/30 transition-colors"
          title="Discard draft"
        >
          <X size={12} />
          Discard
        </button>
      </div>
    </div>
  );
};

function formatTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default DraftRecoveryBanner;
