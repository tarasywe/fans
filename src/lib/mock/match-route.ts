import type { HttpMethod, MockRoute } from './mock-types';

export type RouteMatch = { route: MockRoute; params: Record<string, string> };

function splitPath(path: string): string[] {
  return path.split('/').filter(Boolean);
}

/** Finds the first route whose method and path pattern match. Static segments win over params. */
export function matchRoute(
  routes: readonly MockRoute[],
  method: HttpMethod,
  path: string,
): RouteMatch | null {
  const segments = splitPath(path);
  const candidates: RouteMatch[] = [];

  for (const route of routes) {
    if (route.method !== method) continue;
    const pattern = splitPath(route.path);
    if (pattern.length !== segments.length) continue;

    const params: Record<string, string> = {};
    const matches = pattern.every((part, index) => {
      const segment = segments[index] ?? '';
      if (part.startsWith(':')) {
        params[part.slice(1)] = decodeURIComponent(segment);
        return true;
      }
      return part === segment;
    });
    if (matches) candidates.push({ route, params });
  }

  candidates.sort((a, b) => Object.keys(a.params).length - Object.keys(b.params).length);
  return candidates[0] ?? null;
}
