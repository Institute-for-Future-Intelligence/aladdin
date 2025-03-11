/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { Select, Space } from 'antd';
import { CommonStoreState, useStore } from '../stores/common';
import React, { useMemo } from 'react';
import { useLanguage } from '../hooks';
import { useTranslation } from 'react-i18next';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { ObjectType, SolarStructure } from '../types';
import { FoundationModel } from '../models/FoundationModel';
import i18n from '../i18n/i18n';
import { FresnelReflectorModel } from '../models/FresnelReflectorModel';

const { Option } = Select;

const FresnelReceiverSelect = ({ fresnel }: { fresnel: FresnelReflectorModel }) => {
  const elements = useStore(Selector.elements);
  const addUndoable = useStore(Selector.addUndoable);

  const lang = useLanguage();
  const { t } = useTranslation();

  const pipes = useMemo(() => {
    const pipeIds: string[] = [];
    for (const e of elements) {
      if (e.type === ObjectType.Foundation) {
        const f = e as FoundationModel;
        if (f.solarStructure === SolarStructure.FocusPipe) {
          pipeIds.push(f.id);
        }
      }
    }
    return pipeIds;
  }, [elements]);

  const update = (receiverId: string) => {
    useStore.getState().set((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.FresnelReflector && e.id === fresnel.id && !e.locked) {
          (e as FresnelReflectorModel).receiverId = receiverId;
          break;
        }
      }
    });
  };

  const setReceiverId = (value: string) => {
    const oldValue = fresnel.receiverId;
    const newValue = value;
    if (oldValue === newValue) return;
    const undoableChange = {
      name: 'Select Receiver for Fresnel Reflector',
      timestamp: Date.now(),
      oldValue,
      newValue,
      undo: () => {
        update(undoableChange.oldValue as string);
      },
      redo: () => {
        update(undoableChange.newValue as string);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    update(newValue);
  };

  return (
    <Space>
      <span>{t('fresnelReflectorMenu.AbsorberPipe', lang)} : </span>
      <Select style={{ width: '120px' }} value={fresnel.receiverId} onChange={setReceiverId}>
        {pipes.map((s, i) => {
          return (
            <Option key={i} value={s}>
              {i18n.t('fresnelReflectorMenu.AbsorberPipe', lang) + ' ' + (i + 1)}
            </Option>
          );
        })}
      </Select>
    </Space>
  );
};

export default FresnelReceiverSelect;
