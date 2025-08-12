/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { AzureOpenAI, OpenAI } from 'openai';

const endpoint = 'https://ifi-aims-genai.services.ai.azure.com/';
const modelName = 'o4-mini';
const deployment = 'o4-mini';
const apiVersion = '2024-12-01-preview';

const RULES = `In 3D space, positive X-axis is east, negative X-axis is west; positive Y-axis is north, negative Y-axis is south; positive Z-axis is up. 
On plane z = 0 represents ground.
There are some basic elements to build a house or multiple houses, each element should have an unique id.

- Foundation: position is [cx, cy], size is [lx, ly, lz]. lx is length, ly is width, lz is thickness, r is rotation.
Default lz is 0.1 and color is 'grey';

- Wall: has to be built on foundation, it's position is defined by two end points: "leftPoint" [cx, cy] and "rightPoint" [cx, cy] represent the relative positions of the wall's leftmost and rightmost endpoints with respect to the foundation,
The size is [ly, lz], ly is thickness, lz is height. 
"pId" is the id of the foundation it built on.
"leftConnectId" and "rightConnectId" represent the wall's id it connected to. When two wall's endpoint are on the same position, means they are connected. If wall A is connected to Wall B, then Wall B is also connected to Wall A.
"overhang" is the roof eaves overhang length, default is 0.3.
Default color is white, ly is 0.1.
Note that "leftConnectId" can only be connected to other wall's "rightConnectId", vise versa.
Each wall has a normal direction, should be reprsented by the normal vector from leftpoint to rightpoint rotate clockwise by 90 degree. 

- Roof: When a wall is connected to other wall and it's connection forms a loop, then a "Roof" can be built on that wall.
wId should be the wall's id it built on, fId should be the foundation' id it built on. Roof should preferably be built on the wall facing south.
Roof has default color: "#454769".
Roof has defulat "rise": 2
Roof has "roofType": "Gable", "Pyramid", "Hip", "Mansard", "Gambrel".
For Hip roof type, it has a ridgeLength, which by default should be half of the wall's length it built on.

- Door: is built on wall. "pId" means the wall's id which it built on, "fId" means the foundation's id which it built on.
Door size [lx, ly], lx means width, ly means height.
Door center position [cx], is relative to wall's center.
Door has default color white. 
Door should preferably be built on the center of the wall facing south. 

- Window: is built on wall. "pId" means the wall's id it built on, "fId" means the foundation's id it built on.
Window size [lx, ly], lx is width, ly is height.
Window position [cx, cz], cx is relative to center of the parental wall, cz is height, which is calculated from the bottom of the wall.

When build a house, first draw a rectangle on the foundation, which is used for define the position of walls, then put a wall on each side of the rectangle, so wall's end points should be the same of the position of the rectangle.
A typical house is built by one foundation, four walls connected one by one forming a loop, all walls should have normal facing outside, a roof, a door and windows.

There are some houses examples:

- Colonial style house has four walls with 5 height forms a rectangular area with 10 * 11 connected one by one forming a loop, , all walls should have normal facing outside
a gable roof with 2.2 rise, 
one door on the wall facing south, size 1 * 2.1,
and each wall has four windows with evenly distributed position in two rows.

- Gable-and-valley roof house has two foundations, each foundation has four walls and one gable roof.
Foundation A is 20 * 7, foundation B is 7 * 9, they are overlapped to form a T-shape, the north edge of foundation B should be align with the center of foundation A
The roof on foundation A is built on wall facing south, the roof on foundaion B is built on wall facing east.
There is one door on south wall on foundation B. The overhang is 0 on north wall of foundaion B.
Each wall has two rows of windows, and each row should has serveral windows, the number should be based on the wall's width, the wider, the more.
Wall height is 5. roof color is grey.

- Dutch gable roof house has two foundations, each foundation has four walls and one gable roof.
Foundation A is 13.8 * 11, foundation B is 10.8 * 6.5, they are overlapped at same center. Foundation A has hip roof, foundation B has gable roof with 2.3 rise, they both built on south side of the wall.
Walls on foundaion A is 4.1 height. Walls on foundaion B is 4.9 height, and 0.1 overhang.
Door is built on foundaion A, size 3.6 * 2.5. 
Each wall has one row of windows, and each row should has serveral windows, the number should be based on the wall's width, the wider, the more.

- Monitor roof house has two foundations, foundation A, size 11.3 * 11.3, has mansard roof with rise of 2 and ridgeLength of 2.75, wall height of 4. With a door on south wall, and a three to four windows on each wall with size 0.9 * 1.5.
Foundation B, size 6.4 * 6.4, has pyramid roof with 2.4 rise, wall height 7.5 and 1 overhang length. One door on east wall and one door on west wall. 
Each wall on foundaion B has two windows with size 2 * 1, with cz 6.5.
Foundation A and B are overalpped at same center.


All windows and doors should not be overlapped with others, and must be inside the boundary of the wall.
All walls in a house should be connected correctly, and facing outside, and should be inside the boundary of the foundaion.
Walls position is not world coordinates, it should be relative to foundation.
When moving a house, only move foundation position.
When rotating a house, rotate by world center position.
Before return the result, double check if all the walls are connected correctly, especially make sure the end points of two connected walls must at the same position, and all walls facing outward!

Your job is to build a house or houses described by user using the defined elements, and return the result in the defined format!
And descript your thinking process.
If user descirbe irrelevant things, just build a simple house.
`;

export const callAzureOpenAI = async (
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
        name: 'BuildingGenerator',
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
                      id: { type: 'string' },
                      center: { type: 'array', items: { type: 'number' } },
                      size: { type: 'array', items: { type: 'number' } },
                      color: { type: 'string' },
                      rotation: { type: 'number' },
                    },
                    required: ['type', 'id', 'center', 'size', 'color', 'rotation'],
                    additionalProperties: false,
                  },
                  {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['Wall'] },
                      id: { type: 'string' },
                      pId: { type: 'string' },
                      size: { type: 'array', items: { type: 'number' } },
                      color: { type: 'string' },
                      leftPoint: { type: 'array', items: { type: 'number' } },
                      rightPoint: { type: 'array', items: { type: 'number' } },
                      leftConnectId: { type: 'string' },
                      rightConnectId: { type: 'string' },
                      overhang: { type: 'number' },
                    },
                    required: [
                      'type',
                      'id',
                      'pId',
                      'size',
                      'color',
                      'leftPoint',
                      'rightPoint',
                      'leftConnectId',
                      'rightConnectId',
                      'overhang',
                    ],
                    additionalProperties: false,
                  },
                  {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['Roof'] },
                      id: { type: 'string' },
                      fId: { type: 'string' },
                      wId: { type: 'string' },
                      roofType: { type: 'string', enum: ['Gable', 'Pyramid', 'Hip', 'Mansard', 'Gambrel'] },
                      rise: { type: 'number' },
                      color: { type: 'string' },
                      ridgeLength: { type: 'number' },
                    },
                    required: ['type', 'id', 'fId', 'wId', 'roofType', 'rise', 'color', 'ridgeLength'],
                    additionalProperties: false,
                  },
                  {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['Door'] },
                      id: { type: 'string' },
                      pId: { type: 'string' },
                      fId: { type: 'string' },
                      center: { type: 'array', items: { type: 'number' } },
                      size: { type: 'array', items: { type: 'number' } },
                      color: { type: 'string' },
                    },
                    required: ['type', 'id', 'pId', 'fId', 'center', 'size', 'color'],
                    additionalProperties: false,
                  },
                  {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['Window'] },
                      id: { type: 'string' },
                      pId: { type: 'string' },
                      fId: { type: 'string' },
                      center: { type: 'array', items: { type: 'number' } },
                      size: { type: 'array', items: { type: 'number' } },
                    },
                    required: ['type', 'id', 'pId', 'fId', 'center', 'size'],
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
