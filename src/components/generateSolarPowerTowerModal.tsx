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
import {
  callSolarPowerTowerOpenAI,
  callSolarPowerTowerClaudeAI,
  AI_MODELS_NAME,
} from 'functions/src/callSolarPowerTowerAI';
import { FoundationTexture, ObjectType, SolarStructure } from 'src/types';
import * as Constants from '../constants';
import { updateGenerateSolarPowerTowerPrompt } from 'src/cloudProjectUtil';
import { HeliostatModel } from 'src/models/HeliostatModel';
import { FoundationModel } from 'src/models/FoundationModel';
import short from 'short-uuid';
import { DEFAULT_LATITUDE, DEFAULT_LONGITUDE } from '../constants';

export interface GenerateBuildingModalProps {
  setDialogVisible: (visible: boolean) => void;
  isDialogVisible: boolean;
}

const { TextArea } = Input;

const hardCodedResult = `{
    "thinking": "Hard coded result for testing purposes.",
    "N": 800,
    "heliostat": {"size": [2,4],"poleHeight": 4.2,"poleRadius": 0.1},
    "tower": {"center": [0,0],"height": 20,"radius": 1.5},
    "fn": "while(true){n++}"
}`;

const GenerateSolarPowerTowerModal = React.memo(({ setDialogVisible, isDialogVisible }: GenerateBuildingModalProps) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const reasoningEffort = useStore(Selector.reasoningEffort) ?? 'medium';
  const aIModel = useStore(Selector.aIModel) ?? AI_MODELS_NAME['OpenAI o4-mini'];
  const generatePrompt =
    useStore(Selector.generateSolarPowerTowerPrompt) ??
    'Generate a solar power tower plant with a Fermat spiral layout for heliostats';
  const setGenerating = usePrimitiveStore(Selector.setGenerating);
  const setChanged = usePrimitiveStore(Selector.setChanged);

  const [prompt, setPrompt] = useState<string>(
    'Generate a solar power tower plant with a Fermat spiral layout for heliostats',
  );
  const [listening, setListening] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
  } as DraggableBounds);

  const dragRef = useRef<HTMLDivElement | null>(null);

  const { t } = useTranslation();
  const lang = useMemo(() => {
    return { lng: language };
  }, [language]);

  useEffect(() => {
    setPrompt(generatePrompt);
  }, [generatePrompt]);

  const createInput = () => {
    const input = [];
    const designs = useStore.getState().projectState.designs;
    if (!useStore.getState().projectState.independentPrompt && designs && designs.length > 0) {
      for (const d of designs) {
        if (d.prompt && d.data) {
          // const parsedData = JSON.parse(d.data)
          // delete parsedData.thinking;
          // const content = JSON.stringify(parsedData);
          const content = d.data;

          input.push({ role: 'user', content: d.prompt });
          input.push({ role: 'assistant', content: content });
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

  const executeInWorker = (functionCode: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('../workers/functionExecutor.worker.ts', import.meta.url), {
        type: 'module',
      });

      let isCompleted = false;

      // Set 3 second timeout
      const timeoutId = setTimeout(() => {
        if (!isCompleted) {
          isCompleted = true;
          worker.terminate();
          reject(new Error('Worker execution timed out after 2 seconds.'));
        }
      }, 2000);

      worker.onmessage = (e: MessageEvent) => {
        if (!isCompleted) {
          isCompleted = true;
          clearTimeout(timeoutId);
          const { success, data, error } = e.data;
          worker.terminate();

          if (success) {
            resolve(data);
          } else {
            reject(new Error(error));
          }
        }
      };

      worker.onerror = (error) => {
        console.error('Worker onerror:', error);
        if (!isCompleted) {
          isCompleted = true;
          clearTimeout(timeoutId);
          worker.terminate();
          reject(error);
        }
      };

      worker.postMessage({ functionCode });
    });
  };

  const processResult = async (text: string): Promise<boolean> => {
    const json = JSON.parse(text);

    console.log('prompt:', prompt);
    console.log('raw', JSON.parse(text));
    console.log('thinking:', json.thinking);
    console.log(json.fn);

    try {
      const world = json.world;
      const heliostatProperties = json.heliostat;
      const towerProperties = json.tower;

      // Execute function in Web Worker
      const points = await executeInWorker(json.fn);
      console.log('points:', points);

      useStore.getState().set((state) => {
        state.elements = [];

        if (world) {
          state.world.date = world.date ?? '06/22/2025, 12:00:00 PM';
          state.world.address = world.address ?? 'Tucson, AZ';
          state.world.latitude = world.latitude === undefined ? DEFAULT_LATITUDE : world.latitude;
          state.world.longitude = world.longitude === undefined ? DEFAULT_LONGITUDE : world.longitude;
        }

        const towerRadius = Math.max(1, towerProperties.radius ?? 1);
        const towerHeight = Math.max(10, towerProperties.height ?? 20);
        const towerFoundation = {
          type: ObjectType.Foundation,
          cx: towerProperties.center[0] ?? 0,
          cy: towerProperties.center[1] ?? 0,
          cz: 1.5,
          lx: towerRadius * 10,
          ly: towerRadius * 10,
          lz: 3,
          normal: [0, 0, 1],
          rotation: [0, 0, 0],
          parentId: Constants.GROUND_ID,
          color: Constants.DEFAULT_FOUNDATION_COLOR,
          textureType: FoundationTexture.NoTexture,
          rValue: Constants.DEFAULT_GROUND_FLOOR_R_VALUE,
          solarUpdraftTower: {},
          solarAbsorberPipe: {},
          hvacSystem: { ...Constants.DEFAULT_HVAC_SYSTEM },
          solarStructure: SolarStructure.FocusTower,
          solarPowerTower: { towerHeight, towerRadius },
          notBuilding: true,
          id: short.generate() as string,
        } as FoundationModel;
        state.elements.push(towerFoundation);

        let maxX = 0;
        let maxY = 0;
        for (const p of points) {
          maxX = Math.max(Math.abs(p[0]), maxX);
          maxY = Math.max(Math.abs(p[1]), maxY);
        }

        const foundation = {
          type: ObjectType.Foundation,
          cx: 0,
          cy: 0,
          cz: 0.05,
          lx: (maxX + Math.max(1, maxX * 0.05)) * 2,
          ly: (maxY + Math.max(1, maxY * 0.05)) * 2,
          lz: 0.1,
          normal: [0, 0, 1],
          rotation: [0, 0, 0],
          parentId: Constants.GROUND_ID,
          color: Constants.DEFAULT_FOUNDATION_COLOR,
          textureType: FoundationTexture.NoTexture,
          rValue: Constants.DEFAULT_GROUND_FLOOR_R_VALUE,
          solarUpdraftTower: {},
          solarAbsorberPipe: {},
          solarPowerTower: {},
          hvacSystem: { ...Constants.DEFAULT_HVAC_SYSTEM },
          id: short.generate() as string,
        } as FoundationModel;

        state.elements.push(foundation);

        const [tx, ty] = [towerFoundation.cx, towerFoundation.cy];
        for (const p of points) {
          if (Math.hypot(p[0] - tx, p[1] - ty) < towerRadius * 8) {
            continue;
          }
          const heliostat = {
            type: ObjectType.Heliostat,
            reflectance: Constants.DEFAULT_HELIOSTAT_REFLECTANCE,
            relativeAzimuth: 0,
            tiltAngle: 0,
            drawSunBeam: false,
            poleHeight: heliostatProperties.poleHeight
              ? heliostatProperties.poleHeight - 2
              : Constants.DEFAULT_HELIOSTAT_POLE_HEIGHT, // extra pole height in addition to half of the width or height, whichever is larger
            poleRadius: heliostatProperties.poleRadius ?? Constants.DEFAULT_HELIOSTAT_POLE_RADIUS,
            cx: p[0] / foundation.lx,
            cy: p[1] / foundation.ly,
            cz: 0.5,
            lx: heliostatProperties.size[0] ?? 2,
            ly: heliostatProperties.size[1] ?? 4,
            lz: 0.1,
            showLabel: false,
            normal: [0, 0, 1],
            rotation: [0, 0, 0],
            parentId: foundation.id,
            foundationId: foundation.id,
            towerId: towerFoundation.id,
            id: short.generate() as string,
          } as HeliostatModel;
          state.elements.push(heliostat);
        }

        state.viewState.cameraPosition = [0, -maxY * 2, maxY * 2];
        state.viewState.panCenter = [0, 0, 0];
        state.cameraChangeFlag = !state.cameraChangeFlag;
      });
      return true;
    } catch (e) {
      console.error('Error processing result:', e);
      return false;
    }
  };

  const callFromFirebaseFunction = async () => {
    try {
      const functions = getFunctions(app, 'us-east4');
      const callAI = httpsCallable(functions, 'callAI', { timeout: 300000 });
      const input = createInput();
      console.log('calling...', input); // for debugging
      const res = (await callAI({
        text: input,
        type: 'solar power tower',
        reasoningEffort,
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
        console.log('calling OpenAI...', input); // for debugging
        const response = await callSolarPowerTowerOpenAI(
          import.meta.env.VITE_AZURE_API_KEY,
          input as [],
          true,
          reasoningEffort,
        );
        const result = response.choices[0].message.content;
        console.log('OpenAI response:', response);
        return result;
      } else if (aIModel === AI_MODELS_NAME['Claude Opus-4.5']) {
        console.log('calling Claude...', input); // for debugging
        const response = await callSolarPowerTowerClaudeAI(import.meta.env.VITE_CLAUDE_API_KEY, input as [], true);
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
      // const result = hardCodedResult; // for testing only

      if (result) {
        const success = await processResult(result);
        if (success) {
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
        } else {
          showError('Failed to generate solar power tower plant from the AI response. Please try again.', 10);
        }
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
      state.projectState.generateSolarPowerTowerPrompt = prompt;
    });
    handleGenerativeAI().then(() => {
      setChanged(true);
      const userid = useStore.getState().user.uid;
      const projectTitle = useStore.getState().projectState.title;
      if (userid && projectTitle) updateGenerateSolarPowerTowerPrompt(userid, projectTitle, prompt);
    });
    close();
  };

  const onCancel = () => {
    setPrompt(generatePrompt);
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
          <img src={GenaiImage} width={'16px'} alt={'genai'} /> {t('projectPanel.GenerateSolarPowerTower', lang)}
        </div>
      }
      open={isDialogVisible}
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
          {i18n.t('projectPanel.WhatSolarPowerTowerDoYouWant', lang)}
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
          {t('projectPanel.AIModel', lang) + ':'}
          <Select
            value={aIModel}
            style={{ width: '150px', marginRight: '10px' }}
            onChange={(value) => {
              setCommonStore((state) => {
                state.projectState.aIModel = value;
              });
            }}
            options={[
              { value: AI_MODELS_NAME['OpenAI o4-mini'], label: 'OpenAI o4-mini' },
              { value: AI_MODELS_NAME['Claude Opus-4.5'], label: 'Claude Opus-4.5' },
            ]}
          />
        </Space>
        <span style={{ fontSize: '12px' }}>
          <WarningOutlined /> {t('message.GeneratingSolarPowerTowerMayTakeAWhile', lang)}
        </span>
      </Space>
    </Modal>
  );
});

export default GenerateSolarPowerTowerModal;
