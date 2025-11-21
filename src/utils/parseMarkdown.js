import fm from "front-matter";

export async function parseMarkdown(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }

  const raw = await response.text();
  const parsed = fm(raw);

  return {
    frontmatter: parsed.attributes,
    content: parsed.body
  };
}