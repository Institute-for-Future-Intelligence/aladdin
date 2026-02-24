/*
 * @Copyright 2025-2026. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, Modal, Select, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import * as Selector from '../stores/selector';
import { useTranslation } from 'react-i18next';
import { AudioOutlined, AudioMutedOutlined, WarningOutlined } from '@ant-design/icons';
import { getFunctions, httpsCallable } from 'firebase/functions';
import GenaiImage from '../assets/genai.png';
import { Audio } from 'react-loader-spinner';
import { useStore } from 'src/stores/common';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import i18n from 'src/i18n/i18n';
import useSpeechToText, { ResultType } from 'react-hook-speech-to-text';
import { showError } from 'src/helpers';
import { app } from 'src/firebase';
import { CuboidTexture, ObjectType, User } from 'src/types';
import { updateGenerateUrbanDesignPrompt } from 'src/cloudProjectUtil';
import { Util } from '../Util';
import { AI_MODELS_NAME } from 'functions/src/callSolarPowerTowerAI';
import { callUrbanDesignClaudeAI, callUrbanDesignOpenAI } from 'functions/src/callUrbanDesignAI';
import { CuboidModel } from 'src/models/CuboidModel';
import { PrismModel } from 'src/models/PolygonCuboidModel';
import short from 'short-uuid';
import * as Constants from '../constants';
import {
  generateBuildings,
  generateCityPonds,
  generateCityRivers,
  generateLandmarkBuildings,
  generateRoads,
  generateTrees,
} from './generateUrbanDesignCity';
import { InstancedModel, InstancedTree } from 'src/models/InstancedModel';
import { DefaultViewState } from '../stores/DefaultViewState';

export interface GenerateUrbanDesignProps {
  setDialogVisible: (visible: boolean) => void;
  isDialogVisible: () => boolean;
}

const { TextArea } = Input;

const GenerateUrbanDesignModal = React.memo(({ setDialogVisible, isDialogVisible }: GenerateUrbanDesignProps) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const reasoningEffort = useStore(Selector.reasoningEffort) ?? 'medium';
  const generateUrbanDesignPrompt = useStore(Selector.generateUrbanDesignPrompt) ?? 'Generate a city like Manhattan.';
  const setGenerating = usePrimitiveStore(Selector.setGenerating);
  const setChanged = usePrimitiveStore(Selector.setChanged);

  const [prompt, setPrompt] = useState<string>('Generate Urban Design');
  const [listening, setListening] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
  } as DraggableBounds);

  const isInternalUser = (user: User) => {
    return user.email === 'xiaotong@intofuture.org' || user.email === 'charles@intofuture.org';
  };

  const aIModel = useStore((state) => {
    const model = state.projectState.aIModel;
    if (isInternalUser(state.user)) {
      return model;
    } else {
      return AI_MODELS_NAME['Claude Sonnet-4.5'];
    }
  });

  // models for internal test
  const testModels = [];
  const user = useStore(Selector.user);
  if (isInternalUser(user)) {
    testModels.push({ value: AI_MODELS_NAME['Claude Opus-4.5'], label: 'Claude Opus-4.5' });
    testModels.push({ value: AI_MODELS_NAME['OpenAI o4-mini'], label: 'OpenAI o4-mini' });
  }

  const dragRef = useRef<HTMLDivElement | null>(null);

  const { t } = useTranslation();
  const lang = useMemo(() => {
    return { lng: language };
  }, [language]);

  useEffect(() => {
    setPrompt(generateUrbanDesignPrompt);
  }, [generateUrbanDesignPrompt]);

  const createInput = () => {
    const input = [];
    const designs = useStore.getState().projectState.designs;
    if (!useStore.getState().projectState.independentPrompt && designs && designs.length > 0) {
      for (const d of designs) {
        if (d.prompt && d.data) {
          input.push({ role: 'user', content: d.prompt });
          input.push({ role: 'assistant', content: d.data });
        }
      }
    }
    // add a period at the end of the prompt to avoid misunderstanding
    input.push({
      role: 'user',
      content: prompt.trim(),
    });
    return input;
  };

  const processResult = (text: string) => {
    processCity(text);
  };

  function getRandomLandmarkColor() {
    const landmarkColors = [
      '#C9A86C', // 金色/古铜色 - 经典地标色
      '#8B4513', // 赭石色 - 历史建筑
      '#4A5568', // 石板灰 - 现代地标
      '#1A365D', // 深蓝色 - 企业总部
      '#744210', // 棕褐色 - 传统建筑
      '#9C4221', // 赤陶色 - 地中海风格
      '#2D3748', // 炭灰色 - 现代摩天楼
    ];
    return landmarkColors[Math.floor(Math.random() * landmarkColors.length)];
  }

  const processCity = (text: string) => {
    const json = JSON.parse(text);

    console.log('raw', JSON.parse(text));
    console.log('thinking', json.thinking);
    const world = json.world;
    const terrain = json.terrain;
    const city = json.city;

    useStore.getState().set((state) => {
      state.elements = [];

      const heights = {
        sea: 0.3,
        park: 0.5,
        river: 0.8, // river and ponds
      };

      if (world) {
        state.world.date = world.date ?? '06/22/2026, 12:00:00 PM';
        state.world.address = world.address ?? 'New York City, USA';
        state.world.latitude = world.latitude === undefined ? 40.7128 : world.latitude;
        state.world.longitude = world.longitude === undefined ? -74.006 : world.longitude;
      }
      state.viewState = new DefaultViewState(); // reset view state

      if (terrain) {
        const sea = terrain.sea;
        if (sea && sea.vertices && sea.vertices.length > 0) {
          const seaPrism = {
            id: short.generate() as string,
            type: ObjectType.Sea,
            vertices: sea.vertices.map((v: [number, number]) => ({ x: v[0], y: v[1] })),
            height: heights.sea,
            color: '#26589d',
            transparency: 0,
          } as PrismModel;
          state.elements.push(seaPrism);
        }
      }
      // if (terrain && terrain.length > 0) {
      //   state.terrain = [...terrain];
      // }

      // generate rivers
      if (city.rivers && city.rivers.length > 0) {
        const rivers = generateCityRivers(city.rivers);
        for (const river of rivers) {
          const prism = {
            id: short.generate() as string,
            type: ObjectType.River,
            vertices: river.vertices.map((v: [number, number]) => ({ x: v[0], y: v[1] })),
            height: heights.river,
            color: '#5d97e7',
            transparency: 0,
          } as PrismModel;
          state.elements.push(prism);
        }
      }

      // generate ponds
      if (city.ponds && city.ponds.length > 0) {
        const ponds = generateCityPonds(city.ponds);
        for (const pond of ponds) {
          const prism = {
            id: short.generate() as string,
            type: ObjectType.River,
            vertices: pond.vertices.map((v: [number, number]) => ({ x: v[0], y: v[1] })),
            height: heights.river,
            color: '#5d97e7',
            transparency: 0,
          } as PrismModel;
          state.elements.push(prism);
        }
      }

      // generate roads
      const roads = generateRoads(city.roads);
      for (const road of roads) {
        for (const seg of road.segments) {
          const center = seg.position;
          const dist = seg.length;
          const foundation = {
            id: short.generate() as string,
            type: ObjectType.InstancedFoundation,
            cx: center[0],
            cy: center[1],
            cz: 0.5,
            lx: dist,
            ly: seg.width,
            lz: 1,
            rotation: [0, 0, seg.angle],
            color: '#808080',
          } as InstancedModel;
          state.elements.push(foundation);
        }
      }

      // // show boundaries
      // {
      //   const getRandomColor = () => {
      //     const color = new Color(Math.random(), Math.random(), Math.random());
      //     return '#' + color.getHexString();
      //   };

      //   let cz = 10;
      //   for (const zone of city.zones) {
      //     const boundary = zone.boundary;
      //     const color = getRandomColor();
      //     for (let i = 0; i < boundary.length; i++) {
      //       const start = boundary[i];
      //       const end = boundary[(i + 1) % boundary.length];

      //       const center = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
      //       const rotation = Math.atan2(end[1] - start[1], end[0] - start[0]);
      //       const dist = Math.hypot(start[0] - end[0], start[1] - end[1]);

      //       const foundation = {
      //         id: short.generate() as string,
      //         parentId: Constants.GROUND_ID,
      //         type: ObjectType.Foundation,
      //         cx: center[0],
      //         cy: center[1],
      //         cz: cz,
      //         lx: dist,
      //         ly: 3,
      //         lz: 5,
      //         rotation: [0, 0, rotation],
      //         normal: [0, 0, 1],
      //         color: color,
      //         textureType: FoundationTexture.NoTexture,
      //       } as FoundationModel;
      //       state.elements.push(foundation);
      //     }
      //     cz += 5;
      //   }
      // }

      // /** generate parks */
      // const parks = generateCityParks(city.parks, roads);
      for (const park of city.parks) {
        const prism = {
          id: short.generate() as string,
          type: ObjectType.Greenspace,
          vertices: park.vertices.map((v: [number, number]) => ({ x: v[0], y: v[1] })),
          height: heights.park,
          color: '#4a9700',
          transparency: 0,
        } as PrismModel;
        state.elements.push(prism);
      }

      // /** generate landmarks */
      const seaVerts: [number, number][] | undefined = terrain?.sea?.vertices;
      const landmarks = generateLandmarkBuildings(city, seaVerts);
      for (const landmark of landmarks) {
        const [cx, cy] = landmark.center;
        const [lx, ly, lz] = landmark.size;

        const color = getRandomLandmarkColor();
        const cuboid = {
          id: short.generate() as string,
          parentId: Constants.GROUND_ID,
          type: ObjectType.Cuboid,
          cx,
          cy,
          cz: lz / 2,
          lx,
          ly,
          lz,
          rotation: [0, 0, Util.toRadians(landmark.rotation ?? 0)],
          normal: [0, 0, 1],
          color: color,
          faceColors: new Array(6).fill(color),
          textureTypes: new Array(6).fill(CuboidTexture.NoTexture),
        } as CuboidModel;
        state.elements.push(cuboid);
      }

      let maxX = 0;
      let maxY = 0;

      /** generate buildings */
      const buildings = generateBuildings(city, landmarks, seaVerts);
      for (const building of buildings) {
        const [cx, cy] = building.center;
        const [lx, ly, lz] = building.size;

        if (building.vertices && building.vertices.length >= 3) {
          const prism = {
            id: short.generate() as string,
            type: ObjectType.PrismBuilding,
            vertices: building.vertices.map((v: [number, number]) => ({ x: v[0], y: v[1] })),
            height: lz,
            color: building.color,
            transparency: 0,
          } as PrismModel;
          state.elements.push(prism);
        } else {
          const cuboid = {
            id: short.generate() as string,
            type: ObjectType.InstancedCuboid,
            cx,
            cy,
            cz: lz / 2,
            lx,
            ly,
            lz,
            rotation: [0, 0, Util.toRadians(building.rotation ?? 0)],
            color: building.color,
          } as InstancedModel;
          state.elements.push(cuboid);
        }

        maxX = Math.max(Math.abs(cx), maxX);
        maxY = Math.max(Math.abs(cy), maxY);
      }

      /** generate trees (park + street) */
      const trees = generateTrees(city.parks || [], city.roads, buildings, city.rivers, city.ponds);
      for (const tree of trees) {
        const instancedTree = {
          id: short.generate() as string,
          type: ObjectType.InstancedTrees,
          cx: tree.center[0],
          cy: tree.center[1],
          cz: 0,
          treeType: tree.type,
        } as InstancedTree;
        state.elements.push(instancedTree);
      }

      /** update camera */
      state.viewState.cameraPosition = [0, -maxY * 2, maxY * 2];
      state.viewState.panCenter = [0, 0, 0];
      state.cameraChangeFlag = !state.cameraChangeFlag;
    });
  };

  const callFromFirebaseFunction = async () => {
    try {
      const functions = getFunctions(app, 'us-east4');
      const callAI = httpsCallable(functions, 'callAI', { timeout: 300000 });
      const input = createInput();
      console.log('calling...', input); // for debugging
      const res = (await callAI({
        text: input,
        type: 'urban',
        undefined,
        aIModel,
      })) as any;
      return res.data.text;
    } catch (e) {
      console.log(e);
      showError('' + e, 10);
      return null;
    }
  };

  const callFromBrowser = async () => {
    try {
      const input = createInput();

      if (aIModel === AI_MODELS_NAME['OpenAI o4-mini']) {
        console.log('calling OpenAI...', input);
        const response = await callUrbanDesignOpenAI(
          import.meta.env.VITE_AZURE_API_KEY,
          input as [],
          true,
          reasoningEffort,
        );
        const result = response.choices[0].message.content;
        console.log('OpenAI response:', response);
        return result;
      } else if (aIModel === AI_MODELS_NAME['Claude Sonnet-4.5'] || aIModel === AI_MODELS_NAME['Claude Opus-4.5']) {
        let model = 'claude-sonnet-4-5';
        if (aIModel === AI_MODELS_NAME['Claude Opus-4.5']) {
          model = 'claude-opus-4-5';
        }
        console.log(`calling Claude ${model}...`, input);
        const response = await callUrbanDesignClaudeAI(import.meta.env.VITE_CLAUDE_API_KEY, input as [], true, model);
        const result = (response.content[0] as any).text;
        console.log('Claude response:', response);
        return result;
      }
    } catch (e) {
      console.log(e);
      showError('' + e, 10);
      return null;
    }
  };

  const generate = async () => {
    if (import.meta.env.PROD) {
      return await callFromFirebaseFunction();
    } else {
      return await callFromBrowser();
    }
  };

  const handleGenerativeAI = async () => {
    setGenerating(true);
    try {
      const result = await generate();

      // test
      // const result = ``;
      // const result = `{"world":{"date":"06/22/2025, 12:00:00 PM","address":"Manhattan, New York City, USA","latitude":40.7831,"longitude":-73.9712},"terrain":{"sea":{"vertices":[[-1000,-1000],[-1000,1000],[-850,1000],[-800,800],[-750,400],[-780,0],[-750,-400],[-800,-800],[-850,-1000]]},"land":{"vertices":[[-850,-1000],[-800,-800],[-750,-400],[-780,0],[-750,400],[-800,800],[-850,1000],[1000,1000],[1000,-1000]]}},"city":{"roads":{"nodes":[{"id":"n1","position":[-700,900]},{"id":"n2","position":[-700,600]},{"id":"n3","position":[-700,300]},{"id":"n4","position":[-700,0]},{"id":"n5","position":[-700,-300]},{"id":"n6","position":[-700,-600]},{"id":"n7","position":[-700,-900]},{"id":"n8","position":[-400,900]},{"id":"n9","position":[-400,600]},{"id":"n10","position":[-400,300]},{"id":"n11","position":[-400,0]},{"id":"n12","position":[-400,-300]},{"id":"n13","position":[-400,-600]},{"id":"n14","position":[-400,-900]},{"id":"n15","position":[-100,900]},{"id":"n16","position":[-100,600]},{"id":"n17","position":[-100,300]},{"id":"n18","position":[-100,0]},{"id":"n19","position":[-100,-300]},{"id":"n20","position":[-100,-600]},{"id":"n21","position":[-100,-900]},{"id":"n22","position":[200,900]},{"id":"n23","position":[200,600]},{"id":"n24","position":[200,300]},{"id":"n25","position":[200,0]},{"id":"n26","position":[200,-300]},{"id":"n27","position":[200,-600]},{"id":"n28","position":[200,-900]},{"id":"n29","position":[500,900]},{"id":"n30","position":[500,600]},{"id":"n31","position":[500,300]},{"id":"n32","position":[500,0]},{"id":"n33","position":[500,-300]},{"id":"n34","position":[500,-600]},{"id":"n35","position":[500,-900]},{"id":"n36","position":[800,900]},{"id":"n37","position":[800,600]},{"id":"n38","position":[800,300]},{"id":"n39","position":[800,0]},{"id":"n40","position":[800,-300]},{"id":"n41","position":[800,-600]},{"id":"n42","position":[800,-900]},{"id":"b1","position":[-700,-900]},{"id":"b2","position":[-550,-700]},{"id":"b3","position":[-350,-450]},{"id":"b4","position":[-150,-200]},{"id":"b5","position":[100,100]},{"id":"b6","position":[350,400]},{"id":"b7","position":[550,650]},{"id":"b8","position":[800,900]}],"edges":[{"id":"e1","from":"n1","to":"n2","level":1},{"id":"e2","from":"n2","to":"n3","level":1},{"id":"e3","from":"n3","to":"n4","level":1},{"id":"e4","from":"n4","to":"n5","level":1},{"id":"e5","from":"n5","to":"n6","level":1},{"id":"e6","from":"n6","to":"n7","level":1},{"id":"e7","from":"n8","to":"n9","level":1},{"id":"e8","from":"n9","to":"n10","level":1},{"id":"e9","from":"n10","to":"n11","level":1},{"id":"e10","from":"n11","to":"n12","level":1},{"id":"e11","from":"n12","to":"n13","level":1},{"id":"e12","from":"n13","to":"n14","level":1},{"id":"e13","from":"n15","to":"n16","level":1},{"id":"e14","from":"n16","to":"n17","level":1},{"id":"e15","from":"n17","to":"n18","level":1},{"id":"e16","from":"n18","to":"n19","level":1},{"id":"e17","from":"n19","to":"n20","level":1},{"id":"e18","from":"n20","to":"n21","level":1},{"id":"e19","from":"n22","to":"n23","level":1},{"id":"e20","from":"n23","to":"n24","level":1},{"id":"e21","from":"n24","to":"n25","level":1},{"id":"e22","from":"n25","to":"n26","level":1},{"id":"e23","from":"n26","to":"n27","level":1},{"id":"e24","from":"n27","to":"n28","level":1},{"id":"e25","from":"n29","to":"n30","level":1},{"id":"e26","from":"n30","to":"n31","level":1},{"id":"e27","from":"n31","to":"n32","level":1},{"id":"e28","from":"n32","to":"n33","level":1},{"id":"e29","from":"n33","to":"n34","level":1},{"id":"e30","from":"n34","to":"n35","level":1},{"id":"e31","from":"n36","to":"n37","level":1},{"id":"e32","from":"n37","to":"n38","level":1},{"id":"e33","from":"n38","to":"n39","level":1},{"id":"e34","from":"n39","to":"n40","level":1},{"id":"e35","from":"n40","to":"n41","level":1},{"id":"e36","from":"n41","to":"n42","level":1},{"id":"e37","from":"n1","to":"n8","level":1},{"id":"e38","from":"n8","to":"n15","level":1},{"id":"e39","from":"n15","to":"n22","level":1},{"id":"e40","from":"n22","to":"n29","level":1},{"id":"e41","from":"n29","to":"n36","level":1},{"id":"e42","from":"n2","to":"n9","level":2},{"id":"e43","from":"n9","to":"n16","level":2},{"id":"e44","from":"n16","to":"n23","level":2},{"id":"e45","from":"n23","to":"n30","level":2},{"id":"e46","from":"n30","to":"n37","level":2},{"id":"e47","from":"n3","to":"n10","level":2},{"id":"e48","from":"n10","to":"n17","level":2},{"id":"e49","from":"n17","to":"n24","level":2},{"id":"e50","from":"n24","to":"n31","level":2},{"id":"e51","from":"n31","to":"n38","level":2},{"id":"e52","from":"n4","to":"n11","level":2},{"id":"e53","from":"n11","to":"n18","level":2},{"id":"e54","from":"n18","to":"n25","level":2},{"id":"e55","from":"n25","to":"n32","level":2},{"id":"e56","from":"n32","to":"n39","level":2},{"id":"e57","from":"n5","to":"n12","level":2},{"id":"e58","from":"n12","to":"n19","level":2},{"id":"e59","from":"n19","to":"n26","level":2},{"id":"e60","from":"n26","to":"n33","level":2},{"id":"e61","from":"n33","to":"n40","level":2},{"id":"e62","from":"n6","to":"n13","level":2},{"id":"e63","from":"n13","to":"n20","level":2},{"id":"e64","from":"n20","to":"n27","level":2},{"id":"e65","from":"n27","to":"n34","level":2},{"id":"e66","from":"n34","to":"n41","level":2},{"id":"e67","from":"n7","to":"n14","level":2},{"id":"e68","from":"n14","to":"n21","level":2},{"id":"e69","from":"n21","to":"n28","level":2},{"id":"e70","from":"n28","to":"n35","level":2},{"id":"e71","from":"n35","to":"n42","level":2},{"id":"broadway1","from":"b1","to":"b2","level":1},{"id":"broadway2","from":"b2","to":"b3","level":1},{"id":"broadway3","from":"b3","to":"b4","level":1},{"id":"broadway4","from":"b4","to":"b5","level":1},{"id":"broadway5","from":"b5","to":"b6","level":1},{"id":"broadway6","from":"b6","to":"b7","level":1},{"id":"broadway7","from":"b7","to":"b8","level":1}]},"rivers":[{"vertices":[[-1000,1000],[-850,1000],[-800,800],[-750,400],[-780,0],[-750,-400],[-800,-800],[-850,-1000],[-1000,-1000],[-1000,1000]]},{"vertices":[[1000,1000],[1000,950],[850,900],[800,600],[820,300],[800,0],[820,-300],[800,-600],[850,-900],[1000,-950],[1000,1000]]}],"parks":[{"vertices":[[-100,750],[-100,150],[200,150],[200,750],[-100,750]]}],"landmarks":[{"center":[300,-700],"size":[60,60,380],"rotation":0},{"center":[450,-650],"size":[50,50,320],"rotation":0.1},{"center":[350,-550],"size":[55,55,350],"rotation":-0.05},{"center":[500,-500],"size":[45,45,280],"rotation":0.15},{"center":[-200,-800],"size":[40,40,250],"rotation":0},{"center":[600,-400],"size":[50,50,300],"rotation":0.08},{"center":[-300,50],"size":[35,35,200],"rotation":0},{"center":[700,200],"size":[40,40,220],"rotation":-0.1}],"zones":[{"boundary":[[-700,900],[-700,750],[-100,750],[-100,900],[-700,900]],"length":[20,40],"width":[15,30],"height":[30,80],"coverage":0.5,"layout":"grid"},{"boundary":[[-700,750],[-700,150],[-100,150],[-100,750],[-700,750]],"length":[25,45],"width":[18,35],"height":[40,100],"coverage":0.55,"layout":"grid"},{"boundary":[[200,900],[200,150],[800,150],[800,900],[200,900]],"length":[30,50],"width":[20,40],"height":[50,120],"coverage":0.6,"layout":"grid"},{"boundary":[[-700,150],[-700,-300],[-100,-300],[-100,150],[-700,150]],"length":[25,45],"width":[18,35],"height":[60,150],"coverage":0.65,"layout":"grid"},{"boundary":[[-100,150],[-100,-300],[500,-300],[500,150],[-100,150]],"length":[30,55],"width":[22,42],"height":[80,200],"coverage":0.7,"layout":"grid"},{"boundary":[[500,150],[500,-300],[800,-300],[800,150],[500,150]],"length":[28,48],"width":[20,38],"height":[70,180],"coverage":0.65,"layout":"grid"},{"boundary":[[-700,-300],[-700,-900],[200,-900],[200,-300],[-700,-300]],"length":[35,60],"width":[25,50],"height":[100,300],"coverage":0.75,"layout":"grid"},{"boundary":[[200,-300],[200,-900],[800,-900],[800,-300],[200,-300]],"length":[40,70],"width":[30,55],"height":[150,400],"coverage":0.8,"layout":"grid"}]},"thinking":"Creating Manhattan-style city: 1) Placed Hudson River on west side and East River on east side as narrow water bodies. 2) Created classic Manhattan grid with north-south avenues and east-west cross streets. 3) Added diagonal Broadway cutting through the grid from southwest to northeast. 4) Placed Central Park as large rectangular green space in upper-middle area. 5) Downtown/Financial District in south with tallest buildings and highest density. 6) Midtown area with medium-high buildings. 7) Upper areas with residential scale buildings. 8) Landmarks concentrated in Financial District representing Wall Street skyscrapers. 9) Grid layout throughout to match Manhattan's famous street pattern."}`;
      // const result = `{"world":{"date":"06/22/2025, 12:00:00 PM","address":"Boston, Massachusetts, USA","latitude":42.3601,"longitude":-71.0589},"terrain":{"sea":{"vertices":[[1000,-1000],[1000,1000],[600,1000],[500,800],[450,500],[500,200],[550,-100],[500,-400],[600,-700],[700,-1000]]},"land":{"vertices":[[-1000,-1000],[700,-1000],[600,-700],[500,-400],[550,-100],[500,200],[450,500],[500,800],[600,1000],[-1000,1000]]}},"city":{"roads":{"nodes":[{"id":"n1","position":[-800,800]},{"id":"n2","position":[-400,850]},{"id":"n3","position":[0,900]},{"id":"n4","position":[300,750]},{"id":"n5","position":[-900,400]},{"id":"n6","position":[-500,450]},{"id":"n7","position":[-100,400]},{"id":"n8","position":[250,350]},{"id":"n9","position":[400,300]},{"id":"n10","position":[-850,0]},{"id":"n11","position":[-450,50]},{"id":"n12","position":[-50,0]},{"id":"n13","position":[300,50]},{"id":"n14","position":[450,100]},{"id":"n15","position":[-800,-400]},{"id":"n16","position":[-400,-350]},{"id":"n17","position":[0,-300]},{"id":"n18","position":[350,-250]},{"id":"n19","position":[450,-200]},{"id":"n20","position":[-850,-800]},{"id":"n21","position":[-400,-750]},{"id":"n22","position":[0,-700]},{"id":"n23","position":[350,-600]},{"id":"n24","position":[500,-500]},{"id":"n25","position":[-600,650]},{"id":"n26","position":[-200,600]},{"id":"n27","position":[150,550]},{"id":"n28","position":[-700,200]},{"id":"n29","position":[-250,200]},{"id":"n30","position":[150,150]},{"id":"n31","position":[-650,-200]},{"id":"n32","position":[-200,-150]},{"id":"n33","position":[200,-100]},{"id":"n34","position":[-600,-550]},{"id":"n35","position":[-150,-500]},{"id":"n36","position":[200,-450]},{"id":"n37","position":[100,700]},{"id":"n38","position":[-300,300]},{"id":"n39","position":[50,-600]},{"id":"n40","position":[-100,750]}],"edges":[{"id":"e1","from":"n1","to":"n2","level":1},{"id":"e2","from":"n2","to":"n3","level":1},{"id":"e3","from":"n3","to":"n4","level":1},{"id":"e4","from":"n5","to":"n6","level":1},{"id":"e5","from":"n6","to":"n7","level":1},{"id":"e6","from":"n7","to":"n8","level":1},{"id":"e7","from":"n8","to":"n9","level":1},{"id":"e8","from":"n10","to":"n11","level":1},{"id":"e9","from":"n11","to":"n12","level":1},{"id":"e10","from":"n12","to":"n13","level":1},{"id":"e11","from":"n13","to":"n14","level":1},{"id":"e12","from":"n15","to":"n16","level":1},{"id":"e13","from":"n16","to":"n17","level":1},{"id":"e14","from":"n17","to":"n18","level":1},{"id":"e15","from":"n18","to":"n19","level":1},{"id":"e16","from":"n20","to":"n21","level":1},{"id":"e17","from":"n21","to":"n22","level":1},{"id":"e18","from":"n22","to":"n23","level":1},{"id":"e19","from":"n23","to":"n24","level":1},{"id":"e20","from":"n1","to":"n5","level":1},{"id":"e21","from":"n5","to":"n10","level":1},{"id":"e22","from":"n10","to":"n15","level":1},{"id":"e23","from":"n15","to":"n20","level":1},{"id":"e24","from":"n2","to":"n6","level":1},{"id":"e25","from":"n6","to":"n11","level":1},{"id":"e26","from":"n11","to":"n16","level":1},{"id":"e27","from":"n16","to":"n21","level":1},{"id":"e28","from":"n3","to":"n7","level":1},{"id":"e29","from":"n7","to":"n12","level":1},{"id":"e30","from":"n12","to":"n17","level":1},{"id":"e31","from":"n17","to":"n22","level":1},{"id":"e32","from":"n4","to":"n8","level":1},{"id":"e33","from":"n8","to":"n13","level":1},{"id":"e34","from":"n13","to":"n18","level":1},{"id":"e35","from":"n18","to":"n23","level":1},{"id":"e36","from":"n9","to":"n14","level":1},{"id":"e37","from":"n14","to":"n19","level":1},{"id":"e38","from":"n19","to":"n24","level":1},{"id":"e39","from":"n1","to":"n25","level":2},{"id":"e40","from":"n25","to":"n26","level":2},{"id":"e41","from":"n26","to":"n27","level":2},{"id":"e42","from":"n27","to":"n4","level":2},{"id":"e43","from":"n5","to":"n28","level":2},{"id":"e44","from":"n28","to":"n29","level":2},{"id":"e45","from":"n29","to":"n30","level":2},{"id":"e46","from":"n30","to":"n9","level":2},{"id":"e47","from":"n10","to":"n31","level":2},{"id":"e48","from":"n31","to":"n32","level":2},{"id":"e49","from":"n32","to":"n33","level":2},{"id":"e50","from":"n33","to":"n14","level":2},{"id":"e51","from":"n15","to":"n34","level":2},{"id":"e52","from":"n34","to":"n35","level":2},{"id":"e53","from":"n35","to":"n36","level":2},{"id":"e54","from":"n36","to":"n19","level":2},{"id":"e55","from":"n25","to":"n6","level":2},{"id":"e56","from":"n26","to":"n7","level":2},{"id":"e57","from":"n28","to":"n11","level":2},{"id":"e58","from":"n29","to":"n12","level":2},{"id":"e59","from":"n31","to":"n16","level":2},{"id":"e60","from":"n32","to":"n17","level":2},{"id":"e61","from":"n34","to":"n21","level":2},{"id":"e62","from":"n35","to":"n22","level":2},{"id":"e63","from":"n38","to":"n6","level":2},{"id":"e64","from":"n38","to":"n29","level":2},{"id":"e65","from":"n37","to":"n3","level":2},{"id":"e66","from":"n37","to":"n27","level":2},{"id":"e67","from":"n40","to":"n2","level":2},{"id":"e68","from":"n40","to":"n26","level":2},{"id":"e69","from":"n39","to":"n22","level":2},{"id":"e70","from":"n39","to":"n35","level":2}]},"rivers":[{"vertices":[[-950,600],[-920,620],[-850,580],[-780,610],[-700,570],[-620,600],[-550,560],[-480,590],[-400,550],[-350,580],[-280,540],[-220,570],[-150,530],[-100,560],[-30,520],[40,550],[100,510],[160,540],[220,500],[280,530],[320,490],[350,520],[380,480],[400,450],[420,400],[400,350],[380,300],[350,260],[320,220],[280,180],[220,150],[160,120],[100,90],[40,60],[-30,30],[-100,0],[-150,-30],[-220,-60],[-280,-90],[-350,-120],[-400,-150],[-480,-180],[-550,-210],[-620,-240],[-700,-280],[-780,-320],[-850,-360],[-920,-400],[-950,-440],[-950,-380],[-920,-340],[-850,-300],[-780,-260],[-700,-220],[-620,-180],[-550,-150],[-480,-120],[-400,-90],[-350,-60],[-280,-30],[-220,0],[-150,30],[-100,60],[-30,90],[40,120],[100,150],[160,180],[220,210],[280,240],[320,280],[350,320],[380,360],[400,400],[420,450],[400,500],[350,560],[280,590],[220,560],[160,600],[100,570],[40,610],[-30,580],[-100,620],[-150,590],[-220,630],[-280,600],[-350,640],[-400,610],[-480,650],[-550,620],[-620,660],[-700,630],[-780,670],[-850,640],[-920,680],[-950,650]]}],"parks":[{"vertices":[[-350,700],[-150,700],[-150,550],[-350,550]]},{"vertices":[[-700,-100],[-500,-100],[-500,-300],[-700,-300]]},{"vertices":[[50,250],[250,250],[250,50],[50,50]]},{"vertices":[[-250,-550],[-50,-550],[-50,-750],[-250,-750]]}],"landmarks":[{"center":[350,450],"size":[60,60,180],"rotation":0.15},{"center":[280,150],"size":[50,50,150],"rotation":-0.1},{"center":[-100,300],"size":[40,40,120],"rotation":0.2},{"center":[-500,700],"size":[70,50,100],"rotation":0},{"center":[150,-200],"size":[55,55,140],"rotation":0.05},{"center":[-300,50],"size":[45,45,110],"rotation":-0.15},{"center":[400,-100],"size":[65,50,160],"rotation":0.1},{"center":[-650,300],"size":[50,40,90],"rotation":0}],"zones":[{"boundary":[[-1000,1000],[-1000,400],[-500,450],[-400,850],[-200,600],[0,900],[300,750],[400,300],[450,500],[500,800],[600,1000]],"length":[20,40],"width":[15,30],"height":[15,50],"coverage":0.45,"layout":"cluster"},{"boundary":[[-1000,400],[-1000,0],[-850,0],[-450,50],[-500,450]],"length":[25,45],"width":[20,35],"height":[20,60],"coverage":0.5,"layout":"grid"},{"boundary":[[-450,50],[-50,0],[250,350],[400,300],[450,100],[500,200],[450,500],[400,300],[300,750],[0,900],[-200,600],[-500,450]],"length":[30,50],"width":[25,40],"height":[40,120],"coverage":0.55,"layout":"grid"},{"boundary":[[-1000,0],[-1000,-400],[-800,-400],[-400,-350],[-450,50],[-850,0]],"length":[20,35],"width":[18,28],"height":[12,40],"coverage":0.4,"layout":"perimeter"},{"boundary":[[-400,-350],[0,-300],[300,50],[450,100],[500,200],[550,-100],[500,-400],[350,-250],[0,-300],[-400,-350]],"length":[25,40],"width":[20,32],"height":[25,70],"coverage":0.48,"layout":"grid"},{"boundary":[[-1000,-400],[-1000,-1000],[-850,-800],[-400,-750],[-400,-350],[-800,-400]],"length":[18,32],"width":[15,25],"height":[10,35],"coverage":0.35,"layout":"cluster"},{"boundary":[[-400,-750],[0,-700],[350,-600],[500,-500],[550,-100],[500,-400],[350,-250],[0,-300],[-400,-350]],"length":[22,38],"width":[18,30],"height":[15,45],"coverage":0.42,"layout":"perimeter"},{"boundary":[[-850,-800],[-400,-750],[0,-700],[350,-600],[500,-500],[600,-700],[700,-1000],[-1000,-1000]]}]},"thinking":"Boston is characterized by its irregular, winding streets that follow old colonial paths and cow trails, unlike grid-planned cities. The city has a strong waterfront presence with Boston Harbor to the east. Key features include: 1) Irregular street patterns reflecting organic growth from 17th century origins, 2) Charles River influence with the river meandering through the city, 3) Historic neighborhoods like Back Bay, Beacon Hill, and the North End, 4) Mix of colonial-era low buildings and modern high-rises in the Financial District, 5) Green spaces like Boston Common and the Emerald Necklace. I've created a harbor on the east side, a winding river (representing the Charles River), scattered parks, and varied building zones with different densities reflecting Boston's diverse neighborhoods - from dense downtown areas to more residential outer zones."}`;

      if (result) {
        // prevent markdown
        const cleanedResult = result
          .trim()
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();

        processResult(cleanedResult);
        useStore.getState().set((state) => {
          state.genAIData = {
            aIModel: aIModel,
            prompt: prompt.trim(),
            data: cleanedResult,
          };
        });
        setTimeout(() => {
          usePrimitiveStore.getState().set((state) => {
            state.curateDesignToProjectFlag = true;
            state.genAIModelCreated = true;
          });
        }, 1500);
      }
    } finally {
      setGenerating(false);
    }
  };

  const { error, interimResult, results, setResults, startSpeechToText, stopSpeechToText } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
  });

  const speechToText = useMemo(() => {
    let s = '';
    for (const result of results) {
      s += (result as ResultType).transcript;
    }
    if (interimResult) s += interimResult;
    return s;
  }, [results]);

  useEffect(() => {
    if (speechToText !== '') setPrompt(speechToText);
  }, [speechToText]);

  const onStart = (event: DraggableEvent, uiData: DraggableData) => {
    if (dragRef.current) {
      const { clientWidth, clientHeight } = window.document.documentElement;
      const targetRect = dragRef.current.getBoundingClientRect();
      setBounds({
        left: -targetRect.left + uiData.x,
        right: clientWidth - (targetRect.right - uiData.x),
        top: -targetRect.top + uiData.y,
        bottom: clientHeight - (targetRect?.bottom - uiData.y),
      });
    }
  };

  const onOk = async () => {
    setCommonStore((state) => {
      state.projectState.generateUrbanDesignPrompt = prompt;
    });
    handleGenerativeAI().then(() => {
      setChanged(true);
      const userid = useStore.getState().user.uid;
      const projectTitle = useStore.getState().projectState.title;
      if (userid && projectTitle) updateGenerateUrbanDesignPrompt(userid, projectTitle, prompt);
    });
    close();
  };

  const onCancel = () => {
    setPrompt(generateUrbanDesignPrompt);
    close();
  };

  const close = () => {
    setDialogVisible(false);
    setListening(false);
    stopSpeechToText();
  };

  const onClear = () => {
    setPrompt('');
    setResults([]);
  };

  return (
    <Modal
      width={650}
      title={
        <div
          style={{ width: '100%', cursor: 'move' }}
          onMouseOver={() => setDragEnabled(true)}
          onMouseOut={() => setDragEnabled(false)}
        >
          <img src={GenaiImage} width={'16px'} alt={'genai'} /> {t('projectPanel.GenerateUrbanDesign', lang)}
        </div>
      }
      open={isDialogVisible()}
      footer={[
        <Button key="Cancel" onClick={onCancel}>
          {t('word.Cancel', lang)}
        </Button>,
        <Button key="Clear" onClick={onClear}>
          {t('word.Clear', lang)}
        </Button>,
        <Button key="OK" type="primary" onClick={onOk} disabled={prompt === ''}>
          {t('word.OK', lang)}
        </Button>,
      ]}
      onCancel={onCancel}
      modalRender={(modal) => (
        <Draggable
          nodeRef={dragRef}
          disabled={!dragEnabled}
          bounds={bounds}
          onStart={(event, uiData) => onStart(event, uiData)}
        >
          <div ref={dragRef}>{modal}</div>
        </Draggable>
      )}
    >
      <Space direction={'vertical'} style={{ width: '100%', paddingBottom: '10px', paddingTop: '10px' }}>
        <Space>
          {i18n.t('projectPanel.WhatUrbanDesignDoYouWant', lang)}
          {!error && (
            <>
              {listening ? (
                <>
                  <AudioOutlined
                    style={{ paddingLeft: '2px' }}
                    onClick={() => {
                      setListening(false);
                      stopSpeechToText();
                    }}
                  />
                  <Audio width={12} height={16} />
                  {i18n.t('projectPanel.Listening', lang)}
                </>
              ) : (
                <AudioMutedOutlined
                  style={{ paddingLeft: '2px' }}
                  onClick={() => {
                    setListening(true);
                    startSpeechToText().catch((e) => {
                      showError('Error: ' + e.toString());
                    });
                  }}
                />
              )}
            </>
          )}
        </Space>
        <TextArea
          disabled={listening}
          rows={6}
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
          }}
        />
        <Space>
          {t('projectPanel.AIModel', lang) + ':'}
          <Select
            value={aIModel}
            style={{ width: '160px', marginRight: '10px' }}
            onChange={(value) => {
              setCommonStore((state) => {
                state.projectState.aIModel = value;
              });
            }}
            options={[{ value: AI_MODELS_NAME['Claude Sonnet-4.5'], label: 'Claude Sonnet-4.5' }, ...testModels]}
          />

          {aIModel === AI_MODELS_NAME['OpenAI o4-mini'] && (
            <>
              {t('projectPanel.ReasoningEffort', lang) + ':'}
              <Select
                value={reasoningEffort}
                style={{ width: '100px', marginRight: '10px' }}
                onChange={(value) => {
                  setCommonStore((state) => {
                    state.projectState.reasoningEffort = value;
                  });
                }}
                options={[
                  { value: 'low', label: t('word.Low', lang) },
                  { value: 'medium', label: t('word.Medium', lang) },
                  { value: 'high', label: t('word.High', lang) },
                ]}
              />
            </>
          )}
        </Space>

        <span style={{ fontSize: '12px' }}>
          <WarningOutlined /> {t('message.GeneratingUrbanDesignMayTakeAWhile', lang)}
        </span>
      </Space>
    </Modal>
  );
});

export default GenerateUrbanDesignModal;
