export type DateInput = string | number | Date;

export function toDateKey(value: DateInput): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date input: ${value}`);
  }
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function previousDateKey(dateKey: string, offset = 1): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - offset);
  return toDateKey(date);
}

export function toDateRange(from: string, to: string) {
  return {
    from,
    to,
  };
}
