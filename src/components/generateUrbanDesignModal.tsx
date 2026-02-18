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
    const terrain = json.terrain;
    const city = json.city;

    useStore.getState().set((state) => {
      state.elements = [];

      const heights = {
        sea: 0.3,
        land: 0.4,
        river: 0.7,
        park: 0.8,
      };

      if (world) {
        state.world.date = world.date ?? '06/22/2026, 12:00:00 PM';
        state.world.address = world.address ?? 'New York City, USA';
        state.world.latitude = world.latitude === undefined ? 40.7128 : world.latitude;
        state.world.longitude = world.longitude === undefined ? -74.006 : world.longitude;
      }

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
