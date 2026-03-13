import { useState, useEffect, useCallback, useRef } from 'react';

const DRAFT_PREFIX = 'bms_draft_';
const DRAFT_INDEX_KEY = 'bms_draft_index';
const AUTO_SAVE_INTERVAL = 3000; // 3 seconds

/**
 * Get all draft entries from the index
 */
export const getAllDrafts = () => {
  try {
    const index = JSON.parse(localStorage.getItem(DRAFT_INDEX_KEY) || '{}');
    return Object.entries(index)
      .map(([key, meta]) => ({ key, ...meta }))
      .filter(d => {
        // Verify the draft data still exists
        const data = localStorage.getItem(DRAFT_PREFIX + d.key);
        if (!data) {
          removeDraftFromIndex(d.key);
          return false;
        }
        return true;
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
};

/**
 * Remove a single draft from index + storage
 */
export const discardDraft = (draftKey) => {
  localStorage.removeItem(DRAFT_PREFIX + draftKey);
  removeDraftFromIndex(draftKey);
};

/**
 * Remove all drafts
 */
export const discardAllDrafts = () => {
  const drafts = getAllDrafts();
  for (const d of drafts) {
    localStorage.removeItem(DRAFT_PREFIX + d.key);
  }
  localStorage.removeItem(DRAFT_INDEX_KEY);
};

function removeDraftFromIndex(draftKey) {
  try {
    const index = JSON.parse(localStorage.getItem(DRAFT_INDEX_KEY) || '{}');
    delete index[draftKey];
    localStorage.setItem(DRAFT_INDEX_KEY, JSON.stringify(index));
  } catch { /* ignore */ }
}

function updateDraftIndex(draftKey, meta) {
  try {
    const index = JSON.parse(localStorage.getItem(DRAFT_INDEX_KEY) || '{}');
    index[draftKey] = { ...meta, updatedAt: Date.now() };
    localStorage.setItem(DRAFT_INDEX_KEY, JSON.stringify(index));
  } catch { /* ignore */ }
}

/**
 * useFormDraft — auto-saves form state to localStorage and offers recovery.
 *
 * @param {string} draftKey   - Unique key, e.g. "product_create" or "product_edit_42"
 * @param {object} options
 * @param {string} options.label       - Human-readable label, e.g. "New Product" or "Edit Invoice #123"
 * @param {string} options.entityType  - Entity type, e.g. "product", "customer", "invoice"
 * @param {object} options.initialData - The form's default/reset data
 * @param {boolean} options.isOpen     - Whether the form/modal is currently open
 *
 * @returns {{
 *   draftData: object|null,         - Recovered draft (null if none)
 *   hasDraft: boolean,              - Whether a draft was found on mount
 *   applyDraft: () => void,         - Apply recovered draft to form
 *   dismissDraft: () => void,       - Dismiss + delete recovered draft
 *   saveDraft: (data) => void,      - Manually save current form state
 *   clearDraft: () => void,         - Clear draft (call on successful submit)
 *   isDirty: boolean,               - Whether the form has been modified
 * }}
 */
export default function useFormDraft(draftKey, {
  label = '',
  entityType = '',
  initialData = {},
  isOpen = true,
} = {}) {
  const storageKey = DRAFT_PREFIX + draftKey;
  const [draftData, setDraftData] = useState(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const latestDataRef = useRef(null);
  const intervalRef = useRef(null);
  const appliedRef = useRef(false);

  // On mount / open — check for existing draft
  useEffect(() => {
    if (!isOpen) return;
    appliedRef.current = false;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setDraftData(parsed);
        setHasDraft(true);
      } else {
        setDraftData(null);
        setHasDraft(false);
      }
    } catch {
      setDraftData(null);
      setHasDraft(false);
    }
  }, [storageKey, isOpen]);

  // Auto-save interval
  useEffect(() => {
    if (!isOpen) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      if (latestDataRef.current && isDirty) {
        try {
          localStorage.setItem(storageKey, JSON.stringify({ ...latestDataRef.current, _savedAt: Date.now() }));
          updateDraftIndex(draftKey, { label, entityType });
        } catch { /* localStorage full — ignore */ }
      }
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOpen, isDirty, storageKey, draftKey, label, entityType]);

  // Track latest form data for auto-save
  const saveDraft = useCallback((data) => {
    latestDataRef.current = data;

    // Check if data differs from initial (simple shallow check on stringified values)
    const isChanged = JSON.stringify(data) !== JSON.stringify(initialData);
    setIsDirty(isChanged);
  }, [initialData]);

  // Apply recovered draft
  const applyDraft = useCallback(() => {
    appliedRef.current = true;
    setHasDraft(false);
    // draftData stays available for the consumer to read
  }, []);

  // Dismiss recovered draft
  const dismissDraft = useCallback(() => {
    setDraftData(null);
    setHasDraft(false);
    appliedRef.current = false;
    localStorage.removeItem(storageKey);
    removeDraftFromIndex(draftKey);
  }, [storageKey, draftKey]);

  // Clear draft on successful save
  const clearDraft = useCallback(() => {
    setDraftData(null);
    setHasDraft(false);
    setIsDirty(false);
    latestDataRef.current = null;
    localStorage.removeItem(storageKey);
    removeDraftFromIndex(draftKey);
  }, [storageKey, draftKey]);

  return {
    draftData,
    hasDraft,
    applyDraft,
    dismissDraft,
    saveDraft,
    clearDraft,
    isDirty,
  };
}
