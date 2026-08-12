import { Type, applyDecorators } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';

type WrapOptions = {
  description?: string;
  isArray?: boolean;
};

function wrappedSchema(model: Type<unknown>, isArray = false) {
  return {
    type: 'object' as const,
    required: ['success', 'data'] as string[],
    properties: {
      success: { type: 'boolean' as const, example: true },
      message: { type: 'string' as const },
      data: isArray
        ? {
            type: 'array' as const,
            items: { $ref: getSchemaPath(model) },
          }
        : { $ref: getSchemaPath(model) },
    },
  };
}

function paginatedSchema(
  itemModel: Type<unknown>,
  extraProperties?: Record<string, unknown>,
) {
  return {
    type: 'object' as const,
    required: ['success', 'data'] as string[],
    properties: {
      success: { type: 'boolean' as const, example: true },
      message: { type: 'string' as const },
      data: {
        type: 'object' as const,
        required: ['items', 'total', 'page', 'page_size'],
        properties: {
          items: {
            type: 'array' as const,
            items: { $ref: getSchemaPath(itemModel) },
          },
          total: { type: 'number' as const },
          page: { type: 'number' as const },
          page_size: { type: 'number' as const },
          ...(extraProperties ?? {}),
        },
      },
    },
  };
}

/** Documents HTTP 200 with `{ success, message?, data: Model }`. */
export function ApiWrappedOkResponse(
  model: Type<unknown>,
  options: WrapOptions = {},
) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      description: options.description ?? 'Successful response',
      schema: wrappedSchema(model, options.isArray === true),
    }),
  );
}

/** Documents HTTP 201 with `{ success, message?, data: Model }` (Nest POST default). */
export function ApiWrappedCreatedResponse(
  model: Type<unknown>,
  options: WrapOptions = {},
) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiCreatedResponse({
      description: options.description ?? 'Resource created',
      schema: wrappedSchema(model, options.isArray === true),
    }),
  );
}

/** Documents HTTP 200 with `{ success, message?, data: oneOf Models }`. */
export function ApiWrappedOkOneOfResponse(
  models: Type<unknown>[],
  options: { description?: string } = {},
) {
  return applyDecorators(
    ApiExtraModels(...models),
    ApiOkResponse({
      description: options.description ?? 'Successful response',
      schema: {
        type: 'object',
        required: ['success', 'data'],
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: {
            oneOf: models.map((model) => ({ $ref: getSchemaPath(model) })),
          },
        },
      },
    }),
  );
}

/** Documents HTTP 200 with paginated `{ items, total, page, page_size }`. */
export function ApiWrappedPaginatedResponse(
  itemModel: Type<unknown>,
  options: {
    description?: string;
    extraDataProperties?: Record<string, unknown>;
    extraModels?: Type<unknown>[];
  } = {},
) {
  return applyDecorators(
    ApiExtraModels(itemModel, ...(options.extraModels ?? [])),
    ApiOkResponse({
      description: options.description ?? 'Paginated successful response',
      schema: paginatedSchema(itemModel, options.extraDataProperties),
    }),
  );
}
