export const uid = (prefix = "id") => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
export const nowISO = () => new Date().toISOString();
