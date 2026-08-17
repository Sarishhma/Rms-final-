export const formatTimeAgo = (isoString: string): string => {
  const date = new Date(isoString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
};