/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { AzureOpenAI, OpenAI } from 'openai';

const endpoint = 'https://ifi-aims-genai.services.ai.azure.com/';
const modelName = 'o4-mini';
const deployment = 'o4-mini';
const apiVersion = '2024-12-01-preview';

const RULES = `In 3D space, positive X-axis is east, negative X-axis is west; positive Y-axis is north, negative Y-axis is south; positive Z-axis is up.
The plane z = 0 represents ground.
There are some basic elements for building houses. Each element should have a unique id.

- Foundation: position is [cx, cy], size is [lx, ly, lz]. lx is length, ly is width, lz is thickness, r is rotation.
Foundation has a property "rValue" in the unit of m²·℃/W, which defaults to 2.
Default lz is 0.1 meter and color is 'grey';

- Wall: Must be built on foundation. It's position is defined by two points: "leftPoint" [cx, cy] and "rightPoint" [cx, cy],
representing the relative positions of the wall's leftmost and rightmost endpoints with respect to the foundation,
The size is [ly, lz], ly is thickness, lz is height. "pId" is the id of the foundation on which it is built.
"leftConnectId" and "rightConnectId" represent the id of the wall that it is connected to.
When two walls' endpoints are at the same position, they are connected.
If wall A is connected to wall B, then wall B is also connected to wall A.
"overhang" is the roof eaves overhang length, with a default value of 0.3 meter.
Default color is white. Default ly is 0.1 meter.
Note that "leftConnectId" can only be connected to other wall's "rightConnectId", and vise versa.
Each wall has a normal direction represented by the normal vector from leftpoint to rightpoint, rotated clockwise by 90 degree.
Each wall has a property "rValue" in the unit of m²·℃/W, which defaults to 2.

- Roof: When a wall is connected to other walls and the connection forms a loop, a "Roof" can be built on that wall.
"wId" is the id of the wall that it is built on. "fId" is the id of the foundation that it is built on.
Roof should preferably be built on the wall that faces south.
Roof has default color: "#454769".
Roof has default "rise" of 2 meters.
Roof has a property "rValue" in the unit of m²·℃/W, which defaults to 2.
Roof has "roofType" that is either "Gable", "Pyramid", "Hip", "Mansard", or "Gambrel".
For Hip roof type, it has a ridgeLength, which by default should be half of the length of the wall that it is built on.

- Door: is built on a wall. "pId" is the id of the wall on which it is built. "fId" is the id of the foundation on which it is built.
Door size [lx, ly], lx is width, ly is height.
Door center position [cx] is relative to the wall's center.
Door has default color white.
Door should preferably be built at the center of the wall that faces south.
Door has a property "uValue" in the unit of W/(m²·℃), which defaults to 1.

- Window: is built on a wall. "pId" is the id of the wall on which it is built. "fId" is the id of the foundation on which it is built.
Window size [lx, ly], lx is width, ly is height.
Window position [cx, cz]. cx is relative to center of the parent wall, cz is height calculated from the bottom of the wall.
Window has a property "uValue" in the unit of W/(m²·℃), which defaults to 2.

When building a house, first draw a rectangle on the foundation, which defines the positions of walls, then put a wall on each side of the rectangle.
The endpoints of the walls should be the same as the vertices of the rectangle.
A house is built on top of one foundation, with four walls connected one by one forming a loop.
All walls should have normal facing outside. There should be windows on each wall.

Here are some examples:

- A colonial style house has four walls connected with each other in a loop. Each wall is a 5-meter high.
The walls form a rectangular area with the size of 10 by 12 meters.
All walls should have normal facing outside. There is a gable roof with a rise of 2.4 meters.
Add a door on the wall facing south with a size of 1.6 by 2.1 meters.
On each wall, there should be a set of two windows eventually distributed in the vertical direction
and the set should be repeated in every four meters in the horizontal direction.

- A gable-and-valley roof house has two foundations, each foundation has four walls and one gable roof.
The size of foundation A is 20 by 7 meters. The size of foundation B is 7 by 9 meters. They overlap to form a T-shape.
The northern edge of foundation B should be align with the center of foundation A.
The roof on foundation A is built on wall facing south. The roof on foundation B is built on wall facing east.
There is one door on the south wall on foundation B. The overhang is 0 on north wall of foundation B.
Each wall has two rows of windows, and each row should has several windows.
The number of windows should be based on the wall's length. The longer the wall, the more windows it has.
Wall height is 5 meters. Roof color is grey.

- Dutch gable roof house has two foundations. Each foundation has four walls and one gable roof.
The size of foundation A is 13.8 by 11 meters, the size of foundation B is 10.8 by 6.5 meters. They overlap at the same center.
Foundation A has a hip roof. foundation B has a gable roof with a rise of 2.3 meters. They are both built on the south wall.
Walls on foundation A have a 4.1-meter height. Walls on foundation B have a 4.9-meter height and an overhang of 0.1 meter.
Door is built on foundation A, with a size of 3.6 by 2.5 meters.
Each wall has one row of windows, and each row should has several windows. The number of windows depends on the wall's length.
The longer the wall, the more windows it has.

- Monitor roof house has two foundations. Foundation A has a size of 11.3 by 11.3 meters. It has a mansard roof with rise of 2 meters,
ridgeLength of 2.75 meters, and a wall height of 4 meters. There is a door on the south wall, and 3-4 windows on each wall with a size of 0.9 * 1.5 meters.
Foundation B has a size of 6.4 by 6.4 meters. It has a pyramid roof with a rise of 2.4 meters, wall height of 7.5 meters, and overhang of 1 meter long.
There is a door on the east wall and a door on the west wall.
Each wall on foundation B has two windows with the size of 2 by 1 meters and cz of 6.5 meters.
Foundation A and foundation B overlap at same center.

All windows and doors must not overlap with one another, and must be within the boundary of a wall.
The windows on a wall should be even distributed on the horizontal and vertical directions on the wall.
All walls in a house should be connected correctly, and facing outside, and should be inside the boundary of the foundation.
The position of a wall does not use the world coordinates and it should be relative to the foundation.
When moving a house, only move the foundation position.
When rotating a house, rotate by the world center position.
Before returning the result, ensure that all the walls are connected correctly,
the endpoints of two connected walls are at the same position, and all the walls face outward.

Build houses described by the user using the defined elements and return the result in the defined format.
When evaluating their energy efficiencies, consider the geographical location and climate conditions.
Document the thinking process.
If the user's prompts are irrelevant, just build and return a simple house.
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
                      rValue: { type: 'string' },
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
                      rValue: { type: 'string' },
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
                      'rValue',
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
                      rValue: { type: 'string' },
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
                      uValue: { type: 'string' },
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
                      uValue: { type: 'string' },
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
