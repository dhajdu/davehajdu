// Shared by the cockpit and the marketing assistant. One brand to start.
export const BRAND = 'dave-hajdu';

// A timestamp as a Vietnam calendar date.
export const ictDate = (ts: string) => new Date(new Date(ts).getTime() + 7 * 3_600_000).toISOString().slice(0, 10);
