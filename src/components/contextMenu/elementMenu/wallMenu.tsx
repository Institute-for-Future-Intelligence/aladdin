/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { InputNumber, Menu, Modal, Radio, RadioChangeEvent, Space } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from '../../../i18n/i18n';
import WallSelection from './wallSelection';
import { ElementModel } from '../../../models/ElementModel';
import { WallModel } from '../../../models/WallModel';
import { ObjectType } from '../../../types';

export const WallMenu = () => {
  const language = useStore(Selector.language);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const setCommonStore = useStore(Selector.set);
  const setElementSize = useStore(Selector.setElementSize);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [radioGroup, setRadioGroup] = useState(1);
  const [inputHeightValue, setInputHeightValue] = useState(1);
  const [inputThicknessValue, setInputThicknessValue] = useState(0.1);
  const [originElementArray, setOriginElementArray] = useState<ElementModel[]>([]);

  const wall = getSelectedElement() as WallModel;
  const lang = { lng: language };
  const paddingLeft = '36px';

  useEffect(() => {
    if (wall) {
      setInputThicknessValue(wall.ly);
      setInputHeightValue(wall.lz);
    }
  }, [wall]);

  const onClickSize = () => {
    const elements = useStore.getState().elements;
    setOriginElementArray([...elements]);
    setIsModalVisible(true);
  };

  const onClickModalOk = () => {
    setIsModalVisible(false);
    setOriginElementArray([]);
  };

  const onClickModalCancel = () => {
    setCommonStore((state) => {
      state.elements = [...originElementArray];
    });
    setOriginElementArray([]);
    setIsModalVisible(false);
  };

  const onRadioChange = (e: RadioChangeEvent) => {
    if (wall) {
      const groupNum = e.target.value;
      setRadioGroup(groupNum);

      setCommonStore((state) => {
        state.elements = [...originElementArray];
      });

      setCommonStore((state) => {
        switch (groupNum) {
          case 1: // only selected wall
            for (const e of state.elements) {
              if (e.id === wall.id) {
                e.ly = inputThicknessValue;
                e.lz = inputHeightValue;
              }
            }
            break;

          case 2: // all walls on same foundation
            for (const e of state.elements) {
              if (e.parentId === wall.parentId) {
                e.ly = inputThicknessValue;
                e.lz = inputHeightValue;
              }
            }
            break;

          case 3: // all walls
            for (const e of state.elements) {
              if (e.type === ObjectType.Wall) {
                e.ly = inputThicknessValue;
                e.lz = inputHeightValue;
              }
            }
            break;
        }
      });
    }
  };

  const onChangeHeight = (value: number) => {
    if (wall) {
      setInputHeightValue(value);

      switch (radioGroup) {
        case 1: // only selected wall
          setElementSize(wall.id, wall.lx, wall.ly, value);
          break;

        case 2: // all walls on same foundation
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.parentId === wall.parentId) {
                e.lz = value;
              }
            }
          });
          break;

        case 3: // all walls
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.type === ObjectType.Wall) {
                e.lz = value;
              }
            }
          });
          break;
      }
    }
  };

  const onChangeThickness = (value: number) => {
    if (wall) {
      setInputThicknessValue(value);

      switch (radioGroup) {
        case 1: // only selected wall
          setElementSize(wall.id, wall.lx, value);
          break;

        case 2: // all walls on same foundation
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.parentId === wall.parentId) {
                e.ly = value;
              }
            }
          });
          break;

        case 3: // all walls
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.type === ObjectType.Wall) {
                e.ly = value;
              }
            }
          });
          break;
      }
    }
  };

  return (
    <>
      <Copy />
      <Cut />
      <Lock />
      <Menu>
        <Menu.Item key={'wall-change-texture'} style={{ paddingLeft: paddingLeft }}>
          <Space style={{ width: '60px' }}>{i18n.t('wallMenu.Texture', lang)}: </Space>
          <WallSelection key={'walls'} />
        </Menu.Item>
      </Menu>
      <Menu.Item onClick={onClickSize} style={{ paddingLeft: paddingLeft }}>
        {i18n.t('wallMenu.Size', lang)}...
      </Menu.Item>
      <>
        <Modal
          centered
          title={i18n.t('wallMenu.SizeOfWall', lang)}
          visible={isModalVisible}
          onOk={onClickModalOk}
          onCancel={onClickModalCancel}
        >
          <Radio.Group onChange={onRadioChange} value={radioGroup}>
            <Space direction="vertical">
              <Radio value={1}>{i18n.t('wallMenu.OnlyThisWall', lang)}</Radio>
              <Radio value={2}>{i18n.t('wallMenu.WallsOnFoundation', lang)}</Radio>
              <Radio value={3}>{i18n.t('wallMenu.AllWalls', lang)}</Radio>
            </Space>
          </Radio.Group>
          <br /> <br />
          <Space style={{ width: '50px' }}>{`${i18n.t('word.Height', lang)}:`}</Space>
          <InputNumber
            min={0.1}
            max={50}
            step={0.5}
            precision={1}
            value={inputHeightValue}
            formatter={(n) => Number(n).toFixed(1) + ' m'}
            style={{ width: '80px', marginRight: '20px' }}
            onChange={onChangeHeight}
            onPressEnter={(event) => {
              if (wall) {
                const text = (event.target as HTMLInputElement).value;
                let value: number;
                try {
                  value = parseFloat(text.endsWith('m') ? text.substring(0, text.length - 1).trim() : text);
                  onChangeHeight(value);
                } catch (err) {
                  console.log(err);
                  return;
                }
              }
            }}
          />
          <Space style={{ width: '70px' }}>{`${i18n.t('wallMenu.Thickness', lang)}:`}</Space>
          <InputNumber
            min={0.1}
            max={3}
            step={0.1}
            precision={1}
            value={inputThicknessValue}
            formatter={(n) => Number(n).toFixed(1) + ' m'}
            style={{ width: '80px' }}
            onChange={onChangeThickness}
            onPressEnter={(event) => {
              if (wall) {
                const text = (event.target as HTMLInputElement).value;
                let value: number;
                try {
                  value = parseFloat(text.endsWith('m') ? text.substring(0, text.length - 1).trim() : text);
                  onChangeThickness(value);
                } catch (err) {
                  console.log(err);
                  return;
                }
              }
            }}
          />
        </Modal>
      </>
    </>
  );
};
