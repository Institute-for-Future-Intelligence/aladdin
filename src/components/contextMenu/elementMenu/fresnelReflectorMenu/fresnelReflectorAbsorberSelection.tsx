/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Col, Radio, RadioChangeEvent, Row, Select, Space } from 'antd';
import { useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { FresnelReflectorModel } from '../../../../models/FresnelReflectorModel';
import { ObjectType, Scope, SolarStructure } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { FoundationModel } from '../../../../models/FoundationModel';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/views/hooks';
import { Util } from 'src/Util';
import { HeliostatModel } from 'src/models/HeliostatModel';

const { Option } = Select;

const FresnelReflectorAbsorberSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updateById = useStore(Selector.updateSolarReceiverById);
  const updateAboveFoundation = useStore(Selector.updateSolarReceiverAboveFoundation);
  const updateForAll = useStore(Selector.updateSolarReceiverForAll);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.fresnelReflectorActionScope);
  const setActionScope = useStore(Selector.setFresnelReflectorActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const fresnelReflector = useSelectedElement(ObjectType.FresnelReflector) as FresnelReflectorModel | undefined;

  const [selectedReceiverId, setSelectedReceiverId] = useState<string>(fresnelReflector?.receiverId ?? 'None');

  const lang = useLanguage();

  const pipes = useMemo(() => {
    const pipeIds: string[] = [];
    for (const e of elements) {
      if (e.type === ObjectType.Foundation) {
        const f = e as FoundationModel;
        if (f.solarStructure === SolarStructure.FocusPipe) {
          pipeIds.push(f.id);
        }
      }
    }
    return pipeIds;
  }, [elements]);

  useEffect(() => {
    setSelectedReceiverId('None');
    if (fresnelReflector) {
      if (fresnelReflector.receiverId) {
        setSelectedReceiverId(fresnelReflector.receiverId);
      } else {
        const parent = getElementById(fresnelReflector.parentId);
        if (parent) {
          if (
            parent.type === ObjectType.Foundation &&
            (parent as FoundationModel).solarStructure === SolarStructure.FocusPipe
          ) {
            setSelectedReceiverId(parent.id);
          }
        }
      }
    }
  }, [fresnelReflector]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (receiverId: string) => {
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (
            e.type === ObjectType.FresnelReflector &&
            !e.locked &&
            useStore.getState().selectedElementIdSet.has(e.id)
          ) {
            const fr = e as FresnelReflectorModel;
            if (fr.receiverId !== receiverId) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.FresnelReflector && !e.locked) {
            const fr = e as FresnelReflectorModel;
            if (fr.receiverId !== receiverId) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (
            e.type === ObjectType.FresnelReflector &&
            e.foundationId === fresnelReflector?.foundationId &&
            !e.locked
          ) {
            const fr = e as FresnelReflectorModel;
            if (fr.receiverId !== receiverId) {
              return true;
            }
          }
        }
        break;
      default:
        if (fresnelReflector?.receiverId !== receiverId) {
          return true;
        }
    }
    return false;
  };

  const updateInMap = (map: Map<string, string>, receiverId: string) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (!Util.isHeliostatOrFresnelReflector(e.type)) continue;
        if (!e.locked && map.has(e.id)) {
          if (e.type === ObjectType.Heliostat) {
            (e as HeliostatModel).towerId = receiverId;
          } else if (e.type === ObjectType.FresnelReflector) {
            (e as FresnelReflectorModel).receiverId = receiverId;
          }
        }
      }
    });
  };

  const setReceiverId = (value: string) => {
    if (!fresnelReflector) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldValuesSelected = new Map<string, string>();
        for (const elem of elements) {
          if (elem.type === ObjectType.FresnelReflector && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldValuesSelected.set(elem.id, (elem as FresnelReflectorModel).receiverId);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Receiver for Selected Fresnel Reflectors',
          timestamp: Date.now(),
          oldValues: oldValuesSelected,
          newValue: value,
          undo: () => {
            for (const [id, ti] of undoableChangeSelected.oldValues.entries()) {
              updateById(id, ti as string);
            }
          },
          redo: () => {
            updateInMap(
              undoableChangeSelected.oldValues as Map<string, string>,
              undoableChangeSelected.newValue as string,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateInMap(oldValuesSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldValuesAll = new Map<string, string>();
        for (const elem of elements) {
          if (elem.type === ObjectType.FresnelReflector) {
            oldValuesAll.set(elem.id, (elem as FresnelReflectorModel).receiverId);
          }
        }
        const undoableChangeAll = {
          name: 'Set Receiver for All Fresnel Reflectors',
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            for (const [id, ti] of undoableChangeAll.oldValues.entries()) {
              updateById(id, ti as string);
            }
          },
          redo: () => {
            updateForAll(ObjectType.FresnelReflector, undoableChangeAll.newValue as string);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateForAll(ObjectType.FresnelReflector, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (fresnelReflector.foundationId) {
          const oldValuesAboveFoundation = new Map<string, string>();
          for (const elem of elements) {
            if (elem.type === ObjectType.FresnelReflector && elem.foundationId === fresnelReflector.foundationId) {
              oldValuesAboveFoundation.set(elem.id, (elem as FresnelReflectorModel).receiverId);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Receiver for All Fresnel Reflectors Above Foundation',
            timestamp: Date.now(),
            oldValues: oldValuesAboveFoundation,
            newValue: value,
            groupId: fresnelReflector.foundationId,
            undo: () => {
              for (const [id, ti] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateById(id, ti as string);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateAboveFoundation(
                  ObjectType.FresnelReflector,
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as string,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateAboveFoundation(ObjectType.FresnelReflector, fresnelReflector.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        // selected element may be outdated, make sure that we get the latest
        const f = getElementById(fresnelReflector.id) as FresnelReflectorModel;
        const oldValue = f ? f.receiverId : fresnelReflector.receiverId;
        const undoableChange = {
          name: 'Set Receiver for Fresnel Reflector',
          timestamp: Date.now(),
          oldValue: oldValue,
          newValue: value,
          changedElementId: fresnelReflector.id,
          changedElementType: fresnelReflector.type,
          undo: () => {
            updateById(undoableChange.changedElementId, undoableChange.oldValue as string);
          },
          redo: () => {
            updateById(undoableChange.changedElementId, undoableChange.newValue as string);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateById(fresnelReflector.id, value);
        setApplyCount(applyCount + 1);
    }
    setCommonStore((state) => {
      state.actionState.fresnelReflectorReceiver = value;
    });
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    if (selectedReceiverId) {
      setReceiverId(selectedReceiverId);
    }
  };

  if (fresnelReflector?.type !== ObjectType.FresnelReflector) return null;

  return (
    <Dialog
      width={640}
      title={i18n.t('fresnelReflectorMenu.SelectAbsorberToReflectSunlightTo', lang)}
      onApply={apply}
      onClose={close}
    >
      <Row gutter={6}>
        <Col className="gutter-row" span={9}>
          <Select
            style={{ width: '160px' }}
            value={selectedReceiverId}
            onChange={(value) => {
              setSelectedReceiverId(value);
            }}
          >
            {pipes.map((s, i) => {
              return (
                <Option key={i} value={s}>
                  {i18n.t('fresnelReflectorMenu.AbsorberPipe', lang) + ' ' + (i + 1)}
                </Option>
              );
            })}
          </Select>
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={15}
        >
          <Radio.Group onChange={onScopeChange} value={actionScope}>
            <Space direction="vertical">
              <Radio value={Scope.OnlyThisObject}>
                {i18n.t('fresnelReflectorMenu.OnlyThisFresnelReflector', lang)}
              </Radio>
              <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('fresnelReflectorMenu.AllFresnelReflectorsAboveFoundation', lang)}
              </Radio>
              <Radio value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('fresnelReflectorMenu.AllSelectedFresnelReflectors', lang)}
              </Radio>
              <Radio value={Scope.AllObjectsOfThisType}>
                {i18n.t('fresnelReflectorMenu.AllFresnelReflectors', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default FresnelReflectorAbsorberSelection;
