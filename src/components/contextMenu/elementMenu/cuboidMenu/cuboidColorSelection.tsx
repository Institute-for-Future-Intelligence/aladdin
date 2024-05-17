/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { CompactPicker } from 'react-color';
import { Col, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { CommonStoreState, useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { ObjectType, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { CuboidModel } from '../../../../models/CuboidModel';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/hooks';

const CuboidColorSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.cuboidActionScope);
  const setActionScope = useStore(Selector.setCuboidActionScope);
  const selectedSideIndex = useStore(Selector.selectedSideIndex);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const cuboid = useSelectedElement(ObjectType.Cuboid) as CuboidModel | undefined;

  const [selectedColor, setSelectedColor] = useState<string>(cuboid?.color ?? '#808080');
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);

  const lang = useLanguage();

  useEffect(() => {
    updateSelectedColor();
  }, [cuboid, selectedSideIndex]);

  const updateCuboidColorBySide = (side: number, id: string, color: string) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Cuboid && e.id === id && !e.locked) {
          const cuboid = e as CuboidModel;
          if (!cuboid.faceColors) {
            cuboid.faceColors = new Array<string>(6);
            cuboid.faceColors.fill(cuboid.color ?? color);
          }
          cuboid.faceColors[side] = color;
          break;
        }
      }
    });
  };

  const updateCuboidColorById = (id: string, color: string) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Cuboid && e.id === id && !e.locked) {
          e.color = color;
          const cuboid = e as CuboidModel;
          if (!cuboid.faceColors) cuboid.faceColors = new Array<string>(6);
          for (let i = 0; i < 4; i++) {
            cuboid.faceColors[i] = color;
          }
          break;
        }
      }
    });
  };

  const updateCuboidColorForAll = (color: string) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Cuboid && !e.locked) {
          e.color = color;
          const cuboid = e as CuboidModel;
          if (!cuboid.faceColors) cuboid.faceColors = new Array<string>(6);
          for (let i = 0; i < 4; i++) {
            cuboid.faceColors[i] = color;
          }
        }
      }
    });
  };

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const updateSelectedColor = () => {
    if (cuboid) {
      if (selectedSideIndex >= 0 && cuboid.faceColors) {
        setSelectedColor(cuboid.faceColors[selectedSideIndex]);
      } else {
        setSelectedColor(cuboid.color ?? '#808080');
      }
    }
  };

  const needChange = (color: string) => {
    if (!cuboid) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Cuboid && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const cm = e as CuboidModel;
            if (cm.faceColors) {
              // do not check the top and bottom sides, check only the vertical sides (the first four)
              for (let i = 0; i < 4; i++) {
                if (color !== cm.faceColors[i]) {
                  return true;
                }
              }
            } else {
              if (color !== cm.color) {
                return true;
              }
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Cuboid && !e.locked) {
            const cm = e as CuboidModel;
            if (cm.faceColors) {
              // do not check the top and bottom sides, check only the vertical sides (the first four)
              for (let i = 0; i < 4; i++) {
                if (color !== cm.faceColors[i]) {
                  return true;
                }
              }
            } else {
              if (color !== cm.color) {
                return true;
              }
            }
          }
        }
        break;
      case Scope.OnlyThisObject:
        if (cuboid.faceColors) {
          // do not check the top and bottom sides, check only the vertical sides (the first four)
          for (let i = 0; i < 4; i++) {
            if (color !== cuboid.faceColors[i]) {
              return true;
            }
          }
        } else {
          if (color !== cuboid?.color) {
            return true;
          }
        }
        break;
      default:
        if (selectedSideIndex >= 0) {
          const oldColor = cuboid?.faceColors ? cuboid?.faceColors[selectedSideIndex] : cuboid?.color;
          if (color !== oldColor) {
            return true;
          }
        } else {
          if (color !== cuboid?.color) {
            return true;
          }
        }
    }
    return false;
  };

  const setColor = (value: string) => {
    if (!cuboid) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldColorsSelected = new Map<string, string[]>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Cuboid && useStore.getState().selectedElementIdSet.has(elem.id)) {
            const cm = elem as CuboidModel;
            if (cm.faceColors) {
              oldColorsSelected.set(elem.id, [...cm.faceColors]);
            } else {
              const c = cm.color ?? '#808080';
              oldColorsSelected.set(elem.id, [c, c, c, c, c, c]);
            }
          }
        }
        const undoableChangeSelected = {
          name: 'Set Color for Selected Cuboids',
          timestamp: Date.now(),
          oldValues: oldColorsSelected,
          newValue: value,
          undo: () => {
            for (const [id, colors] of undoableChangeSelected.oldValues.entries()) {
              if (colors && Array.isArray(colors)) {
                for (let i = 0; i < colors.length; i++) {
                  updateCuboidColorBySide(i, id, colors[i] as string);
                }
              }
            }
          },
          redo: () => {
            for (const [id, colors] of undoableChangeSelected.oldValues.entries()) {
              if (colors && Array.isArray(colors)) {
                for (let i = 0; i < colors.length; i++) {
                  updateCuboidColorBySide(i, id, undoableChangeSelected.newValue as string);
                }
              }
            }
            // updateCuboidColorForAll(undoableChangeAll.newValue as string);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        for (const [id, colors] of oldColorsSelected.entries()) {
          if (colors && Array.isArray(colors)) {
            for (let i = 0; i < colors.length; i++) {
              updateCuboidColorBySide(i, id, value);
            }
          }
        }
        setApplyCount(applyCount + 1);
        setCommonStore((state) => {
          if (!state.actionState.cuboidFaceColors)
            state.actionState.cuboidFaceColors = ['#808080', '#808080', '#808080', '#808080', '#808080', '#808080'];
          for (let i = 0; i < 4; i++) {
            state.actionState.cuboidFaceColors[i] = value;
          }
        });
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldColorsAll = new Map<string, string[]>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Cuboid) {
            const cm = elem as CuboidModel;
            if (cm.faceColors) {
              oldColorsAll.set(elem.id, [...cm.faceColors]);
            } else {
              const c = cm.color ?? '#808080';
              oldColorsAll.set(elem.id, [c, c, c, c, c, c]);
            }
          }
        }
        const undoableChangeAll = {
          name: 'Set Color for All Cuboids',
          timestamp: Date.now(),
          oldValues: oldColorsAll,
          newValue: value,
          undo: () => {
            for (const [id, colors] of undoableChangeAll.oldValues.entries()) {
              if (colors && Array.isArray(colors)) {
                for (let i = 0; i < colors.length; i++) {
                  updateCuboidColorBySide(i, id, colors[i] as string);
                }
              }
            }
          },
          redo: () => {
            updateCuboidColorForAll(undoableChangeAll.newValue as string);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateCuboidColorForAll(value);
        setApplyCount(applyCount + 1);
        setCommonStore((state) => {
          if (!state.actionState.cuboidFaceColors)
            state.actionState.cuboidFaceColors = ['#808080', '#808080', '#808080', '#808080', '#808080', '#808080'];
          for (let i = 0; i < 4; i++) {
            state.actionState.cuboidFaceColors[i] = value;
          }
        });
        break;
      }
      case Scope.OnlyThisObject:
        let oldColors;
        if (cuboid.faceColors) {
          oldColors = [...cuboid.faceColors];
        } else {
          const c = cuboid.color ?? '#808080';
          oldColors = [c, c, c, c, c, c];
        }
        const undoableChange = {
          name: 'Set Color for All Sides of Selected Cuboid',
          timestamp: Date.now(),
          oldValue: oldColors,
          newValue: value,
          changedElementId: cuboid.id,
          changedElementType: cuboid.type,
          undo: () => {
            if (undoableChange.oldValue && Array.isArray(undoableChange.oldValue)) {
              for (let i = 0; i < undoableChange.oldValue.length; i++) {
                updateCuboidColorBySide(i, undoableChange.changedElementId, undoableChange.oldValue[i] as string);
              }
            }
          },
          redo: () => {
            updateCuboidColorById(undoableChange.changedElementId, undoableChange.newValue as string);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateCuboidColorById(cuboid.id, value);
        setApplyCount(applyCount + 1);
        setCommonStore((state) => {
          if (!state.actionState.cuboidFaceColors)
            state.actionState.cuboidFaceColors = ['#808080', '#808080', '#808080', '#808080', '#808080', '#808080'];
          for (let i = 0; i < 4; i++) {
            state.actionState.cuboidFaceColors[i] = value;
          }
        });
        break;
      default:
        if (selectedSideIndex >= 0) {
          const oldColor = cuboid.faceColors ? cuboid.faceColors[selectedSideIndex] : cuboid.color;
          const undoableChange = {
            name: 'Set Color for Selected Side of Cuboid',
            timestamp: Date.now(),
            oldValue: oldColor,
            newValue: value,
            changedElementId: cuboid.id,
            changedElementType: cuboid.type,
            changedSideIndex: selectedSideIndex,
            undo: () => {
              if (undoableChange.changedSideIndex !== undefined) {
                updateCuboidColorBySide(
                  undoableChange.changedSideIndex,
                  undoableChange.changedElementId,
                  undoableChange.oldValue as string,
                );
              }
            },
            redo: () => {
              if (undoableChange.changedSideIndex !== undefined) {
                updateCuboidColorBySide(
                  undoableChange.changedSideIndex,
                  undoableChange.changedElementId,
                  undoableChange.newValue as string,
                );
              }
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateCuboidColorBySide(selectedSideIndex, cuboid.id, value);
          setApplyCount(applyCount + 1);
          setCommonStore((state) => {
            if (!state.actionState.cuboidFaceColors)
              state.actionState.cuboidFaceColors = ['#808080', '#808080', '#808080', '#808080', '#808080', '#808080'];
            state.actionState.cuboidFaceColors[selectedSideIndex] = value;
          });
        }
    }
    setUpdateFlag(!updateFlag);
  };

  const close = () => {
    updateSelectedColor();
    setDialogVisible(false);
  };

  const apply = () => {
    setColor(selectedColor);
    setDialogVisible(false);
    setApplyCount(0);
  };

  const currentColor =
    selectedSideIndex >= 0 && cuboid?.faceColors ? cuboid.faceColors[selectedSideIndex] : cuboid?.color ?? '#808080';

  return (
    <Dialog width={600} title={i18n.t('word.Color', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col className="gutter-row" span={12}>
          <CompactPicker
            color={selectedColor ?? currentColor}
            onChangeComplete={(colorResult) => {
              setSelectedColor(colorResult.hex);
              setUpdateFlag(!updateFlag);
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
              <Radio style={{ width: '100%' }} value={Scope.OnlyThisSide}>
                {i18n.t('cuboidMenu.OnlyThisSide', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.OnlyThisObject}>
                {i18n.t('cuboidMenu.AllSidesOfThisCuboid', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('cuboidMenu.AllSidesOfSelectedCuboids', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisType}>
                {i18n.t('cuboidMenu.AllSidesOfAllCuboids', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default CuboidColorSelection;
