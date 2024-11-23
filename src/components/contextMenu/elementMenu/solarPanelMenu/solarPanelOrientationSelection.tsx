/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useRef, useState } from 'react';
import { Col, Radio, RadioChangeEvent, Row, Select, Space } from 'antd';
import { CommonStoreState, useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { SolarPanelModel } from '../../../../models/SolarPanelModel';
import { ElementState, ObjectType, Orientation, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { Util } from '../../../../Util';
import { UNIT_VECTOR_POS_Z_ARRAY } from '../../../../constants';
import { RoofModel } from 'src/models/RoofModel';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/hooks';

const { Option } = Select;

const SolarPanelOrientationSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const getPvModule = useStore(Selector.getPvModule);
  const getParent = useStore(Selector.getParent);
  const setElementSize = useStore(Selector.setElementSize);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.solarPanelActionScope);
  const setActionScope = useStore(Selector.setSolarPanelActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const solarPanel = useSelectedElement() as SolarPanelModel | undefined;

  const [selectedOrientation, setSelectedOrientation] = useState<Orientation>(
    solarPanel?.orientation ?? Orientation.portrait,
  );
  const rejectRef = useRef<boolean>(false);
  const rejectedValue = useRef<Orientation | undefined>();

  const lang = useLanguage();

  const updateSolarPanelOrientationById = (id: string, orientation: Orientation) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && e.id === id && !e.locked) {
          const sp = e as SolarPanelModel;
          let pvModel = state.supportedPvModules[sp.pvModelName];
          if (!pvModel) pvModel = state.customPvModules[sp.pvModelName];
          state.setSolarPanelOrientation(sp, pvModel, orientation);
          break;
        }
      }
    });
  };

  const updateSolarPanelOrientationAboveFoundation = (foundationId: string, orientation: Orientation) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId && !e.locked) {
          const sp = e as SolarPanelModel;
          let pvModel = state.supportedPvModules[sp.pvModelName];
          if (!pvModel) pvModel = state.customPvModules[sp.pvModelName];
          state.setSolarPanelOrientation(sp, pvModel, orientation);
        }
      }
    });
  };

  const updateSolarPanelOrientationOnSurface = (
    parentId: string,
    normal: number[] | undefined,
    orientation: Orientation,
  ) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && !e.locked) {
          let found;
          if (normal) {
            found = e.parentId === parentId && Util.isIdentical(e.normal, normal);
          } else {
            found = e.parentId === parentId;
          }
          if (found) {
            const sp = e as SolarPanelModel;
            let pvModel = state.supportedPvModules[sp.pvModelName];
            if (!pvModel) pvModel = state.customPvModules[sp.pvModelName];
            state.setSolarPanelOrientation(sp, pvModel, orientation);
          }
        }
      }
    });
  };

  const updateSolarPanelOrientationForAll = (orientation: Orientation) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && !e.locked) {
          const sp = e as SolarPanelModel;
          let pvModel = state.supportedPvModules[sp.pvModelName];
          if (!pvModel) pvModel = state.customPvModules[sp.pvModelName];
          state.setSolarPanelOrientation(sp, pvModel, orientation);
        }
      }
    });
  };

  const updateInMap = (map: Map<string, Orientation>, value: Orientation) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && !e.locked && map.has(e.id)) {
          const sp = e as SolarPanelModel;
          let pvModel = state.supportedPvModules[sp.pvModelName];
          if (!pvModel) pvModel = state.customPvModules[sp.pvModelName];
          state.setSolarPanelOrientation(sp, pvModel, value);
        }
      }
    });
  };

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  // cannot use the stored dx, dy in the following calculation
  // as changing orientation does not cause it to update
  const changeOrientation = (value: Orientation) => {
    if (solarPanel) {
      const pvModel = getPvModule(solarPanel.pvModelName);
      if (value === Orientation.portrait) {
        // calculate the current x-y layout
        const nx = Math.max(1, Math.round(solarPanel.lx / pvModel.width));
        const ny = Math.max(1, Math.round(solarPanel.ly / pvModel.length));
        setElementSize(solarPanel.id, nx * pvModel.width, ny * pvModel.length);
      } else {
        // calculate the current x-y layout
        const nx = Math.max(1, Math.round(solarPanel.lx / pvModel.length));
        const ny = Math.max(1, Math.round(solarPanel.ly / pvModel.width));
        setElementSize(solarPanel.id, nx * pvModel.length, ny * pvModel.width);
      }
      updateSolarPanelOrientationById(solarPanel.id, value);
    }
  };

  const withinParent = (sp: SolarPanelModel, orientation: Orientation) => {
    const parent = getParent(sp);
    if (parent) {
      if (parent.type === ObjectType.Cuboid && !Util.isIdentical(sp.normal, UNIT_VECTOR_POS_Z_ARRAY)) {
        // TODO: cuboid vertical sides
        return true;
      }
      const clone = JSON.parse(JSON.stringify(sp)) as SolarPanelModel;
      clone.orientation = orientation;
      const pvModel = getPvModule(clone.pvModelName);
      if (orientation === Orientation.portrait) {
        // calculate the current x-y layout
        const nx = Math.max(1, Math.round(clone.lx / pvModel.width));
        const ny = Math.max(1, Math.round(clone.ly / pvModel.length));
        clone.lx = nx * pvModel.width;
        clone.ly = ny * pvModel.length;
      } else {
        // calculate the current x-y layout
        const nx = Math.max(1, Math.round(clone.lx / pvModel.length));
        const ny = Math.max(1, Math.round(clone.ly / pvModel.width));
        clone.lx = nx * pvModel.length;
        clone.ly = ny * pvModel.width;
      }
      if (parent.type === ObjectType.Wall) {
        // maybe outside bound or overlap with others
        return Util.checkElementOnWallState(clone, parent) === ElementState.Valid;
      }
      if (parent.type === ObjectType.Roof) {
        return Util.checkElementOnRoofState(clone, parent as RoofModel) === ElementState.Valid;
      }
      return Util.isSolarCollectorWithinHorizontalSurface(clone, parent);
    }
    return false;
  };

  const rejectChange = (sp: SolarPanelModel, orientation: Orientation) => {
    // check if the new orientation will cause the solar panel to be out of the bound
    if (!withinParent(sp, orientation)) {
      return true;
    }
    // other check?
    return false;
  };

  const needChange = (orientation: Orientation) => {
    if (!solarPanel) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const sp = e as SolarPanelModel;
            if (sp.orientation !== orientation) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisType: {
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && !e.locked) {
            const sp = e as SolarPanelModel;
            if (sp.orientation !== orientation) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && e.foundationId === solarPanel?.foundationId && !e.locked) {
            const sp = e as SolarPanelModel;
            if (sp.orientation !== orientation) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeOnSurface: {
        const parent = getParent(solarPanel);
        if (parent) {
          const isParentCuboid = parent.type === ObjectType.Cuboid;
          if (isParentCuboid) {
            for (const e of elements) {
              if (
                e.type === ObjectType.SolarPanel &&
                e.parentId === solarPanel.parentId &&
                Util.isIdentical(e.normal, solarPanel.normal) &&
                !e.locked
              ) {
                const sp = e as SolarPanelModel;
                if (sp.orientation !== orientation) {
                  return true;
                }
              }
            }
          } else {
            for (const e of elements) {
              if (e.type === ObjectType.SolarPanel && e.parentId === solarPanel.parentId && !e.locked) {
                const sp = e as SolarPanelModel;
                if (sp.orientation !== orientation) {
                  return true;
                }
              }
            }
          }
        }
        break;
      }
      default: {
        if (solarPanel?.orientation !== orientation) {
          return true;
        }
        break;
      }
    }
    return false;
  };

  const setOrientation = (value: Orientation) => {
    if (!solarPanel) return;
    if (!needChange(value)) return;
    rejectedValue.current = undefined;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        rejectRef.current = false;
        for (const elem of elements) {
          if (elem.type === ObjectType.SolarPanel && useStore.getState().selectedElementIdSet.has(elem.id)) {
            if (rejectChange(elem as SolarPanelModel, value)) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          setSelectedOrientation(solarPanel.orientation);
        } else {
          const oldOrientationsSelected = new Map<string, Orientation>();
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarPanel && useStore.getState().selectedElementIdSet.has(elem.id)) {
              oldOrientationsSelected.set(elem.id, (elem as SolarPanelModel).orientation);
            }
          }
          const undoableChangeSelected = {
            name: 'Set Orientation for Selected Solar Panels',
            timestamp: Date.now(),
            oldValues: oldOrientationsSelected,
            newValue: value,
            undo: () => {
              for (const [id, orientation] of undoableChangeSelected.oldValues.entries()) {
                updateSolarPanelOrientationById(id, orientation as Orientation);
              }
            },
            redo: () => {
              updateInMap(
                undoableChangeSelected.oldValues as Map<string, Orientation>,
                undoableChangeSelected.newValue as Orientation,
              );
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeSelected);
          updateInMap(oldOrientationsSelected, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisType: {
        rejectRef.current = false;
        for (const elem of elements) {
          if (elem.type === ObjectType.SolarPanel) {
            if (rejectChange(elem as SolarPanelModel, value)) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          setSelectedOrientation(solarPanel.orientation);
        } else {
          const oldOrientationsAll = new Map<string, Orientation>();
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarPanel) {
              oldOrientationsAll.set(elem.id, (elem as SolarPanelModel).orientation);
            }
          }
          const undoableChangeAll = {
            name: 'Set Orientation for All Solar Panels',
            timestamp: Date.now(),
            oldValues: oldOrientationsAll,
            newValue: value,
            undo: () => {
              for (const [id, orientation] of undoableChangeAll.oldValues.entries()) {
                updateSolarPanelOrientationById(id, orientation as Orientation);
              }
            },
            redo: () => {
              updateSolarPanelOrientationForAll(undoableChangeAll.newValue as Orientation);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAll);
          updateSolarPanelOrientationForAll(value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        if (solarPanel.foundationId) {
          rejectRef.current = false;
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarPanel && elem.foundationId === solarPanel.foundationId) {
              if (rejectChange(elem as SolarPanelModel, value)) {
                rejectRef.current = true;
                break;
              }
            }
          }
          if (rejectRef.current) {
            rejectedValue.current = value;
            setSelectedOrientation(solarPanel.orientation);
          } else {
            const oldOrientationsAboveFoundation = new Map<string, Orientation>();
            for (const elem of elements) {
              if (elem.type === ObjectType.SolarPanel && elem.foundationId === solarPanel.foundationId) {
                oldOrientationsAboveFoundation.set(elem.id, (elem as SolarPanelModel).orientation);
              }
            }
            const undoableChangeAboveFoundation = {
              name: 'Set Orientation for All Solar Panels Above Foundation',
              timestamp: Date.now(),
              oldValues: oldOrientationsAboveFoundation,
              newValue: value,
              groupId: solarPanel.foundationId,
              undo: () => {
                for (const [id, orientation] of undoableChangeAboveFoundation.oldValues.entries()) {
                  updateSolarPanelOrientationById(id, orientation as Orientation);
                }
              },
              redo: () => {
                if (undoableChangeAboveFoundation.groupId) {
                  updateSolarPanelOrientationAboveFoundation(
                    undoableChangeAboveFoundation.groupId,
                    undoableChangeAboveFoundation.newValue as Orientation,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeAboveFoundation);
            updateSolarPanelOrientationAboveFoundation(solarPanel.foundationId, value);
            setApplyCount(applyCount + 1);
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeOnSurface: {
        const parent = getParent(solarPanel);
        if (parent) {
          rejectRef.current = false;
          const isParentCuboid = parent.type === ObjectType.Cuboid;
          if (isParentCuboid) {
            for (const elem of elements) {
              if (
                elem.type === ObjectType.SolarPanel &&
                elem.parentId === solarPanel.parentId &&
                Util.isIdentical(elem.normal, solarPanel.normal)
              ) {
                if (rejectChange(elem as SolarPanelModel, value)) {
                  rejectRef.current = true;
                  break;
                }
              }
            }
          } else {
            for (const elem of elements) {
              if (elem.type === ObjectType.SolarPanel && elem.parentId === solarPanel.parentId) {
                if (rejectChange(elem as SolarPanelModel, value)) {
                  rejectRef.current = true;
                  break;
                }
              }
            }
          }
          if (rejectRef.current) {
            rejectedValue.current = value;
            setSelectedOrientation(solarPanel.orientation);
          } else {
            const oldOrientationsOnSurface = new Map<string, Orientation>();
            const isParentCuboid = parent.type === ObjectType.Cuboid;
            if (isParentCuboid) {
              for (const elem of elements) {
                if (
                  elem.type === ObjectType.SolarPanel &&
                  elem.parentId === solarPanel.parentId &&
                  Util.isIdentical(elem.normal, solarPanel.normal)
                ) {
                  oldOrientationsOnSurface.set(elem.id, (elem as SolarPanelModel).orientation);
                }
              }
            } else {
              for (const elem of elements) {
                if (elem.type === ObjectType.SolarPanel && elem.parentId === solarPanel.parentId) {
                  oldOrientationsOnSurface.set(elem.id, (elem as SolarPanelModel).orientation);
                }
              }
            }
            const normal = isParentCuboid ? solarPanel.normal : undefined;
            const undoableChangeOnSurface = {
              name: 'Set Orientation for All Solar Panels on Surface',
              timestamp: Date.now(),
              oldValues: oldOrientationsOnSurface,
              newValue: value,
              groupId: solarPanel.parentId,
              normal: normal,
              undo: () => {
                for (const [id, orientation] of undoableChangeOnSurface.oldValues.entries()) {
                  updateSolarPanelOrientationById(id, orientation as Orientation);
                }
              },
              redo: () => {
                if (undoableChangeOnSurface.groupId) {
                  updateSolarPanelOrientationOnSurface(
                    undoableChangeOnSurface.groupId,
                    undoableChangeOnSurface.normal,
                    undoableChangeOnSurface.newValue as Orientation,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeOnSurface);
            updateSolarPanelOrientationOnSurface(solarPanel.parentId, normal, value);
            setApplyCount(applyCount + 1);
          }
        }
        break;
      }
      default: {
        // solar panel selected element may be outdated, make sure that we get the latest
        const sp = getElementById(solarPanel.id) as SolarPanelModel;
        const oldOrientation = sp ? sp.orientation : solarPanel.orientation;
        rejectRef.current = false;
        // rejectRef.current = rejectChange(solarPanel, value);
        if (rejectRef.current) {
          rejectedValue.current = value;
          setSelectedOrientation(oldOrientation);
        } else {
          const undoableChange = {
            name: 'Set Orientation of Selected Solar Panel',
            timestamp: Date.now(),
            oldValue: oldOrientation,
            newValue: value,
            changedElementId: solarPanel.id,
            changedElementType: solarPanel.type,
            undo: () => {
              changeOrientation(undoableChange.oldValue as Orientation);
            },
            redo: () => {
              changeOrientation(undoableChange.newValue as Orientation);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          changeOrientation(value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
    }
    setCommonStore((state) => {
      state.actionState.solarPanelOrientation = value;
    });
  };

  const close = () => {
    if (!solarPanel) return;
    setSelectedOrientation(solarPanel.orientation);
    rejectRef.current = false;
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setOrientation(selectedOrientation);
    if (!rejectRef.current) {
      setDialogVisible(false);
      setApplyCount(0);
    }
  };

  const apply = () => {
    setOrientation(selectedOrientation);
  };

  const rejectedMessage = rejectRef.current
    ? ': ' +
      i18n.t('message.NotApplicableToSelectedAction', lang) +
      (rejectedValue.current
        ? ' (' +
          (rejectedValue.current === Orientation.portrait
            ? i18n.t('solarPanelMenu.Portrait', lang)
            : i18n.t('solarPanelMenu.Landscape', lang)) +
          ')'
        : '')
    : '';

  return (
    <Dialog
      width={550}
      title={i18n.t('solarPanelMenu.Orientation', lang)}
      rejectedMessage={rejectedMessage}
      onApply={apply}
      onClose={close}
      onClickCancel={cancel}
      onClickOk={ok}
    >
      <Row gutter={6}>
        <Col className="gutter-row" span={8}>
          <Select
            style={{ width: '150px' }}
            value={selectedOrientation}
            onChange={(value) => setSelectedOrientation(value)}
          >
            <Option key={Orientation.portrait} value={Orientation.portrait}>
              {i18n.t('solarPanelMenu.Portrait', lang)}
            </Option>
            <Option key={Orientation.landscape} value={Orientation.landscape}>
              {i18n.t('solarPanelMenu.Landscape', lang)}
            </Option>
          </Select>
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={16}
        >
          <Radio.Group onChange={onScopeChange} value={actionScope}>
            <Space direction="vertical">
              <Radio style={{ width: '100%' }} value={Scope.OnlyThisObject}>
                {i18n.t('solarPanelMenu.OnlyThisSolarPanel', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeOnSurface}>
                {i18n.t('solarPanelMenu.AllSolarPanelsOnSurface', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('solarPanelMenu.AllSolarPanelsAboveFoundation', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('solarPanelMenu.AllSelectedSolarPanels', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisType}>
                {i18n.t('solarPanelMenu.AllSolarPanels', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default SolarPanelOrientationSelection;
