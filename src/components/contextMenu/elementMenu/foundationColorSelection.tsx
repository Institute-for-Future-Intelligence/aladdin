/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useRef, useState } from 'react';
import { CompactPicker } from 'react-color';
import { Col, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { FoundationModel } from '../../../models/FoundationModel';
import { useSelectedElement } from './menuHooks';
import Dialog from '../dialog';

const FoundationColorSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const updateElementColorById = useStore(Selector.updateElementColorById);
  const getElementById = useStore(Selector.getElementById);
  const updateElementColorForAll = useStore(Selector.updateElementColorForAll);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.foundationActionScope);
  const setActionScope = useStore(Selector.setFoundationActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const foundation = useSelectedElement(ObjectType.Foundation) as FoundationModel | undefined;

  // useRef for keyboard listener closure
  const selectedColorRef = useRef(foundation?.color ?? '#808080');
  const [selectedColor, setSelectedColor] = useState(selectedColorRef.current);

  const lang = { lng: language };

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (color: string) => {
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Foundation && !e.locked) {
            const f = e as FoundationModel;
            if (color !== f.color) {
              return true;
            }
          }
        }
        break;
      default:
        if (color !== foundation?.color) {
          return true;
        }
    }
    return false;
  };

  const updateColor = (value: string) => {
    if (!foundation) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        const oldColorsAll = new Map<string, string>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Foundation) {
            oldColorsAll.set(elem.id, elem.color ?? '#808080');
          }
        }
        const undoableChangeAll = {
          name: 'Set Color for All Foundations',
          timestamp: Date.now(),
          oldValues: oldColorsAll,
          newValue: value,
          undo: () => {
            for (const [id, color] of undoableChangeAll.oldValues.entries()) {
              updateElementColorById(id, color as string);
            }
          },
          redo: () => {
            updateElementColorForAll(ObjectType.Foundation, undoableChangeAll.newValue as string);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateElementColorForAll(ObjectType.Foundation, value);
        setApplyCount(applyCount + 1);
        break;
      default:
        // foundation via selected element may be outdated, make sure that we get the latest
        const f = getElementById(foundation.id);
        const oldColor = f ? f.color : foundation.color;
        const undoableChange = {
          name: 'Set Color of Selected Foundation',
          timestamp: Date.now(),
          oldValue: oldColor,
          newValue: value,
          changedElementId: foundation.id,
          changedElementType: foundation.type,
          undo: () => {
            updateElementColorById(undoableChange.changedElementId, undoableChange.oldValue as string);
          },
          redo: () => {
            updateElementColorById(undoableChange.changedElementId, undoableChange.newValue as string);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateElementColorById(foundation.id, value);
        setApplyCount(applyCount + 1);
    }
    setCommonStore((state) => {
      state.actionState.foundationColor = value;
    });
  };

  const apply = () => {
    updateColor(selectedColorRef.current);
  };

  const close = () => {
    setDialogVisible(false);
  };

  const ok = () => {
    apply();
    close();
    setApplyCount(0);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  return (
    <Dialog
      width={600}
      title={i18n.t('word.Color', lang)}
      onClickApply={apply}
      onClickCancel={cancel}
      onClickOk={ok}
      onClose={close}
    >
      <Row gutter={6}>
        <Col className="gutter-row" span={12}>
          <CompactPicker
            color={selectedColor}
            onChangeComplete={(colorResult) => {
              setSelectedColor(colorResult.hex);
              selectedColorRef.current = colorResult.hex;
            }}
          />
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={12}
        >
          <Radio.Group onChange={onScopeChange} value={actionScope}>
            <Space direction="vertical">
              <Radio value={Scope.OnlyThisObject}>{i18n.t('foundationMenu.OnlyThisFoundation', lang)}</Radio>
              <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('foundationMenu.AllFoundations', lang)}</Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default FoundationColorSelection;
