/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import Anthropic from '@anthropic-ai/sdk';
import { AzureOpenAI, OpenAI } from 'openai';

const endpoint = 'https://ifi-aims-genai.services.ai.azure.com/';
const modelName = 'o4-mini';
const deployment = 'o4-mini';
const apiVersion = '2024-12-01-preview';

const RULES = `Role
You are an expert in urban design, computational geometry, and procedural layout generation.

Task
Generate a procedural layout for an urban area using cuboids to represent buildings, and foundations for green spaces or other non-building elements.

Input
You will receive a prompt describing the urban design requirements and constraints.

Core Requirements

The total site size is about 1000 m × 1000 m unless overridden by user input.

Each building is represented by a cuboid.

Buildings must not overlap.

Use a 2D ground plane (x, y) for layout; height extends in the z-direction.

Coordinate System Rules

Origin (0, 0, 0) is at the center of the site.

x corresponds to the east-west direction

y corresponds to the north-south direction

z is vertical;

Prefer realistic urban proportions.

Keep spacing reasonable for streets or open areas.

`;

export const callUrbanDesignOpenAI = async (
  apiKey: string | undefined,
  inputMessage: [],
  fromBrowser = false,
  reasoningEffort: string,
) => {
  const options = {
    endpoint,
    apiKey,
    deployment,
    apiVersion,
    dangerouslyAllowBrowser: fromBrowser,
    reasoning_effort: reasoningEffort,
  };

  const client = new AzureOpenAI(options);

  const response = await client.chat.completions.create({
    messages: [{ role: 'system', content: RULES }, ...inputMessage],
    reasoning_effort: reasoningEffort as OpenAI.ReasoningEffort,
    max_completion_tokens: 100000,
    model: modelName,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'UrbanDesignGenerator',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            thinking: {
              type: 'string',
            },
            elements: {
              type: 'array',
              items: {
                type: 'object',
                anyOf: [
                  {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['Foundation'] },
                      center: { type: 'array', items: { type: 'number' } },
                      size: { type: 'array', items: { type: 'number' } },
                      rotation: { type: 'number' },
                    },
                    required: ['type', 'center', 'size', 'rotation'],
                    additionalProperties: false,
                  },
                  {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['Cuboid'] },
                      center: { type: 'array', items: { type: 'number' } },
                      size: { type: 'array', items: { type: 'number' } },
                      rotation: { type: 'number' },
                    },
                    required: ['type', 'center', 'size', 'rotation'],
                    additionalProperties: false,
                  },
                ],
              },
            },
          },
          required: ['elements', 'thinking'],
          additionalProperties: false,
        },
      },
    },
  });
  return response;
};

export const callUrbanDesignClaudeAI = async (apiKey: string | undefined, inputMessage: [], fromBrowser = false) => {
  const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: fromBrowser });

  const res = await anthropic.beta.messages.create({
    temperature: 0,
    model: 'claude-opus-4-5',
    max_tokens: 10000, // require streaming API if this is large.
    system: RULES,
    messages: [...inputMessage],
    betas: ['structured-outputs-2025-11-13'],
    // thinking: {
    //   type: 'enabled',
    //   budget_tokens: 2000,
    // },
    output_format: {
      type: 'json_schema',
      schema: {
        type: 'object',
        properties: {
          thinking: {
            type: 'string',
          },
          elements: {
            type: 'array',
            items: {
              anyOf: [
                {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['Foundation'] },
                    center: { type: 'array', items: { type: 'number' } },
                    size: { type: 'array', items: { type: 'number' } },
                    rotation: { type: 'number' },
                  },
                  required: ['type', 'center', 'size', 'rotation'],
                  additionalProperties: false,
                },
                {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['Cuboid'] },
                    center: { type: 'array', items: { type: 'number' } },
                    size: { type: 'array', items: { type: 'number' } },
                    rotation: { type: 'number' },
                  },
                  required: ['type', 'center', 'size', 'rotation'],
                  additionalProperties: false,
                },
              ],
            },
          },
        },
        required: ['elements', 'thinking'],
        additionalProperties: false,
      },
    },
  });
  return res;
};
