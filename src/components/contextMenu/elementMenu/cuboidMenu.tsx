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
import { CuboidTexture, ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableRemoveAllChildren } from '../../../undo/UndoableRemoveAllChildren';
import CuboidColorSelection from './cuboidColorSelection';
import CuboidLengthInput from './cuboidLengthInput';
import CuboidWidthInput from './cuboidWidthInput';
import CuboidHeightInput from './cuboidHeightInput';
import CuboidAzimuthInput from './cuboidAzimuthInput';
import CuboidTextureSelection from './cuboidTextureSelection';
import { CuboidModel } from '../../../models/CuboidModel';
import { UndoableAdd } from '../../../undo/UndoableAdd';
import {
  UNIT_VECTOR_NEG_X,
  UNIT_VECTOR_NEG_Y,
  UNIT_VECTOR_POS_X,
  UNIT_VECTOR_POS_Y,
  UNIT_VECTOR_POS_Z,
} from '../../../constants';
import { Vector3 } from 'three';

export const CuboidMenu = () => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const addUndoable = useStore(Selector.addUndoable);
  const countAllChildElementsByType = useStore(Selector.countAllChildElementsByType);
  const countAllChildSolarPanels = useStore(Selector.countAllChildSolarPanels);
  const removeAllChildElementsByType = useStore(Selector.removeAllChildElementsByType);
  const contextMenuObjectType = useStore(Selector.contextMenuObjectType);
  const selectedSideIndex = useStore(Selector.selectedSideIndex);
  const elementsToPaste = useStore(Selector.elementsToPaste);
  const cuboidActionScope = useStore(Selector.cuboidActionScope);
  const setCuboidActionScope = useStore(Selector.setCuboidActionScope);
  const addElement = useStore(Selector.addElement);
  const removeElementById = useStore(Selector.removeElementById);
  const setApplyCount = useStore(Selector.setApplyCount);

  const [colorDialogVisible, setColorDialogVisible] = useState(false);
  const [textureDialogVisible, setTextureDialogVisible] = useState(false);
  const [widthDialogVisible, setWidthDialogVisible] = useState(false);
  const [lengthDialogVisible, setLengthDialogVisible] = useState(false);
  const [heightDialogVisible, setHeightDialogVisible] = useState(false);
  const [azimuthDialogVisible, setAzimuthDialogVisible] = useState(false);

  const cuboid = getSelectedElement() as CuboidModel;
  const humanCountCuboid = cuboid ? countAllChildElementsByType(cuboid.id, ObjectType.Human, true) : 0;
  const treeCountCuboid = cuboid ? countAllChildElementsByType(cuboid.id, ObjectType.Tree, true) : 0;
  const polygonCountCuboid = cuboid ? countAllChildElementsByType(cuboid.id, ObjectType.Polygon, true) : 0;
  const sensorCountCuboid = cuboid ? countAllChildElementsByType(cuboid.id, ObjectType.Sensor, true) : 0;
  const solarRackCountCuboid = cuboid ? countAllChildElementsByType(cuboid.id, ObjectType.SolarPanel, true) : 0;
  const solarPanelCountCuboid = cuboid ? countAllChildSolarPanels(cuboid.id, true) : 0;
  const lang = { lng: language };

  const legalToPaste = () => {
    if (elementsToPaste && elementsToPaste.length > 0) {
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

  const editable = !cuboid?.locked;

  return (
    cuboid && (
      <Menu.ItemGroup>
        {legalToPaste() && <Paste keyName={'cuboid-paste'} />}
        <Copy keyName={'cuboid-copy'} />
        {editable && <Cut keyName={'cuboid-cut'} />}
        <Lock keyName={'cuboid-lock'} />

        {(humanCountCuboid > 0 ||
          treeCountCuboid > 0 ||
          sensorCountCuboid > 0 ||
          solarPanelCountCuboid > 0 ||
          polygonCountCuboid > 0) &&
          contextMenuObjectType && (
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
                        if (cuboid) {
                          const removed = elements.filter(
                            (e) => !e.locked && e.type === ObjectType.Sensor && e.parentId === cuboid.id,
                          );
                          removeAllChildElementsByType(cuboid.id, ObjectType.Sensor);
                          const removedElements = JSON.parse(JSON.stringify(removed));
                          const undoableRemoveAllSensorChildren = {
                            name: 'Remove All Sensors on Cuboid',
                            timestamp: Date.now(),
                            parentId: cuboid.id,
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
                  {i18n.t('cuboidMenu.RemoveAllUnlockedSensors', lang)} ({sensorCountCuboid}{' '}
                  {i18n.t('cuboidMenu.Sensors', lang)})
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
                        if (cuboid) {
                          const removed = elements.filter(
                            (e) => !e.locked && e.type === ObjectType.SolarPanel && e.parentId === cuboid.id,
                          );
                          removeAllChildElementsByType(cuboid.id, ObjectType.SolarPanel);
                          const removedElements = JSON.parse(JSON.stringify(removed));
                          const undoableRemoveAllSolarPanelChildren = {
                            name: 'Remove All Solar Panels on Cuboid',
                            timestamp: Date.now(),
                            parentId: cuboid.id,
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
                  {i18n.t('cuboidMenu.RemoveAllUnlockedSolarPanels', lang)}&nbsp; ({solarPanelCountCuboid}{' '}
                  {i18n.t('cuboidMenu.SolarPanels', lang)},{solarRackCountCuboid} {i18n.t('cuboidMenu.Racks', lang)})
                </Menu.Item>
              )}

              {polygonCountCuboid > 0 && (
                <Menu.Item
                  key={'remove-all-polygons-on-cuboid'}
                  onClick={() => {
                    Modal.confirm({
                      title:
                        i18n.t('cuboidMenu.DoYouReallyWantToRemoveAllPolygonsOnCuboid', lang) +
                        ' (' +
                        polygonCountCuboid +
                        ' ' +
                        i18n.t('cuboidMenu.Polygons', lang) +
                        ')?',
                      icon: <ExclamationCircleOutlined />,
                      onOk: () => {
                        if (cuboid) {
                          const removed = elements.filter(
                            (e) => !e.locked && e.type === ObjectType.Polygon && e.parentId === cuboid.id,
                          );
                          removeAllChildElementsByType(cuboid.id, ObjectType.Polygon);
                          const removedElements = JSON.parse(JSON.stringify(removed));
                          const undoableRemoveAllPolygonChildren = {
                            name: 'Remove All Polygons on Cuboid',
                            timestamp: Date.now(),
                            parentId: cuboid.id,
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
                  {i18n.t('cuboidMenu.RemoveAllUnlockedPolygons', lang)} ({polygonCountCuboid}{' '}
                  {i18n.t('cuboidMenu.Polygons', lang)})
                </Menu.Item>
              )}

              {humanCountCuboid > 0 && (
                <Menu.Item
                  key={'remove-all-humans-on-cuboid'}
                  onClick={() => {
                    Modal.confirm({
                      title:
                        i18n.t('cuboidMenu.DoYouReallyWantToRemoveAllHumansOnCuboid', lang) +
                        ' (' +
                        humanCountCuboid +
                        ' ' +
                        i18n.t('cuboidMenu.Humans', lang) +
                        ')?',
                      icon: <ExclamationCircleOutlined />,
                      onOk: () => {
                        if (cuboid) {
                          const removed = elements.filter(
                            (e) => !e.locked && e.type === ObjectType.Human && e.parentId === cuboid.id,
                          );
                          removeAllChildElementsByType(cuboid.id, ObjectType.Human);
                          const removedElements = JSON.parse(JSON.stringify(removed));
                          const undoableRemoveAllHumanChildren = {
                            name: 'Remove All Humans on Cuboid',
                            timestamp: Date.now(),
                            parentId: cuboid.id,
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
                  {i18n.t('cuboidMenu.RemoveAllUnlockedHumans', lang)} ({humanCountCuboid}{' '}
                  {i18n.t('cuboidMenu.Humans', lang)})
                </Menu.Item>
              )}

              {treeCountCuboid > 0 && (
                <Menu.Item
                  key={'remove-all-trees-on-cuboid'}
                  onClick={() => {
                    Modal.confirm({
                      title:
                        i18n.t('cuboidMenu.DoYouReallyWantToRemoveAllTreesOnCuboid', lang) +
                        ' (' +
                        treeCountCuboid +
                        ' ' +
                        i18n.t('cuboidMenu.Trees', lang) +
                        ')?',
                      icon: <ExclamationCircleOutlined />,
                      onOk: () => {
                        if (cuboid) {
                          const removed = elements.filter(
                            (e) => !e.locked && e.type === ObjectType.Tree && e.parentId === cuboid.id,
                          );
                          removeAllChildElementsByType(cuboid.id, ObjectType.Tree);
                          const removedElements = JSON.parse(JSON.stringify(removed));
                          const undoableRemoveAllTreeChildren = {
                            name: 'Remove All Trees on Cuboid',
                            timestamp: Date.now(),
                            parentId: cuboid.id,
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
                  {i18n.t('cuboidMenu.RemoveAllUnlockedTrees', lang)} ({treeCountCuboid}{' '}
                  {i18n.t('cuboidMenu.Trees', lang)})
                </Menu.Item>
              )}
            </SubMenu>
          )}

        {editable &&
          (!cuboid.textureTypes ||
            (selectedSideIndex >= 0 && cuboid.textureTypes[selectedSideIndex] === CuboidTexture.NoTexture)) && (
            <>
              <CuboidColorSelection dialogVisible={colorDialogVisible} setDialogVisible={setColorDialogVisible} />
              <Menu.Item
                key={'cuboid-color'}
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
            <CuboidTextureSelection dialogVisible={textureDialogVisible} setDialogVisible={setTextureDialogVisible} />
            <Menu.Item
              key={'cuboid-texture'}
              style={{ paddingLeft: '36px' }}
              onClick={() => {
                setApplyCount(0);
                setTextureDialogVisible(true);
              }}
            >
              {i18n.t('word.Texture', lang)} ...
            </Menu.Item>

            <CuboidLengthInput dialogVisible={lengthDialogVisible} setDialogVisible={setLengthDialogVisible} />
            <Menu.Item
              key={'cuboid-length'}
              style={{ paddingLeft: '36px' }}
              onClick={() => {
                // no side selection for length
                if (cuboidActionScope === Scope.OnlyThisSide) {
                  setCuboidActionScope(Scope.OnlyThisObject);
                }
                setApplyCount(0);
                setLengthDialogVisible(true);
              }}
            >
              {i18n.t('word.Length', lang)} ...
            </Menu.Item>

            <CuboidWidthInput dialogVisible={widthDialogVisible} setDialogVisible={setWidthDialogVisible} />
            <Menu.Item
              key={'cuboid-width'}
              style={{ paddingLeft: '36px' }}
              onClick={() => {
                // no side selection for width
                if (cuboidActionScope === Scope.OnlyThisSide) {
                  setCuboidActionScope(Scope.OnlyThisObject);
                }
                setApplyCount(0);
                setWidthDialogVisible(true);
              }}
            >
              {i18n.t('word.Width', lang)} ...
            </Menu.Item>

            <CuboidHeightInput dialogVisible={heightDialogVisible} setDialogVisible={setHeightDialogVisible} />
            <Menu.Item
              key={'cuboid-height'}
              style={{ paddingLeft: '36px' }}
              onClick={() => {
                // no side selection for height
                if (cuboidActionScope === Scope.OnlyThisSide) {
                  setCuboidActionScope(Scope.OnlyThisObject);
                }
                setApplyCount(0);
                setHeightDialogVisible(true);
              }}
            >
              {i18n.t('word.Height', lang)} ...
            </Menu.Item>

            <CuboidAzimuthInput dialogVisible={azimuthDialogVisible} setDialogVisible={setAzimuthDialogVisible} />
            <Menu.Item
              key={'cuboid-azimuth'}
              style={{ paddingLeft: '36px' }}
              onClick={() => {
                // no side selection for azimuth
                if (cuboidActionScope === Scope.OnlyThisSide) {
                  setCuboidActionScope(Scope.OnlyThisObject);
                }
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
          key={'add-polygon-on-cuboid'}
          onClick={() => {
            if (cuboid) {
              setCommonStore((state) => {
                state.objectTypeToAdd = ObjectType.Polygon;
              });
              const position = new Vector3(cuboid.cx, cuboid.cy, cuboid.cz);
              let normal;
              switch (selectedSideIndex) {
                case 0:
                  normal = UNIT_VECTOR_POS_X;
                  break;
                case 1:
                  normal = UNIT_VECTOR_NEG_X;
                  break;
                case 2:
                  normal = UNIT_VECTOR_POS_Y;
                  break;
                case 3:
                  normal = UNIT_VECTOR_NEG_Y;
                  break;
                default:
                  normal = UNIT_VECTOR_POS_Z;
                  position.z = cuboid.lz;
              }
              const element = addElement(cuboid, position, normal);
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
          {i18n.t('cuboidMenu.AddPolygon', lang)}
        </Menu.Item>
      </Menu.ItemGroup>
    )
  );
};
