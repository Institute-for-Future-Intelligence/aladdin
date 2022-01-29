/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
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
import FoundationLengthInput from './foundationLengthInput';
import FoundationWidthInput from './foundationWidthInput';
import FoundationHeightInput from './foundationHeightInput';
import FoundationAzimuthInput from './foundationAzimuthInput';
import FoundationTextureSelection from './foundationTextureSelection';
import { FoundationModel } from '../../../models/FoundationModel';
import { UndoableAdd } from '../../../undo/UndoableAdd';
import { Vector3 } from 'three';
import { UNIT_VECTOR_POS_Z } from '../../../constants';

export const FoundationMenu = () => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const foundation = useStore(Selector.selectedElement) as FoundationModel;
  const addUndoable = useStore(Selector.addUndoable);
  const countAllChildElementsByType = useStore(Selector.countAllChildElementsByType);
  const countAllChildSolarPanels = useStore(Selector.countAllChildSolarPanels);
  const removeAllChildElementsByType = useStore(Selector.removeAllChildElementsByType);
  const contextMenuObjectType = useStore(Selector.contextMenuObjectType);
  const elementsToPaste = useStore(Selector.elementsToPaste);
  const addElement = useStore(Selector.addElement);
  const removeElementById = useStore(Selector.removeElementById);
  const setApplyCount = useStore(Selector.setApplyCount);

  const [colorDialogVisible, setColorDialogVisible] = useState(false);
  const [textureDialogVisible, setTextureDialogVisible] = useState(false);
  const [widthDialogVisible, setWidthDialogVisible] = useState(false);
  const [lengthDialogVisible, setLengthDialogVisible] = useState(false);
  const [heightDialogVisible, setHeightDialogVisible] = useState(false);
  const [azimuthDialogVisible, setAzimuthDialogVisible] = useState(false);

  const humanCountFoundation = foundation ? countAllChildElementsByType(foundation.id, ObjectType.Human, true) : 0;
  const treeCountFoundation = foundation ? countAllChildElementsByType(foundation.id, ObjectType.Tree, true) : 0;
  const wallCountFoundation = foundation ? countAllChildElementsByType(foundation.id, ObjectType.Wall, true) : 0;
  const polygonCountFoundation = foundation ? countAllChildElementsByType(foundation.id, ObjectType.Polygon, true) : 0;
  const sensorCountFoundation = foundation ? countAllChildElementsByType(foundation.id, ObjectType.Sensor, true) : 0;
  const solarRackCountFoundation = foundation
    ? countAllChildElementsByType(foundation.id, ObjectType.SolarPanel, true)
    : 0;
  const solarPanelCountFoundation = foundation ? countAllChildSolarPanels(foundation.id, true) : 0;
  const lang = { lng: language };

  const legalToPaste = () => {
    if (elementsToPaste && elementsToPaste.length > 0) {
      // when there are multiple elements to paste, the first element is the parent
      // we check the legality of the parent here
      const e = elementsToPaste[0];
      if (
        e.type === ObjectType.Human ||
        e.type === ObjectType.Tree ||
        e.type === ObjectType.Polygon ||
        e.type === ObjectType.Sensor ||
        e.type === ObjectType.SolarPanel
      ) {
        return true;
      }
    }
    return false;
  };

  const editable = !foundation?.locked;

  return (
    foundation && (
      <Menu.ItemGroup>
        {legalToPaste() && <Paste keyName={'foundation-paste'} />}
        <Copy keyName={'foundation-copy'} />
        {editable && <Cut keyName={'foundation-cut'} />}
        <Lock keyName={'foundation-lock'} />
        {(sensorCountFoundation > 0 ||
          solarPanelCountFoundation > 0 ||
          treeCountFoundation > 0 ||
          humanCountFoundation > 0 ||
          wallCountFoundation > 0 ||
          polygonCountFoundation > 0) &&
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
                            (e) => !e.locked && e.type === ObjectType.Wall && e.parentId === foundation.id,
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
                                state.updateWallMapOnFoundation = !state.updateWallMapOnFoundation;
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
                  {i18n.t('foundationMenu.RemoveAllUnlockedWalls', lang)} ({wallCountFoundation})
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
                            (e) => !e.locked && e.type === ObjectType.Sensor && e.parentId === foundation.id,
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
                  {i18n.t('foundationMenu.RemoveAllUnlockedSensors', lang)} ({sensorCountFoundation})
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
                            (e) => !e.locked && e.type === ObjectType.SolarPanel && e.parentId === foundation.id,
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
                                state.updateDesignInfo();
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
                  {i18n.t('foundationMenu.RemoveAllUnlockedSolarPanels', lang)}&nbsp; ({solarPanelCountFoundation}{' '}
                  {i18n.t('foundationMenu.SolarPanels', lang)}, {solarRackCountFoundation}{' '}
                  {i18n.t('foundationMenu.Racks', lang)})
                </Menu.Item>
              )}

              {polygonCountFoundation > 0 && (
                <Menu.Item
                  key={'remove-all-polygons-on-foundation'}
                  onClick={() => {
                    Modal.confirm({
                      title:
                        i18n.t('foundationMenu.DoYouReallyWantToRemoveAllPolygonsOnFoundation', lang) +
                        ' (' +
                        polygonCountFoundation +
                        ' ' +
                        i18n.t('foundationMenu.Polygons', lang) +
                        ')?',
                      icon: <ExclamationCircleOutlined />,
                      onOk: () => {
                        if (foundation) {
                          const removed = elements.filter(
                            (e) => !e.locked && e.type === ObjectType.Polygon && e.parentId === foundation.id,
                          );
                          removeAllChildElementsByType(foundation.id, ObjectType.Polygon);
                          const removedElements = JSON.parse(JSON.stringify(removed));
                          const undoableRemoveAllPolygonChildren = {
                            name: 'Remove All Polygons on Foundation',
                            timestamp: Date.now(),
                            parentId: foundation.id,
                            removedElements: removedElements,
                            undo: () => {
                              setCommonStore((state) => {
                                state.elements.push(...undoableRemoveAllPolygonChildren.removedElements);
                              });
                            },
                            redo: () => {
                              removeAllChildElementsByType(
                                undoableRemoveAllPolygonChildren.parentId,
                                ObjectType.Polygon,
                              );
                            },
                          } as UndoableRemoveAllChildren;
                          addUndoable(undoableRemoveAllPolygonChildren);
                        }
                      },
                    });
                  }}
                >
                  {i18n.t('foundationMenu.RemoveAllUnlockedPolygons', lang)} ({polygonCountFoundation})
                </Menu.Item>
              )}

              {humanCountFoundation > 0 && (
                <Menu.Item
                  key={'remove-all-humans-on-foundation'}
                  onClick={() => {
                    Modal.confirm({
                      title:
                        i18n.t('foundationMenu.DoYouReallyWantToRemoveAllHumansOnFoundation', lang) +
                        ' (' +
                        humanCountFoundation +
                        ' ' +
                        i18n.t('foundationMenu.Humans', lang) +
                        ')?',
                      icon: <ExclamationCircleOutlined />,
                      onOk: () => {
                        if (foundation) {
                          const removed = elements.filter(
                            (e) => !e.locked && e.type === ObjectType.Human && e.parentId === foundation.id,
                          );
                          removeAllChildElementsByType(foundation.id, ObjectType.Human);
                          const removedElements = JSON.parse(JSON.stringify(removed));
                          const undoableRemoveAllHumanChildren = {
                            name: 'Remove All Humans on Foundation',
                            timestamp: Date.now(),
                            parentId: foundation.id,
                            removedElements: removedElements,
                            undo: () => {
                              setCommonStore((state) => {
                                state.elements.push(...undoableRemoveAllHumanChildren.removedElements);
                              });
                            },
                            redo: () => {
                              removeAllChildElementsByType(undoableRemoveAllHumanChildren.parentId, ObjectType.Human);
                            },
                          } as UndoableRemoveAllChildren;
                          addUndoable(undoableRemoveAllHumanChildren);
                        }
                      },
                    });
                  }}
                >
                  {i18n.t('foundationMenu.RemoveAllUnlockedHumans', lang)} ({humanCountFoundation})
                </Menu.Item>
              )}

              {treeCountFoundation > 0 && (
                <Menu.Item
                  key={'remove-all-trees-on-foundation'}
                  onClick={() => {
                    Modal.confirm({
                      title:
                        i18n.t('foundationMenu.DoYouReallyWantToRemoveAllTreesOnFoundation', lang) +
                        ' (' +
                        treeCountFoundation +
                        ' ' +
                        i18n.t('foundationMenu.Trees', lang) +
                        ')?',
                      icon: <ExclamationCircleOutlined />,
                      onOk: () => {
                        if (foundation) {
                          const removed = elements.filter(
                            (e) => !e.locked && e.type === ObjectType.Tree && e.parentId === foundation.id,
                          );
                          removeAllChildElementsByType(foundation.id, ObjectType.Tree);
                          const removedElements = JSON.parse(JSON.stringify(removed));
                          const undoableRemoveAllTreeChildren = {
                            name: 'Remove All Trees on Foundation',
                            timestamp: Date.now(),
                            parentId: foundation.id,
                            removedElements: removedElements,
                            undo: () => {
                              setCommonStore((state) => {
                                state.elements.push(...undoableRemoveAllTreeChildren.removedElements);
                              });
                            },
                            redo: () => {
                              removeAllChildElementsByType(undoableRemoveAllTreeChildren.parentId, ObjectType.Tree);
                            },
                          } as UndoableRemoveAllChildren;
                          addUndoable(undoableRemoveAllTreeChildren);
                        }
                      },
                    });
                  }}
                >
                  {i18n.t('foundationMenu.RemoveAllUnlockedTrees', lang)} ({treeCountFoundation})
                </Menu.Item>
              )}
            </SubMenu>
          )}

        {editable && (!foundation.textureType || foundation.textureType === FoundationTexture.NoTexture) && (
          <>
            <FoundationColorSelection dialogVisible={colorDialogVisible} setDialogVisible={setColorDialogVisible} />
            <Menu.Item
              key={'foundation-color'}
              style={{ paddingLeft: '36px' }}
              onClick={() => {
                setApplyCount(0);
                setColorDialogVisible(true);
              }}
            >
              {i18n.t('word.Color', lang)} ...
            </Menu.Item>
          </>
        )}

        {editable && (
          <>
            <FoundationTextureSelection
              dialogVisible={textureDialogVisible}
              setDialogVisible={setTextureDialogVisible}
            />
            <Menu.Item
              key={'foundation-texture'}
              style={{ paddingLeft: '36px' }}
              onClick={() => {
                setApplyCount(0);
                setTextureDialogVisible(true);
              }}
            >
              {i18n.t('word.Texture', lang)} ...
            </Menu.Item>

            <FoundationLengthInput dialogVisible={lengthDialogVisible} setDialogVisible={setLengthDialogVisible} />
            <Menu.Item
              key={'foundation-length'}
              style={{ paddingLeft: '36px' }}
              onClick={() => {
                setApplyCount(0);
                setLengthDialogVisible(true);
              }}
            >
              {i18n.t('word.Length', lang)} ...
            </Menu.Item>

            <FoundationWidthInput dialogVisible={widthDialogVisible} setDialogVisible={setWidthDialogVisible} />
            <Menu.Item
              key={'foundation-width'}
              style={{ paddingLeft: '36px' }}
              onClick={() => {
                setApplyCount(0);
                setWidthDialogVisible(true);
              }}
            >
              {i18n.t('word.Width', lang)} ...
            </Menu.Item>

            <FoundationHeightInput dialogVisible={heightDialogVisible} setDialogVisible={setHeightDialogVisible} />
            <Menu.Item
              key={'foundation-height'}
              style={{ paddingLeft: '36px' }}
              onClick={() => {
                setApplyCount(0);
                setHeightDialogVisible(true);
              }}
            >
              {i18n.t('word.Height', lang)} ...
            </Menu.Item>

            <FoundationAzimuthInput dialogVisible={azimuthDialogVisible} setDialogVisible={setAzimuthDialogVisible} />
            <Menu.Item
              key={'foundation-azimuth'}
              style={{ paddingLeft: '36px' }}
              onClick={() => {
                setApplyCount(0);
                setAzimuthDialogVisible(true);
              }}
            >
              {i18n.t('word.Azimuth', lang)} ...
            </Menu.Item>
          </>
        )}

        <Menu.Item
          style={{ paddingLeft: '36px' }}
          key={'add-polygon-on-foundation'}
          onClick={() => {
            if (foundation) {
              setCommonStore((state) => {
                state.objectTypeToAdd = ObjectType.Polygon;
              });
              const element = addElement(
                foundation,
                new Vector3(foundation.cx, foundation.cy, foundation.lz),
                UNIT_VECTOR_POS_Z,
              );
              const undoableAdd = {
                name: 'Add',
                timestamp: Date.now(),
                addedElement: element,
                undo: () => {
                  removeElementById(undoableAdd.addedElement.id, false);
                },
                redo: () => {
                  setCommonStore((state) => {
                    state.elements.push(undoableAdd.addedElement);
                    state.selectedElement = undoableAdd.addedElement;
                  });
                },
              } as UndoableAdd;
              addUndoable(undoableAdd);
              setCommonStore((state) => {
                state.objectTypeToAdd = ObjectType.None;
              });
            }
          }}
        >
          {i18n.t('foundationMenu.AddPolygon', lang)}
        </Menu.Item>
      </Menu.ItemGroup>
    )
  );
};
