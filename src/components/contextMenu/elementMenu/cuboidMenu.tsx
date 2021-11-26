/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Menu, Modal } from 'antd';
import { Copy, Cut, Lock, Paste } from '../menuItems';
import SubMenu from 'antd/lib/menu/SubMenu';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ObjectType } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableRemoveAllChildren } from '../../../undo/UndoableRemoveAllChildren';
import CuboidColorSelection from './cuboidColorSelection';
import CuboidWidthInput from './cuboidWidthInput';
import CuboidLengthInput from './cuboidLengthInput';
import CuboidHeightInput from './cuboidHeightInput';
import CuboidAzimuthInput from './cuboidAzimuthInput';
import CuboidTextureSelection from './cuboidTextureSelection';

export const CuboidMenu = () => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const selectedElement = getSelectedElement();
  const addUndoable = useStore(Selector.addUndoable);
  const countAllChildElementsByType = useStore(Selector.countAllChildElementsByType);
  const countAllChildSolarPanels = useStore(Selector.countAllChildSolarPanels);
  const removeAllChildElementsByType = useStore(Selector.removeAllChildElementsByType);
  const contextMenuObjectType = useStore(Selector.contextMenuObjectType);

  const [colorDialogVisible, setColorDialogVisible] = useState(false);
  const [textureDialogVisible, setTextureDialogVisible] = useState(false);
  const [widthDialogVisible, setWidthDialogVisible] = useState(false);
  const [lengthDialogVisible, setLengthDialogVisible] = useState(false);
  const [heightDialogVisible, setHeightDialogVisible] = useState(false);
  const [azimuthDialogVisible, setAzimuthDialogVisible] = useState(false);

  const sensorCountCuboid = selectedElement ? countAllChildElementsByType(selectedElement.id, ObjectType.Sensor) : 0;
  const solarRackCountCuboid = selectedElement
    ? countAllChildElementsByType(selectedElement.id, ObjectType.SolarPanel)
    : 0;
  const solarPanelCountCuboid = selectedElement ? countAllChildSolarPanels(selectedElement.id) : 0;
  const lang = { lng: language };

  return (
    <Menu.ItemGroup>
      <Paste />
      <Copy />
      <Cut />
      <Lock />

      {(sensorCountCuboid > 0 || solarPanelCountCuboid > 0) && contextMenuObjectType && (
        <SubMenu key={'clear'} title={i18n.t('word.Clear', lang)} style={{ paddingLeft: '24px' }}>
          {sensorCountCuboid > 0 && (
            <Menu.Item
              key={'remove-all-sensors-on-cuboid'}
              onClick={() => {
                Modal.confirm({
                  title:
                    i18n.t('cuboidMenu.DoYouReallyWantToRemoveAllSensorsOnCuboid', lang) +
                    ' (' +
                    sensorCountCuboid +
                    ' ' +
                    i18n.t('cuboidMenu.Sensors', lang) +
                    ')?',
                  icon: <ExclamationCircleOutlined />,
                  onOk: () => {
                    if (selectedElement) {
                      const removed = elements.filter(
                        (e) => e.type === ObjectType.Sensor && e.parentId === selectedElement.id,
                      );
                      removeAllChildElementsByType(selectedElement.id, ObjectType.Sensor);
                      const removedElements = JSON.parse(JSON.stringify(removed));
                      const undoableRemoveAllSensorChildren = {
                        name: 'Remove All Sensors on Cuboid',
                        timestamp: Date.now(),
                        parentId: selectedElement.id,
                        removedElements: removedElements,
                        undo: () => {
                          setCommonStore((state) => {
                            state.elements.push(...undoableRemoveAllSensorChildren.removedElements);
                          });
                        },
                        redo: () => {
                          removeAllChildElementsByType(undoableRemoveAllSensorChildren.parentId, ObjectType.Sensor);
                        },
                      } as UndoableRemoveAllChildren;
                      addUndoable(undoableRemoveAllSensorChildren);
                    }
                  },
                });
              }}
            >
              {i18n.t('cuboidMenu.RemoveAllSensors', lang)} ({sensorCountCuboid} {i18n.t('cuboidMenu.Sensors', lang)})
            </Menu.Item>
          )}
          {solarPanelCountCuboid > 0 && (
            <Menu.Item
              key={'remove-all-solar-panels-on-cuboid'}
              onClick={() => {
                Modal.confirm({
                  title:
                    i18n.t('cuboidMenu.DoYouReallyWantToRemoveAllSolarPanelsOnCuboid', lang) +
                    ' (' +
                    solarPanelCountCuboid +
                    ' ' +
                    i18n.t('cuboidMenu.SolarPanels', lang) +
                    ', ' +
                    solarRackCountCuboid +
                    ' ' +
                    i18n.t('cuboidMenu.Racks', lang) +
                    ')?',
                  icon: <ExclamationCircleOutlined />,
                  onOk: () => {
                    if (selectedElement) {
                      const removed = elements.filter(
                        (e) => e.type === ObjectType.SolarPanel && e.parentId === selectedElement.id,
                      );
                      removeAllChildElementsByType(selectedElement.id, ObjectType.SolarPanel);
                      const removedElements = JSON.parse(JSON.stringify(removed));
                      const undoableRemoveAllSolarPanelChildren = {
                        name: 'Remove All Solar Panels on Cuboid',
                        timestamp: Date.now(),
                        parentId: selectedElement.id,
                        removedElements: removedElements,
                        undo: () => {
                          setCommonStore((state) => {
                            state.elements.push(...undoableRemoveAllSolarPanelChildren.removedElements);
                          });
                        },
                        redo: () => {
                          removeAllChildElementsByType(
                            undoableRemoveAllSolarPanelChildren.parentId,
                            ObjectType.SolarPanel,
                          );
                        },
                      } as UndoableRemoveAllChildren;
                      addUndoable(undoableRemoveAllSolarPanelChildren);
                    }
                  },
                });
              }}
            >
              {i18n.t('cuboidMenu.RemoveAllSolarPanels', lang)}&nbsp; ({solarPanelCountCuboid}{' '}
              {i18n.t('cuboidMenu.SolarPanels', lang)},{solarRackCountCuboid} {i18n.t('cuboidMenu.Racks', lang)})
            </Menu.Item>
          )}
        </SubMenu>
      )}

      <CuboidColorSelection colorDialogVisible={colorDialogVisible} setColorDialogVisible={setColorDialogVisible} />
      <Menu.Item
        key={'cuboid-color'}
        style={{ paddingLeft: '36px' }}
        onClick={() => {
          setColorDialogVisible(true);
        }}
      >
        {i18n.t('word.Color', lang)} ...
      </Menu.Item>

      <CuboidTextureSelection
        textureDialogVisible={textureDialogVisible}
        setTextureDialogVisible={setTextureDialogVisible}
      />
      <Menu.Item
        key={'cuboid-texture'}
        style={{ paddingLeft: '36px' }}
        onClick={() => {
          setTextureDialogVisible(true);
        }}
      >
        {i18n.t('word.Texture', lang)} ...
      </Menu.Item>

      <CuboidWidthInput widthDialogVisible={widthDialogVisible} setWidthDialogVisible={setWidthDialogVisible} />
      <Menu.Item
        key={'cuboid-width'}
        style={{ paddingLeft: '36px' }}
        onClick={() => {
          setWidthDialogVisible(true);
        }}
      >
        {i18n.t('word.Width', lang)} ...
      </Menu.Item>

      <CuboidLengthInput lengthDialogVisible={lengthDialogVisible} setLengthDialogVisible={setLengthDialogVisible} />
      <Menu.Item
        key={'cuboid-length'}
        style={{ paddingLeft: '36px' }}
        onClick={() => {
          setLengthDialogVisible(true);
        }}
      >
        {i18n.t('word.Length', lang)} ...
      </Menu.Item>

      <CuboidHeightInput heightDialogVisible={heightDialogVisible} setHeightDialogVisible={setHeightDialogVisible} />
      <Menu.Item
        key={'cuboid-height'}
        style={{ paddingLeft: '36px' }}
        onClick={() => {
          setHeightDialogVisible(true);
        }}
      >
        {i18n.t('word.Height', lang)} ...
      </Menu.Item>

      <CuboidAzimuthInput
        azimuthDialogVisible={azimuthDialogVisible}
        setAzimuthDialogVisible={setAzimuthDialogVisible}
      />
      <Menu.Item
        key={'cuboid-azimuth'}
        style={{ paddingLeft: '36px' }}
        onClick={() => {
          setAzimuthDialogVisible(true);
        }}
      >
        {i18n.t('word.Azimuth', lang)} ...
      </Menu.Item>
    </Menu.ItemGroup>
  );
};
