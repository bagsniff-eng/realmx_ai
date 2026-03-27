const BOM_RE = /^\uFEFF|^\u00EF?\u00BB?\u00BF/;

export function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (value == null) {
    return undefined;
  }

  return value.replace(BOM_RE, '').trim();
}

export function requireEnv(name: string): string {
  const value = readEnv(name);
  if (!value) {
    throw new Error(`${name} is not set in the environment variables`);
  }

  return value;
}
