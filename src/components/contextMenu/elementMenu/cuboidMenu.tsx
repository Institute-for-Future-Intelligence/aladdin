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
import CuboidWidthInput from './cuboidWidthInput';
import CuboidLengthInput from './cuboidLengthInput';
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

  const [colorDialogVisible, setColorDialogVisible] = useState(false);
  const [textureDialogVisible, setTextureDialogVisible] = useState(false);
  const [widthDialogVisible, setWidthDialogVisible] = useState(false);
  const [lengthDialogVisible, setLengthDialogVisible] = useState(false);
  const [heightDialogVisible, setHeightDialogVisible] = useState(false);
  const [azimuthDialogVisible, setAzimuthDialogVisible] = useState(false);

  const cuboid = getSelectedElement() as CuboidModel;
  const polygonCountCuboid = cuboid ? countAllChildElementsByType(cuboid.id, ObjectType.Polygon) : 0;
  const sensorCountCuboid = cuboid ? countAllChildElementsByType(cuboid.id, ObjectType.Sensor) : 0;
  const solarRackCountCuboid = cuboid ? countAllChildElementsByType(cuboid.id, ObjectType.SolarPanel) : 0;
  const solarPanelCountCuboid = cuboid ? countAllChildSolarPanels(cuboid.id) : 0;
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

        {(sensorCountCuboid > 0 || solarPanelCountCuboid > 0 || polygonCountCuboid > 0) && contextMenuObjectType && (
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
                          (e) => e.type === ObjectType.Sensor && e.parentId === cuboid.id,
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
                      if (cuboid) {
                        const removed = elements.filter(
                          (e) => e.type === ObjectType.SolarPanel && e.parentId === cuboid.id,
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
                {i18n.t('cuboidMenu.RemoveAllSolarPanels', lang)}&nbsp; ({solarPanelCountCuboid}{' '}
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
                          (e) => e.type === ObjectType.Polygon && e.parentId === cuboid.id,
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
                            removeAllChildElementsByType(undoableRemoveAllPolygonChildren.parentId, ObjectType.Polygon);
                          },
                        } as UndoableRemoveAllChildren;
                        addUndoable(undoableRemoveAllPolygonChildren);
                      }
                    },
                  });
                }}
              >
                {i18n.t('cuboidMenu.RemoveAllPolygons', lang)} ({polygonCountCuboid}{' '}
                {i18n.t('cuboidMenu.Polygons', lang)})
              </Menu.Item>
            )}
          </SubMenu>
        )}

        {editable &&
          (!cuboid.textureTypes ||
            (selectedSideIndex >= 0 && cuboid.textureTypes[selectedSideIndex] === CuboidTexture.NoTexture)) && (
            <>
              <CuboidColorSelection
                colorDialogVisible={colorDialogVisible}
                setColorDialogVisible={setColorDialogVisible}
              />
              <Menu.Item
                key={'cuboid-color'}
                style={{ paddingLeft: '36px' }}
                onClick={() => {
                  setColorDialogVisible(true);
                }}
              >
                {i18n.t('word.Color', lang)} ...
              </Menu.Item>
            </>
          )}

        {editable && (
          <>
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
                // no side selection for width
                if (cuboidActionScope === Scope.OnlyThisSide) {
                  setCuboidActionScope(Scope.OnlyThisObject);
                }
                setWidthDialogVisible(true);
              }}
            >
              {i18n.t('word.Width', lang)} ...
            </Menu.Item>

            <CuboidLengthInput
              lengthDialogVisible={lengthDialogVisible}
              setLengthDialogVisible={setLengthDialogVisible}
            />
            <Menu.Item
              key={'cuboid-length'}
              style={{ paddingLeft: '36px' }}
              onClick={() => {
                // no side selection for length
                if (cuboidActionScope === Scope.OnlyThisSide) {
                  setCuboidActionScope(Scope.OnlyThisObject);
                }
                setLengthDialogVisible(true);
              }}
            >
              {i18n.t('word.Length', lang)} ...
            </Menu.Item>

            <CuboidHeightInput
              heightDialogVisible={heightDialogVisible}
              setHeightDialogVisible={setHeightDialogVisible}
            />
            <Menu.Item
              key={'cuboid-height'}
              style={{ paddingLeft: '36px' }}
              onClick={() => {
                // no side selection for height
                if (cuboidActionScope === Scope.OnlyThisSide) {
                  setCuboidActionScope(Scope.OnlyThisObject);
                }
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
                // no side selection for azimuth
                if (cuboidActionScope === Scope.OnlyThisSide) {
                  setCuboidActionScope(Scope.OnlyThisObject);
                }
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
