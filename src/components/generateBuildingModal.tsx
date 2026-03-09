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
  callBuildingAzureAI,
  callBuildingClaudeAI,
  callBuildingGeminiAI,
  callBuildingOpenAI,
} from 'functions/src/callBuildingAI';
import { AIMemory, ObjectType } from 'src/types';
import { GenAIUtil } from 'src/panels/GenAIUtil';
import { RoofType } from 'src/models/RoofModel';
import { updateAIModel, updateGenerateBuildingPrompt } from 'src/cloudProjectUtil';
import { Util } from '../Util';
import {
  DEFAULT_LATITUDE,
  DEFAULT_LONGITUDE,
  DEFAULT_VIEW_AMBIENT_LIGHT_INTENSITY,
  DEFAULT_VIEW_DIRECT_LIGHT_INTENSITY,
  DEFAULT_SHORT_TERM_MEMORY,
} from '../constants';
import { DefaultViewState } from '../stores/DefaultViewState';
import { AI_MODEL_NAMES } from '../../functions/src/constants';

export interface GenerateBuildingModalProps {
  setDialogVisible: (visible: boolean) => void;
  isDialogVisible: () => boolean;
}

const { TextArea } = Input;

const GenerateBuildingModal = React.memo(({ setDialogVisible, isDialogVisible }: GenerateBuildingModalProps) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const reasoningEffort = useStore(Selector.reasoningEffort) ?? 'medium';
  const generateBuildingPrompt = useStore(Selector.generateBuildingPrompt);
  const setGenerating = usePrimitiveStore(Selector.setGenerating);
  const setChanged = usePrimitiveStore(Selector.setChanged);
  const user = useStore(Selector.user);
  const projectOwner = useStore(Selector.projectOwner);
  const projectTitle = useStore(Selector.projectTitle);
  const aiModelStored = useStore(Selector.aiModel);
  // exclude unsupported models
  const aiModel =
    aiModelStored && aiModelStored !== AI_MODEL_NAMES['Claude Sonnet-4.5']
      ? aiModelStored
      : AI_MODEL_NAMES['OpenAI GPT-5.2'];

  const [prompt, setPrompt] = useState<string>('Generate a colonial style house');
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
  const isOwner = user.uid === projectOwner;

  useEffect(() => {
    setPrompt(generateBuildingPrompt);
  }, [generateBuildingPrompt]);

  const createInput = () => {
    const input = [];
    const projectState = useStore.getState().projectState;
    const aiMemory = projectState.aiMemory;
    const designs = projectState.designs;
    if (aiMemory !== AIMemory.NONE && designs && designs.length > 0) {
      const memoryDesigns = aiMemory === AIMemory.SHORT_TERM ? designs.slice(-DEFAULT_SHORT_TERM_MEMORY) : designs;
      for (const d of memoryDesigns) {
        if (d.prompt && d.data) {
          input.push({ role: 'user', content: d.prompt });
          const sendBackThinking = false;
          if (sendBackThinking) {
            input.push({ role: 'assistant', content: d.data });
          } else {
            const content = JSON.parse(d.data);
            delete content.thinking;
            input.push({ role: 'assistant', content: JSON.stringify(content) });
          }
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

  const createGeminiInput = () => {
    const input = [];
    const projectState = useStore.getState().projectState;
    const aiMemory = projectState.aiMemory;
    const designs = projectState.designs;
    if (aiMemory !== AIMemory.NONE && designs && designs.length > 0) {
      const memoryDesigns = aiMemory === AIMemory.SHORT_TERM ? designs.slice(-DEFAULT_SHORT_TERM_MEMORY) : designs;
      for (const d of memoryDesigns) {
        if (d.prompt && d.data) {
          input.push({ role: 'user', parts: [{ text: d.prompt }] });
          const sendBackThinking = false;
          if (sendBackThinking) {
            input.push({ role: 'model', parts: [{ text: d.data }] });
          } else {
            const content = JSON.parse(d.data);
            delete content.thinking;
            input.push({ role: 'model', parts: [{ text: JSON.stringify(content) }] });
          }
        }
      }
    }
    input.push({ role: 'user', parts: [{ text: prompt.trim() }] });
    return input;
  };

  const processResult = (text: string) => {
    const json = JSON.parse(text);

    console.log('prompt:', prompt);
    console.log('raw:', JSON.parse(text));

    const jsonWorld = json.world;
    const jsonView = json.view;
    const jsonElements = json.elements ? GenAIUtil.arrayCorrection(json.elements) : [];

    console.log('validated', jsonElements);
    console.log('thinking', json.thinking);

    useStore.getState().set((state) => {
      let [minX, maxX] = [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];
      let [minY, maxY] = [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];
      if (jsonWorld) {
        state.world.date = jsonWorld.date ?? '06/22/2025, 12:00:00 PM';
        state.world.address = jsonWorld.address ?? 'Natick, MA';
        state.world.latitude = jsonWorld.latitude === undefined ? DEFAULT_LATITUDE : jsonWorld.latitude;
        state.world.longitude = jsonWorld.longitude === undefined ? DEFAULT_LONGITUDE : jsonWorld.longitude;
      }
      state.viewState = new DefaultViewState(); // reset view state
      if (jsonView) {
        state.viewState.directLightIntensity = jsonView.directLightIntensity ?? DEFAULT_VIEW_DIRECT_LIGHT_INTENSITY;
        state.viewState.ambientLightIntensity = jsonView.ambientLightIntensity ?? DEFAULT_VIEW_AMBIENT_LIGHT_INTENSITY;
      }
      if (jsonElements.length > 0) {
        state.elements = [];
        for (const e of jsonElements) {
          switch (e.type) {
            case ObjectType.Foundation: {
              const hasBattery = jsonElements.find((el) => el.type === ObjectType.BatteryStorage && el.pId === e.id);
              const f = GenAIUtil.makeFoundationForBuildingDesign(
                e.id,
                e.center,
                e.size,
                Util.toRadians(e.rotation),
                e.color,
                e.rValue,
                e.heatingSetpoint,
                e.coolingSetpoint,
                e.coefficientOfPerformanceAC,
                e.hvacId,
                hasBattery,
              );

              minX = Math.min(minX, f.cx - f.lx / 2);
              maxX = Math.max(maxX, f.cx + f.lx / 2);
              minY = Math.min(minY, f.cy - f.ly / 2);
              maxY = Math.max(maxY, f.cy + f.ly / 2);
              state.elements.push(f);
              break;
            }
            case ObjectType.Wall: {
              const {
                id,
                pId,
                thickness,
                height,
                leftPoint,
                rightPoint,
                color,
                overhang,
                rValue,
                airPermeability,
                leftConnectId,
                rightConnectId,
              } = e;
              const w = GenAIUtil.makeWall(
                id,
                pId,
                thickness,
                height,
                color,
                overhang,
                rValue,
                airPermeability,
                leftPoint,
                rightPoint,
                leftConnectId,
                rightConnectId,
              );
              state.elements.push(w);
              break;
            }
            case ObjectType.Door: {
              const {
                id,
                pId,
                fId,
                center,
                size,
                filled,
                color,
                frameColor,
                uValue,
                airPermeability,
                doorType,
                textureType,
              } = e;
              const wall = state.elements.find((e) => e.id === pId);
              if (wall) {
                const _center = [center[0] / wall.lx, (-wall.lz / 2 + size[1] / 2) / wall.lz];
                const _size = [size[0] / wall.lx, size[1] / wall.lz];
                const d = GenAIUtil.makeDoor(
                  id,
                  pId,
                  fId,
                  _center,
                  _size,
                  filled,
                  color,
                  frameColor,
                  uValue,
                  airPermeability,
                  doorType,
                  textureType,
                );
                state.elements.push(d);
              }
              break;
            }
            case ObjectType.SolarPanel: {
              const { id, pId, fId, pvModelName, orientation, center, size } = e;
              const foundation = state.elements.find((e) => e.id === fId);
              if (foundation) {
                const s = GenAIUtil.makeSolarPanel(
                  id,
                  pId,
                  fId,
                  pvModelName,
                  orientation,
                  [center[0], center[1], center[2]],
                  size,
                  e.batteryId,
                );
                state.elements.push(s);
                state.updateElementOnRoofFromGenAIFlag = true;
              }
              break;
            }
            case ObjectType.Window: {
              const {
                id,
                pId,
                fId,
                center,
                size,
                opacity,
                uValue,
                color,
                tint,
                windowType,
                shutter,
                shutterColor,
                shutterWidth,
                horizontalMullion,
                horizontalMullionSpacing,
                verticalMullion,
                verticalMullionSpacing,
                mullionColor,
                mullionWidth,
              } = e;
              const wall = state.elements.find((e) => e.id === pId);
              if (wall) {
                const _size = [size[0] / wall.lx, size[1] / wall.lz];
                const _center = [center[0] / wall.lx, (center[1] - wall.lz / 2) / wall.lz];
                const w = GenAIUtil.makeWindow(
                  id,
                  pId,
                  fId,
                  _center,
                  _size,
                  opacity,
                  uValue,
                  color,
                  tint,
                  windowType,
                  shutter,
                  shutterColor,
                  shutterWidth,
                  horizontalMullion,
                  horizontalMullionSpacing,
                  verticalMullion,
                  verticalMullionSpacing,
                  mullionColor ?? color,
                  mullionWidth,
                );
                state.elements.push(w);
              }
              break;
            }
            case ObjectType.Roof: {
              switch (e.roofType) {
                case RoofType.Gable: {
                  const { id, fId, wId, thickness, rise, color, rValue, airPermeability } = e;
                  const r = GenAIUtil.makeGableRoof(id, fId, wId, thickness, rise, color, rValue, airPermeability);
                  state.elements.push(r);
                  state.addedRoofIdSet.add(id);
                  break;
                }
                case RoofType.Pyramid: {
                  const { id, fId, wId, thickness, rise, color, rValue, airPermeability } = e;
                  const r = GenAIUtil.makePyramidRoof(id, fId, wId, thickness, rise, color, rValue, airPermeability);
                  state.elements.push(r);
                  state.addedRoofIdSet.add(id);
                  break;
                }
                case RoofType.Gambrel: {
                  const { id, fId, wId, thickness, rise, color, rValue, airPermeability } = e;
                  const r = GenAIUtil.makeGambrelRoof(id, fId, wId, thickness, rise, color, rValue, airPermeability);
                  state.elements.push(r);
                  state.addedRoofIdSet.add(id);
                  break;
                }
                case RoofType.Mansard: {
                  const { id, fId, wId, thickness, rise, color, ridgeLength, rValue, airPermeability } = e;
                  const r = GenAIUtil.makeMansardRoof(
                    id,
                    fId,
                    wId,
                    thickness,
                    rise,
                    color,
                    ridgeLength,
                    rValue,
                    airPermeability,
                  );
                  state.elements.push(r);
                  state.addedRoofIdSet.add(id);
                  break;
                }
                case RoofType.Hip: {
                  const { id, fId, wId, thickness, rise, color, ridgeLength, rValue, airPermeability } = e;
                  const r = GenAIUtil.makeHipRoof(
                    id,
                    fId,
                    wId,
                    thickness,
                    rise,
                    color,
                    ridgeLength,
                    rValue,
                    airPermeability,
                  );
                  state.elements.push(r);
                  state.addedRoofIdSet.add(id);
                  break;
                }
              }
              break;
            }
            case ObjectType.BatteryStorage: {
              const f = jsonElements.find((el) => el.id === e.pId);
              if (f) {
                const b = GenAIUtil.makeBatteryStorage(
                  e.id,
                  e.pId,
                  [e.center[0], e.center[1], f.size[2] / 2],
                  e.size,
                  e.color,
                  e.chargingEfficiency,
                  e.dischargingEfficiency,
                  e.hvacId,
                );
                state.elements.push(b);
              }
            }
          }
        }
      }

      const panCenter = [(minX + maxX) / 2, (minY + maxY) / 2, 0];
      const l = Math.max(maxX - minX, maxY - minY) * 1.5;
      state.viewState.cameraPosition = [panCenter[0] - l, panCenter[1] - l, l / 2];
      state.viewState.panCenter = [...panCenter];
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
        type: 'building',
        reasoningEffort,
        aiModel,
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

      if (aiModel === AI_MODEL_NAMES['Azure OpenAI o4-mini']) {
        console.log('calling Azure OpenAI...', input); // for debugging
        const response = await callBuildingAzureAI(
          import.meta.env.VITE_AZURE_API_KEY,
          input as [],
          true,
          reasoningEffort,
        );
        const result = response.choices[0].message.content;
        console.log('Azure OpenAI response:', response);
        return result;
      } else if (aiModel === AI_MODEL_NAMES['OpenAI GPT-5.2']) {
        console.log('calling OpenAI...', input); // for debugging
        const response = await callBuildingOpenAI(
          import.meta.env.VITE_OPENAI_API_KEY,
          input as [],
          true,
          reasoningEffort,
        );
        console.log('OpenAI GPT-5.2 response:', response);
        return response.output_text;
      } else if (aiModel === AI_MODEL_NAMES['Claude Opus-4.5']) {
        console.log('calling Claude...', input); // for debugging
        const response = await callBuildingClaudeAI(import.meta.env.VITE_CLAUDE_API_KEY, input as [], true);
        const result = (response.content[0] as any).text;
        console.log('Claude response:', response);
        return result;
      } else if (aiModel === AI_MODEL_NAMES['Gemini 2.5-Pro']) {
        const geminiInput = createGeminiInput();
        console.log('calling Gemini...', geminiInput); // for debugging
        const response = await callBuildingGeminiAI(
          import.meta.env.VITE_GEMINI_API_KEY,
          geminiInput as [],
          reasoningEffort,
        );
        const result = response.text;
        console.log('Gemini response:', response);
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
      const r = await generate();
      // prevent markdown
      const result = r
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      if (result) {
        processResult(result);
        useStore.getState().set((state) => {
          state.genAIData = {
            aiModel,
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
      state.projectState.generateBuildingPrompt = prompt;
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
    setPrompt(generateBuildingPrompt);
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
          <img src={GenaiImage} width={'16px'} alt={'genai'} /> {t('projectPanel.GenerateBuilding', lang)}
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
          {i18n.t('projectPanel.WhatBuildingDoYouWant', lang)}
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
            value={aiModel}
            style={{ width: '150px', marginRight: '10px' }}
            onChange={(value) => {
              if (isOwner && user.uid && projectTitle) {
                updateAIModel(user.uid, projectTitle, value).then(() => {
                  setCommonStore((state) => {
                    state.projectState.aiModel = value;
                  });
                });
              }
            }}
            options={[
              { value: AI_MODEL_NAMES['OpenAI GPT-5.2'], label: 'OpenAI GPT-5.2' },
              { value: AI_MODEL_NAMES['Azure OpenAI o4-mini'], label: 'OpenAI o4-mini' },
              { value: AI_MODEL_NAMES['Gemini 2.5-Pro'], label: 'Gemini 2.5 Pro' },
              // { value: AI_MODELS_NAME['Claude Opus-4.5'], label: 'Claude Opus-4.5' },
            ]}
          />
          {(aiModel === AI_MODEL_NAMES['Azure OpenAI o4-mini'] || aiModel === AI_MODEL_NAMES['OpenAI GPT-5.2']) && (
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
          <WarningOutlined /> {t('message.GeneratingABuildingMayTakeAWhile', lang)}
        </span>
      </Space>
    </Modal>
  );
});

export default GenerateBuildingModal;
