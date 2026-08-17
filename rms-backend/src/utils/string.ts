export const normalizeName = (val: string) => {
  return val
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
    .toLowerCase();
};
