/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Menu, Modal, Radio } from 'antd';
import SubMenu from 'antd/lib/menu/SubMenu';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Lock, Paste } from '../menuItems';
import i18n from '../../../i18n/i18n';
import WallTextureSelection from './wallTextureSelection';
import WallOpacityInput from './wallOpacityInput';
import WallThicknessInput from './wallThicknessInput';
import WallColorSelection from './wallColorSelection';
import { WallModel, WallStructure } from 'src/models/WallModel';
import { ObjectType, WallTexture } from 'src/types';
import { ElementCounter } from '../../../stores/ElementCounter';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { UndoableRemoveAllChildren } from '../../../undo/UndoableRemoveAllChildren';
import { Util } from 'src/Util';
import WallHeightInput from './wallHeightInput';

export const WallMenu = () => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const wall = useStore(Selector.selectedElement) as WallModel;
  const elementsToPaste = useStore(Selector.elementsToPaste);
  const language = useStore(Selector.language);
  const setApplyCount = useStore(Selector.setApplyCount);
  const countAllOffspringsByType = useStore(Selector.countAllOffspringsByTypeAtOnce);
  const removeAllChildElementsByType = useStore(Selector.removeAllChildElementsByType);
  const contextMenuObjectType = useStore(Selector.contextMenuObjectType);
  const addUndoable = useStore(Selector.addUndoable);
  const updateWallStructureById = useStore(Selector.updateWallStructureById);
  const [selectedStructure, setSelectedStructure] = useState(wall?.wallStructure ?? WallStructure.Default);

  const [textureDialogVisible, setTextureDialogVisible] = useState(false);
  const [colorDialogVisible, setColorDialogVisible] = useState(false);
  const [heightDialogVisible, setHeightDialogVisible] = useState(false);
  const [opacityDialogVisible, setOpacityDialogVisible] = useState(false);
  const [thicknessDialogVisible, setThicknessDialogVisible] = useState(false);

  const counter = wall ? countAllOffspringsByType(wall.id) : new ElementCounter();
  const lang = { lng: language };
  const paddingLeft = '36px';

  const legalToPaste = () => {
    if (elementsToPaste && elementsToPaste.length > 0) {
      const e = elementsToPaste[0];
      if (Util.isLegalOnWall(e.type)) {
        return true;
      }
    }
    return false;
  };

  const radioStyle = {
    display: 'block',
    height: '30px',
    paddingLeft: '10px',
    lineHeight: '30px',
  };

  return (
    wall && (
      <Menu.ItemGroup>
        {legalToPaste() && <Paste keyName={'wall-paste'} />}
        {/* <Copy keyName={'wall-copy'} /> */}
        {/* <Cut keyName={'wall-cut'} /> */}
        <Lock keyName={'wall-lock'} />

        {!wall.locked && (
          <>
            <SubMenu
              key={'wall-structure'}
              title={i18n.t('wallMenu.WallStructure', lang)}
              style={{ paddingLeft: '24px' }}
            >
              <Radio.Group
                value={selectedStructure}
                style={{ height: '75px' }}
                onChange={(e) => {
                  updateWallStructureById(wall.id, e.target.value);
                  setSelectedStructure(e.target.value);
                }}
              >
                <Radio style={radioStyle} value={WallStructure.Default}>
                  {i18n.t('wallMenu.DefaultStructure', lang)}
                </Radio>
                <Radio style={radioStyle} value={WallStructure.Stud}>
                  {i18n.t('wallMenu.StudStructure', lang)}
                </Radio>
              </Radio.Group>
            </SubMenu>

            {counter.gotSome() && contextMenuObjectType && (
              <SubMenu key={'clear'} title={i18n.t('word.Clear', lang)} style={{ paddingLeft: '24px' }}>
                {counter.windowCount > 0 && (
                  <Menu.Item
                    key={'remove-all-windows-on-wall'}
                    onClick={() => {
                      Modal.confirm({
                        title:
                          i18n.t('wallMenu.DoYouReallyWantToRemoveAllWindowsOnThisWall', lang) +
                          ' (' +
                          counter.windowCount +
                          ' ' +
                          i18n.t('wallMenu.Windows', lang) +
                          ')?',
                        icon: <ExclamationCircleOutlined />,
                        onOk: () => {
                          if (wall) {
                            const removed = elements.filter(
                              (e) => !e.locked && e.type === ObjectType.Window && e.parentId === wall.id,
                            );
                            removeAllChildElementsByType(wall.id, ObjectType.Window);
                            const removedElements = JSON.parse(JSON.stringify(removed));
                            const undoableRemoveAllWindowChildren = {
                              name: 'Remove All Windows on Wall',
                              timestamp: Date.now(),
                              parentId: wall.id,
                              removedElements: removedElements,
                              undo: () => {
                                setCommonStore((state) => {
                                  state.elements.push(...undoableRemoveAllWindowChildren.removedElements);
                                });
                              },
                              redo: () => {
                                removeAllChildElementsByType(
                                  undoableRemoveAllWindowChildren.parentId,
                                  ObjectType.Window,
                                );
                              },
                            } as UndoableRemoveAllChildren;
                            addUndoable(undoableRemoveAllWindowChildren);
                          }
                        },
                      });
                    }}
                  >
                    {i18n.t('wallMenu.RemoveAllUnlockedWindows', lang)} ({counter.windowCount})
                  </Menu.Item>
                )}
                {counter.doorCount > 0 && (
                  <Menu.Item
                    key={'remove-all-doors-on-wall'}
                    onClick={() => {
                      Modal.confirm({
                        title:
                          i18n.t('wallMenu.DoYouReallyWantToRemoveAllDoorsOnThisWall', lang) +
                          ' (' +
                          counter.windowCount +
                          ' ' +
                          i18n.t('wallMenu.Doors', lang) +
                          ')?',
                        icon: <ExclamationCircleOutlined />,
                        onOk: () => {
                          if (wall) {
                            const removed = elements.filter(
                              (e) => !e.locked && e.type === ObjectType.Door && e.parentId === wall.id,
                            );
                            removeAllChildElementsByType(wall.id, ObjectType.Door);
                            const removedElements = JSON.parse(JSON.stringify(removed));
                            const undoableRemoveAllDoorChildren = {
                              name: 'Remove All Doors on Wall',
                              timestamp: Date.now(),
                              parentId: wall.id,
                              removedElements: removedElements,
                              undo: () => {
                                setCommonStore((state) => {
                                  state.elements.push(...undoableRemoveAllDoorChildren.removedElements);
                                });
                              },
                              redo: () => {
                                removeAllChildElementsByType(undoableRemoveAllDoorChildren.parentId, ObjectType.Door);
                              },
                            } as UndoableRemoveAllChildren;
                            addUndoable(undoableRemoveAllDoorChildren);
                          }
                        },
                      });
                    }}
                  >
                    {i18n.t('wallMenu.RemoveAllUnlockedDoors', lang)} ({counter.doorCount})
                  </Menu.Item>
                )}
                {counter.solarPanelCount > 0 && (
                  <Menu.Item
                    key={'remove-all-solar-panels-on-wall'}
                    onClick={() => {
                      Modal.confirm({
                        title:
                          i18n.t('wallMenu.DoYouReallyWantToRemoveAllSolarPanelsOnThisWall', lang) +
                          ' (' +
                          counter.solarPanelCount +
                          ' ' +
                          i18n.t('wallMenu.SolarPanels', lang) +
                          ')?',
                        icon: <ExclamationCircleOutlined />,
                        onOk: () => {
                          if (wall) {
                            const removed = elements.filter(
                              (e) => !e.locked && e.type === ObjectType.SolarPanel && e.parentId === wall.id,
                            );
                            removeAllChildElementsByType(wall.id, ObjectType.SolarPanel);
                            const removedElements = JSON.parse(JSON.stringify(removed));
                            const undoableRemoveAllSolarPanelChildren = {
                              name: 'Remove All Solar Panels on Wall',
                              timestamp: Date.now(),
                              parentId: wall.id,
                              removedElements: removedElements,
                              undo: () => {
                                setCommonStore((state) => {
                                  state.elements.push(...undoableRemoveAllSolarPanelChildren.removedElements);
                                });
                              },
                              redo: () => {
                                removeAllChildElementsByType(
                                  undoableRemoveAllSolarPanelChildren.parentId,
                                  ObjectType.Door,
                                );
                              },
                            } as UndoableRemoveAllChildren;
                            addUndoable(undoableRemoveAllSolarPanelChildren);
                          }
                        },
                      });
                    }}
                  >
                    {i18n.t('wallMenu.RemoveAllUnlockedSolarPanels', lang)} ({counter.solarPanelCount})
                  </Menu.Item>
                )}
              </SubMenu>
            )}

            {textureDialogVisible && <WallTextureSelection setDialogVisible={setTextureDialogVisible} />}
            <Menu.Item
              key={'wall-texture'}
              style={{ paddingLeft: paddingLeft }}
              onClick={() => {
                setApplyCount(0);
                setTextureDialogVisible(true);
              }}
            >
              {i18n.t('word.Texture', lang)} ...
            </Menu.Item>

            {colorDialogVisible && <WallColorSelection setDialogVisible={setColorDialogVisible} />}
            {(wall.textureType === WallTexture.NoTexture || wall.textureType === WallTexture.Default) && (
              <Menu.Item
                key={'wall-color'}
                style={{ paddingLeft: paddingLeft }}
                onClick={() => {
                  setApplyCount(0);
                  setColorDialogVisible(true);
                }}
              >
                {i18n.t('word.Color', lang)} ...
              </Menu.Item>
            )}

            {selectedStructure === WallStructure.Stud && (
              <>
                {opacityDialogVisible && <WallOpacityInput setDialogVisible={setOpacityDialogVisible} />}
                <Menu.Item
                  key={'wall-opacity'}
                  style={{ paddingLeft: paddingLeft }}
                  onClick={() => {
                    setApplyCount(0);
                    setOpacityDialogVisible(true);
                  }}
                >
                  {i18n.t('wallMenu.Opacity', lang)} ...
                </Menu.Item>
              </>
            )}

            {heightDialogVisible && <WallHeightInput setDialogVisible={setHeightDialogVisible} />}
            <Menu.Item
              key={'wall-height'}
              style={{ paddingLeft: paddingLeft }}
              onClick={() => {
                setApplyCount(0);
                setHeightDialogVisible(true);
              }}
            >
              {i18n.t('word.Height', lang)} ...
            </Menu.Item>

            {thicknessDialogVisible && <WallThicknessInput setDialogVisible={setThicknessDialogVisible} />}
            <Menu.Item
              key={'wall-thickness'}
              style={{ paddingLeft: paddingLeft }}
              onClick={() => {
                setApplyCount(0);
                setThicknessDialogVisible(true);
              }}
            >
              {i18n.t('word.Thickness', lang)} ...
            </Menu.Item>
          </>
        )}
      </Menu.ItemGroup>
    )
  );
};
