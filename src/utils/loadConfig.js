import yaml from 'js-yaml';

export async function loadConfig() {
  const res = await fetch("/config.yaml");
  const text = await res.text();
  return yaml.load(text);
}
