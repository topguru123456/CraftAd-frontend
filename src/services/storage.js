const PREFIX = 'craftad:';
export const storage = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(PREFIX + k)); } catch { return null; } },
  set: (k, v) => localStorage.setItem(PREFIX + k, JSON.stringify(v)),
  remove: (k) => localStorage.removeItem(PREFIX + k),
};
