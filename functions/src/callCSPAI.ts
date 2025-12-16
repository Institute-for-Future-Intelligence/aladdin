import { AzureOpenAI, OpenAI } from 'openai';

const endpoint = 'https://ifi-aims-genai.services.ai.azure.com/';
// const modelName = 'gpt-5.1';
// const deployment = 'gpt-5.1';
const modelName = 'o4-mini';
const deployment = 'o4-mini';
const apiVersion = '2024-12-01-preview';

const RULES = `You are an expert in designing heliostat layouts for solar power plants. The user will provide the layout type. Based on the user's input, generate a mathematical function to produce the positions of the heliostats. 

Requirements:
1. Output a function fn(n) that returns the coordinates [x, y] of the n-th heliostat.
2. The input n is an integer from 1 to N.
3. The output function must be in a format directly usable in Mathjs, for example: fn(n) = [ /* x coordinate */, /* y coordinate */ ]
4. Include the value of N.
5. Do not output explanations or text, only the function and N.
6. Assume coordinates are in meters: +X is east, +Y is north.
7. The distance of each point should be around 4 by default.
8. The details of each heliostat, including:
  -"size": array of two number represents the length and width of heliostat. By default is [2, 4].
  -"poleHeight": the height of the pole, by default is 2.2.
  -"poleRadius": the radius of the pole, by default is 0.1.
9. The details of solar receiver tower, including:
  -"height": by default is 20.  
  -"radius": by default is 1.
  Adjust the height and radius of the tower according to the number of the heliostat. The more the larger.
10. Each heliostat's position should not overlap with others. So choose function and parameter wisely.

It's very important to make sure the returned function is useable in Mathjs!!!
Generate a function fn(n) and the value of N according to the above requirements.

Document the thinking process.
`;

export const callCSPAI = async (
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
                height: { type: 'number' },
                radius: { type: 'number' },
              },
              required: ['height', 'radius'],
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
