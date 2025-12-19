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
import { callCSPAI } from 'functions/src/callCSPAI';
import { FoundationTexture, ObjectType, SolarStructure } from 'src/types';
import * as Constants from '../constants';
import { updateGenerateCSPPrompt } from 'src/cloudProjectUtil';
import { HeliostatModel } from 'src/models/HeliostatModel';
import { FoundationModel } from 'src/models/FoundationModel';
import short from 'short-uuid';

import { create, all } from 'mathjs';
const math = create(all);

export interface GenerateBuildingModalProps {
  setDialogVisible: (visible: boolean) => void;
  isDialogVisible: boolean;
}

const { TextArea } = Input;

const GenerateCSPModal = React.memo(({ setDialogVisible, isDialogVisible }: GenerateBuildingModalProps) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const reasoningEffort = useStore(Selector.reasoningEffort) ?? 'medium';
  const generateCSPPrompt = useStore(Selector.generateCSPPrompt) ?? 'Generate CSP with Fermat spiral';
  const setGenerating = usePrimitiveStore(Selector.setGenerating);
  const setChanged = usePrimitiveStore(Selector.setChanged);

  const [prompt, setPrompt] = useState<string>('Generate CSP with Fermat spiral');
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
    setPrompt(generateCSPPrompt);
  }, [generateCSPPrompt]);

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

  const processResult = (text: string) => {
    const json = JSON.parse(text);

    console.log('prompt:', prompt);
    console.log('raw', JSON.parse(text));
    console.log('thinking:', json.thinking);
    console.log(json.fn);

    const fn = math.evaluate(json.fn);
    const N = json.N;
    const heliostatProperties = json.heliostat;
    const towerProperties = json.tower;

    const points = [...Array(N).keys()].map((i) => fn(i + 1)._data);

    useStore.getState().set((state) => {
      state.elements = [];

      const towerRadius = Math.max(1, towerProperties.radius ?? 1);
      const towerHeight = Math.max(10, towerProperties.height ?? 20);
      const towerFoundation = {
        type: ObjectType.Foundation,
        cx: towerProperties.center[0] ?? 0,
        cy: towerProperties.center[1] ?? 0,
        cz: 1.5,
        lx: Math.max(10, towerRadius * 4),
        ly: Math.max(10, towerRadius * 4),
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
        maxX = math.max(Math.abs(p[0]), maxX);
        maxY = math.max(Math.abs(p[1]), maxY);
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

      for (const p of points) {
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
  };

  const callFromFirebaseFunction = async () => {
    try {
      const functions = getFunctions(app, 'us-east4');
      const callAzure = httpsCallable(functions, 'callAzure', { timeout: 300000 });
      const input = createInput();
      console.log('calling...', input); // for debugging
      const res = (await callAzure({
        text: input,
        type: 'CSP',
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
      const response = await callCSPAI(apiKey, input as [], true, reasoningEffort);
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
      state.projectState.generateCSPPrompt = prompt;
    });
    handleGenerativeAI().then(() => {
      setChanged(true);
      const userid = useStore.getState().user.uid;
      const projectTitle = useStore.getState().projectState.title;
      if (userid && projectTitle) updateGenerateCSPPrompt(userid, projectTitle, prompt);
    });
    close();
  };

  const onCancel = () => {
    setPrompt(generateCSPPrompt);
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
          <img src={GenaiImage} width={'16px'} alt={'genai'} /> {t('projectPanel.GenerateCSP', lang)}
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
          {i18n.t('projectPanel.WhatCSPDoYouWant', lang)}
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
          <WarningOutlined /> {t('message.GeneratingCSPMayTakeAWhile', lang)}
        </span>
      </Space>
    </Modal>
  );
});

export default GenerateCSPModal;
