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
import { CuboidTexture, FoundationTexture, ObjectType, User } from 'src/types';
import { updateGenerateBuildingPrompt } from 'src/cloudProjectUtil';
import { Util } from '../Util';
import { AI_MODELS_NAME } from 'functions/src/callSolarPowerTowerAI';
import { callUrbanDesignClaudeAI, callUrbanDesignOpenAI } from 'functions/src/callUrbanDesignAI';
import { CuboidModel } from 'src/models/CuboidModel';
import { PrismModel } from 'src/models/PolygonCuboidModel';
import short from 'short-uuid';
import * as Constants from '../constants';
import {
  generateBuildings,
  generateCityRivers,
  generateLandmarkBuildings,
  generateRoads,
} from './generateUrbanDesignCity';
import { InstancedModel } from 'src/models/InstancedModel';
import { Color } from 'three';
import { FoundationModel } from 'src/models/FoundationModel';

export interface GenerateUrbanDesignProps {
  setDialogVisible: (visible: boolean) => void;
  isDialogVisible: () => boolean;
}

const { TextArea } = Input;

const GenerateUrbanDesignModal = React.memo(({ setDialogVisible, isDialogVisible }: GenerateUrbanDesignProps) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const reasoningEffort = useStore(Selector.reasoningEffort) ?? 'medium';
  const generateUrbanDesignPrompt =
    useStore(Selector.generateUrbanDesignPrompt) ?? 'Generate a city plan like Manhattan.';
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
    const city = json.city;

    useStore.getState().set((state) => {
      state.elements = [];

      if (world) {
        state.world.date = world.date ?? '06/22/2026, 12:00:00 PM';
        state.world.address = world.address ?? 'New York City, USA';
        state.world.latitude = world.latitude === undefined ? 40.7128 : world.latitude;
        state.world.longitude = world.longitude === undefined ? -74.006 : world.longitude;
      }

      // generate rivers
      if (city.rivers && city.rivers.length > 0) {
        const rivers = generateCityRivers(city.rivers);
        for (const river of rivers) {
          const polygonCuboid = {
            id: short.generate() as string,
            type: ObjectType.River,
            vertices: river.vertices.map((v: [number, number]) => ({ x: v[0], y: v[1] })),
            height: 0.75,
            color: '#5d97e7',
            transparency: 0,
          } as PrismModel;
          state.elements.push(polygonCuboid);
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
          height: 0.5,
          color: '#4a9700',
          transparency: 0,
        } as PrismModel;
        state.elements.push(prism);
      }

      // /** generate landmarks */
      const landmarks = generateLandmarkBuildings(city);
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
      const buildings = generateBuildings(city, landmarks);
      for (const building of buildings) {
        const [cx, cy] = building.center;
        const [lx, ly, lz] = building.size;

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

        maxX = Math.max(Math.abs(cx), maxX);
        maxY = Math.max(Math.abs(cy), maxY);
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
      // const result = `{"thinking":"Creating a Boston-style city plan. Boston is known for its irregular, organic street pattern that evolved from colonial-era cow paths and historical development, unlike the grid patterns of newer American cities. Key features: 1) Irregular, winding streets especially in older areas like Beacon Hill and North End, 2) Boston Common and Public Garden as central green spaces, 3) Charles River on the north side, 4) Boston Harbor on the east, 5) Back Bay area with more regular grid pattern (filled land), 6) Mix of colonial brick buildings and modern towers in Financial District, 7) Narrow winding streets in historic neighborhoods. I'll create an organic road network with winding streets, include the Charles River, Boston Harbor, Boston Common, and various neighborhoods with different characteristics - historic areas with cluster layout, Back Bay with grid, and downtown with taller modern buildings.","world":{"date":"06/22/2025, 12:00:00 PM","address":"Boston, Massachusetts, USA","latitude":42.3601,"longitude":-71.0589},"city":{"rivers":[{"vertices":[[-1000,600],[-1000,1000],[1000,1000],[1000,550],[700,500],[300,580],[-200,520],[-600,600]]},{"vertices":[[700,-1000],[1000,-1000],[1000,300],[900,250],[850,0],[880,-300],[820,-600],[750,-900]]}],"roads":{"nodes":[{"id":"n1","position":[-800,-800]},{"id":"n2","position":[-450,-820]},{"id":"n3","position":[-100,-780]},{"id":"n4","position":[250,-830]},{"id":"n5","position":[550,-750]},{"id":"n6","position":[-820,-500]},{"id":"n7","position":[-480,-450]},{"id":"n8","position":[-120,-480]},{"id":"n9","position":[220,-420]},{"id":"n10","position":[520,-470]},{"id":"n11","position":[-780,-180]},{"id":"n12","position":[-400,-150]},{"id":"n13","position":[-50,-200]},{"id":"n14","position":[280,-120]},{"id":"n15","position":[580,-180]},{"id":"n16","position":[-750,120]},{"id":"n17","position":[-380,150]},{"id":"n18","position":[0,100]},{"id":"n19","position":[350,80]},{"id":"n20","position":[620,50]},{"id":"n21","position":[-720,380]},{"id":"n22","position":[-350,420]},{"id":"n23","position":[50,360]},{"id":"n24","position":[400,320]},{"id":"n25","position":[650,280]},{"id":"c1","position":[-620,-700]},{"id":"c2","position":[-280,-750]},{"id":"c3","position":[80,-680]},{"id":"c4","position":[400,-720]},{"id":"c5","position":[-650,-320]},{"id":"c6","position":[-300,-340]},{"id":"c7","position":[80,-300]},{"id":"c8","position":[400,-280]},{"id":"c9","position":[-580,-30]},{"id":"c10","position":[-200,0]},{"id":"c11","position":[170,-20]},{"id":"c12","position":[480,-40]},{"id":"c13","position":[-550,260]},{"id":"c14","position":[-150,280]},{"id":"c15","position":[230,220]},{"id":"c16","position":[530,180]},{"id":"w1","position":[-550,-580]},{"id":"w2","position":[-200,-420]},{"id":"w3","position":[150,-350]},{"id":"w4","position":[-450,-80]},{"id":"w5","position":[-100,50]},{"id":"w6","position":[250,150]}],"edges":[{"id":"e1","from":"n1","to":"c1","level":"1","points":[]},{"id":"e2","from":"c1","to":"n2","level":"1","points":[]},{"id":"e3","from":"n2","to":"c2","level":"1","points":[]},{"id":"e4","from":"c2","to":"n3","level":"1","points":[]},{"id":"e5","from":"n3","to":"c3","level":"1","points":[]},{"id":"e6","from":"c3","to":"n4","level":"1","points":[]},{"id":"e7","from":"n4","to":"c4","level":"1","points":[]},{"id":"e8","from":"c4","to":"n5","level":"1","points":[]},{"id":"e9","from":"n6","to":"c5","level":"1","points":[]},{"id":"e10","from":"c5","to":"n7","level":"1","points":[]},{"id":"e11","from":"n7","to":"c6","level":"1","points":[]},{"id":"e12","from":"c6","to":"n8","level":"1","points":[]},{"id":"e13","from":"n8","to":"c7","level":"1","points":[]},{"id":"e14","from":"c7","to":"n9","level":"1","points":[]},{"id":"e15","from":"n9","to":"c8","level":"1","points":[]},{"id":"e16","from":"c8","to":"n10","level":"1","points":[]},{"id":"e17","from":"n11","to":"c9","level":"1","points":[]},{"id":"e18","from":"c9","to":"n12","level":"1","points":[]},{"id":"e19","from":"n12","to":"c10","level":"1","points":[]},{"id":"e20","from":"c10","to":"n13","level":"1","points":[]},{"id":"e21","from":"n13","to":"c11","level":"1","points":[]},{"id":"e22","from":"c11","to":"n14","level":"1","points":[]},{"id":"e23","from":"n14","to":"c12","level":"1","points":[]},{"id":"e24","from":"c12","to":"n15","level":"1","points":[]},{"id":"e25","from":"n16","to":"c13","level":"1","points":[]},{"id":"e26","from":"c13","to":"n17","level":"1","points":[]},{"id":"e27","from":"n17","to":"c14","level":"1","points":[]},{"id":"e28","from":"c14","to":"n18","level":"1","points":[]},{"id":"e29","from":"n18","to":"c15","level":"1","points":[]},{"id":"e30","from":"c15","to":"n19","level":"1","points":[]},{"id":"e31","from":"n19","to":"c16","level":"1","points":[]},{"id":"e32","from":"c16","to":"n20","level":"1","points":[]},{"id":"e33","from":"n21","to":"n22","level":"1","points":[]},{"id":"e34","from":"n22","to":"n23","level":"1","points":[]},{"id":"e35","from":"n23","to":"n24","level":"1","points":[]},{"id":"e36","from":"n24","to":"n25","level":"1","points":[]},{"id":"e37","from":"n1","to":"n6","level":"1","points":[]},{"id":"e38","from":"n6","to":"n11","level":"1","points":[]},{"id":"e39","from":"n11","to":"n16","level":"1","points":[]},{"id":"e40","from":"n16","to":"n21","level":"1","points":[]},{"id":"e41","from":"n2","to":"n7","level":"1","points":[]},{"id":"e42","from":"n7","to":"n12","level":"1","points":[]},{"id":"e43","from":"n12","to":"n17","level":"1","points":[]},{"id":"e44","from":"n17","to":"n22","level":"1","points":[]},{"id":"e45","from":"n3","to":"n8","level":"1","points":[]},{"id":"e46","from":"n8","to":"n13","level":"1","points":[]},{"id":"e47","from":"n13","to":"n18","level":"1","points":[]},{"id":"e48","from":"n18","to":"n23","level":"1","points":[]},{"id":"e49","from":"n4","to":"n9","level":"1","points":[]},{"id":"e50","from":"n9","to":"n14","level":"1","points":[]},{"id":"e51","from":"n14","to":"n19","level":"1","points":[]},{"id":"e52","from":"n19","to":"n24","level":"1","points":[]},{"id":"e53","from":"n5","to":"n10","level":"1","points":[]},{"id":"e54","from":"n10","to":"n15","level":"1","points":[]},{"id":"e55","from":"n15","to":"n20","level":"1","points":[]},{"id":"e56","from":"n20","to":"n25","level":"1","points":[]},{"id":"e57","from":"c1","to":"w1","level":"2","points":[]},{"id":"e58","from":"w1","to":"c5","level":"2","points":[]},{"id":"e59","from":"c5","to":"c9","level":"2","points":[]},{"id":"e60","from":"c9","to":"c13","level":"2","points":[]},{"id":"e61","from":"c2","to":"c6","level":"2","points":[]},{"id":"e62","from":"c6","to":"c10","level":"2","points":[]},{"id":"e63","from":"c10","to":"c14","level":"2","points":[]},{"id":"e64","from":"c3","to":"c7","level":"2","points":[]},{"id":"e65","from":"c7","to":"c11","level":"2","points":[]},{"id":"e66","from":"c11","to":"c15","level":"2","points":[]},{"id":"e67","from":"c4","to":"c8","level":"2","points":[]},{"id":"e68","from":"c8","to":"c12","level":"2","points":[]},{"id":"e69","from":"c12","to":"c16","level":"2","points":[]},{"id":"e70","from":"n7","to":"w1","level":"2","points":[]},{"id":"e71","from":"w1","to":"n8","level":"2","points":[]},{"id":"e72","from":"n8","to":"w2","level":"2","points":[]},{"id":"e73","from":"w2","to":"n9","level":"2","points":[]},{"id":"e74","from":"n9","to":"w3","level":"2","points":[]},{"id":"e75","from":"w3","to":"n10","level":"2","points":[]},{"id":"e76","from":"n12","to":"w4","level":"2","points":[]},{"id":"e77","from":"w4","to":"n13","level":"2","points":[]},{"id":"e78","from":"n13","to":"w5","level":"2","points":[]},{"id":"e79","from":"w5","to":"n18","level":"2","points":[]},{"id":"e80","from":"n18","to":"w6","level":"2","points":[]},{"id":"e81","from":"w6","to":"n19","level":"2","points":[]}]},"parks":[{"vertices":[[-500,80],[-500,380],[-150,380],[-150,80]]},{"vertices":[[-150,80],[-150,320],[120,320],[120,80]]},{"vertices":[[-800,300],[-800,500],[-600,500],[-600,300]]}],"zones":[{"boundary":[[-800,-820],[-450,-820],[-450,-500],[-800,-500]],"length":[12,24],"width":[10,20],"height":[14,38],"layout":"cluster","coverage":0.38,"color":"#8B4513"},{"boundary":[[-450,-820],[-100,-820],[-100,-480],[-450,-480]],"length":[13,26],"width":[10,21],"height":[16,42],"layout":"cluster","coverage":0.4,"color":"#A0522D"},{"boundary":[[-100,-780],[250,-780],[250,-420],[-100,-420]],"length":[14,28],"width":[11,23],"height":[20,52],"layout":"cluster","coverage":0.43,"color":"#8B5A2B"},{"boundary":[[250,-830],[550,-830],[550,-470],[250,-470]],"length":[16,32],"width":[13,26],"height":[35,90],"layout":"grid","coverage":0.5,"color":"#5A5A5A"},{"boundary":[[-820,-500],[-480,-500],[-480,-180],[-820,-180]],"length":[11,22],"width":[9,18],"height":[12,32],"layout":"cluster","coverage":0.35,"color":"#9A7B5A"},{"boundary":[[-480,-450],[-120,-450],[-120,-200],[-480,-200]],"length":[13,26],"width":[11,22],"height":[18,48],"layout":"cluster","coverage":0.42,"color":"#7A5A3A"},{"boundary":[[-120,-480],[220,-480],[220,-120],[-120,-120]],"length":[18,36],"width":[14,30],"height":[50,140],"layout":"grid","coverage":0.55,"color":"#3D3D3D"},{"boundary":[[220,-420],[520,-420],[520,-180],[220,-180]],"length":[20,42],"width":[16,34],"height":[70,180],"layout":"grid","coverage":0.58,"color":"#333333"},{"boundary":[[-780,-180],[-400,-180],[-400,120],[-780,120]],"length":[12,24],"width":[10,20],"height":[15,40],"layout":"cluster","coverage":0.38,"color":"#8A6A4A"},{"boundary":[[120,-200],[280,-200],[280,80],[120,80]],"length":[20,40],"width":[16,34],"height":[80,200],"layout":"grid","coverage":0.6,"color":"#2D2D2D"},{"boundary":[[280,-120],[580,-120],[580,50],[280,50]],"length":[22,46],"width":[18,38],"height":[100,260],"layout":"grid","coverage":0.62,"color":"#282828"},{"boundary":[[-720,120],[-500,120],[-500,380],[-720,380]],"length":[14,28],"width":[11,24],"height":[20,55],"layout":"perimeter","coverage":0.45,"color":"#7B5B3B"},{"boundary":[[120,80],[400,80],[400,320],[120,320]],"length":[16,34],"width":[13,28],"height":[35,95],"layout":"grid","coverage":0.5,"color":"#4A4A4A"},{"boundary":[[400,80],[620,80],[620,280],[400,280]],"length":[18,38],"width":[15,32],"height":[45,120],"layout":"grid","coverage":0.52,"color":"#424242"},{"boundary":[[-720,380],[-350,380],[-350,550],[-720,550]],"length":[13,26],"width":[10,22],"height":[18,48],"layout":"perimeter","coverage":0.42,"color":"#6B4B2B"},{"boundary":[[-350,320],[50,320],[50,500],[-350,500]],"length":[14,30],"width":[12,25],"height":[22,60],"layout":"cluster","coverage":0.44,"color":"#7A5A3A"},{"boundary":[[50,360],[400,360],[400,500],[50,500]],"length":[15,32],"width":[12,26],"height":[28,75],"layout":"grid","coverage":0.48,"color":"#555555"}],"landmarks":[{"center":[420,-280],"size":[48,48,228],"rotation":0.08},{"center":[180,-320],"size":[42,42,165],"rotation":0},{"center":[500,-50],"size":[45,45,195],"rotation":0.05},{"center":[350,180],"size":[38,38,110],"rotation":0.1},{"center":[-50,-350],"size":[35,50,85],"rotation":0.25},{"center":[-350,-600],"size":[22,35,40],"rotation":0.3},{"center":[-650,-350],"size":[18,30,32],"rotation":0.2},{"center":[-550,450],"size":[30,30,55],"rotation":0}]}}`;
      // const result = `{"thinking":"Creating a Manhattan-style city plan. Manhattan is a long narrow island with rivers on both sides (Hudson River on west, East River on east). Key features: 1) Grid street pattern with avenues running north-south and streets running east-west, 2) Broadway cutting diagonally, 3) Central Park in the upper middle area, 4) Financial district in the south, 5) Midtown with tall buildings, 6) Various neighborhoods. I'll place rivers on east and west sides running north-south, create a strong grid road network, include Central Park, Broadway diagonal, and multiple zones with perimeter layout as requested. Landmarks will include Empire State Building area, One World Trade Center area, Chrysler Building area, etc.","world":{"date":"06/22/2025, 12:00:00 PM","address":"Manhattan, New York City, USA","latitude":40.7831,"longitude":-73.9712},"city":{"rivers":[{"vertices":[[-1000,-1000],[-920,-1000],[-900,-700],[-880,-400],[-870,-100],[-880,200],[-890,500],[-900,800],[-920,1000],[-1000,1000]]},{"vertices":[[1000,-1000],[920,-1000],[900,-700],[910,-400],[900,-100],[910,200],[900,500],[920,800],[940,1000],[1000,1000]]}],"roads":{"nodes":[{"id":"n1","position":[-850,-900]},{"id":"n2","position":[-400,-900]},{"id":"n3","position":[0,-900]},{"id":"n4","position":[400,-900]},{"id":"n5","position":[850,-900]},{"id":"n6","position":[-850,-600]},{"id":"n7","position":[-400,-600]},{"id":"n8","position":[0,-600]},{"id":"n9","position":[400,-600]},{"id":"n10","position":[850,-600]},{"id":"n11","position":[-850,-300]},{"id":"n12","position":[-400,-300]},{"id":"n13","position":[0,-300]},{"id":"n14","position":[400,-300]},{"id":"n15","position":[850,-300]},{"id":"n16","position":[-850,0]},{"id":"n17","position":[-400,0]},{"id":"n18","position":[0,0]},{"id":"n19","position":[400,0]},{"id":"n20","position":[850,0]},{"id":"n21","position":[-850,300]},{"id":"n22","position":[-400,300]},{"id":"n23","position":[0,300]},{"id":"n24","position":[400,300]},{"id":"n25","position":[850,300]},{"id":"n26","position":[-850,600]},{"id":"n27","position":[-400,600]},{"id":"n28","position":[0,600]},{"id":"n29","position":[400,600]},{"id":"n30","position":[850,600]},{"id":"n31","position":[-850,900]},{"id":"n32","position":[-400,900]},{"id":"n33","position":[0,900]},{"id":"n34","position":[400,900]},{"id":"n35","position":[850,900]},{"id":"n36","position":[-200,-900]},{"id":"n37","position":[200,-900]},{"id":"n38","position":[-200,-600]},{"id":"n39","position":[200,-600]},{"id":"n40","position":[-200,-300]},{"id":"n41","position":[200,-300]},{"id":"n42","position":[-200,0]},{"id":"n43","position":[200,0]},{"id":"n44","position":[-200,300]},{"id":"n45","position":[200,300]},{"id":"n46","position":[-200,600]},{"id":"n47","position":[200,600]},{"id":"n48","position":[-200,900]},{"id":"n49","position":[200,900]},{"id":"n50","position":[-600,-900]},{"id":"n51","position":[600,-900]},{"id":"n52","position":[-600,-600]},{"id":"n53","position":[600,-600]},{"id":"n54","position":[-600,-300]},{"id":"n55","position":[600,-300]},{"id":"n56","position":[-600,0]},{"id":"n57","position":[600,0]},{"id":"n58","position":[-600,300]},{"id":"n59","position":[600,300]},{"id":"n60","position":[-600,600]},{"id":"n61","position":[600,600]},{"id":"n62","position":[-600,900]},{"id":"n63","position":[600,900]},{"id":"b1","position":[-700,-850]},{"id":"b2","position":[-100,-450]},{"id":"b3","position":[300,150]},{"id":"b4","position":[700,750]}],"edges":[{"id":"e1","from":"n1","to":"n2","level":"1","points":[]},{"id":"e2","from":"n2","to":"n36","level":"1","points":[]},{"id":"e3","from":"n36","to":"n3","level":"1","points":[]},{"id":"e4","from":"n3","to":"n37","level":"1","points":[]},{"id":"e5","from":"n37","to":"n4","level":"1","points":[]},{"id":"e6","from":"n4","to":"n5","level":"1","points":[]},{"id":"e7","from":"n6","to":"n7","level":"1","points":[]},{"id":"e8","from":"n7","to":"n38","level":"1","points":[]},{"id":"e9","from":"n38","to":"n8","level":"1","points":[]},{"id":"e10","from":"n8","to":"n39","level":"1","points":[]},{"id":"e11","from":"n39","to":"n9","level":"1","points":[]},{"id":"e12","from":"n9","to":"n10","level":"1","points":[]},{"id":"e13","from":"n11","to":"n12","level":"1","points":[]},{"id":"e14","from":"n12","to":"n40","level":"1","points":[]},{"id":"e15","from":"n40","to":"n13","level":"1","points":[]},{"id":"e16","from":"n13","to":"n41","level":"1","points":[]},{"id":"e17","from":"n41","to":"n14","level":"1","points":[]},{"id":"e18","from":"n14","to":"n15","level":"1","points":[]},{"id":"e19","from":"n16","to":"n17","level":"1","points":[]},{"id":"e20","from":"n17","to":"n42","level":"1","points":[]},{"id":"e21","from":"n42","to":"n18","level":"1","points":[]},{"id":"e22","from":"n18","to":"n43","level":"1","points":[]},{"id":"e23","from":"n43","to":"n19","level":"1","points":[]},{"id":"e24","from":"n19","to":"n20","level":"1","points":[]},{"id":"e25","from":"n21","to":"n22","level":"1","points":[]},{"id":"e26","from":"n22","to":"n44","level":"1","points":[]},{"id":"e27","from":"n44","to":"n23","level":"1","points":[]},{"id":"e28","from":"n23","to":"n45","level":"1","points":[]},{"id":"e29","from":"n45","to":"n24","level":"1","points":[]},{"id":"e30","from":"n24","to":"n25","level":"1","points":[]},{"id":"e31","from":"n26","to":"n27","level":"1","points":[]},{"id":"e32","from":"n27","to":"n46","level":"1","points":[]},{"id":"e33","from":"n46","to":"n28","level":"1","points":[]},{"id":"e34","from":"n28","to":"n47","level":"1","points":[]},{"id":"e35","from":"n47","to":"n29","level":"1","points":[]},{"id":"e36","from":"n29","to":"n30","level":"1","points":[]},{"id":"e37","from":"n31","to":"n32","level":"1","points":[]},{"id":"e38","from":"n32","to":"n48","level":"1","points":[]},{"id":"e39","from":"n48","to":"n33","level":"1","points":[]},{"id":"e40","from":"n33","to":"n49","level":"1","points":[]},{"id":"e41","from":"n49","to":"n34","level":"1","points":[]},{"id":"e42","from":"n34","to":"n35","level":"1","points":[]},{"id":"e43","from":"n1","to":"n6","level":"1","points":[]},{"id":"e44","from":"n6","to":"n11","level":"1","points":[]},{"id":"e45","from":"n11","to":"n16","level":"1","points":[]},{"id":"e46","from":"n16","to":"n21","level":"1","points":[]},{"id":"e47","from":"n21","to":"n26","level":"1","points":[]},{"id":"e48","from":"n26","to":"n31","level":"1","points":[]},{"id":"e49","from":"n2","to":"n7","level":"1","points":[]},{"id":"e50","from":"n7","to":"n12","level":"1","points":[]},{"id":"e51","from":"n12","to":"n17","level":"1","points":[]},{"id":"e52","from":"n17","to":"n22","level":"1","points":[]},{"id":"e53","from":"n22","to":"n27","level":"1","points":[]},{"id":"e54","from":"n27","to":"n32","level":"1","points":[]},{"id":"e55","from":"n3","to":"n8","level":"1","points":[]},{"id":"e56","from":"n8","to":"n13","level":"1","points":[]},{"id":"e57","from":"n13","to":"n18","level":"1","points":[]},{"id":"e58","from":"n18","to":"n23","level":"1","points":[]},{"id":"e59","from":"n23","to":"n28","level":"1","points":[]},{"id":"e60","from":"n28","to":"n33","level":"1","points":[]},{"id":"e61","from":"n4","to":"n9","level":"1","points":[]},{"id":"e62","from":"n9","to":"n14","level":"1","points":[]},{"id":"e63","from":"n14","to":"n19","level":"1","points":[]},{"id":"e64","from":"n19","to":"n24","level":"1","points":[]},{"id":"e65","from":"n24","to":"n29","level":"1","points":[]},{"id":"e66","from":"n29","to":"n34","level":"1","points":[]},{"id":"e67","from":"n5","to":"n10","level":"1","points":[]},{"id":"e68","from":"n10","to":"n15","level":"1","points":[]},{"id":"e69","from":"n15","to":"n20","level":"1","points":[]},{"id":"e70","from":"n20","to":"n25","level":"1","points":[]},{"id":"e71","from":"n25","to":"n30","level":"1","points":[]},{"id":"e72","from":"n30","to":"n35","level":"1","points":[]},{"id":"e73","from":"n36","to":"n38","level":"1","points":[]},{"id":"e74","from":"n38","to":"n40","level":"1","points":[]},{"id":"e75","from":"n40","to":"n42","level":"1","points":[]},{"id":"e76","from":"n42","to":"n44","level":"1","points":[]},{"id":"e77","from":"n44","to":"n46","level":"1","points":[]},{"id":"e78","from":"n46","to":"n48","level":"1","points":[]},{"id":"e79","from":"n37","to":"n39","level":"1","points":[]},{"id":"e80","from":"n39","to":"n41","level":"1","points":[]},{"id":"e81","from":"n41","to":"n43","level":"1","points":[]},{"id":"e82","from":"n43","to":"n45","level":"1","points":[]},{"id":"e83","from":"n45","to":"n47","level":"1","points":[]},{"id":"e84","from":"n47","to":"n49","level":"1","points":[]},{"id":"e85","from":"n1","to":"n50","level":"2","points":[]},{"id":"e86","from":"n50","to":"n2","level":"2","points":[]},{"id":"e87","from":"n4","to":"n51","level":"2","points":[]},{"id":"e88","from":"n51","to":"n5","level":"2","points":[]},{"id":"e89","from":"n6","to":"n52","level":"2","points":[]},{"id":"e90","from":"n52","to":"n7","level":"2","points":[]},{"id":"e91","from":"n9","to":"n53","level":"2","points":[]},{"id":"e92","from":"n53","to":"n10","level":"2","points":[]},{"id":"e93","from":"n11","to":"n54","level":"2","points":[]},{"id":"e94","from":"n54","to":"n12","level":"2","points":[]},{"id":"e95","from":"n14","to":"n55","level":"2","points":[]},{"id":"e96","from":"n55","to":"n15","level":"2","points":[]},{"id":"e97","from":"n16","to":"n56","level":"2","points":[]},{"id":"e98","from":"n56","to":"n17","level":"2","points":[]},{"id":"e99","from":"n19","to":"n57","level":"2","points":[]},{"id":"e100","from":"n57","to":"n20","level":"2","points":[]},{"id":"e101","from":"n21","to":"n58","level":"2","points":[]},{"id":"e102","from":"n58","to":"n22","level":"2","points":[]},{"id":"e103","from":"n24","to":"n59","level":"2","points":[]},{"id":"e104","from":"n59","to":"n25","level":"2","points":[]},{"id":"e105","from":"n26","to":"n60","level":"2","points":[]},{"id":"e106","from":"n60","to":"n27","level":"2","points":[]},{"id":"e107","from":"n29","to":"n61","level":"2","points":[]},{"id":"e108","from":"n61","to":"n30","level":"2","points":[]},{"id":"e109","from":"n31","to":"n62","level":"2","points":[]},{"id":"e110","from":"n62","to":"n32","level":"2","points":[]},{"id":"e111","from":"n34","to":"n63","level":"2","points":[]},{"id":"e112","from":"n63","to":"n35","level":"2","points":[]},{"id":"e113","from":"n50","to":"n52","level":"2","points":[]},{"id":"e114","from":"n52","to":"n54","level":"2","points":[]},{"id":"e115","from":"n54","to":"n56","level":"2","points":[]},{"id":"e116","from":"n56","to":"n58","level":"2","points":[]},{"id":"e117","from":"n58","to":"n60","level":"2","points":[]},{"id":"e118","from":"n60","to":"n62","level":"2","points":[]},{"id":"e119","from":"n51","to":"n53","level":"2","points":[]},{"id":"e120","from":"n53","to":"n55","level":"2","points":[]},{"id":"e121","from":"n55","to":"n57","level":"2","points":[]},{"id":"e122","from":"n57","to":"n59","level":"2","points":[]},{"id":"e123","from":"n59","to":"n61","level":"2","points":[]},{"id":"e124","from":"n61","to":"n63","level":"2","points":[]},{"id":"broadway1","from":"n1","to":"b1","level":"1","points":[]},{"id":"broadway2","from":"b1","to":"n7","level":"1","points":[]},{"id":"broadway3","from":"n7","to":"b2","level":"1","points":[]},{"id":"broadway4","from":"b2","to":"n13","level":"1","points":[]},{"id":"broadway5","from":"n13","to":"b3","level":"1","points":[]},{"id":"broadway6","from":"b3","to":"n24","level":"1","points":[]},{"id":"broadway7","from":"n24","to":"b4","level":"1","points":[]},{"id":"broadway8","from":"b4","to":"n35","level":"1","points":[]}]},"parks":[{"vertices":[[-350,350],[-350,850],[350,850],[350,350]]}],"zones":[{"boundary":[[-850,-900],[-400,-900],[-400,-600],[-850,-600]],"length":[20,40],"width":[15,30],"height":[80,200],"layout":"perimeter","coverage":0.55,"color":"#4A4A4A"},{"boundary":[[-400,-900],[0,-900],[0,-600],[-400,-600]],"length":[18,35],"width":[12,25],"height":[60,150],"layout":"perimeter","coverage":0.5,"color":"#5C5C5C"},{"boundary":[[0,-900],[400,-900],[400,-600],[0,-600]],"length":[18,35],"width":[12,25],"height":[60,150],"layout":"perimeter","coverage":0.5,"color":"#525252"},{"boundary":[[400,-900],[850,-900],[850,-600],[400,-600]],"length":[20,40],"width":[15,30],"height":[70,180],"layout":"perimeter","coverage":0.55,"color":"#484848"},{"boundary":[[-850,-600],[-400,-600],[-400,-300],[-850,-300]],"length":[15,30],"width":[12,25],"height":[40,100],"layout":"perimeter","coverage":0.45,"color":"#6B6B6B"},{"boundary":[[-400,-600],[0,-600],[0,-300],[-400,-300]],"length":[15,30],"width":[12,25],"height":[50,120],"layout":"perimeter","coverage":0.5,"color":"#5E5E5E"},{"boundary":[[0,-600],[400,-600],[400,-300],[0,-300]],"length":[15,30],"width":[12,25],"height":[50,120],"layout":"perimeter","coverage":0.5,"color":"#606060"},{"boundary":[[400,-600],[850,-600],[850,-300],[400,-300]],"length":[15,30],"width":[12,25],"height":[40,100],"layout":"perimeter","coverage":0.45,"color":"#686868"},{"boundary":[[-850,-300],[-400,-300],[-400,0],[-850,0]],"length":[20,45],"width":[15,35],"height":[100,280],"layout":"perimeter","coverage":0.6,"color":"#3C3C3C"},{"boundary":[[-400,-300],[0,-300],[0,0],[-400,0]],"length":[25,50],"width":[18,40],"height":[150,350],"layout":"perimeter","coverage":0.65,"color":"#2F2F2F"},{"boundary":[[0,-300],[400,-300],[400,0],[0,0]],"length":[25,50],"width":[18,40],"height":[150,350],"layout":"perimeter","coverage":0.65,"color":"#333333"},{"boundary":[[400,-300],[850,-300],[850,0],[400,0]],"length":[20,45],"width":[15,35],"height":[100,280],"layout":"perimeter","coverage":0.6,"color":"#3A3A3A"},{"boundary":[[-850,0],[-400,0],[-400,300],[-850,300]],"length":[18,35],"width":[14,28],"height":[60,150],"layout":"perimeter","coverage":0.5,"color":"#555555"},{"boundary":[[-400,0],[0,0],[0,300],[-400,300]],"length":[20,40],"width":[15,30],"height":[80,200],"layout":"perimeter","coverage":0.55,"color":"#4D4D4D"},{"boundary":[[0,0],[400,0],[400,300],[0,300]],"length":[20,40],"width":[15,30],"height":[80,200],"layout":"perimeter","coverage":0.55,"color":"#505050"},{"boundary":[[400,0],[850,0],[850,300],[400,300]],"length":[18,35],"width":[14,28],"height":[60,150],"layout":"perimeter","coverage":0.5,"color":"#585858"},{"boundary":[[-850,300],[-400,300],[-400,600],[-850,600]],"length":[15,30],"width":[12,22],"height":[30,80],"layout":"perimeter","coverage":0.4,"color":"#707070"},{"boundary":[[400,300],[850,300],[850,600],[400,600]],"length":[15,30],"width":[12,22],"height":[30,80],"layout":"perimeter","coverage":0.4,"color":"#6E6E6E"},{"boundary":[[-850,600],[-400,600],[-400,900],[-850,900]],"length":[12,25],"width":[10,20],"height":[20,60],"layout":"perimeter","coverage":0.35,"color":"#787878"},{"boundary":[[-400,850],[350,850],[350,900],[-400,900]],"length":[12,25],"width":[10,20],"height":[25,70],"layout":"perimeter","coverage":0.35,"color":"#757575"},{"boundary":[[400,600],[850,600],[850,900],[400,900]],"length":[12,25],"width":[10,20],"height":[20,60],"layout":"perimeter","coverage":0.35,"color":"#7A7A7A"}],"landmarks":[{"center":[-100,-150],"size":[60,60,380],"rotation":0},{"center":[150,-200],"size":[50,50,320],"rotation":0.05},{"center":[-250,-100],"size":[45,45,280],"rotation":0},{"center":[50,-50],"size":[55,55,300],"rotation":0.1},{"center":[300,-150],"size":[40,40,250],"rotation":0},{"center":[-150,-400],"size":[70,70,420],"rotation":0},{"center":[200,-500],"size":[50,50,200],"rotation":0.08},{"center":[-50,100],"size":[45,45,220],"rotation":0},{"center":[100,-700],"size":[80,80,350],"rotation":0.02},{"center":[-300,-750],"size":[55,55,180],"rotation":0}]}}`;
      // const result = `{"thinking":"Boston is a historic American city with a famously irregular street pattern, unlike the grid systems of many US cities. Key features include: 1) The Charles River separating Boston from Cambridge, curving through the north. 2) Boston Harbor to the east. 3) The Boston Common and Public Garden - America's oldest public park. 4) Historic neighborhoods like Beacon Hill, Back Bay, North End, South End. 5) Irregular, winding streets that follow old cow paths and colonial-era roads. 6) The Freedom Trail connecting historic sites. 7) Prominent landmarks like the State House with its gold dome, Faneuil Hall, Old North Church. I'll create a layout that captures Boston's organic street pattern, the Charles River curving along the north, some waterfront to the east, the Common/Public Garden in the center-west area, and various distinct neighborhoods with different building characteristics.","world":{"date":"06/22/2025, 12:00:00 PM","address":"Boston, Massachusetts, USA","latitude":42.3601,"longitude":-71.0589},"city":{"rivers":[{"vertices":[[-1000,600],[-800,650],[-500,700],[-200,720],[100,680],[400,620],[700,580],[1000,550],[1000,700],[-1000,700]]}],"roads":{"nodes":[{"id":"n1","position":[-800,400]},{"id":"n2","position":[-500,350]},{"id":"n3","position":[-200,300]},{"id":"n4","position":[100,280]},{"id":"n5","position":[400,250]},{"id":"n6","position":[700,200]},{"id":"n7","position":[-600,100]},{"id":"n8","position":[-300,50]},{"id":"n9","position":[0,0]},{"id":"n10","position":[300,-50]},{"id":"n11","position":[600,-100]},{"id":"n12","position":[-700,-200]},{"id":"n13","position":[-400,-250]},{"id":"n14","position":[-100,-300]},{"id":"n15","position":[200,-350]},{"id":"n16","position":[500,-400]},{"id":"n17","position":[800,-300]},{"id":"n18","position":[-500,-500]},{"id":"n19","position":[-150,-550]},{"id":"n20","position":[150,-600]},{"id":"n21","position":[450,-650]},{"id":"n22","position":[750,-550]},{"id":"n23","position":[-800,-700]},{"id":"n24","position":[-400,-750]},{"id":"n25","position":[0,-800]},{"id":"n26","position":[400,-850]},{"id":"n27","position":[800,-750]},{"id":"n28","position":[-900,200]},{"id":"n29","position":[900,50]},{"id":"n30","position":[-600,500]},{"id":"n31","position":[-200,480]},{"id":"n32","position":[200,450]},{"id":"n33","position":[500,400]},{"id":"n34","position":[850,350]},{"id":"n35","position":[-350,200]},{"id":"n36","position":[50,150]},{"id":"n37","position":[-250,-150]},{"id":"n38","position":[100,-180]},{"id":"n39","position":[400,-200]},{"id":"n40","position":[-650,-450]},{"id":"n41","position":[300,-500]},{"id":"n42","position":[650,-400]},{"id":"n43","position":[-100,-700]},{"id":"n44","position":[250,-720]},{"id":"n45","position":[600,-700]}],"edges":[{"id":"e1","from":"n1","to":"n2","level":"1","points":[[-650,380]]},{"id":"e2","from":"n2","to":"n3","level":"1","points":[[-350,320]]},{"id":"e3","from":"n3","to":"n4","level":"1","points":[[-50,285]]},{"id":"e4","from":"n4","to":"n5","level":"1","points":[[250,260]]},{"id":"e5","from":"n5","to":"n6","level":"1","points":[[550,220]]},{"id":"e6","from":"n7","to":"n8","level":"1","points":[[-450,70]]},{"id":"e7","from":"n8","to":"n9","level":"1","points":[[-150,20]]},{"id":"e8","from":"n9","to":"n10","level":"1","points":[[150,-30]]},{"id":"e9","from":"n10","to":"n11","level":"1","points":[[450,-80]]},{"id":"e10","from":"n12","to":"n13","level":"1","points":[[-550,-230]]},{"id":"e11","from":"n13","to":"n14","level":"1","points":[[-250,-280]]},{"id":"e12","from":"n14","to":"n15","level":"1","points":[[50,-330]]},{"id":"e13","from":"n15","to":"n16","level":"1","points":[[350,-380]]},{"id":"e14","from":"n16","to":"n17","level":"1","points":[[650,-350]]},{"id":"e15","from":"n18","to":"n19","level":"1","points":[[-325,-530]]},{"id":"e16","from":"n19","to":"n20","level":"1","points":[[0,-580]]},{"id":"e17","from":"n20","to":"n21","level":"1","points":[[300,-630]]},{"id":"e18","from":"n21","to":"n22","level":"1","points":[[600,-600]]},{"id":"e19","from":"n23","to":"n24","level":"1","points":[[-600,-730]]},{"id":"e20","from":"n24","to":"n25","level":"1","points":[[-200,-780]]},{"id":"e21","from":"n25","to":"n26","level":"1","points":[[200,-830]]},{"id":"e22","from":"n26","to":"n27","level":"1","points":[[600,-800]]},{"id":"e23","from":"n28","to":"n1","level":"1","points":[[-850,300]]},{"id":"e24","from":"n1","to":"n7","level":"1","points":[[-720,250]]},{"id":"e25","from":"n7","to":"n12","level":"1","points":[[-660,-50]]},{"id":"e26","from":"n12","to":"n18","level":"1","points":[[-620,-350]]},{"id":"e27","from":"n18","to":"n23","level":"1","points":[[-650,-600]]},{"id":"e28","from":"n2","to":"n35","level":"1","points":[[-420,280]]},{"id":"e29","from":"n35","to":"n8","level":"1","points":[[-320,130]]},{"id":"e30","from":"n8","to":"n37","level":"1","points":[[-280,-50]]},{"id":"e31","from":"n37","to":"n13","level":"1","points":[[-320,-200]]},{"id":"e32","from":"n13","to":"n40","level":"1","points":[[-520,-350]]},{"id":"e33","from":"n40","to":"n24","level":"1","points":[[-530,-600]]},{"id":"e34","from":"n3","to":"n36","level":"1","points":[[-80,220]]},{"id":"e35","from":"n36","to":"n9","level":"1","points":[[30,80]]},{"id":"e36","from":"n9","to":"n38","level":"1","points":[[50,-90]]},{"id":"e37","from":"n38","to":"n14","level":"1","points":[[0,-240]]},{"id":"e38","from":"n14","to":"n19","level":"1","points":[[-130,-420]]},{"id":"e39","from":"n19","to":"n43","level":"1","points":[[-120,-630]]},{"id":"e40","from":"n43","to":"n25","level":"1","points":[[-50,-750]]},{"id":"e41","from":"n4","to":"n36","level":"2","points":[[80,210]]},{"id":"e42","from":"n36","to":"n38","level":"2","points":[[80,-20]]},{"id":"e43","from":"n38","to":"n15","level":"2","points":[[150,-270]]},{"id":"e44","from":"n15","to":"n41","level":"2","points":[[250,-430]]},{"id":"e45","from":"n41","to":"n20","level":"2","points":[[220,-550]]},{"id":"e46","from":"n20","to":"n44","level":"2","points":[[200,-660]]},{"id":"e47","from":"n44","to":"n25","level":"2","points":[[130,-760]]},{"id":"e48","from":"n5","to":"n39","level":"1","points":[[400,20]]},{"id":"e49","from":"n39","to":"n10","level":"2","points":[[350,-120]]},{"id":"e50","from":"n10","to":"n16","level":"1","points":[[400,-220]]},{"id":"e51","from":"n16","to":"n42","level":"1","points":[[580,-400]]},{"id":"e52","from":"n42","to":"n21","level":"2","points":[[550,-530]]},{"id":"e53","from":"n21","to":"n45","level":"2","points":[[530,-680]]},{"id":"e54","from":"n45","to":"n26","level":"2","points":[[500,-780]]},{"id":"e55","from":"n6","to":"n11","level":"1","points":[[660,50]]},{"id":"e56","from":"n11","to":"n17","level":"1","points":[[720,-200]]},{"id":"e57","from":"n17","to":"n22","level":"1","points":[[780,-430]]},{"id":"e58","from":"n22","to":"n27","level":"1","points":[[780,-650]]},{"id":"e59","from":"n6","to":"n29","level":"1","points":[[800,120]]},{"id":"e60","from":"n29","to":"n34","level":"2","points":[[880,200]]},{"id":"e61","from":"n30","to":"n1","level":"2","points":[[-700,450]]},{"id":"e62","from":"n30","to":"n31","level":"2","points":[[-400,490]]},{"id":"e63","from":"n31","to":"n2","level":"2","points":[[-350,410]]},{"id":"e64","from":"n31","to":"n32","level":"2","points":[[0,465]]},{"id":"e65","from":"n32","to":"n4","level":"2","points":[[150,360]]},{"id":"e66","from":"n32","to":"n33","level":"2","points":[[350,425]]},{"id":"e67","from":"n33","to":"n5","level":"2","points":[[450,320]]},{"id":"e68","from":"n33","to":"n34","level":"2","points":[[680,375]]},{"id":"e69","from":"n34","to":"n6","level":"2","points":[[780,275]]},{"id":"e70","from":"n35","to":"n37","level":"2","points":[[-300,25]]},{"id":"e71","from":"n37","to":"n40","level":"2","points":[[-450,-300]]},{"id":"e72","from":"n38","to":"n39","level":"2","points":[[250,-190]]},{"id":"e73","from":"n39","to":"n11","level":"2","points":[[500,-100]]},{"id":"e74","from":"n41","to":"n42","level":"2","points":[[480,-450]]},{"id":"e75","from":"n44","to":"n45","level":"2","points":[[420,-710]]}]},"parks":[{"vertices":[[-550,180],[-420,200],[-380,280],[-400,380],[-480,400],[-580,350],[-600,250]]},{"vertices":[[-380,50],[-280,80],[-250,150],[-300,220],[-380,200],[-420,120]]},{"vertices":[[500,-550],[600,-520],[650,-580],[620,-680],[530,-700],[480,-630]]},{"vertices":[[-750,-350],[-650,-320],[-600,-400],[-680,-480],[-780,-450]]}],"zones":[{"boundary":[[-800,400],[-500,350],[-420,280],[-550,180],[-600,250],[-580,350],[-600,500],[-800,600]],"length":[12,25],"width":[10,18],"height":[15,35],"layout":"perimeter","coverage":0.45,"color":"#8B4513"},{"boundary":[[-500,350],[-200,300],[100,280],[-80,220],[-300,220],[-380,280],[-420,280]],"length":[15,30],"width":[12,22],"height":[20,50],"layout":"cluster","coverage":0.5,"color":"#CD853F"},{"boundary":[[100,280],[400,250],[500,400],[200,450],[50,150]],"length":[20,40],"width":[15,30],"height":[40,100],"layout":"grid","coverage":0.55,"color":"#696969"},{"boundary":[[400,250],[700,200],[850,350],[500,400]],"length":[18,35],"width":[14,28],"height":[30,80],"layout":"grid","coverage":0.5,"color":"#708090"},{"boundary":[[-600,100],[-300,50],[0,0],[-150,20],[-350,200],[-420,120],[-380,50]],"length":[10,20],"width":[8,16],"height":[12,30],"layout":"cluster","coverage":0.4,"color":"#A0522D"},{"boundary":[[0,0],[300,-50],[400,-200],[100,-180],[50,-90]],"length":[25,45],"width":[18,35],"height":[60,150],"layout":"grid","coverage":0.6,"color":"#4A4A4A"},{"boundary":[[300,-50],[600,-100],[720,-200],[500,-400],[400,-200]],"length":[20,38],"width":[15,28],"height":[45,120],"layout":"grid","coverage":0.55,"color":"#5A5A5A"},{"boundary":[[-700,-200],[-400,-250],[-250,-150],[-300,50],[-450,70],[-660,-50]],"length":[12,22],"width":[10,18],"height":[15,40],"layout":"perimeter","coverage":0.42,"color":"#8B7355"},{"boundary":[[-400,-250],[-100,-300],[-130,-420],[-320,-200]],"length":[14,26],"width":[11,20],"height":[18,45],"layout":"cluster","coverage":0.48,"color":"#9C8B7A"},{"boundary":[[-100,-300],[200,-350],[250,-430],[150,-430],[-130,-420]],"length":[16,30],"width":[12,24],"height":[25,60],"layout":"grid","coverage":0.52,"color":"#7A7A7A"},{"boundary":[[200,-350],[500,-400],[580,-400],[400,-200]],"length":[22,42],"width":[16,32],"height":[50,130],"layout":"grid","coverage":0.58,"color":"#606060"},{"boundary":[[500,-400],[800,-300],[780,-430],[650,-400]],"length":[18,34],"width":[14,26],"height":[35,90],"layout":"perimeter","coverage":0.45,"color":"#6B6B6B"},{"boundary":[[-650,-450],[-500,-500],[-325,-530],[-400,-750],[-650,-600],[-780,-450]],"length":[10,18],"width":[8,15],"height":[10,25],"layout":"cluster","coverage":0.35,"color":"#A67B5B"},{"boundary":[[-325,-530],[-150,-550],[0,-580],[-120,-630],[-200,-780],[-400,-750]],"length":[12,22],"width":[10,18],"height":[15,35],"layout":"perimeter","coverage":0.4,"color":"#997B66"},{"boundary":[[0,-580],[150,-600],[300,-500],[300,-630],[200,-660],[130,-760],[-50,-750],[-120,-630]],"length":[14,25],"width":[11,20],"height":[18,42],"layout":"grid","coverage":0.45,"color":"#8A7B6B"},{"boundary":[[300,-500],[450,-650],[530,-700],[600,-700],[650,-400],[500,-550]],"length":[16,28],"width":[12,22],"height":[22,55],"layout":"cluster","coverage":0.42,"color":"#7B7B7B"},{"boundary":[[600,-700],[750,-550],[800,-750],[600,-800],[500,-780]],"length":[15,26],"width":[12,20],"height":[20,50],"layout":"perimeter","coverage":0.38,"color":"#8B8B8B"}],"landmarks":[{"center":[180,50],"size":[60,50,180],"rotation":0.15},{"center":[-480,320],"size":[40,35,45],"rotation":-0.1},{"center":[550,320],"size":[55,45,140],"rotation":0.08},{"center":[50,-250],"size":[45,40,95],"rotation":-0.05},{"center":[450,-320],"size":[70,55,200],"rotation":0.12},{"center":[-350,-380],"size":[35,30,50],"rotation":0.2},{"center":[700,-180],"size":[50,45,110],"rotation":-0.08},{"center":[-150,400],"size":[40,35,65],"rotation":0.1},{"center":[300,-700],"size":[45,38,75],"rotation":-0.15}]}}`;
      // const result = `{"thinking":"London is characterized by the River Thames flowing west to east through the city, with iconic landmarks like the Tower of London, Big Ben, St Paul's Cathedral, and the London Eye. The city has an organic, medieval street pattern in the center (City of London) with more planned areas in the West End. Key features: 1) River Thames curving through the city from west to east, 2) Historic core with irregular streets, 3) Major roads radiating from center, 4) Hyde Park and other green spaces, 5) Mix of historic and modern architecture, 6) Landmarks along the river. I'll create a layout with the Thames flowing through, major bridges, historic zones with smaller buildings, financial district (City of London), West End shopping/theatre district, and residential areas.","world":{"date":"06/22/2025, 12:00:00 PM","address":"London, United Kingdom","latitude":51.5074,"longitude":-0.1278},"city":{"rivers":[{"vertices":[[-1000,50],[-900,80],[-700,120],[-500,100],[-300,60],[-100,20],[100,-20],[300,-60],[500,-40],[700,0],[900,30],[1000,50],[1000,-50],[900,-70],[700,-100],[500,-140],[300,-160],[100,-120],[-100,-80],[-300,-40],[-500,0],[-700,20],[-900,-20],[-1000,-50]]}],"roads":{"nodes":[{"id":"n1","position":[-800,300]},{"id":"n2","position":[-500,300]},{"id":"n3","position":[-200,300]},{"id":"n4","position":[100,300]},{"id":"n5","position":[400,300]},{"id":"n6","position":[700,300]},{"id":"n7","position":[-800,500]},{"id":"n8","position":[-500,500]},{"id":"n9","position":[-200,500]},{"id":"n10","position":[100,500]},{"id":"n11","position":[400,500]},{"id":"n12","position":[700,500]},{"id":"n13","position":[-800,700]},{"id":"n14","position":[-500,700]},{"id":"n15","position":[-200,700]},{"id":"n16","position":[100,700]},{"id":"n17","position":[400,700]},{"id":"n18","position":[700,700]},{"id":"n19","position":[-800,-200]},{"id":"n20","position":[-500,-200]},{"id":"n21","position":[-200,-200]},{"id":"n22","position":[100,-200]},{"id":"n23","position":[400,-200]},{"id":"n24","position":[700,-200]},{"id":"n25","position":[-800,-400]},{"id":"n26","position":[-500,-400]},{"id":"n27","position":[-200,-400]},{"id":"n28","position":[100,-400]},{"id":"n29","position":[400,-400]},{"id":"n30","position":[700,-400]},{"id":"n31","position":[-800,-650]},{"id":"n32","position":[-500,-650]},{"id":"n33","position":[-200,-650]},{"id":"n34","position":[100,-650]},{"id":"n35","position":[400,-650]},{"id":"n36","position":[700,-650]},{"id":"n37","position":[-650,300]},{"id":"n38","position":[-350,300]},{"id":"n39","position":[-50,300]},{"id":"n40","position":[250,300]},{"id":"n41","position":[550,300]},{"id":"n42","position":[-650,500]},{"id":"n43","position":[-350,500]},{"id":"n44","position":[-50,500]},{"id":"n45","position":[250,500]},{"id":"n46","position":[550,500]},{"id":"n47","position":[-650,-400]},{"id":"n48","position":[-350,-400]},{"id":"n49","position":[-50,-400]},{"id":"n50","position":[250,-400]},{"id":"n51","position":[550,-400]},{"id":"n52","position":[-300,150]},{"id":"n53","position":[0,150]},{"id":"n54","position":[300,150]},{"id":"n55","position":[600,150]},{"id":"n56","position":[-400,-300]},{"id":"n57","position":[-100,-300]},{"id":"n58","position":[200,-300]},{"id":"n59","position":[500,-300]}],"edges":[{"id":"e1","from":"n1","to":"n2","level":"1","points":[]},{"id":"e2","from":"n2","to":"n3","level":"1","points":[]},{"id":"e3","from":"n3","to":"n4","level":"1","points":[]},{"id":"e4","from":"n4","to":"n5","level":"1","points":[]},{"id":"e5","from":"n5","to":"n6","level":"1","points":[]},{"id":"e6","from":"n7","to":"n8","level":"1","points":[]},{"id":"e7","from":"n8","to":"n9","level":"1","points":[]},{"id":"e8","from":"n9","to":"n10","level":"1","points":[]},{"id":"e9","from":"n10","to":"n11","level":"1","points":[]},{"id":"e10","from":"n11","to":"n12","level":"1","points":[]},{"id":"e11","from":"n13","to":"n14","level":"1","points":[]},{"id":"e12","from":"n14","to":"n15","level":"1","points":[]},{"id":"e13","from":"n15","to":"n16","level":"1","points":[]},{"id":"e14","from":"n16","to":"n17","level":"1","points":[]},{"id":"e15","from":"n17","to":"n18","level":"1","points":[]},{"id":"e16","from":"n19","to":"n20","level":"1","points":[]},{"id":"e17","from":"n20","to":"n21","level":"1","points":[]},{"id":"e18","from":"n21","to":"n22","level":"1","points":[]},{"id":"e19","from":"n22","to":"n23","level":"1","points":[]},{"id":"e20","from":"n23","to":"n24","level":"1","points":[]},{"id":"e21","from":"n25","to":"n26","level":"1","points":[]},{"id":"e22","from":"n26","to":"n27","level":"1","points":[]},{"id":"e23","from":"n27","to":"n28","level":"1","points":[]},{"id":"e24","from":"n28","to":"n29","level":"1","points":[]},{"id":"e25","from":"n29","to":"n30","level":"1","points":[]},{"id":"e26","from":"n31","to":"n32","level":"1","points":[]},{"id":"e27","from":"n32","to":"n33","level":"1","points":[]},{"id":"e28","from":"n33","to":"n34","level":"1","points":[]},{"id":"e29","from":"n34","to":"n35","level":"1","points":[]},{"id":"e30","from":"n35","to":"n36","level":"1","points":[]},{"id":"e31","from":"n1","to":"n7","level":"1","points":[]},{"id":"e32","from":"n7","to":"n13","level":"1","points":[]},{"id":"e33","from":"n2","to":"n8","level":"1","points":[]},{"id":"e34","from":"n8","to":"n14","level":"1","points":[]},{"id":"e35","from":"n3","to":"n9","level":"1","points":[]},{"id":"e36","from":"n9","to":"n15","level":"1","points":[]},{"id":"e37","from":"n4","to":"n10","level":"1","points":[]},{"id":"e38","from":"n10","to":"n16","level":"1","points":[]},{"id":"e39","from":"n5","to":"n11","level":"1","points":[]},{"id":"e40","from":"n11","to":"n17","level":"1","points":[]},{"id":"e41","from":"n6","to":"n12","level":"1","points":[]},{"id":"e42","from":"n12","to":"n18","level":"1","points":[]},{"id":"e43","from":"n19","to":"n25","level":"1","points":[]},{"id":"e44","from":"n25","to":"n31","level":"1","points":[]},{"id":"e45","from":"n20","to":"n26","level":"1","points":[]},{"id":"e46","from":"n26","to":"n32","level":"1","points":[]},{"id":"e47","from":"n21","to":"n27","level":"1","points":[]},{"id":"e48","from":"n27","to":"n33","level":"1","points":[]},{"id":"e49","from":"n22","to":"n28","level":"1","points":[]},{"id":"e50","from":"n28","to":"n34","level":"1","points":[]},{"id":"e51","from":"n23","to":"n29","level":"1","points":[]},{"id":"e52","from":"n29","to":"n35","level":"1","points":[]},{"id":"e53","from":"n24","to":"n30","level":"1","points":[]},{"id":"e54","from":"n30","to":"n36","level":"1","points":[]},{"id":"e55","from":"n1","to":"n37","level":"2","points":[]},{"id":"e56","from":"n37","to":"n2","level":"2","points":[]},{"id":"e57","from":"n2","to":"n38","level":"2","points":[]},{"id":"e58","from":"n38","to":"n3","level":"2","points":[]},{"id":"e59","from":"n3","to":"n39","level":"2","points":[]},{"id":"e60","from":"n39","to":"n4","level":"2","points":[]},{"id":"e61","from":"n4","to":"n40","level":"2","points":[]},{"id":"e62","from":"n40","to":"n5","level":"2","points":[]},{"id":"e63","from":"n5","to":"n41","level":"2","points":[]},{"id":"e64","from":"n41","to":"n6","level":"2","points":[]},{"id":"e65","from":"n7","to":"n42","level":"2","points":[]},{"id":"e66","from":"n42","to":"n8","level":"2","points":[]},{"id":"e67","from":"n8","to":"n43","level":"2","points":[]},{"id":"e68","from":"n43","to":"n9","level":"2","points":[]},{"id":"e69","from":"n9","to":"n44","level":"2","points":[]},{"id":"e70","from":"n44","to":"n10","level":"2","points":[]},{"id":"e71","from":"n10","to":"n45","level":"2","points":[]},{"id":"e72","from":"n45","to":"n11","level":"2","points":[]},{"id":"e73","from":"n11","to":"n46","level":"2","points":[]},{"id":"e74","from":"n46","to":"n12","level":"2","points":[]},{"id":"e75","from":"n37","to":"n42","level":"2","points":[]},{"id":"e76","from":"n38","to":"n43","level":"2","points":[]},{"id":"e77","from":"n39","to":"n44","level":"2","points":[]},{"id":"e78","from":"n40","to":"n45","level":"2","points":[]},{"id":"e79","from":"n41","to":"n46","level":"2","points":[]},{"id":"e80","from":"n25","to":"n47","level":"2","points":[]},{"id":"e81","from":"n47","to":"n26","level":"2","points":[]},{"id":"e82","from":"n26","to":"n48","level":"2","points":[]},{"id":"e83","from":"n48","to":"n27","level":"2","points":[]},{"id":"e84","from":"n27","to":"n49","level":"2","points":[]},{"id":"e85","from":"n49","to":"n28","level":"2","points":[]},{"id":"e86","from":"n28","to":"n50","level":"2","points":[]},{"id":"e87","from":"n50","to":"n29","level":"2","points":[]},{"id":"e88","from":"n29","to":"n51","level":"2","points":[]},{"id":"e89","from":"n51","to":"n30","level":"2","points":[]},{"id":"e90","from":"n3","to":"n52","level":"2","points":[]},{"id":"e91","from":"n52","to":"n21","level":"2","points":[]},{"id":"e92","from":"n4","to":"n53","level":"2","points":[]},{"id":"e93","from":"n53","to":"n22","level":"2","points":[]},{"id":"e94","from":"n5","to":"n54","level":"2","points":[]},{"id":"e95","from":"n54","to":"n23","level":"2","points":[]},{"id":"e96","from":"n6","to":"n55","level":"2","points":[]},{"id":"e97","from":"n55","to":"n24","level":"2","points":[]},{"id":"e98","from":"n20","to":"n56","level":"2","points":[]},{"id":"e99","from":"n56","to":"n26","level":"2","points":[]},{"id":"e100","from":"n21","to":"n57","level":"2","points":[]},{"id":"e101","from":"n57","to":"n27","level":"2","points":[]},{"id":"e102","from":"n22","to":"n58","level":"2","points":[]},{"id":"e103","from":"n58","to":"n28","level":"2","points":[]},{"id":"e104","from":"n23","to":"n59","level":"2","points":[]},{"id":"e105","from":"n59","to":"n29","level":"2","points":[]}]},"parks":[{"vertices":[[-750,350],[-550,350],[-550,650],[-750,650]]},{"vertices":[[150,350],[350,350],[350,480],[150,480]]},{"vertices":[[-150,-450],[50,-450],[50,-600],[-150,-600]]},{"vertices":[[500,-450],[650,-450],[650,-600],[500,-600]]}],"zones":[{"boundary":[[-800,300],[-500,300],[-500,700],[-800,700]],"length":[15,30],"width":[12,25],"height":[12,35],"layout":"perimeter","coverage":0.4,"color":"#8B7355"},{"boundary":[[-500,300],[-200,300],[-200,700],[-500,700]],"length":[20,40],"width":[15,30],"height":[20,50],"layout":"grid","coverage":0.55,"color":"#696969"},{"boundary":[[-200,300],[100,300],[100,700],[-200,700]],"length":[25,50],"width":[20,40],"height":[25,60],"layout":"grid","coverage":0.5,"color":"#5F5F5F"},{"boundary":[[100,300],[400,300],[400,700],[100,700]],"length":[18,35],"width":[14,28],"height":[15,40],"layout":"perimeter","coverage":0.45,"color":"#708090"},{"boundary":[[400,300],[700,300],[700,700],[400,700]],"length":[20,38],"width":[15,30],"height":[18,45],"layout":"grid","coverage":0.5,"color":"#6B6B6B"},{"boundary":[[-800,-200],[-500,-200],[-500,-650],[-800,-650]],"length":[12,25],"width":[10,20],"height":[10,25],"layout":"cluster","coverage":0.35,"color":"#A0522D"},{"boundary":[[-500,-200],[-200,-200],[-200,-650],[-500,-650]],"length":[15,30],"width":[12,24],"height":[12,30],"layout":"grid","coverage":0.45,"color":"#7B7B7B"},{"boundary":[[-200,-200],[100,-200],[100,-650],[-200,-650]],"length":[18,35],"width":[14,28],"height":[15,38],"layout":"grid","coverage":0.5,"color":"#666666"},{"boundary":[[100,-200],[400,-200],[400,-650],[100,-650]],"length":[20,40],"width":[16,32],"height":[18,45],"layout":"grid","coverage":0.55,"color":"#5A5A5A"},{"boundary":[[400,-200],[700,-200],[700,-650],[400,-650]],"length":[25,50],"width":[20,40],"height":[30,80],"layout":"grid","coverage":0.6,"color":"#4A4A4A"}],"landmarks":[{"center":[550,-350],"size":[60,60,180],"rotation":0},{"center":[-100,200],"size":[80,40,100],"rotation":0.1},{"center":[200,-500],"size":[50,50,135],"rotation":-0.05},{"center":[-400,450],"size":[45,70,90],"rotation":0.2},{"center":[300,550],"size":[55,55,110],"rotation":0},{"center":[-600,-350],"size":[40,60,75],"rotation":-0.15},{"center":[0,-300],"size":[70,35,65],"rotation":0.08},{"center":[600,450],"size":[50,50,95],"rotation":0.12}]}}`;

      if (result) {
        processResult(result);
        useStore.getState().set((state) => {
          state.genAIData = {
            aIModel: aIModel,
            prompt: prompt.trim(),
            data: result,
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
      if (userid && projectTitle) updateGenerateBuildingPrompt(userid, projectTitle, prompt);
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
