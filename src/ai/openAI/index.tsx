import { Input } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import OpenAI from 'openai';
import { memo, useEffect, useState } from 'react';
import { DEFAULT_HVAC_SYSTEM, GROUND_ID, TWO_PI } from 'src/constants';
import { DoorModel } from 'src/models/DoorModel';
import { FoundationModel } from 'src/models/FoundationModel';
import { GableRoofModel, PyramidRoofModel, RoofStructure, RoofType } from 'src/models/RoofModel';
import { WallFill, WallModel, WallStructure } from 'src/models/WallModel';
import { WindowModel } from 'src/models/WindowModel';
import { useStore } from 'src/stores/common';
import { DoorTexture, FoundationTexture, ObjectType, RoofTexture, WallTexture } from 'src/types';
import { RoofUtil } from 'src/views/roof/RoofUtil';

// const RULES = `There is a 3D space. Positive X-axis is east, negative X-axis is west; positive Y-axis is north, negative Y-axis is south. Z-axis represents height. XY plane(z = 0) represents ground.
// There are few basic elements in the 3D space to build a model, each element should have an unique id and some parameters.

// Foundation: Its center are [cx, cy], and its sizes are [lx, ly, lz]. lx is length, ly is width, lz is thickness. Foundation is built on ground. lz default is 0.1
// The default color of foundation is "grey";
// Foundation's format: {type: "Foundation", id: string, center: [cx, cy], size: [lx, ly, lz], color: string}

// Wall: Its sizes are [lx, ly, lz]. lx is length, ly is thickness, lz is height. Its center are [cx, cy], but note that center position is relative to the foundation.
// "color" by default is white.
// "pId" indicates the id of the foundation it belongs to.
// "leftPoint" [cx, cy] and "rightPoint" [cx, cy] represent the relative positions of the wall's leftmost and rightmost endpoints with respect to the foundation,
// "leftConnectId" and "rightConnectId" represent the wall's id it connected to. When two wall's endpoint are on the same position, means they are connected. If wall A is connected to Wall B, then Wall B is also connected to Wall A.
// Note that "leftConnectId" can only be connected to other wall's "rightConnectId", vise versa.
// Note that the leftpoint and rightpoint take precedence over the center and lx; if they are provided, the wall's position and length shoule be recalculated based on the leftpoint and rightpoint.
// Wall's format: {type: 'Wall', id: string, pId: string, center: [cx, cy], size: [lx, ly, lz], color: string, leftPoint: [x, y], rightPoint: [x, y], leftConnectId: string, rightConnectId: string}

// Roof: When a wall is connected to other wall and it's connection forms a loop, then a "Roof" can be built on that wall.
// wId should be the wall's id it built on, fId should be the foundation' id it built on. Roof should preferably be built on the wall facing south.
// Roof has default color: "#454769".
// Roof has defulat "rise": 2
// Roof has only "roofType": "Gable", "Pyramid".
// Roof's format should be {type: "Roof", roofType: string, id: string, fId: string, wId: string, rise: number, color: string }

// Door: is built on wall. "pId" means the wall's id which it built on, "fId" means the foundation's id which it built on.
// Door size [lx, lz], lx means width, lz means height. Note dimension is proportional to wall, which means the actual size of door should be lx multiply by wall's lx.
// Door position [cx, cz]. Position is also proportional to wall, which means it's realtive position to wall should be cx multiply by wall's lx. cz = wall.lz / 2 - (lz * wall.lz) / 2. Position range from -0.5 to 0.5.
// Door has default color white.
// Door should preferably be built on the center of the wall facing south.
// Door's format {type: "Door", id: string, pId: string, fId: string, center: [cx, cz], size: [lx, lz], color: string}

// Window: is built on wall. "pId" means the wall's id which it built on, "fId" means the foundation's id which it built on.
// Window size [lx, lz], lx means width, lz means height. Note dimension is proportional to wall, which means the actual size of Window should be lx multiply by wall's lx.
// Window position [cx, cz]. Position is also proportional to wall, which means it's realtive position to wall should be cx multiply by wall's lx. Position range from -0.5 to 0.5.
// cx is default 0.3, cz is default 0
// Window has default color white.
// Window should preferably be built on the center of the wall facing south.
// Window's format {type: "Window", id: string, pId: string, fId: string, center: [cx, cz], size: [lx, lz], color: string}

// A typical house is formed by one foundation, four walls connected one by one forming a loop, a roof, a door, a window.

// A typical colonial style house has four walls with 5 height forms a rectangular area with 10 * 11 connected one by one forming a loop,
// a gable roof with 2.2 rise,
// one door on the wall facing south,
// and each wall has four windows with evenly distributed position in two rows

// The foundation should be slightly larger than the shape formed by walls.
// When moving a house, only move foundation position.
// Before return the result, double check if all the walls are connected correctly.
// When add wall on foundation, keep the foundation in the result.
// When change the house color, change the foundation, wall, and roof together.

// Don't leave any comment in the result
// Return the result in an array, and can be parsed by JSON.parse().
// `;

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

const AI = memo(() => {
  const [prompt, setPrompt] = useState('build a colonial style house');
  // const [answers, setAnswers] = useState<string[]>([]);
  const [responseId, setResponseId] = useState<string | null>(null);

  const [isFirst, setIsFirst] = useState(true);

  const client = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const makeFoundation = (id: string, center: number[], size: number[], color: string) => {
    const [cx, cy] = center;
    const [lx, ly, lz] = size;
    return {
      type: ObjectType.Foundation,
      cx: cx,
      cy: cy,
      cz: lz / 2,
      lx: lx,
      ly: ly,
      lz: lz,
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      parentId: GROUND_ID,
      color: color,
      textureType: FoundationTexture.NoTexture,
      solarUpdraftTower: {},
      solarAbsorberPipe: {},
      solarPowerTower: {},
      hvacSystem: { ...DEFAULT_HVAC_SYSTEM },
      id: id,
    } as FoundationModel;
  };

  const makeWall = (
    id: string,
    pId: string,
    center: number[],
    size: number[],
    color: string,
    leftPoint: number[],
    rightPoint: number[],
    leftConnectId?: string,
    rightConnectId?: string,
  ) => {
    const [cx, cy] = center;
    const [lx, ly, lz] = size;
    const [lpx, lpy] = leftPoint;
    const [rpx, rpy] = rightPoint;
    let angle = Math.atan2(rpy - lpy, rpx - lpx);
    angle = angle >= 0 ? angle : (TWO_PI + angle) % TWO_PI;

    const actionState = useStore.getState().actionState;
    return {
      type: ObjectType.Wall,
      cx: cx,
      cy: cy,
      cz: 0,
      lx: lx,
      ly: ly,
      lz: lz,
      parapet: actionState.wallParapet,
      eavesLength: actionState.wallEavesLength ?? 0.3,
      rValue: actionState.wallRValue ?? 3,
      fill: WallFill.Full,
      leftUnfilledHeight: 0.5,
      rightUnfilledHeight: 0.5,
      leftTopPartialHeight: actionState.wallHeight - 0.5,
      rightTopPartialHeight: actionState.wallHeight - 0.5,
      relativeAngle: angle,
      leftPoint: [lpx, lpy, 0],
      rightPoint: [rpx, rpy, 0],
      leftJoints: leftConnectId ? [leftConnectId] : [],
      rightJoints: rightConnectId ? [rightConnectId] : [],
      textureType: actionState.wallTexture ?? WallTexture.Default,
      color: color,
      volumetricHeatCapacity: actionState.wallVolumetricHeatCapacity ?? 0.5,
      wallStructure: actionState.wallStructure ?? WallStructure.Default,
      studSpacing: actionState.wallStructureSpacing ?? 2,
      studWidth: actionState.wallStructureWidth ?? 0.1,
      studColor: actionState.wallStructureColor ?? '#ffffff',
      opacity: actionState.wallOpacity !== undefined ? actionState.wallOpacity : 0.5,
      lineWidth: 0.2,
      lineColor: '#000000',
      windows: [],
      showLabel: false,
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      parentId: pId,
      foundationId: pId,
      id: id,
    } as WallModel;
  };

  const makeDoor = (id: string, pId: string, fId: string, center: number[], size: number[], color: string) => {
    const actionState = useStore.getState().actionState;
    const [cx, cz] = center;
    const [lx, lz] = size;
    return {
      type: ObjectType.Door,
      cx: cx,
      cy: 0,
      cz: cz,
      lx: lx,
      ly: 0,
      lz: lz,
      doorType: actionState.doorType,
      filled: actionState.doorFilled,
      interior: actionState.doorInterior,
      archHeight: actionState.doorArchHeight,
      textureType: actionState.doorTexture ?? DoorTexture.Default,
      color: color,
      uValue: actionState.doorUValue ?? 0.5,
      lineWidth: 0.2,
      lineColor: '#000000',
      showLabel: false,
      normal: [0, 1, 0],
      rotation: [0, 0, 0],
      parentId: pId,
      foundationId: fId,
      id: id,
    } as DoorModel;
  };

  const makeWindow = (id: string, pId: string, fId: string, center: number[], size: number[]) => {
    const actionState = useStore.getState().actionState;
    const [cx, cz] = center;
    const [lx, lz] = size;
    return {
      type: ObjectType.Window,
      cx: cx,
      cy: 0.3,
      cz: cz,
      lx: lx,
      ly: 0.3,
      lz: lz,
      leftShutter: actionState.windowShutterLeft,
      rightShutter: actionState.windowShutterRight,
      shutterColor: actionState.windowShutterColor,
      shutterWidth: actionState.windowShutterWidth,
      horizontalMullion: actionState.windowHorizontalMullion,
      verticalMullion: actionState.windowVerticalMullion,
      mullionWidth: actionState.windowMullionWidth,
      horizontalMullionSpacing: actionState.windowHorizontalMullionSpacing,
      verticalMullionSpacing: actionState.windowVerticalMullionSpacing,
      mullionColor: actionState.windowMullionColor,
      frame: actionState.windowFrame,
      frameWidth: actionState.windowFrameWidth,
      sillWidth: RoofUtil.isTypeRoof(ObjectType.Wall) ? 0 : actionState.windowSillWidth,
      windowType: actionState.windowType,
      empty: actionState.windowEmpty,
      interior: actionState.windowInterior,
      archHeight: actionState.windowArchHeight,
      lineWidth: 0.2,
      lineColor: '#000000',
      showLabel: false,
      color: actionState.windowColor ?? '#ffffff', // frame color
      tint: actionState.windowTint ?? '#73D8FF', // glass color
      opacity: actionState.windowOpacity !== undefined ? actionState.windowOpacity : 0.5,
      uValue: actionState.windowUValue ?? 0.5,
      normal: [0, -1, 0],
      rotation: [0, 0, 0],
      parentId: pId,
      parentType: ObjectType.Wall,
      foundationId: fId,
      id: id,
    } as WindowModel;
  };

  const makeGableRoof = (id: string, fId: string, wId: string, rise: number, color: string) => {
    const actionState = useStore.getState().actionState;
    return {
      type: ObjectType.Roof,
      cx: 0,
      cy: 0,
      cz: 0,
      lx: 0,
      ly: 0,
      lz: 0,
      ceiling: actionState.roofCeiling ?? false,
      rise: rise,
      thickness: actionState.roofThickness ?? 0.2,
      rValue: actionState.roofRValue ?? 3,
      color: color,
      sideColor: actionState.roofSideColor ?? '#ffffff',
      textureType: actionState.roofTexture ?? RoofTexture.Default,
      roofType: RoofType.Gable,
      roofStructure: RoofStructure.Default,
      wallsId: [wId],
      lineWidth: 0.2,
      lineColor: '#000000',
      showLabel: false,
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      parentId: fId,
      foundationId: fId,
      id: id,
      ridgeLeftPoint: [0, 1],
      ridgeRightPoint: [0, 1],
    } as GableRoofModel;
  };

  const makePyramidRoof = (id: string, fId: string, wId: string, rise: number, color: string) => {
    const actionState = useStore.getState().actionState;
    return {
      type: ObjectType.Roof,
      cx: 0,
      cy: 0,
      cz: 0,
      lx: 0,
      ly: 0,
      lz: 0,
      ceiling: actionState.roofCeiling ?? false,
      rise: rise,
      thickness: actionState.roofThickness ?? 0.2,
      rValue: actionState.roofRValue ?? 3,
      color: color,
      sideColor: actionState.roofSideColor ?? '#ffffff',
      textureType: actionState.roofTexture ?? RoofTexture.Default,
      roofType: RoofType.Pyramid,
      roofStructure: RoofStructure.Default,
      wallsId: [wId],
      lineWidth: 0.2,
      lineColor: '#000000',
      showLabel: false,
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      parentId: fId,
      foundationId: fId,
      id: id,
    } as PyramidRoofModel;
  };

  const get = async () => {
    console.log('prompt:', prompt);
    console.log('getting response...');

    const response = await client.responses.create({
      model: 'o4-mini',
      store: true,
      previous_response_id: responseId,
      input: isFirst ? RULES + prompt : prompt,
    });

    setIsFirst(false);

    // console.log(response);
    console.log('raw:');
    console.log(response.output_text);

    const json = JSON.parse(response.output_text);
    console.log('parsed:');
    console.log(json);

    // useStore.getState().set((state) => {
    //   state.elements = [];
    //   for (const e of json) {
    //     switch (e.type) {
    //       case ObjectType.Foundation: {
    //         const { id, center, size, color } = e;
    //         const f = makeFoundation(id, center, size, color);
    //         state.elements.push(f);
    //         break;
    //       }
    //       case ObjectType.Wall: {
    //         const { id, pId, center, size, leftPoint, rightPoint, color } = e;
    //         const w = makeWall(id, pId, center, size, color, leftPoint, rightPoint, e.leftConnectId, e.rightConnectId);
    //         state.elements.push(w);
    //         break;
    //       }
    //       case ObjectType.Door: {
    //         const { id, pId, fId, center, size, color } = e;
    //         const wall = state.elements.find((e) => e.id === pId);
    //         if (wall) {
    //           center[1] = (-wall.lz / 2 + (size[1] * wall.lz) / 2) / wall.lz;
    //           const d = makeDoor(id, pId, fId, center, size, color);
    //           state.elements.push(d);
    //         }
    //         break;
    //       }
    //       case ObjectType.Window: {
    //         const { id, pId, fId, center, size, color } = e;
    //         // const wall = state.elements.find((e) => e.id === pId);
    //         const w = makeWindow(id, pId, fId, center, size, color);
    //         state.elements.push(w);
    //         break;
    //       }
    //       case ObjectType.Roof: {
    //         switch (e.roofType) {
    //           case RoofType.Gable: {
    //             const { id, fId, wId, rise, color } = e;
    //             const r = makeGableRoof(id, fId, wId, rise, color);
    //             state.elements.push(r);
    //             state.addedRoofIdSet.add(id);
    //             break;
    //           }
    //           case RoofType.Pyramid: {
    //             const { id, fId, wId, rise, color } = e;
    //             const r = makePyramidRoof(id, fId, wId, rise, color);
    //             state.elements.push(r);
    //             state.addedRoofIdSet.add(id);
    //           }
    //         }
    //         break;
    //       }
    //     }
    //   }
    // });

    useStore.getState().set((state) => {
      state.elements = [];
      for (const e of json) {
        switch (e.type) {
          case ObjectType.Foundation: {
            const { id, center, size, color } = e;
            const f = makeFoundation(id, center, size, color);
            state.elements.push(f);
            break;
          }
          case ObjectType.Wall: {
            const { id, pId, center, size, leftPoint, rightPoint, color } = e;
            const w = makeWall(id, pId, center, size, color, leftPoint, rightPoint, e.leftConnectId, e.rightConnectId);
            state.elements.push(w);
            break;
          }
          case ObjectType.Door: {
            const { id, pId, fId, center, size, color } = e;
            const wall = state.elements.find((e) => e.id === pId);
            if (wall) {
              center[1] = (-wall.lz / 2 + size[1] / 2) / wall.lz;
              size[0] = size[0] / wall.lx;
              size[1] = size[1] / wall.lz;
              const d = makeDoor(id, pId, fId, center, size, color);
              state.elements.push(d);
            }
            break;
          }
          case ObjectType.Window: {
            const { id, pId, fId, center, size } = e;
            const wall = state.elements.find((e) => e.id === pId);
            if (wall) {
              size[0] = size[0] / wall.lx;
              size[1] = size[1] / wall.lz;
              const w = makeWindow(id, pId, fId, center, size);
              state.elements.push(w);
            }
            break;
          }
          case ObjectType.Roof: {
            switch (e.roofType) {
              case RoofType.Gable: {
                const { id, fId, wId, rise, color } = e;
                const r = makeGableRoof(id, fId, wId, rise, color);
                state.elements.push(r);
                state.addedRoofIdSet.add(id);
                break;
              }
              case RoofType.Pyramid: {
                const { id, fId, wId, rise, color } = e;
                const r = makePyramidRoof(id, fId, wId, rise, color);
                state.elements.push(r);
                state.addedRoofIdSet.add(id);
              }
            }
            break;
          }
        }
      }
    });

    setResponseId(response.id);
  };

  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 9999,
        bottom: '0px',
        height: '150px',
        width: '300px',
        border: 'solid red 2px',
        backgroundColor: 'white',
      }}
    >
      <TextArea
        size="large"
        rows={3}
        value={prompt}
        onChange={(e) => {
          setPrompt(e.target.value);
        }}
      />
      <button
        onClick={() => {
          get();
          setPrompt('');
        }}
      >
        send
      </button>
    </div>
  );
});

export default AI;
