/**
 * Polyfill pour node:url dans le navigateur
 * Utilisé par Prisma Client dans Tauri
 */

export function fileURLToPath(url: string | URL): string {
  if (typeof url === 'string') {
    // Si c'est une string, retourner tel quel (dans Tauri, les chemins sont des strings)
    return url;
  }
  // Si c'est un URL object, convertir en string
  return url.pathname || url.href;
}

export function pathToFileURL(path: string): URL {
  return new URL(`file://${path}`);
}
