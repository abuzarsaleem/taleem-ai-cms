import type { OpenAPIObject } from '@nestjs/swagger';

const HTTP_METHODS = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
] as const;

type ResponseObject = {
  description?: string;
  content?: Record<string, { schema?: unknown; example?: unknown }>;
};

type ErrorExample = {
  statusCode: number;
  message: string;
  code?: string;
  error?: string;
  path: string;
  timestamp: string;
};

const ERROR_SCHEMA = {
  type: 'object' as const,
  required: ['statusCode', 'message', 'path', 'timestamp'],
  properties: {
    statusCode: { type: 'number' },
    message: {
      oneOf: [
        { type: 'string' },
        { type: 'array', items: { type: 'string' } },
      ],
    },
    code: { type: 'string' },
    error: { type: 'string' },
    path: { type: 'string' },
    timestamp: { type: 'string' },
  },
};

function errorExample(statusCode: number): ErrorExample {
  const path = '/api/v1/admin/dashboard';
  const timestamp = '2026-08-11T14:30:00.000Z';

  if (statusCode === 401) {
    return {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
      path,
      timestamp,
    };
  }

  if (statusCode === 500) {
    return {
      statusCode: 500,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      path,
      timestamp,
    };
  }

  return {
    statusCode: 400,
    message: 'Invalid credentials',
    code: 'BUSINESS_ERROR',
    error: 'Bad Request',
    path,
    timestamp,
  };
}

function jsonErrorResponse(
  statusCode: number,
  description: string,
): ResponseObject {
  return {
    description,
    content: {
      'application/json': {
        schema: ERROR_SCHEMA,
        example: errorExample(statusCode),
      },
    },
  };
}

function hasJsonSchema(response: unknown): boolean {
  if (!response || typeof response !== 'object') return false;
  const content = (response as ResponseObject).content;
  const json = content?.['application/json'];
  return Boolean(json?.schema);
}

/**
 * Adds shared error responses (400/401/500) with matching statusCode examples.
 * Success 200/201 schemas must be declared per-endpoint with typed DTOs.
 */
export function applyStandardSwaggerResponses(
  document: OpenAPIObject,
): OpenAPIObject {
  const components = document.components ?? {};
  const schemas = { ...(components.schemas ?? {}) };

  // Keep a generic schema for $ref usage elsewhere; examples are per-response.
  schemas.ApiErrorResponseDto = {
    ...ERROR_SCHEMA,
    properties: {
      ...ERROR_SCHEMA.properties,
      statusCode: { type: 'number', example: 400 },
      message: {
        oneOf: [
          { type: 'string', example: 'Invalid credentials' },
          {
            type: 'array',
            items: { type: 'string' },
            example: ['email must be an email'],
          },
        ],
      },
      code: { type: 'string', example: 'BUSINESS_ERROR' },
      error: { type: 'string', example: 'Bad Request' },
      path: { type: 'string', example: '/api/v1/admin/dashboard' },
      timestamp: { type: 'string', example: '2026-08-11T14:30:00.000Z' },
    },
  };

  document.components = { ...components, schemas };

  for (const pathItem of Object.values(document.paths ?? {})) {
    if (!pathItem || typeof pathItem !== 'object') continue;

    for (const method of HTTP_METHODS) {
      const operation = (pathItem as Record<string, unknown>)[method] as
        | { responses?: Record<string, unknown> }
        | undefined;
      if (!operation || typeof operation !== 'object') continue;

      const responses: Record<string, unknown> = {
        ...(operation.responses ?? {}),
      };

      // Drop Nest's empty stub success responses that have no schema.
      for (const code of ['200', '201'] as const) {
        const existing = responses[code];
        if (
          existing &&
          typeof existing === 'object' &&
          !hasJsonSchema(existing) &&
          !(existing as ResponseObject).content
        ) {
          delete responses[code];
        }
      }

      // Always overwrite shared error docs so examples match the HTTP status.
      responses['400'] = jsonErrorResponse(
        400,
        'Bad request — validation failure or business rule violation',
      );
      responses['401'] = jsonErrorResponse(
        401,
        'Unauthorized — missing or invalid bearer token',
      );
      responses['500'] = jsonErrorResponse(500, 'Internal server error');

      operation.responses = responses;
    }
  }

  return document;
}
