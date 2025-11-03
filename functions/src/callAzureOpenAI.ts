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

There should be an address for the location of houses. If not specified, the default address is Natick, Massachusetts, USA.
Provide the latitude and longitude of the location.

Date and time should be set as a string in a format MM/dd/yyyy, hh:mm:ss a. If not specified, set the default date and time to 06/22/2025, 12:00:00 PM.
Direct light intensity is a number with the default value 3.5.
Ambient light intensity is a number with the default value 0.2.

There are some basic elements for building houses. Each element should have a unique id.

- Foundation: position is [cx, cy], size is [lx, ly, lz]. lx is length, ly is width, lz is thickness, r is rotation.
When foundation is part of a building, it has a property "rValue" in the unit of m²·℃/W, which defaults to 2.
Foundation has an HVAC system.
It has a heating set point, which defaults to 20 Celsius, and a cooling set point, which defaults to 25 Celsius.
It has a coefficient of performance for the air conditioner, which defaults to 4.
Default lz is 0.1 meter and color is 'grey';

- Wall: Must be built on foundation. It's position is defined by two points: "leftPoint" [cx, cy] and "rightPoint" [cx, cy],
representing the relative positions of the wall's leftmost and rightmost endpoints with respect to the foundation,
Wall has a number property "thickness" in the unit of meter, which defaults to 0.3.
Wall has a number property "height" in the unit of meter.
"pId" is the id of the foundation on which it is built.
"leftConnectId" and "rightConnectId" represent the id of the wall that it is connected to.
When two walls' endpoints are at the same position, they are connected.
If wall A is connected to wall B, then wall B is also connected to wall A.
"overhang" is the roof eaves overhang length, with a default value of 0.3 meter.
Default color is white.
Note that "leftConnectId" can only be connected to other wall's "rightConnectId", and vise versa.
Wall has a normal direction represented by the normal vector from "leftPoint" to "rightPoint", rotated clockwise by 90 degree.
Wall has a number property "rValue" in the unit of m²·℃/W, which defaults to 2.
Wall has a number property "airPermeability" in the unit of m³/(h·m²), which defaults to 0.

- Roof: When a wall is connected to other walls and the connection forms a loop, a roof can be built on that wall.
"wId" is the id of the wall that it is built on. "fId" is the id of the foundation that it is built on.
Roof should preferably be built on the wall that faces south.
Roof has default color: "#454769".
Roof has default "thickness" of 0.2 meter.
Roof has default "rise" of 2 meters.
Roof has a property "rValue" in the unit of m²·℃/W, which defaults to 2.
Roof has a number property "airPermeability" in the unit of m³/(h·m²), which defaults to 0.
Roof has "roofType" that is either "Gable", "Pyramid", "Hip", "Mansard", or "Gambrel".
For Hip roof type, it has a ridgeLength, which by default should be half of the length of the wall that it is built on.
For Mansard roof type, it has a ridgeLength, which by default should be 1.

- Door: is built on a wall. "pId" is the id of the wall on which it is built. "fId" is the id of the foundation on which it is built.
Door size [lx, ly], lx is width, ly is height.
Door center position [cx] is relative to the wall's center.
Door should preferably be built at the center of the wall that faces south.
Door has a boolean property "filled", which defaults to true.
Door has a property "uValue" in the unit of W/(m²·℃), which defaults to 1.
Door has a number property "airPermeability" in the unit of m³/(h·m²), which defaults to 0.
Door has a string property "doorType" that can be either "Default" or "Arched", which defaults to "Default".
Door has a string property "textureType" that can be "Door Texture #1", "Door Texture #2", ..., "Door Texture #17", "Door Texture Default", or "No Door Texture", which defaults to "Door Texture #1".
Do not set "textureType" to "Door Texture Default" or "No Door Texture" unless explicitly specified.
Prefer to set "textureType" to "Door Texture #1", "Door Texture #2", ..., or "Door Texture #17".
"Door Texture #1" is a white, paneled front door with a semicircular window at the top featuring a sunburst-style grid design.
"Door Texture #2" is a wooden Craftsman-style door featuring a grid of six small square windows at the top and three vertical recessed panels below a decorative ledge.
"Door Texture #3" is a wooden door with a dark brown finish, two vertical panels, and a small decorative glass window at the top.
"Door Texture #4" is a dark brown wooden door featuring two vertical panels and a rectangular decorative glass window near the top.
"Door Texture #5" is a dark wooden door with decorative diamond-patterned glass panels, including matching sidelights and a transom window.
"Door Texture #6" is a white door with a large, decorative leaded glass panel flanked by two matching sidelights.
"Door Texture #7" is a brown wood-grain door with a central arched decorative glass panel flanked by two matching sidelights.
"Door Texture #8" is a pair of ornate double doors made of dark metal or wood with iron scrollwork panels over glass.
"Door Texture #9" is a white, traditional-style sectional garage door with raised panels and a row of four rectangular windows across the top.
"Door Texture #10" is a white, carriage-house style garage door featuring vertically grooved panels, a top row of four 4-lite windows, and decorative black handles.
"Door Texture #11" is a white, carriage-house style garage door featuring decorative black handles and a top section with two arched, multi-pane windows.
"Door Texture #12" is a white, carriage-house style garage door with decorative black handles and two arched top windows featuring ornate black scrollwork inserts.
"Door Texture #13" is a pair of natural wood double doors with large glass panels divided into small squares and ornate brass handles, set within a decorative wooden frame.
"Door Texture #14" is a single natural wood door with a tall glass panel divided into squares and a vertical wooden panel beneath it, all set within an ornate wooden frame.
"Door Texture #15" is a dark double door with gold hardware and a semicircular transom window featuring a fanlight design above it, all framed by light-colored molding.
"Door Texture #16" is a panelized green single door with two vertical glass windows featuring a decorative circular design, topped by a semicircular fanlight transom, and set within a light-colored arched entryway.
"Door Texture #17" is a panelized coral single door featuring a multi-pane glass window in the upper section and a semicircular fanlight transom above, all framed by light-colored pilasters and a pink arch.
Only when "textureType" is "Door Texture Default" or "No Door Texture", set door's color (default to white).
Do not change "textureType" to "Door Texture Default" or "No Door Texture" when setting color.
When "textureType" is neither "Door Texture Default" nor "No Door Texture", consider door's color when selecting the texture type.
Door has default frame color white.

- Window: is built on a wall. "pId" is the id of the wall on which it is built. "fId" is the id of the foundation on which it is built.
Window size [lx, ly], lx is width, ly is height.
Window position [cx, cz]. cx is relative to center of the parent wall, cz is height calculated from the bottom of the wall.
Window has a number property "opacity", which defaults to 0.5.
When solar heat gain coefficient (SHGC) is specified for a window, its opacity is calculated by subtracting SHGC from 1. SHGC must be a number between 0 and 1.
Window has a number property "uValue" in the unit of W/(m²·℃), which defaults to 2.
Window has a number property "airPermeability" in the unit of m³/(h·m²), which defaults to 0.
Window has a string property "color" in HTML hex color code, which defaults to "#FFFFFF".
Window has a string property "tint" in HTML hex color code, which defaults to "#73D8FF".
Window has a string property "windowType" that can be either "Default" or "Arched", which defaults to "Default".
Window has a boolean property "shutter", which defaults to false.
Window has a string property "shutterColor", which defaults to "#808080".
Window has a number property "shutterWidth", which defaults to 0.5 (relative to the width of window).
Window has a boolean property "horizontalMullion", which defaults to true.
Window has a number property "horizontalMullionSpacing", which defaults to 0.5 meter.
Window has a boolean property "verticalMullion", which defaults to true.
Window has a number property "verticalMullionSpacing", which defaults to 0.5 meter.
Window has a string property "mullionColor", which defaults to "#ffffff".
Window has a number property "mullionWidth", which defaults to 0.06 meter.

- Solar panel: is mounted on roof.
"pId" is the id of the parent roof on which it is mounted.
"fId" is the id of the foundation on which it is belonged.
The orientation of a solar panel can be "Landscape" or "Portrait". The default is "Landscape".
"pvModelName" is the name of the PV module of the solar panel. The default is "SPR-X21-335-BLK".
Its size is [lx, ly], where lx is width, ly is height.
Its center is [cx, cy, cz], where cx and cy are relative to the foundation's center.
When adding a solar panel to the roof, place it at the center of the south-facing roof segment by default. 
If the roof is mansard roof, place solar panels at the center of the roof.
It's important to make sure the panel stays within the building and foundation boundary!

When building a house, first draw a rectangle on the foundation, which defines the positions of walls, then put a wall on each side of the rectangle.
The endpoints of the walls should be the same as the vertices of the rectangle.
A house is built on top of one foundation, with four walls connected one by one forming a loop.
All walls should have normal facing outside. There should be windows on each wall.

Here are some examples:

- A colonial style house has four walls connected with each other in a loop. Each wall is a 5-meter high.
The walls form a rectangular area with the size of 10 by 12 meters.
All walls should have normal facing outside. There is a gable roof with a rise of 2.4 meters.
Add a door on the wall facing south with a size of 1.6 by 2.5 meters.
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
                    ],
                    additionalProperties: false,
                  },
                  {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['Wall'] },
                      id: { type: 'string' },
                      pId: { type: 'string' },
                      thickness: { type: 'number' },
                      height: { type: 'number' },
                      color: { type: 'string' },
                      rValue: { type: 'number' },
                      airPermeability: { type: 'number' },
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
                      'thickness',
                      'height',
                      'color',
                      'rValue',
                      'airPermeability',
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
                      thickness: { type: 'number' },
                      rise: { type: 'number' },
                      color: { type: 'string' },
                      rValue: { type: 'number' },
                      airPermeability: { type: 'number' },
                      ridgeLength: { type: 'number' },
                    },
                    required: [
                      'type',
                      'id',
                      'fId',
                      'wId',
                      'roofType',
                      'thickness',
                      'rise',
                      'color',
                      'ridgeLength',
                      'rValue',
                      'airPermeability',
                    ],
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
                      filled: { type: 'boolean' },
                      color: { type: 'string' },
                      frameColor: { type: 'string' },
                      uValue: { type: 'number' },
                      airPermeability: { type: 'number' },
                      doorType: { type: 'string' },
                      textureType: { type: 'string' },
                    },
                    required: [
                      'type',
                      'id',
                      'pId',
                      'fId',
                      'center',
                      'size',
                      'filled',
                      'color',
                      'frameColor',
                      'uValue',
                      'airPermeability',
                      'doorType',
                      'textureType',
                    ],
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
                      airPermeability: { type: 'number' },
                      color: { type: 'string' },
                      tint: { type: 'string' },
                      windowType: { type: 'string' },
                      shutter: { type: 'boolean' },
                      shutterColor: { type: 'string' },
                      shutterWidth: { type: 'number' },
                      horizontalMullion: { type: 'boolean' },
                      horizontalMullionSpacing: { type: 'number' },
                      verticalMullion: { type: 'boolean' },
                      verticalMullionSpacing: { type: 'number' },
                      mullionColor: { type: 'string' },
                      mullionWidth: { type: 'number' },
                    },
                    required: [
                      'type',
                      'id',
                      'pId',
                      'fId',
                      'center',
                      'size',
                      'opacity',
                      'uValue',
                      'airPermeability',
                      'color',
                      'tint',
                      'windowType',
                      'shutter',
                      'shutterColor',
                      'shutterWidth',
                      'horizontalMullion',
                      'horizontalMullionSpacing',
                      'verticalMullion',
                      'verticalMullionSpacing',
                      'mullionColor',
                      'mullionWidth',
                    ],
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
                    },
                    required: ['type', 'id', 'pId', 'fId', 'pvModelName', 'orientation', 'center', 'size'],
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
