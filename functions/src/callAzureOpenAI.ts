/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { AzureOpenAI, OpenAI } from 'openai';

const endpoint = 'https://aims-test-resource.cognitiveservices.azure.com/';
const modelName = 'o4-mini';
const deployment = 'o4-mini';
const apiVersion = '2024-12-01-preview';

const RULES = `There is a 3D space. Positive X-axis is east, negative X-axis is west; positive Y-axis is north, negative Y-axis is south. Z-axis represents height. XY plane(z = 0) represents ground.
There are few basic elements in the 3D space to build a model, each element should have an unique id and some parameters.

Foundation: Its center are [cx, cy], and its sizes are [lx, ly, lz]. lx is length, ly is width, lz is thickness. Foundation is built on ground. lz default is 0.1
The default color of foundation is "grey";
Foundation's format: {type: "Foundation", id: string, center: [cx, cy], size: [lx, ly, lz], color: string}

Wall: Its sizes are [lx, ly, lz]. lx is length, ly is thickness, lz is height. Its center are [cx, cy], but note that center position is relative to the foundation.
"color" by default is white.
"pId" indicates the id of the foundation it belongs to.
"leftPoint" [cx, cy] and "rightPoint" [cx, cy] represent the relative positions of the wall's leftmost and rightmost endpoints with respect to the foundation,
"leftConnectId" and "rightConnectId" represent the wall's id it connected to. When two wall's endpoint are on the same position, means they are connected. If wall A is connected to Wall B, then Wall B is also connected to Wall A.
Note that "leftConnectId" can only be connected to other wall's "rightConnectId", vise versa.
Note that the leftpoint and rightpoint take precedence over the center and lx; if they are provided, the wall's position and length shoule be recalculated based on the leftpoint and rightpoint.
Wall's format: {type: 'Wall', id: string, pId: string, center: [cx, cy], size: [lx, ly, lz], color: string, leftPoint: [x, y], rightPoint: [x, y], leftConnectId: string, rightConnectId: string}

Roof: When a wall is connected to other wall and it's connection forms a loop, then a "Roof" can be built on that wall.
wId should be the wall's id it built on, fId should be the foundation' id it built on. Roof should preferably be built on the wall facing south.
Roof has default color: "#454769".
Roof has defulat "rise": 2
Roof has only "roofType": "Gable", "Pyramid".
Roof's format should be {type: "Roof", roofType: string, id: string, fId: string, wId: string, rise: number, color: string }

Door: is built on wall. "pId" means the wall's id which it built on, "fId" means the foundation's id which it built on.
Door size [lx, lz], lx means width, lz means height. size is actual size in real world
Door position [cx, cz]. Position is proportional to wall, which means it's realtive position to wall should be cx multiply by wall's lx. cz = wall.lz / 2 - (lz * wall.lz) / 2. Position range from -0.5 to 0.5.
Door has default color white. 
Door should preferably be built on the center of the wall facing south. 
Door's format {type: "Door", id: string, pId: string, fId: string, center: [cx, cz], size: [lx, lz], color: string}

Window: is built on wall. "pId" means the wall's id which it built on, "fId" means the foundation's id which it built on.
Window size [lx, lz], lx means width, lz means height. size is actual size in real world.
Window position [cx, cz]. Position is proportional to wall, which means it's realtive position to wall should be cx multiply by wall's lx. Position range from -0.5 to 0.5.
cx is default 0.3, cz is default 0
Window should preferably be built on the center of the wall facing south. 
Window's format {type: "Window", id: string, pId: string, fId: string, center: [cx, cz], size: [lx, lz]}

A typical house is formed by one foundation, four walls connected one by one forming a loop, a roof, a door, a window.

A typical colonial style house has four walls with 5 height forms a rectangular area with 10 * 11 connected one by one forming a loop, 
a gable roof with 2.2 rise, 
one door on the wall facing south,
and each wall has four windows with evenly distributed position in two rows,

The foundation should be slightly larger than the shape formed by walls.
When moving a house, only move foundation position.
Before return the result, double check if all the walls are connected correctly.
When change the house color, change the foundation, wall, and roof together.

Don't leave any comment in the result
Return the result in an array, and can be parsed by JSON.parse().
`;

export const callAzureOpenAI = async (
  apiKey: string | undefined,
  prompt: string,
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
    messages: [
      { role: 'system', content: RULES },
      {
        role: 'user',
        content: prompt,
      },
    ],
    reasoning_effort: reasoningEffort as OpenAI.ReasoningEffort,
    max_completion_tokens: 100000,
    model: modelName,
  });
  return response;
};
