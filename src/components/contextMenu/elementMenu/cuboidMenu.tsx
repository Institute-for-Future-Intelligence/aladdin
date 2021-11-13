/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Menu, Modal } from 'antd';
import { ColorPicker, Copy, Cut, Lock, Paste } from '../menuItems';
import SubMenu from 'antd/lib/menu/SubMenu';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useStore } from 'src/stores/common';
import * as Selector from '../../../stores/selector';
import { ObjectType } from 'src/types';
import ReshapeElementMenu from 'src/components/reshapeElementMenu';
import i18n from '../../../i18n/i18n';
import { ElementModel } from '../../../models/ElementModel';
import { UndoableRemoveAllChildren } from '../../../undo/UndoableRemoveAllChildren';

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
      <ColorPicker />
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
                      const removed: ElementModel[] = [];
                      for (const elem of elements) {
                        if (elem.type === ObjectType.Sensor && elem.parentId === selectedElement.id) {
                          removed.push(elem);
                        }
                      }
                      removeAllChildElementsByType(selectedElement.id, ObjectType.Sensor);
                      const removedElements = JSON.parse(JSON.stringify(removed));
                      const undoableRemoveAllSensorChildren = {
                        name: 'Remove All Sensors on Foundation',
                        timestamp: Date.now(),
                        parentId: selectedElement.id,
                        removedElements: removedElements,
                        undo: () => {
                          setCommonStore((state) => {
                            for (const elem of undoableRemoveAllSensorChildren.removedElements) {
                              state.elements.push(elem);
                            }
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
                      const removed: ElementModel[] = [];
                      for (const elem of elements) {
                        if (elem.type === ObjectType.SolarPanel && elem.parentId === selectedElement.id) {
                          removed.push(elem);
                        }
                      }
                      removeAllChildElementsByType(selectedElement.id, ObjectType.SolarPanel);
                      const removedElements = JSON.parse(JSON.stringify(removed));
                      const undoableRemoveAllSolarPanelChildren = {
                        name: 'Remove All Solar Panels on Foundation',
                        timestamp: Date.now(),
                        parentId: selectedElement.id,
                        removedElements: removedElements,
                        undo: () => {
                          setCommonStore((state) => {
                            for (const elem of undoableRemoveAllSolarPanelChildren.removedElements) {
                              state.elements.push(elem);
                            }
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
      {selectedElement && contextMenuObjectType && (
        <ReshapeElementMenu elementId={selectedElement.id} name={'cuboid'} style={{ paddingLeft: '20px' }} />
      )}
    </Menu.ItemGroup>
  );
};
