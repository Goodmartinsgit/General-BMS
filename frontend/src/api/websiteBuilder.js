import api from './axios';

const BASE = '/website-builder';

// ── Pages ─────────────────────────────────────────────────────────────────────
export const listPages       = ()           => api.get(`${BASE}/pages`);
export const createPage      = (data)       => api.post(`${BASE}/pages`, data);
export const updatePage      = (id, data)   => api.put(`${BASE}/pages/${id}`, data);
export const deletePage      = (id)         => api.delete(`${BASE}/pages/${id}`);

// ── Sections ───────────────────────────────────────────────────────────────────
export const listSections    = (pageId)             => api.get(`${BASE}/pages/${pageId}/sections`);
export const createSection   = (pageId, data)       => api.post(`${BASE}/pages/${pageId}/sections`, data);
export const updateSection   = (pageId, secId, data)=> api.put(`${BASE}/pages/${pageId}/sections/${secId}`, data);
export const deleteSection   = (pageId, secId)      => api.delete(`${BASE}/pages/${pageId}/sections/${secId}`);
export const reorderSections = (pageId, order)      => api.put(`${BASE}/pages/${pageId}/sections/reorder`, { order });

// ── Global content ─────────────────────────────────────────────────────────────
export const listGlobalContent   = ()              => api.get(`${BASE}/global`);
export const upsertGlobalContent = (key, data)     => api.put(`${BASE}/global/${key}`, data);

// ── Navigation ──────────────────────────────────────────────────────────────────
export const listNavigation  = (type = 'header')   => api.get(`${BASE}/navigation?type=${type}`);
export const createNavItem   = (data)              => api.post(`${BASE}/navigation`, data);
export const updateNavItem   = (id, data)          => api.put(`${BASE}/navigation/${id}`, data);
export const deleteNavItem   = (id)                => api.delete(`${BASE}/navigation/${id}`);
export const reorderNavItems = (order)             => api.put(`${BASE}/navigation/reorder`, { order });
