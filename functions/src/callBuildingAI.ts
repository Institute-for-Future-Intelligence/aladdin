/*
 * @Copyright 2025-2026. Institute for Future Intelligence, Inc.
 */

import Anthropic from '@anthropic-ai/sdk';
import { AzureOpenAI, OpenAI } from 'openai';

const endpoint = 'https://ifi-aims-genai.services.ai.azure.com/';
const modelName = 'o4-mini';
const deployment = 'o4-mini';
const apiVersion = '2024-12-01-preview';

const BUILDING_RULES = `3D coordinate system: +X=east, -X=west, +Y=north, -Y=south, +Z=up. Ground plane: z=0.

Location: default Natick, MA. Provide latitude/longitude.
Date format: MM/dd/yyyy, hh:mm:ss a. Default: 06/22/2025, 02:00:00 PM.
Light defaults: direct=6, ambient=0.4.

## Elements
Foundation: center=[cx,cy], size=[lx,ly,lz], rotation=r.
Defaults: lz=0.1, color="grey", rValue=2m²·℃/W, heatingSetpoint=20°C, coolingSetpoint=22°C, COP_AC=4. HVAC system with hvacId.

Wall: built on foundation (pId). Position: leftPoint=[cx,cy], rightPoint=[cx,cy] relative to foundation.
Defaults: color="white", rValue=2m²·℃/W, overhang=0.3.
leftConnectId connects to another wall's rightConnectId and vice versa.
Normal direction: leftPoint→rightPoint rotated 90° clockwise.

Roof: built on a wall (wId) whose connections form a loop. fId=foundation id. Prefer south-facing wall.
Defaults: color="#454769", rise=2.4, rValue=2(m²·℃/W).
Types: Gable, Pyramid, Hip, Mansard, Gambrel.
Hip: ridgeLength defaults to half the parent wall length.
Mansard: ridgeLength defaults to 1.
Gambrel: rise defaults to 3.

Door: built on wall (pId), fId=foundation. size=[width,height], center=[cx] relative to wall center.
Defaults: frameColor="white", uValue=1W/(m²·℃). Prefer south-facing wall center.

Window: built on wall (pId), fId=foundation. size=[width,height], center=[cx,cz] where cz is height from wall bottom.
Defaults: opacity=0.5, uValue=2W/(m²·℃), color="#FFFFFF", tint="#73D8FF", width=1, height=1.5.
If SHGC specified: opacity = 1 - SHGC.

Solar panel: mounted on roof (pId), fId=foundation. size=[lx,ly], center=[cx,cy,cz] relative to foundation.
Defaults: orientation="Landscape", pvModelName="SPR-X21-335-BLK".
Cover the roof segment it is mounted on with a single array of solar panels. Place it at the center of the south-facing roof segment by default. Must stay within foundation boundary.
If the roof is mansard, place solar panel at the center of the roof.
batteryId links to battery storage on same foundation if any.

Battery storage: built on foundation (pId). center=[cx,cy,cz], installed outside west wall, cz=foundation lz/2.
Defaults: color="#C7BABE", size=[1.5,2,1.5], chargingEfficiency=0.95, dischargingEfficiency=0.95.
hvacId matches foundation's hvacId.

## House construction rules
- Each element has a unique id
- All positions are relative to parent element unless stated otherwise
- One foundation supports four walls forming a rectangular loop, all normals facing outward.
- Wall endpoints match foundation rectangle vertices. Each wall has windows.
- Windows/doors must not overlap and must be within wall boundary.
- Windows evenly distributed horizontally and vertically on each wall. Their arrangement is symmetric about the central vertical line of the wall.
- Wall positions are relative to foundation. Move house by moving foundation. Rotate by world center.
- Verify: all walls connected correctly, shared endpoints match, all normals face outward.

## Examples

Colonial: 4 walls (5.6m high) forming 12×8m rectangle, gable roof (rise 2.4m), south door (1.6×2.5m).
On each wall, add a set of two windows evenly distributed in the vertical direction, add a vertical gap of 1 meter between them, and repeat the set every 4 meters horizontally. The horizontal distribution must be symmetric about the central line of the wall.

Gable-and-valley: 2 foundations overlapping as T-shape. A: 20×7m, B: 7×9m (north edge aligned to A's center). A: gable on south wall. B: gable on east wall, door on south, overhang=0 on north. 2 rows of windows per wall, count based on wall length. Height 5m, grey roof.

Dutch gable: 2 foundations at same center. A: 13.8×11m hip roof, walls 4.1m, door 3.6×2.5m. B: 10.8×6.5m gable (rise 2.3m), walls 4.9m, overhang 0.1m. Both roofs on south wall. Windows per wall based on length.

Monitor: 2 foundations at same center. A: 11.3×11.3m, mansard (rise 2, ridgeLength 2.75), walls 4m, south door, 3-4 windows (0.9×1.5m). B: 6.4×6.4m, pyramid (rise 2.4), walls 7.5m, overhang 1m, east+west doors, 2 windows per wall (2×1m, cz=6.5m).

Build the house as described. If no style is specified, build a colonial one. Consider location/climate for energy efficiency. Document thinking. If prompt is irrelevant, build a simple house.
`;

const RULES = `In 3D space, positive X-axis is east, negative X-axis is west; positive Y-axis is north, negative Y-axis is south; positive Z-axis is up.
The plane z = 0 represents ground.

There is a location for the house. If not specified, the default is Natick, MA. Provide the latitude and longitude.

Date and time are set as a string in a format MM/dd/yyyy, hh:mm:ss a. If not specified, default to 06/22/2025, 02:00:00 PM.
Direct light intensity is a number with the default value 3.5.
Ambient light intensity is a number with the default value 0.2.

There are some basic elements for building houses. Each element should have a unique id.

Foundation: position is [cx, cy], size is [lx, ly, lz]. lx is length, ly is width, lz is thickness, r is rotation.
When foundation is part of a building, it has a property "rValue" in the unit of m²·℃/W, which defaults to 2.
Foundation has an HVAC system.
It has a heating setpoint, which defaults to 20 Celsius, and a cooling setpoint, which defaults to 25 Celsius.
It has a coefficient of performance for the air conditioner, which defaults to 4.
Default lz is 0.1 meter and color is 'grey';

Wall: Must be built on foundation. Its position is defined by two points: "leftPoint" [cx, cy] and "rightPoint" [cx, cy],
representing the relative positions of its leftmost and rightmost endpoints relative to the foundation,
Wall has a number property "height" in meter.
"pId" is the id of the foundation on which it is built.
"leftConnectId" and "rightConnectId" represent the id of the wall that it is connected to.
When two walls' endpoints are at the same position, they are connected.
If wall A is connected to wall B, then wall B is also connected to wall A.
"overhang" is the roof eaves overhang length, with a default value of 0.3 meter.
Default color is white.
Note that "leftConnectId" can only be connected to other wall's "rightConnectId", and vise versa.
Wall has a normal direction represented by the normal vector from "leftPoint" to "rightPoint", rotated clockwise by 90 degrees.
Wall has a number property "rValue" in the unit of m²·℃/W, which defaults to 2.

Roof: When a wall is connected to other walls and the connection forms a loop, a roof can be built on that wall.
"wId" is the id of the wall that it is built on. "fId" is the id of the foundation that it is built on.
Roof should preferably be built on the wall that faces south.
Roof has default color: "#454769".
Roof has default "rise" of 2 meters.
Roof has a property "rValue" in the unit of m²·℃/W, which defaults to 2.
Roof has "roofType" that is either "Gable", "Pyramid", "Hip", "Mansard", or "Gambrel".
For Hip roof type, it has a ridgeLength, which by default should be half of the length of the wall that it is built on.
For Mansard roof type, it has a ridgeLength, which by default should be 1.
For Gambrel roof type, default rise is 3 meters.

Door: is built on a wall. "pId" is the id of the wall on which it is built. "fId" is the id of the foundation on which it is built.
Door size [lx, ly], lx is width, ly is height.
Door center position [cx] is relative to the wall's center.
Door should preferably be built at the center of the wall that faces south.
Door has a property "uValue" in the unit of W/(m²·℃), which defaults to 1.
Door has default frame color white.

Window: is built on a wall. "pId" is the id of the wall on which it is built. "fId" is the id of the foundation on which it is built.
Window size [lx, ly], lx is width, ly is height.
Window position [cx, cz]. cx is relative to center of the parent wall, cz is height calculated from the bottom of the wall.
Window has a number property "opacity", which defaults to 0.5.
When solar heat gain coefficient (SHGC) is specified for a window, its opacity is calculated by subtracting SHGC from 1. SHGC must be a number between 0 and 1.
Window has a number property "uValue" in the unit of W/(m²·℃), which defaults to 2.
Window has a string property "color" in HTML hex color code, which defaults to "#FFFFFF".
Window has a string property "tint" in HTML hex color code, which defaults to "#73D8FF".

Solar panel: is mounted on roof.
"pId" is the id of the parent roof on which it is mounted.
"fId" is the id of the foundation on which it is belonged.
The orientation of a solar panel can be "Landscape" or "Portrait". The default is "Landscape".
"pvModelName" is the name of the PV module of the solar panel. The default is "SPR-X21-335-BLK".
Its size is [lx, ly], it should cover the entire area of the roof segment it is mounted on.
Its center is [cx, cy, cz], where cx and cy are relative to the foundation's center.
"batteryId" should be the id of batter storage built on the same foundation if there is any.
When adding a solar panel to the roof, place it at the center of the south-facing roof segment by default.
If the roof is mansard roof, place solar panel at the center of the roof.
It's important to make sure the panel stays within the foundation's boundary.

Battery storage: is built on foundation. "pId" is the id of the foundation on which it is built.
"color" by default is "#C7BABE".
"size" is [lx, ly, lz], by default is [1.5, 2, 1.5].
"chargingEfficiency" and "dischargingEfficiency" by default is 0.95.
"center" is [cx, cy, cz], it is installed outside the west facing wall, cz should be half of the foundation lz.
"hvacId" should be the same hvacId as the foundation on which it is built.

When building a house, first draw a rectangle on the foundation, which defines the positions of walls, then put a wall on each side of the rectangle.
The endpoints of the walls should be the same as the vertices of the rectangle.
A house is built on top of one foundation, with four walls connected one by one forming a loop.
All walls should have normal facing outside. There should be windows on each wall.
One foundation can only have four walls.

Here are some examples:

- A colonial style house has four walls connected with each other in a loop. Each wall is a 5.6-meter high.
The walls form a rectangular area with the size of 10 by 12 meters.
All walls have normal facing outside. There is a gable roof with a rise of 2.4 meters.
Add a door on the wall facing south with a size of 1.6 by 2.5 meters.
On each wall, there is a set of two windows evenly distributed in the vertical direction
and the set should be repeated in every four meters in the horizontal direction.

- A gable-and-valley roof house has two foundations, each foundation has four walls and one gable roof.
The size of foundation A is 20 by 7 meters. The size of foundation B is 7 by 9 meters. They overlap to form a T-shape.
The northern edge of foundation B is aligned with the center of foundation A.
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

Build the house described by the user using the defined elements and return the result in the defined format.
When evaluating their energy efficiencies, consider the geographical location and climate conditions.
Document the thinking process.
If the user's prompts are irrelevant, just build and return a simple house.
`;

const DATA_STRUCTURE = `

## Output Format
Return strict JSON only, with this structure:

{
  "thinking": "Your reasoning process",
  "world": {
    "date": "MM/dd/yyyy, hh:mm:ss",
    "address": "Address string",
    "latitude": number,
    "longitude": number
  },
  "view": {
    "directLightIntensity": number (0-1),
    "ambientLightIntensity": number (0-1)
  },
  "elements": [
    // Array of elements, each one of the types below
  ]
}

## Element Type Definitions

### Foundation
{
  "type": "Foundation",
  "id": "unique ID",
  "center": [x, y, z],
  "size": [width, depth, height],
  "color": "#RRGGBB",
  "rotation": degrees,
  "rValue": R-value,
  "heatingSetpoint": heating temperature,
  "coolingSetpoint": cooling temperature,
  "coefficientOfPerformanceAC": AC performance coefficient,
  "hvacId": "associated HVAC ID"
}

### Wall
{
  "type": "Wall",
  "id": "unique ID",
  "pId": "parent ID (Foundation)",
  "height": height,
  "color": "#RRGGBB",
  "rValue": R-value,
  "leftPoint": [x, y],
  "rightPoint": [x, y],
  "leftConnectId": "left connecting wall ID",
  "rightConnectId": "right connecting wall ID",
  "overhang": overhang length
}

### Roof
{
  "type": "Roof",
  "id": "unique ID",
  "fId": "Foundation ID",
  "wId": "Wall ID",
  "roofType": "Gable" | "Pyramid" | "Hip" | "Mansard" | "Gambrel",
  "rise": rise height,
  "color": "#RRGGBB",
  "rValue": R-value,
  "ridgeLength": ridge length
}

### Door
{
  "type": "Door",
  "id": "unique ID",
  "pId": "parent wall ID",
  "fId": "Foundation ID",
  "center": [x, y],
  "size": [width, height],
  "color": "#RRGGBB",
  "frameColor": "#RRGGBB",
  "uValue": U-value,
}

### Window
{
  "type": "Window",
  "id": "unique ID",
  "pId": "parent wall ID",
  "fId": "Foundation ID",
  "center": [x, y],
  "size": [width, height],
  "opacity": opacity (0-1),
  "uValue": U-value,
  "color": "#RRGGBB",
  "tint": "tint color",
}

### Solar Panel
{
  "type": "Solar Panel",
  "id": "unique ID",
  "pId": "parent ID",
  "fId": "Foundation ID",
  "pvModelName": "model name",
  "orientation": "orientation",
  "center": [x, y],
  "size": [width, height],
  "batteryId": "associated battery ID"
}

### Battery Storage
{
  "type": "Battery Storage",
  "id": "unique ID",
  "pId": "parent ID",
  "center": [x, y, z],
  "size": [width, depth, height],
  "color": "#RRGGBB",
  "chargingEfficiency": charging efficiency (0-1),
  "dischargingEfficiency": discharging efficiency (0-1),
  "hvacId": "associated HVAC ID"
}

## Important Rules
1. Output JSON only - no other text, no markdown code fences
2. All fields are required
3. IDs must be unique and meaningful
4. Colors use hexadecimal format
5. Element ID references must be correctly linked

`;

export const callBuildingAI = async (
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
    messages: [{ role: 'system', content: BUILDING_RULES }, ...inputMessage],
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
            view: {
              type: 'object',
              properties: {
                directLightIntensity: { type: 'number' },
                ambientLightIntensity: { type: 'number' },
              },
              required: ['directLightIntensity', 'ambientLightIntensity'],
              additionalProperties: false,
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
                      rValue: { type: 'number' },
                      heatingSetpoint: { type: 'number' },
                      coolingSetpoint: { type: 'number' },
                      hvacId: { type: 'string' },
                      coefficientOfPerformanceAC: { type: 'number' },
                      rotation: { type: 'number' },
                    },
                    required: [
                      'type',
                      'id',
                      'center',
                      'size',
                      'color',
                      'rotation',
                      'rValue',
                      'heatingSetpoint',
                      'coolingSetpoint',
                      'coefficientOfPerformanceAC',
                      'hvacId',
                    ],
                    additionalProperties: false,
                  },
                  {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['Wall'] },
                      id: { type: 'string' },
                      pId: { type: 'string' },
                      height: { type: 'number' },
                      color: { type: 'string' },
                      rValue: { type: 'number' },
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
                      'height',
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
                      rValue: { type: 'number' },
                      ridgeLength: { type: 'number' },
                    },
                    required: ['type', 'id', 'fId', 'wId', 'roofType', 'rise', 'color', 'ridgeLength', 'rValue'],
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
                      frameColor: { type: 'string' },
                      uValue: { type: 'number' },
                    },
                    required: ['type', 'id', 'pId', 'fId', 'center', 'size', 'color', 'frameColor', 'uValue'],
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
                      opacity: { type: 'number' },
                      uValue: { type: 'number' },
                      color: { type: 'string' },
                      tint: { type: 'string' },
                    },
                    required: ['type', 'id', 'pId', 'fId', 'center', 'size', 'opacity', 'uValue', 'color', 'tint'],
                    additionalProperties: false,
                  },
                  {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['Solar Panel'] },
                      id: { type: 'string' },
                      pId: { type: 'string' },
                      fId: { type: 'string' },
                      pvModelName: { type: 'string' },
                      orientation: { type: 'string' },
                      center: { type: 'array', items: { type: 'number' } },
                      size: { type: 'array', items: { type: 'number' } },
                      batteryId: { type: 'string' },
                    },
                    required: ['type', 'id', 'pId', 'fId', 'pvModelName', 'orientation', 'center', 'size', 'batteryId'],
                    additionalProperties: false,
                  },
                  {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['Battery Storage'] },
                      id: { type: 'string' },
                      pId: { type: 'string' },
                      center: { type: 'array', items: { type: 'number' } },
                      size: { type: 'array', items: { type: 'number' } },
                      color: { type: 'string' },
                      chargingEfficiency: { type: 'number' },
                      dischargingEfficiency: { type: 'number' },
                      hvacId: { type: 'string' },
                    },
                    required: [
                      'type',
                      'id',
                      'pId',
                      'center',
                      'size',
                      'color',
                      'chargingEfficiency',
                      'dischargingEfficiency',
                      'hvacId',
                    ],
                    additionalProperties: false,
                  },
                ],
              },
            },
          },
          required: ['world', 'view', 'elements', 'thinking'],
          additionalProperties: false,
        },
      },
    },
  });
  return response;
};

export const callBuildingClaudeAI = async (apiKey: string | undefined, inputMessage: [], fromBrowser = false) => {
  const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: fromBrowser });

  const res = await anthropic.beta.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 10000, // require streaming API if this is large.
    system: RULES + DATA_STRUCTURE,
    messages: [...inputMessage],
    betas: ['structured-outputs-2025-11-13'],
  });
  return res;
};
