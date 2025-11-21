export function makeAppTitle(site) {
  if (!site) return "";
  const title = site.title?.toLowerCase() ?? "";
  const author = site.author?.toLowerCase() ?? "";
  return `${title} by ${author}`;
}