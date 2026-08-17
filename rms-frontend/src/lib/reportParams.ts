export function buildReportParams(
  from: string,
  to: string,
  resolution: string
) {
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  return {
    from: new Date(from).toISOString(),
    to: toDate.toISOString(),
    resolution,
  };
}