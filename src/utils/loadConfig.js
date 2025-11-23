import yaml from 'js-yaml';

export async function loadConfig() {
  try {
    const response = await fetch('/config.yaml');
    if (!response.ok) {
      throw new Error(`Failed to fetch config.yaml: ${response.statusText}`);
    }

    const yamlText = await response.text();
    const config = yaml.load(yamlText);

    const textTransformClass = config.ui.lowercase ? 'text-lowercase' : 'text-default';
    document.body.classList.add(textTransformClass);

    return config;
  } catch (error) {
    console.error('Error loading configuration:', error);
    throw error;
  }
}
