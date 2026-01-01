/*
 * @Copyright 2025-2026. Institute for Future Intelligence, Inc.
 */

import { AzureOpenAI, OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const endpoint = 'https://ifi-aims-genai.services.ai.azure.com/';
// const modelName = 'gpt-5.1';
// const deployment = 'gpt-5.1';
const modelName = 'o4-mini';
const deployment = 'o4-mini';
const apiVersion = '2024-12-01-preview';

// const RULES = `You are an expert in designing heliostat layouts for solar power plants. The user will provide the layout type. Based on the user's input, generate a mathematical function to produce the positions of the heliostats.

// Requirements:
// 1. Output a function fn(n) that returns the coordinates [x, y] of the n-th heliostat.
// 2. The input n is an integer from 1 to N.
// 3. The output function must be in a format directly usable in Mathjs, for example: fn(n) = [ /* x coordinate */, /* y coordinate */ ]
// 4. Include the value of N.
// 5. Do not output explanations or comments in the function.
// 6. Assume coordinates are in meters: +X is east, +Y is north.
// 7. The distance of each point should be around 5 to 10 by default.
// 8. The details of each heliostat, including:
//   -"size": array of two number represents the length and width of heliostat. By default is [2, 4].
//   -"poleHeight": the height of the pole, by default is 2.2.
//   -"poleRadius": the radius of the pole, by default is 0.1.
// 9. The details of solar receiver tower, including:
//   -"height": default is 20.
//   -"radius": default is 1.
//   -"center": default is [0, 0].
//   Adjust the height and radius of the tower according to the number of the heliostat. The more the larger.
// 10. Each heliostat's position should not overlap with others. So choose function and parameter wisely.
// 11. The center of the function should be at [0,0].

// It's very important to make sure the returned function is directly executable in Mathjs!!!
// DO NOT use "if" in the returned function!!!
// The function MUST be a single expression!!!

// Document the thinking process.

// `;

const RULES = `
Role
You are a prompt-following mathematical layout generator specialized in concentrated solar power (CSP) heliostat field design.
Your task is to convert a user's high-level layout requirement into a mathematical point-distribution function that can be directly evaluated using MathJS to generate heliostat positions.
You must strictly follow the rules below.

===

Objective
Given a user-defined layout concept (e.g. Fermat spiral, radial, honeycomb, circular rings, etc.), generate:
A function that computes heliostat positions
A complete set of layout parameters for heliostats and the receiver tower
The output will be parsed programmatically — format correctness is critical.

===

Output requirements (strict)
1. Function Definition
  - Output a function can be parsed by JS new Function();
  - The function returns an array of array, each element is the [x, y] coordinates (in meters) of the n-th heliostat.

2. Indexing
  - N is an integer in the range: n = 1, 2, ..., N

3. Total Count
  - Explicitly output the value of N.

4. Coordinate System
  - +X → East
  - +Y → North

5. Spacing Constraint
  - The minimum distance between neighboring heliostats is at least the heliostat length or width, whichever is larger.
  - The maximum distance between neighboring heliostats is at most four times of the heliostat length or width, whichever is larger.

6. Non-overlap Constraint
  - Heliostat positions must not overlap with each other.
  - Choose layout formulas and parameters carefully to ensure physical feasibility.

7. Center Constraint (Critical)
  - The geometric center of the layout function (e.g., spiral origin or layout centroid) must be exactly at [0, 0].
  - All layout formulas must be defined relative to this origin.

8. When moving the position of the tower, do not move the center of the function together.

9. Document the thinking process.
===

Heliostat properties (Implicit Defaults)
Use these defaults when designing spacing and layout logic:
  - size: [2, 4] (length * width, meters)
  - poleHeight: 4.2
  - poleRadius: 0.1

===

Solar Receiver Tower Properties (Implicit Defaults)
  - center: [0, 0]
  - height: 20
  - radius: 1

Adjust tower height and radius proportionally to the total number of heliostats:
  - More heliostats → larger tower dimensions

Location
If not specified, the default address is Tucson, Arizona, USA.
  - address
  - latitude and longitude

Date and time
  - a string in a format MM/dd/yyyy, hh:mm:ss a. If not specified, set the default date and time to 06/22/2025, 12:00:00 PM


===

Output Format (Very Important)

Do NOT output:
  - Explanations
  - Comments
  - Markdown
  - Any additional text

===

Critical Constraint

The returned function MUST be directly executable in JS new Function() without modification!!!
DO NOT include "function()" in the function!!!
===

User requirements:

`;

export const callSolarPowerTowerAI = async (
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
        name: 'CSPGenerator',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            thinking: {
              type: 'string',
            },
            fn: { type: 'string' },
            N: { type: 'number' },
            world: {
              type: 'object',
              properties: {
                date: { type: 'string' },
                address: { type: 'string' },
                latitude: { type: 'number' },
                longitude: { type: 'number' },
              },
              required: ['date', 'address', 'latitude', 'longitude'],
              additionalProperties: false,
            },
            heliostat: {
              type: 'object',
              properties: {
                size: { type: 'array', items: { type: 'number' } },
                poleHeight: { type: 'number' },
                poleRadius: { type: 'number' },
              },
              required: ['size', 'poleHeight', 'poleRadius'],
              additionalProperties: false,
            },
            tower: {
              type: 'object',
              properties: {
                center: { type: 'array', items: { type: 'number' } },
                height: { type: 'number' },
                radius: { type: 'number' },
              },
              required: ['center', 'height', 'radius'],
              additionalProperties: false,
            },
          },
          required: ['fn', 'N', 'heliostat', 'tower', 'thinking'],
          additionalProperties: false,
        },
      },
    },
  });
  return response;
};

export const callSolarPowerTowerClaudeAI = async (
  apiKey: string | undefined,
  inputMessage: [],
  fromBrowser = false,
) => {
  const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: fromBrowser });

  const res = await anthropic.beta.messages.create({
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
          fn: { type: 'string' },
          N: { type: 'number' },
          world: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              address: { type: 'string' },
              latitude: { type: 'number' },
              longitude: { type: 'number' },
            },
            required: ['date', 'address', 'latitude', 'longitude'],
            additionalProperties: false,
          },
          heliostat: {
            type: 'object',
            properties: {
              size: { type: 'array', items: { type: 'number' } },
              poleHeight: { type: 'number' },
              poleRadius: { type: 'number' },
            },
            required: ['size', 'poleHeight', 'poleRadius'],
            additionalProperties: false,
          },
          tower: {
            type: 'object',
            properties: {
              center: { type: 'array', items: { type: 'number' } },
              height: { type: 'number' },
              radius: { type: 'number' },
            },
            required: ['center', 'height', 'radius'],
            additionalProperties: false,
          },
        },
        required: ['fn', 'N', 'heliostat', 'tower', 'thinking'],
        additionalProperties: false,
      },
    },
  });
  return res;
};
