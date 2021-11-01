/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { InputNumber, Menu, Space } from 'antd';
import { Util } from '../Util';
import { useStore } from '../stores/common';
import { ObjectType } from '../types';
import i18n from '../i18n';

export interface ReshapeElementMenuProps {
  elementId: string;
  name: string;
  maxWidth?: number;
  maxLength?: number;
  maxHeight?: number;
  adjustWidth?: boolean;
  adjustLength?: boolean;
  adjustHeight?: boolean;
  adjustAngle?: boolean;
  widthName?: string;

  [key: string]: any;
}

const ReshapeElementMenu = ({
  elementId,
  name = 'default',
  maxWidth = 1000,
  maxLength = 1000,
  maxHeight = 100,
  adjustWidth = true,
  adjustLength = true,
  adjustHeight = true,
  adjustAngle = true,
  widthName = 'Width',
  ...rest
}: ReshapeElementMenuProps) => {
  const language = useStore((state) => state.language);
  const setElementSize = useStore((state) => state.setElementSize);
  const setElementRotation = useStore((state) => state.setElementRotation);
  const getElementById = useStore((state) => state.getElementById);
  const updateElementById = useStore((state) => state.updateElementById);
  const element = getElementById(elementId);
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const lang = { lng: language };

  return (
    <Menu key={name} {...rest}>
      {adjustWidth && (
        <Menu.Item key={name + '-lx'}>
          <Space style={{ width: '60px' }}>{widthName === 'Width' ? i18n.t('word.Width', lang) : widthName}:</Space>
          <InputNumber
            min={0.1}
            max={maxWidth}
            step={0.5}
            precision={1}
            value={element?.lx ?? 1}
            formatter={(x) => Number(x).toFixed(1) + ' m'}
            onChange={(value) => {
              if (element) {
                setElementSize(element.id, value, element.ly);
                setUpdateFlag(!updateFlag);
              }
            }}
            onPressEnter={(event) => {
              if (element) {
                const text = (event.target as HTMLInputElement).value;
                let value;
                try {
                  value = parseFloat(text.endsWith('m') ? text.substring(0, text.length - 1).trim() : text);
                } catch (err) {
                  console.log(err);
                  return;
                }
                setElementSize(element.id, value, element.ly);
                setUpdateFlag(!updateFlag);
              }
            }}
          />
        </Menu.Item>
      )}
      {adjustLength && (
        <Menu.Item key={name + '-ly'}>
          <Space style={{ width: '60px' }}>{i18n.t('word.Length', lang)}:</Space>
          <InputNumber
            min={0.1}
            max={maxLength}
            step={0.5}
            precision={1}
            value={element?.ly ?? 1}
            formatter={(y) => Number(y).toFixed(1) + ' m'}
            onChange={(value) => {
              if (element && value) {
                setElementSize(element.id, element.lx, value);
                setUpdateFlag(!updateFlag);
              }
            }}
            onPressEnter={(event) => {
              if (element) {
                const text = (event.target as HTMLInputElement).value;
                let value;
                try {
                  value = parseFloat(text.endsWith('m') ? text.substring(0, text.length - 1).trim() : text);
                } catch (err) {
                  console.log(err);
                  return;
                }
                setElementSize(element.id, element.lx, value);
                setUpdateFlag(!updateFlag);
              }
            }}
          />
        </Menu.Item>
      )}
      {adjustHeight && (
        <Menu.Item key={name + '-lz'}>
          <Space style={{ width: '60px' }}>{i18n.t('word.Height', lang)}:</Space>
          <InputNumber
            min={0.1}
            max={maxHeight}
            step={0.1}
            precision={1}
            value={element?.lz ?? 0.1}
            formatter={(h) => Number(h).toFixed(1) + ' m'}
            onChange={(value) => {
              if (element && value) {
                setElementSize(element.id, element.lx, element.ly, value);
                // the following objects stand on the ground and should raise their z coordinates
                if (
                  element.type === ObjectType.Human ||
                  element.type === ObjectType.Tree ||
                  element.type === ObjectType.Foundation ||
                  element.type === ObjectType.Cuboid
                ) {
                  updateElementById(element.id, { cz: value / 2 });
                }
                setUpdateFlag(!updateFlag);
              }
            }}
            onPressEnter={(event) => {
              if (element) {
                const text = (event.target as HTMLInputElement).value;
                let value;
                try {
                  value = parseFloat(text.endsWith('m') ? text.substring(0, text.length - 1).trim() : text);
                } catch (err) {
                  console.log(err);
                  return;
                }
                setElementSize(element.id, element.lx, element.ly, value);
                // the following objects stand on the ground and should raise their z coordinates
                if (
                  element.type === ObjectType.Human ||
                  element.type === ObjectType.Tree ||
                  element.type === ObjectType.Foundation ||
                  element.type === ObjectType.Cuboid
                ) {
                  updateElementById(element.id, { cz: value / 2 });
                }
                setUpdateFlag(!updateFlag);
              }
            }}
          />
        </Menu.Item>
      )}
      {adjustAngle && (
        <Menu.Item key={name + '-angle'}>
          <Space style={{ width: '60px' }}>{i18n.t('word.Angle', lang)}:</Space>
          <InputNumber
            min={-360}
            max={360}
            step={1}
            precision={1}
            value={element ? -Util.toDegrees(element.rotation[2]) : 0}
            formatter={(a) => Number(a).toFixed(1) + '°'}
            onChange={(value) => {
              if (element && value !== null) {
                setElementRotation(element.id, element.rotation[0], element.rotation[1], Util.toRadians(-value));
                setUpdateFlag(!updateFlag);
              }
            }}
            onPressEnter={(event) => {
              if (element) {
                const text = (event.target as HTMLInputElement).value;
                let value;
                try {
                  value = parseFloat(text.endsWith('°') ? text.substring(0, text.length - 1).trim() : text);
                } catch (err) {
                  console.log(err);
                  return;
                }
                setElementRotation(element.id, element.rotation[0], element.rotation[1], Util.toRadians(-value));
                setUpdateFlag(!updateFlag);
              }
            }}
          />
        </Menu.Item>
      )}
    </Menu>
  );
};

export default ReshapeElementMenu;
