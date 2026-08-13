import type { OpenAPIObject } from '@nestjs/swagger';
import {
  authRegistrationSortKey,
  isAdminSwaggerPath,
  SWAGGER_TAG_ORDER,
  SWAGGER_TAGS,
} from './swagger-tags';

const METHOD_ORDER = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
];

const ALLOWED_TAGS = new Set(SWAGGER_TAG_ORDER);

function tagIndex(name: string): number {
  const index = SWAGGER_TAG_ORDER.indexOf(name);
  return index === -1 ? SWAGGER_TAG_ORDER.length : index;
}

/** Keep only the functional tags from DocumentBuilder (drop controller-name tags). */
function uniqueAllowedTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of tags) {
    if (typeof tag !== 'string' || !ALLOWED_TAGS.has(tag) || seen.has(tag)) {
      continue;
    }
    seen.add(tag);
    result.push(tag);
  }
  return result;
}

export function sortSwaggerDocument(document: OpenAPIObject): OpenAPIObject {
  if (document.tags) {
    document.tags = document.tags
      .filter((tag) => ALLOWED_TAGS.has(tag.name))
      .sort((a, b) => tagIndex(a.name) - tagIndex(b.name));
  }

  if (!document.paths) {
    return document;
  }

  const operations: Array<{
    path: string;
    method: string;
    operation: Record<string, unknown>;
  }> = [];

  for (const [path, pathItem] of Object.entries(document.paths)) {
    if (!pathItem || typeof pathItem !== 'object') {
      continue;
    }
    for (const [method, operation] of Object.entries(pathItem)) {
      if (method === 'parameters' || typeof operation !== 'object') {
        continue;
      }
      const op = operation as Record<string, unknown>;
      const allowed = uniqueAllowedTags(op.tags);
      if (allowed.length > 0) {
        op.tags = allowed;
      } else {
        delete op.tags;
      }
      operations.push({
        path,
        method,
        operation: op,
      });
    }
  }

  operations.sort((a, b) => {
    const tagA = (a.operation.tags as string[] | undefined)?.[0] ?? '';
    const tagB = (b.operation.tags as string[] | undefined)?.[0] ?? '';
    const byTag = tagIndex(tagA) - tagIndex(tagB);
    if (byTag !== 0) {
      return byTag;
    }

    const adminA = isAdminSwaggerPath(a.path);
    const adminB = isAdminSwaggerPath(b.path);
    if (adminA !== adminB) {
      return adminA ? -1 : 1;
    }

    if (tagA === SWAGGER_TAGS.AUTH_REGISTRATION) {
      const byFlow =
        authRegistrationSortKey(a.path, a.method) -
        authRegistrationSortKey(b.path, b.method);
      if (byFlow !== 0) {
        return byFlow;
      }
    }

    const byMethod =
      METHOD_ORDER.indexOf(a.method) - METHOD_ORDER.indexOf(b.method);
    if (byMethod !== 0) {
      return byMethod;
    }

    return a.path.localeCompare(b.path);
  });

  const sortedPaths: OpenAPIObject['paths'] = {};
  for (const { path, method, operation } of operations) {
    if (!sortedPaths[path]) {
      sortedPaths[path] = {};
    }
    (sortedPaths[path] as Record<string, unknown>)[method] = operation;
  }

  document.paths = sortedPaths;
  return document;
}
