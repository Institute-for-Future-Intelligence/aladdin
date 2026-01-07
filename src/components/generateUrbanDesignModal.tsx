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
import { CuboidTexture, FoundationTexture, ObjectType } from 'src/types';
import { GenAIUtil } from 'src/panels/GenAIUtil';
import { updateGenerateBuildingPrompt } from 'src/cloudProjectUtil';
import { Util } from '../Util';
import { AI_MODELS_NAME } from 'functions/src/callSolarPowerTowerAI';
import { callUrbanDesignClaudeAI, callUrbanDesignOpenAI } from 'functions/src/callUrbanDesignAI';
import { FoundationModel } from 'src/models/FoundationModel';
import { CuboidModel } from 'src/models/CuboidModel';
import short from 'short-uuid';
import * as Constants from '../constants';

export interface GenerateUrbanDesignProps {
  setDialogVisible: (visible: boolean) => void;
  isDialogVisible: () => boolean;
}

const { TextArea } = Input;

const GenerateUrbanDesignModal = React.memo(({ setDialogVisible, isDialogVisible }: GenerateUrbanDesignProps) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const reasoningEffort = useStore(Selector.reasoningEffort) ?? 'medium';
  const generateUrbanDesignPrompt = useStore(Selector.generateUrbanDesignPrompt) ?? 'Generate an urban design.';
  const setGenerating = usePrimitiveStore(Selector.setGenerating);
  const setChanged = usePrimitiveStore(Selector.setChanged);

  const aIModel = useStore(Selector.aIModel) ?? AI_MODELS_NAME['OpenAI o4-mini'];
  const [prompt, setPrompt] = useState<string>('Generate Urban Design');
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
    const json = JSON.parse(text);

    console.log('prompt:', prompt);
    console.log('raw:', JSON.parse(text).elements);

    const jsonElements = json.elements ? GenAIUtil.arrayCorrection(json.elements) : [];

    console.log('validated:', jsonElements);
    console.log('thinking:', json.thinking);

    useStore.getState().set((state) => {
      let [minX, maxX] = [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];
      let [minY, maxY] = [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];
      if (jsonElements.length > 0) {
        state.elements = [];
        for (const e of jsonElements) {
          switch (e.type) {
            case ObjectType.Foundation: {
              const [cx, cy] = e.center ?? [0, 0];
              const [lx, ly, lz] = e.size ?? [10, 10, 0.1];
              minX = Math.min(minX, cx - lx / 2);
              maxX = Math.max(maxX, cx + lx / 2);
              minY = Math.min(minY, cy - ly / 2);
              maxY = Math.max(maxY, cy + ly / 2);
              const foundation = {
                id: short.generate() as string,
                parentId: Constants.GROUND_ID,
                type: ObjectType.Foundation,
                cx,
                cy,
                cz: lz / 2,
                lx,
                ly,
                lz,
                rotation: [0, 0, Util.toRadians(e.rotation ?? 0)],
                normal: [0, 0, 1],
                color: '#808080',
                textureType: FoundationTexture.NoTexture,
              } as FoundationModel;
              state.elements.push(foundation);
              break;
            }
            case ObjectType.Cuboid: {
              const [cx, cy] = e.center ?? [0, 0];
              const [lx, ly, lz] = e.size ?? [10, 10, 1];
              minX = Math.min(minX, cx - lx / 2);
              maxX = Math.max(maxX, cx + lx / 2);
              minY = Math.min(minY, cy - ly / 2);
              maxY = Math.max(maxY, cy + ly / 2);
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
                rotation: [0, 0, Util.toRadians(e.rotation ?? 0)],
                normal: [0, 0, 1],
                color: '#808080',
                faceColors: new Array(6).fill(Constants.DEFAULT_CUBOID_COLOR),
                textureTypes: new Array(6).fill(CuboidTexture.NoTexture),
              } as CuboidModel;
              state.elements.push(cuboid);
              break;
            }
          }
        }
      }

      console.log('bounding', minX, maxX, minY, maxY);
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
        const response = await callUrbanDesignOpenAI(
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
        const response = await callUrbanDesignClaudeAI(import.meta.env.VITE_CLAUDE_API_KEY, input as [], true);
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
          <WarningOutlined /> {t('message.GeneratingUrbanDesignMayTakeAWhile', lang)}
        </span>
      </Space>
    </Modal>
  );
});

export default GenerateUrbanDesignModal;
