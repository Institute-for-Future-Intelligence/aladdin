/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Menu, Modal, Radio, Space } from 'antd';
import { Copy, Cut, Lock, Paste } from '../menuItems';
import SubMenu from 'antd/lib/menu/SubMenu';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { FoundationTexture, ObjectType, SolarReceiver } from '../../../types';
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
import { UndoableChange } from '../../../undo/UndoableChange';
import { ElementCounter } from '../../../stores/ElementCounter';

export const FoundationMenu = () => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const foundation = useStore(Selector.selectedElement) as FoundationModel;
  const addUndoable = useStore(Selector.addUndoable);
  const countAllOffspringsByType = useStore(Selector.countAllOffspringsByTypeAtOnce);
  const removeAllChildElementsByType = useStore(Selector.removeAllChildElementsByType);
  const contextMenuObjectType = useStore(Selector.contextMenuObjectType);
  const elementsToPaste = useStore(Selector.elementsToPaste);
  const addElement = useStore(Selector.addElement);
  const removeElementById = useStore(Selector.removeElementById);
  const setApplyCount = useStore(Selector.setApplyCount);
  const updateFoundationSolarReceiverById = useStore(Selector.updateFoundationSolarReceiverById);

  const [selectedSolarReceiver, setSelectedSolarReceiver] = useState(foundation?.solarReceiver);
  const [colorDialogVisible, setColorDialogVisible] = useState(false);
  const [textureDialogVisible, setTextureDialogVisible] = useState(false);
  const [widthDialogVisible, setWidthDialogVisible] = useState(false);
  const [lengthDialogVisible, setLengthDialogVisible] = useState(false);
  const [heightDialogVisible, setHeightDialogVisible] = useState(false);
  const [azimuthDialogVisible, setAzimuthDialogVisible] = useState(false);

  const counter = foundation ? countAllOffspringsByType(foundation.id) : new ElementCounter();
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
        e.type === ObjectType.SolarPanel ||
        e.type === ObjectType.WaterHeater ||
        e.type === ObjectType.ParabolicDish ||
        e.type === ObjectType.Heliostat ||
        e.type === ObjectType.FresnelReflector ||
        e.type === ObjectType.ParabolicTrough
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
        {counter.gotSome() && contextMenuObjectType && (
          <SubMenu key={'clear'} title={i18n.t('word.Clear', lang)} style={{ paddingLeft: '24px' }}>
            {counter.wallCount > 0 && (
              <Menu.Item
                key={'remove-all-walls-on-foundation'}
                onClick={() => {
                  Modal.confirm({
                    title:
                      i18n.t('foundationMenu.DoYouReallyWantToRemoveAllWallsOnFoundation', lang) +
                      ' (' +
                      counter.wallCount +
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
                {i18n.t('foundationMenu.RemoveAllUnlockedWalls', lang)} ({counter.wallCount})
              </Menu.Item>
            )}

            {counter.sensorCount > 0 && (
              <Menu.Item
                key={'remove-all-sensors-on-foundation'}
                onClick={() => {
                  Modal.confirm({
                    title:
                      i18n.t('foundationMenu.DoYouReallyWantToRemoveAllSensorsOnFoundation', lang) +
                      ' (' +
                      counter.sensorCount +
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
                {i18n.t('foundationMenu.RemoveAllUnlockedSensors', lang)} ({counter.sensorCount})
              </Menu.Item>
            )}

            {counter.solarPanelCount > 0 && (
              <Menu.Item
                key={'remove-all-solar-panels-on-foundation'}
                onClick={() => {
                  Modal.confirm({
                    title:
                      i18n.t('foundationMenu.DoYouReallyWantToRemoveAllSolarPanelsOnFoundation', lang) +
                      ' (' +
                      counter.solarPanelModuleCount +
                      ' ' +
                      i18n.t('foundationMenu.SolarPanels', lang) +
                      ', ' +
                      counter.solarPanelCount +
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
                {i18n.t('foundationMenu.RemoveAllUnlockedSolarPanels', lang)}&nbsp; ({counter.solarPanelModuleCount}{' '}
                {i18n.t('foundationMenu.SolarPanels', lang)}, {counter.solarPanelCount}{' '}
                {i18n.t('foundationMenu.Racks', lang)})
              </Menu.Item>
            )}

            {counter.parabolicTroughCount > 0 && (
              <Menu.Item
                key={'remove-all-parabolic-troughs-on-foundation'}
                onClick={() => {
                  Modal.confirm({
                    title:
                      i18n.t('foundationMenu.DoYouReallyWantToRemoveAllParabolicTroughsOnFoundation', lang) +
                      ' (' +
                      counter.parabolicTroughCount +
                      ' ' +
                      i18n.t('foundationMenu.ParabolicTroughs', lang) +
                      ')?',
                    icon: <ExclamationCircleOutlined />,
                    onOk: () => {
                      if (foundation) {
                        const removed = elements.filter(
                          (e) => !e.locked && e.type === ObjectType.ParabolicTrough && e.parentId === foundation.id,
                        );
                        removeAllChildElementsByType(foundation.id, ObjectType.ParabolicTrough);
                        const removedElements = JSON.parse(JSON.stringify(removed));
                        const undoableRemoveAllParabolicTroughChildren = {
                          name: 'Remove All Parabolic Troughs on Foundation',
                          timestamp: Date.now(),
                          parentId: foundation.id,
                          removedElements: removedElements,
                          undo: () => {
                            setCommonStore((state) => {
                              state.elements.push(...undoableRemoveAllParabolicTroughChildren.removedElements);
                            });
                          },
                          redo: () => {
                            removeAllChildElementsByType(
                              undoableRemoveAllParabolicTroughChildren.parentId,
                              ObjectType.ParabolicTrough,
                            );
                          },
                        } as UndoableRemoveAllChildren;
                        addUndoable(undoableRemoveAllParabolicTroughChildren);
                      }
                    },
                  });
                }}
              >
                {i18n.t('foundationMenu.RemoveAllUnlockedParabolicTroughs', lang)} ({counter.parabolicTroughCount})
              </Menu.Item>
            )}

            {counter.parabolicDishCount > 0 && (
              <Menu.Item
                key={'remove-all-parabolic-dishes-on-foundation'}
                onClick={() => {
                  Modal.confirm({
                    title:
                      i18n.t('foundationMenu.DoYouReallyWantToRemoveAllParabolicDishesOnFoundation', lang) +
                      ' (' +
                      counter.parabolicDishCount +
                      ' ' +
                      i18n.t('foundationMenu.ParabolicDishes', lang) +
                      ')?',
                    icon: <ExclamationCircleOutlined />,
                    onOk: () => {
                      if (foundation) {
                        const removed = elements.filter(
                          (e) => !e.locked && e.type === ObjectType.ParabolicDish && e.parentId === foundation.id,
                        );
                        removeAllChildElementsByType(foundation.id, ObjectType.ParabolicDish);
                        const removedElements = JSON.parse(JSON.stringify(removed));
                        const undoableRemoveAllParabolicDishChildren = {
                          name: 'Remove All Parabolic Dishes on Foundation',
                          timestamp: Date.now(),
                          parentId: foundation.id,
                          removedElements: removedElements,
                          undo: () => {
                            setCommonStore((state) => {
                              state.elements.push(...undoableRemoveAllParabolicDishChildren.removedElements);
                            });
                          },
                          redo: () => {
                            removeAllChildElementsByType(
                              undoableRemoveAllParabolicDishChildren.parentId,
                              ObjectType.ParabolicDish,
                            );
                          },
                        } as UndoableRemoveAllChildren;
                        addUndoable(undoableRemoveAllParabolicDishChildren);
                      }
                    },
                  });
                }}
              >
                {i18n.t('foundationMenu.RemoveAllUnlockedParabolicDishes', lang)} ({counter.parabolicDishCount})
              </Menu.Item>
            )}

            {counter.fresnelReflectorCount > 0 && (
              <Menu.Item
                key={'remove-all-fresnel-reflector-on-foundation'}
                onClick={() => {
                  Modal.confirm({
                    title:
                      i18n.t('foundationMenu.DoYouReallyWantToRemoveAllFresnelReflectorsOnFoundation', lang) +
                      ' (' +
                      counter.fresnelReflectorCount +
                      ' ' +
                      i18n.t('foundationMenu.FresnelReflectors', lang) +
                      ')?',
                    icon: <ExclamationCircleOutlined />,
                    onOk: () => {
                      if (foundation) {
                        const removed = elements.filter(
                          (e) => !e.locked && e.type === ObjectType.FresnelReflector && e.parentId === foundation.id,
                        );
                        removeAllChildElementsByType(foundation.id, ObjectType.FresnelReflector);
                        const removedElements = JSON.parse(JSON.stringify(removed));
                        const undoableRemoveAllFresnelReflectorChildren = {
                          name: 'Remove All Fresnel Reflectors on Foundation',
                          timestamp: Date.now(),
                          parentId: foundation.id,
                          removedElements: removedElements,
                          undo: () => {
                            setCommonStore((state) => {
                              state.elements.push(...undoableRemoveAllFresnelReflectorChildren.removedElements);
                            });
                          },
                          redo: () => {
                            removeAllChildElementsByType(
                              undoableRemoveAllFresnelReflectorChildren.parentId,
                              ObjectType.FresnelReflector,
                            );
                          },
                        } as UndoableRemoveAllChildren;
                        addUndoable(undoableRemoveAllFresnelReflectorChildren);
                      }
                    },
                  });
                }}
              >
                {i18n.t('foundationMenu.RemoveAllUnlockedFresnelReflectors', lang)} ({counter.fresnelReflectorCount})
              </Menu.Item>
            )}

            {counter.heliostatCount > 0 && (
              <Menu.Item
                key={'remove-all-heliostats-on-foundation'}
                onClick={() => {
                  Modal.confirm({
                    title:
                      i18n.t('foundationMenu.DoYouReallyWantToRemoveAllHeliostatsOnFoundation', lang) +
                      ' (' +
                      counter.heliostatCount +
                      ' ' +
                      i18n.t('foundationMenu.Heliostats', lang) +
                      ')?',
                    icon: <ExclamationCircleOutlined />,
                    onOk: () => {
                      if (foundation) {
                        const removed = elements.filter(
                          (e) => !e.locked && e.type === ObjectType.Heliostat && e.parentId === foundation.id,
                        );
                        removeAllChildElementsByType(foundation.id, ObjectType.Heliostat);
                        const removedElements = JSON.parse(JSON.stringify(removed));
                        const undoableRemoveAllHeliostatChildren = {
                          name: 'Remove All Heliostats on Foundation',
                          timestamp: Date.now(),
                          parentId: foundation.id,
                          removedElements: removedElements,
                          undo: () => {
                            setCommonStore((state) => {
                              state.elements.push(...undoableRemoveAllHeliostatChildren.removedElements);
                            });
                          },
                          redo: () => {
                            removeAllChildElementsByType(
                              undoableRemoveAllHeliostatChildren.parentId,
                              ObjectType.Heliostat,
                            );
                          },
                        } as UndoableRemoveAllChildren;
                        addUndoable(undoableRemoveAllHeliostatChildren);
                      }
                    },
                  });
                }}
              >
                {i18n.t('foundationMenu.RemoveAllUnlockedHeliostats', lang)} ({counter.heliostatCount})
              </Menu.Item>
            )}

            {counter.polygonCount > 0 && (
              <Menu.Item
                key={'remove-all-polygons-on-foundation'}
                onClick={() => {
                  Modal.confirm({
                    title:
                      i18n.t('foundationMenu.DoYouReallyWantToRemoveAllPolygonsOnFoundation', lang) +
                      ' (' +
                      counter.polygonCount +
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
                            removeAllChildElementsByType(undoableRemoveAllPolygonChildren.parentId, ObjectType.Polygon);
                          },
                        } as UndoableRemoveAllChildren;
                        addUndoable(undoableRemoveAllPolygonChildren);
                      }
                    },
                  });
                }}
              >
                {i18n.t('foundationMenu.RemoveAllUnlockedPolygons', lang)} ({counter.polygonCount})
              </Menu.Item>
            )}

            {counter.humanCount > 0 && (
              <Menu.Item
                key={'remove-all-humans-on-foundation'}
                onClick={() => {
                  Modal.confirm({
                    title:
                      i18n.t('foundationMenu.DoYouReallyWantToRemoveAllHumansOnFoundation', lang) +
                      ' (' +
                      counter.humanCount +
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
                {i18n.t('foundationMenu.RemoveAllUnlockedHumans', lang)} ({counter.humanCount})
              </Menu.Item>
            )}

            {counter.treeCount > 0 && (
              <Menu.Item
                key={'remove-all-trees-on-foundation'}
                onClick={() => {
                  Modal.confirm({
                    title:
                      i18n.t('foundationMenu.DoYouReallyWantToRemoveAllTreesOnFoundation', lang) +
                      ' (' +
                      counter.treeCount +
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
                {i18n.t('foundationMenu.RemoveAllUnlockedTrees', lang)} ({counter.treeCount})
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

        {(counter.fresnelReflectorCount > 0 || counter.heliostatCount > 0) && (
          <SubMenu
            key={'select-solar-receiver'}
            title={i18n.t('foundationMenu.SelectSolarReceiver', lang)}
            style={{ paddingLeft: '24px' }}
          >
            <Radio.Group
              value={selectedSolarReceiver}
              style={{ paddingLeft: '12px' }}
              onChange={(e) => {
                if (foundation) {
                  const oldReceiver = foundation.solarReceiver;
                  const newReceiver = e.target.value;
                  const undoableChange = {
                    name: 'Select Solar Receiver for Selected Foundation',
                    timestamp: Date.now(),
                    oldValue: oldReceiver,
                    newValue: newReceiver,
                    changedElementId: foundation.id,
                    undo: () => {
                      updateFoundationSolarReceiverById(
                        undoableChange.changedElementId,
                        undoableChange.oldValue as SolarReceiver,
                      );
                    },
                    redo: () => {
                      updateFoundationSolarReceiverById(
                        undoableChange.changedElementId,
                        undoableChange.newValue as SolarReceiver,
                      );
                    },
                  } as UndoableChange;
                  addUndoable(undoableChange);
                  updateFoundationSolarReceiverById(foundation.id, newReceiver);
                  setSelectedSolarReceiver(newReceiver);
                }
              }}
            >
              <Space direction="vertical">
                <Radio value={undefined}>{i18n.t('word.None', lang)}</Radio>
                <Radio value={SolarReceiver.Tube}>
                  {i18n.t('foundationMenu.ReceiverTubeForFresnelReflectors', lang)}
                </Radio>
                <Radio value={SolarReceiver.Tower}>{i18n.t('foundationMenu.ReceiverTowerForHeliostats', lang)}</Radio>
              </Space>
            </Radio.Group>
          </SubMenu>
        )}
      </Menu.ItemGroup>
    )
  );
};
