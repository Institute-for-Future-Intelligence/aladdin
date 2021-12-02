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
import { FoundationTexture, ObjectType } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableRemoveAllChildren } from '../../../undo/UndoableRemoveAllChildren';
import FoundationColorSelection from './foundationColorSelection';
import FoundationWidthInput from './foundationWidthInput';
import FoundationLengthInput from './foundationLengthInput';
import FoundationHeightInput from './foundationHeightInput';
import FoundationAzimuthInput from './foundationAzimuthInput';
import FoundationTextureSelection from './foundationTextureSelection';
import { FoundationModel } from '../../../models/FoundationModel';

export const FoundationMenu = () => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const getSelectedElement = useStore(Selector.getSelectedElement);
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

  const foundation = getSelectedElement() as FoundationModel;
  const wallCountFoundation = foundation ? countAllChildElementsByType(foundation.id, ObjectType.Wall) : 0;
  const sensorCountFoundation = foundation ? countAllChildElementsByType(foundation.id, ObjectType.Sensor) : 0;
  const solarRackCountFoundation = foundation ? countAllChildElementsByType(foundation.id, ObjectType.SolarPanel) : 0;
  const solarPanelCountFoundation = foundation ? countAllChildSolarPanels(foundation.id) : 0;
  const lang = { lng: language };

  return (
    <Menu.ItemGroup>
      <Paste />
      <Copy />
      <Cut />
      <Lock />
      {(sensorCountFoundation > 0 || solarPanelCountFoundation > 0 || wallCountFoundation > 0) &&
        contextMenuObjectType && (
          <SubMenu key={'clear'} title={i18n.t('word.Clear', lang)} style={{ paddingLeft: '24px' }}>
            {wallCountFoundation > 0 && (
              <Menu.Item
                key={'remove-all-walls-on-foundation'}
                onClick={() => {
                  Modal.confirm({
                    title:
                      i18n.t('foundationMenu.DoYouReallyWantToRemoveAllWallsOnFoundation', lang) +
                      ' (' +
                      wallCountFoundation +
                      ' ' +
                      i18n.t('foundationMenu.Walls', lang) +
                      ')?',
                    icon: <ExclamationCircleOutlined />,
                    onOk: () => {
                      if (foundation) {
                        const removed = elements.filter(
                          (e) => e.type === ObjectType.Wall && e.parentId === foundation.id,
                        );
                        removeAllChildElementsByType(foundation.id, ObjectType.Wall);
                        const removedElements = JSON.parse(JSON.stringify(removed));
                        const undoableRemoveAllWallChildren = {
                          name: 'Remove All Walls on Foundation',
                          timestamp: Date.now(),
                          parentId: foundation.id,
                          removedElements: removedElements,
                          undo: () => {
                            setCommonStore((state) => {
                              state.elements.push(...undoableRemoveAllWallChildren.removedElements);
                            });
                          },
                          redo: () => {
                            removeAllChildElementsByType(undoableRemoveAllWallChildren.parentId, ObjectType.Wall);
                          },
                        } as UndoableRemoveAllChildren;
                        addUndoable(undoableRemoveAllWallChildren);
                      }
                    },
                  });
                }}
              >
                {i18n.t('foundationMenu.RemoveAllWalls', lang)} ({wallCountFoundation})
              </Menu.Item>
            )}

            {sensorCountFoundation > 0 && (
              <Menu.Item
                key={'remove-all-sensors-on-foundation'}
                onClick={() => {
                  Modal.confirm({
                    title:
                      i18n.t('foundationMenu.DoYouReallyWantToRemoveAllSensorsOnFoundation', lang) +
                      ' (' +
                      sensorCountFoundation +
                      ' ' +
                      i18n.t('foundationMenu.Sensors', lang) +
                      ')?',
                    icon: <ExclamationCircleOutlined />,
                    onOk: () => {
                      if (foundation) {
                        const removed = elements.filter(
                          (e) => e.type === ObjectType.Sensor && e.parentId === foundation.id,
                        );
                        removeAllChildElementsByType(foundation.id, ObjectType.Sensor);
                        const removedElements = JSON.parse(JSON.stringify(removed));
                        const undoableRemoveAllSensorChildren = {
                          name: 'Remove All Sensors on Foundation',
                          timestamp: Date.now(),
                          parentId: foundation.id,
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
                {i18n.t('foundationMenu.RemoveAllSensors', lang)} ({sensorCountFoundation})
              </Menu.Item>
            )}

            {solarPanelCountFoundation > 0 && (
              <Menu.Item
                key={'remove-all-solar-panels-on-foundation'}
                onClick={() => {
                  Modal.confirm({
                    title:
                      i18n.t('foundationMenu.DoYouReallyWantToRemoveAllSolarPanelsOnFoundation', lang) +
                      ' (' +
                      solarPanelCountFoundation +
                      ' ' +
                      i18n.t('foundationMenu.SolarPanels', lang) +
                      ', ' +
                      solarRackCountFoundation +
                      ' ' +
                      i18n.t('foundationMenu.Racks', lang) +
                      ')?',
                    icon: <ExclamationCircleOutlined />,
                    onOk: () => {
                      if (foundation) {
                        const removed = elements.filter(
                          (e) => e.type === ObjectType.SolarPanel && e.parentId === foundation.id,
                        );
                        removeAllChildElementsByType(foundation.id, ObjectType.SolarPanel);
                        const removedElements = JSON.parse(JSON.stringify(removed));
                        const undoableRemoveAllSolarPanelChildren = {
                          name: 'Remove All Solar Panels on Foundation',
                          timestamp: Date.now(),
                          parentId: foundation.id,
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
                {i18n.t('foundationMenu.RemoveAllSolarPanels', lang)}&nbsp; ({solarPanelCountFoundation}{' '}
                {i18n.t('foundationMenu.SolarPanels', lang)}, {solarRackCountFoundation}{' '}
                {i18n.t('foundationMenu.Racks', lang)})
              </Menu.Item>
            )}
          </SubMenu>
        )}

      <FoundationColorSelection colorDialogVisible={colorDialogVisible} setColorDialogVisible={setColorDialogVisible} />
      {(!foundation.textureType || foundation.textureType === FoundationTexture.NoTexture) && (
        <Menu.Item
          key={'foundation-color'}
          style={{ paddingLeft: '36px' }}
          onClick={() => {
            setColorDialogVisible(true);
          }}
        >
          {i18n.t('word.Color', lang)} ...
        </Menu.Item>
      )}

      <FoundationTextureSelection
        textureDialogVisible={textureDialogVisible}
        setTextureDialogVisible={setTextureDialogVisible}
      />
      <Menu.Item
        key={'foundation-texture'}
        style={{ paddingLeft: '36px' }}
        onClick={() => {
          setTextureDialogVisible(true);
        }}
      >
        {i18n.t('word.Texture', lang)} ...
      </Menu.Item>

      <FoundationWidthInput widthDialogVisible={widthDialogVisible} setWidthDialogVisible={setWidthDialogVisible} />
      <Menu.Item
        key={'foundation-width'}
        style={{ paddingLeft: '36px' }}
        onClick={() => {
          setWidthDialogVisible(true);
        }}
      >
        {i18n.t('word.Width', lang)} ...
      </Menu.Item>

      <FoundationLengthInput
        lengthDialogVisible={lengthDialogVisible}
        setLengthDialogVisible={setLengthDialogVisible}
      />
      <Menu.Item
        key={'foundation-length'}
        style={{ paddingLeft: '36px' }}
        onClick={() => {
          setLengthDialogVisible(true);
        }}
      >
        {i18n.t('word.Length', lang)} ...
      </Menu.Item>

      <FoundationHeightInput
        heightDialogVisible={heightDialogVisible}
        setHeightDialogVisible={setHeightDialogVisible}
      />
      <Menu.Item
        key={'foundation-height'}
        style={{ paddingLeft: '36px' }}
        onClick={() => {
          setHeightDialogVisible(true);
        }}
      >
        {i18n.t('word.Height', lang)} ...
      </Menu.Item>

      <FoundationAzimuthInput
        azimuthDialogVisible={azimuthDialogVisible}
        setAzimuthDialogVisible={setAzimuthDialogVisible}
      />
      <Menu.Item
        key={'foundation-azimuth'}
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
