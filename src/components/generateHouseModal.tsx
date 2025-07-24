/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Checkbox, Input, Modal, Select, Space } from 'antd';
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
import { callAzureOpenAI } from '../../functions/src/callAzureOpenAI';
import { ObjectType } from 'src/types';
import { GenAIUtil } from 'src/panels/genAIUtil';
import { RoofType } from 'src/models/RoofModel';

export interface GenerateHouseModalProps {
  setDialogVisible: (visible: boolean) => void;
  isDialogVisible: () => boolean;
}

const { TextArea } = Input;

const GenerateHouseModal = React.memo(({ setDialogVisible, isDialogVisible }: GenerateHouseModalProps) => {
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

  const handleGenerativeAI = async () => {
    setGenerating(true);
    try {
      const result = await generate();
      if (result) {
        processResult(result);
        setTimeout(() => {
          usePrimitiveStore.getState().set((state) => {
            state.curateDesignToProjectFlag = true;
          });
        }, 1500);
      }
    } finally {
      setGenerating(false);
    }
  };

  const processResult = (text: string) => {
    const json = JSON.parse(text);
    useStore.getState().set((state) => {
      state.elements = [];
      for (const e of json) {
        switch (e.type) {
          case ObjectType.Foundation: {
            const { id, center, size, color } = e;
            const f = GenAIUtil.makeFoundation(id, center, size, color);
            state.elements.push(f);
            break;
          }
          case ObjectType.Wall: {
            const { id, pId, center, size, leftPoint, rightPoint, color } = e;
            const w = GenAIUtil.makeWall(
              id,
              pId,
              center,
              size,
              color,
              leftPoint,
              rightPoint,
              e.leftConnectId,
              e.rightConnectId,
            );
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
              const d = GenAIUtil.makeDoor(id, pId, fId, center, size, color);
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
              const w = GenAIUtil.makeWindow(id, pId, fId, center, size);
              state.elements.push(w);
            }
            break;
          }
          case ObjectType.Roof: {
            switch (e.roofType) {
              case RoofType.Gable: {
                const { id, fId, wId, rise, color } = e;
                const r = GenAIUtil.makeGableRoof(id, fId, wId, rise, color);
                state.elements.push(r);
                state.addedRoofIdSet.add(id);
                break;
              }
              case RoofType.Pyramid: {
                const { id, fId, wId, rise, color } = e;
                const r = GenAIUtil.makePyramidRoof(id, fId, wId, rise, color);
                state.elements.push(r);
                state.addedRoofIdSet.add(id);
              }
            }
            break;
          }
        }
      }
    });
  };

  const generate = async () => {
    if (import.meta.env.PROD) {
      return await callFromFirebaseFunction();
    } else {
      return await callFromBrowser();
    }
  };

  const callFromFirebaseFunction = async () => {
    // const functions = getFunctions(app, 'us-east4');
    // const callAzure = httpsCallable(functions, 'callAzure', { timeout: 300000 });
    // const res = (await callAzure({
    //   text: prompt + ' ' + hydrogen,
    //   reasoningEffort,
    // })) as any;
    // resultRef.current = res.data.text;
    return null;
  };

  const callFromBrowser = async () => {
    const apiKey = import.meta.env.VITE_AZURE_API_KEY;
    try {
      console.log('calling...', prompt);
      const response = await callAzureOpenAI(apiKey, prompt, true, reasoningEffort);
      const result = response.choices[0].message.content;
      console.log('res', result);
      return result;
    } catch (e) {
      console.log(e);
      return null;
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
    handleGenerativeAI();
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
          <img src={GenaiImage} width={'16px'} alt={'genai'} /> {t('projectPanel.GenerateHouse', lang)}
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
          {t('word.Generate', lang)}
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
          {i18n.t('projectPanel.WhatHouseDoYouWant', lang)}
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
                      showError('error', e.toString());
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
          <WarningOutlined /> {t('message.GeneratingAHouseMayTakeAWhile', lang)}
        </span>
      </Space>
    </Modal>
  );
});

export default GenerateHouseModal;
