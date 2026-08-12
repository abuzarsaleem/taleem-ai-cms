import type { OpenAPIObject } from '@nestjs/swagger';
import { isAdminSwaggerPath, SWAGGER_TAG_ORDER } from './swagger-tags';

const METHOD_ORDER = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
];

function tagIndex(name: string): number {
  const index = SWAGGER_TAG_ORDER.indexOf(name);
  return index === -1 ? SWAGGER_TAG_ORDER.length : index;
}

export function sortSwaggerDocument(document: OpenAPIObject): OpenAPIObject {
  if (document.tags) {
    document.tags.sort(
      (a, b) => tagIndex(a.name) - tagIndex(b.name),
    );
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
      operations.push({
        path,
        method,
        operation: operation as Record<string, unknown>,
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
