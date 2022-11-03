/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Checkbox, InputNumber, Menu, Space } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { LightModel } from '../../../models/LightModel';
import SubMenu from 'antd/lib/menu/SubMenu';
import { CompactPicker } from 'react-color';
import { UndoableCheck } from '../../../undo/UndoableCheck';
import { ObjectType } from '../../../types';

export const LightMenu = () => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const addUndoable = useStore(Selector.addUndoable);
  const getParent = useStore(Selector.getParent);
  const updateLightColorById = useStore(Selector.updateLightColorById);
  const updateLightIntensityById = useStore(Selector.updateLightIntensityById);
  const updateLightDistanceById = useStore(Selector.updateLightDistanceById);
  const updateLightInsideById = useStore(Selector.updateInsideLightById);
  const light = useStore(Selector.selectedElement) as LightModel;

  const [inputIntensity, setInputIntensity] = useState<number>(light?.intensity ?? 3);
  const [inputDistance, setInputDistance] = useState<number>(light?.distance ?? 5);
  const [inputColor, setInputColor] = useState<string>(light?.color ?? '#ffff99');
  const [inputInside, setInputInside] = useState<boolean>(light?.inside);

  const lang = { lng: language };

  const setIntensity = (value: number) => {
    if (!light) return;
    if (!value || value === inputIntensity) return;
    const undoableChange = {
      name: 'Set Light Intensity',
      timestamp: Date.now(),
      oldValue: inputIntensity,
      newValue: value,
      changedElementId: light.id,
      undo: () => {
        updateLightIntensityById(undoableChange.changedElementId, undoableChange.oldValue as number);
      },
      redo: () => {
        updateLightIntensityById(undoableChange.changedElementId, undoableChange.newValue as number);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    updateLightIntensityById(light.id, value);
    setInputIntensity(value);
    setCommonStore((state) => {
      state.actionState.lightIntensity = value;
    });
  };

  const setDistance = (value: number) => {
    if (!light) return;
    if (!value || value === inputDistance) return;
    const undoableChange = {
      name: 'Set Light Distance',
      timestamp: Date.now(),
      oldValue: inputDistance,
      newValue: value,
      changedElementId: light.id,
      undo: () => {
        updateLightDistanceById(undoableChange.changedElementId, undoableChange.oldValue as number);
      },
      redo: () => {
        updateLightDistanceById(undoableChange.changedElementId, undoableChange.newValue as number);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    updateLightDistanceById(light.id, value);
    setInputDistance(value);
    setCommonStore((state) => {
      state.actionState.lightDistance = value;
    });
  };

  const parent = light?.parentId ? getParent(light) : undefined;

  return (
    light && (
      <>
        <Copy keyName={'light-copy'} />
        <Cut keyName={'light-cut'} />
        <Lock keyName={'light-lock'} />

        {parent && (parent.type === ObjectType.Roof || parent.type === ObjectType.Wall) && (
          <Menu.Item key={'light-inside'}>
            <Checkbox
              checked={inputInside}
              onChange={(e) => {
                if (!light) return;
                const checked = e.target.checked;
                const undoableCheck = {
                  name: 'Inside Light',
                  timestamp: Date.now(),
                  checked: checked,
                  undo: () => {
                    updateLightInsideById(light.id, !undoableCheck.checked);
                  },
                  redo: () => {
                    updateLightInsideById(light.id, undoableCheck.checked);
                  },
                } as UndoableCheck;
                addUndoable(undoableCheck);
                updateLightInsideById(light.id, checked);
                setInputInside(checked);
              }}
            >
              {i18n.t('lightMenu.Inside', lang)}
            </Checkbox>
          </Menu.Item>
        )}

        <Menu>
          <Menu.Item
            style={{ height: '36px', paddingLeft: '36px', marginBottom: 0, marginTop: 0 }}
            key={'light-intensity'}
          >
            <Space style={{ width: '80px' }}>{i18n.t('lightMenu.Intensity', lang)}:</Space>
            <InputNumber
              min={0.1}
              max={10}
              step={0.1}
              precision={1}
              value={inputIntensity}
              onChange={(value) => setIntensity(value)}
            />
          </Menu.Item>
          <Menu.Item style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }} key={'light-distance'}>
            <Space style={{ width: '80px' }}>{i18n.t('lightMenu.MaximumDistance', lang)}:</Space>
            <InputNumber
              min={1}
              max={10}
              step={1}
              precision={1}
              value={inputDistance}
              onChange={(value) => setDistance(value)}
            />
          </Menu.Item>
        </Menu>

        <SubMenu key={'light-color'} title={i18n.t('word.Color', { lng: language })} style={{ paddingLeft: '24px' }}>
          <CompactPicker
            color={inputColor}
            onChangeComplete={(colorResult) => {
              if (!light) return;
              const oldColor = light.color;
              const newColor = colorResult.hex;
              const undoableChange = {
                name: 'Set Light Color',
                timestamp: Date.now(),
                oldValue: oldColor,
                newValue: newColor,
                undo: () => {
                  updateLightColorById(light.id, undoableChange.oldValue as string);
                },
                redo: () => {
                  updateLightColorById(light.id, undoableChange.newValue as string);
                },
              } as UndoableChange;
              addUndoable(undoableChange);
              updateLightColorById(light.id, newColor);
              setInputColor(newColor);
              setCommonStore((state) => {
                state.actionState.lightColor = newColor;
              });
            }}
          />
        </SubMenu>
      </>
    )
  );
};
