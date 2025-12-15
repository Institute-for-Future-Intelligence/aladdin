/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
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
import { callBuildingAI } from 'functions/src/callBuildingAI';
import { ObjectType } from 'src/types';
import { GenAIUtil } from 'src/panels/GenAIUtil';
import { RoofType } from 'src/models/RoofModel';
import { updateGenerateBuildingPrompt } from 'src/cloudProjectUtil';
import { Util } from '../Util';
import {
  DEFAULT_LATITUDE,
  DEFAULT_LONGITUDE,
  DEFAULT_VIEW_AMBIENT_LIGHT_INTENSITY,
  DEFAULT_VIEW_DIRECT_LIGHT_INTENSITY,
} from '../constants';

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

  useEffect(() => {
    setPrompt(generateBuildingPrompt);
  }, [generateBuildingPrompt]);

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
    const json = JSON.parse(text);

    console.log('prompt:', prompt);
    console.log('raw:', JSON.parse(text).elements);

    const jsonWorld = json.world;
    const jsonView = json.view;
    const jsonElements = json.elements ? GenAIUtil.arrayCorrection(json.elements) : [];

    console.log('validated:', jsonElements);
    console.log('thinking:', json.thinking);

    useStore.getState().set((state) => {
      if (jsonWorld) {
        state.world.date = jsonWorld.date ?? '06/22/2025, 12:00:00 PM';
        state.world.address = jsonWorld.address ?? 'Natick, MA';
        state.world.latitude = jsonWorld.latitude === undefined ? DEFAULT_LATITUDE : jsonWorld.latitude;
        state.world.longitude = jsonWorld.longitude === undefined ? DEFAULT_LONGITUDE : jsonWorld.longitude;
      }
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
              const f = GenAIUtil.makeFoundation(
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
                  mullionColor,
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
              const b = GenAIUtil.makeBatteryStorage(
                e.id,
                e.pId,
                e.center,
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
    });
  };

  const callFromFirebaseFunction = async () => {
    try {
      const functions = getFunctions(app, 'us-east4');
      const callAzure = httpsCallable(functions, 'callAzure', { timeout: 300000 });
      const input = createInput();
      console.log('calling...', input); // for debugging
      const res = (await callAzure({
        text: input,
        type: 'building',
        reasoningEffort,
      })) as any;
      return res.data.text;
    } catch (e) {
      console.log(e);
      showError('' + e, 10);
      return null;
    }
  };

  const callFromBrowser = async () => {
    const apiKey = import.meta.env.VITE_AZURE_API_KEY;
    try {
      const input = createInput();
      console.log('calling...', input); // for debugging
      const response = await callBuildingAI(apiKey, input as [], true, reasoningEffort);
      const result = response.choices[0].message.content;
      console.log('res', response);
      return result;
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
      if (result) {
        processResult(result);
        useStore.getState().set((state) => {
          state.genAIData = {
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
        </Space>
        <span style={{ fontSize: '12px' }}>
          <WarningOutlined /> {t('message.GeneratingABuildingMayTakeAWhile', lang)}
        </span>
      </Space>
    </Modal>
  );
});

export default GenerateBuildingModal;
