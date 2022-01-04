/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { CompactPicker } from 'react-color';
import { Button, Col, Modal, Radio, RadioChangeEvent, Row, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { CuboidModel } from '../../../models/CuboidModel';

const CuboidColorSelection = ({
  colorDialogVisible,
  setColorDialogVisible,
}: {
  colorDialogVisible: boolean;
  setColorDialogVisible: (b: boolean) => void;
}) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const updateCuboidColorBySide = useStore(Selector.updateCuboidColorBySide);
  const updateCuboidColorById = useStore(Selector.updateCuboidColorById);
  const updateCuboidColorForAll = useStore(Selector.updateCuboidColorForAll);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const addUndoable = useStore(Selector.addUndoable);
  const cuboidActionScope = useStore(Selector.cuboidActionScope);
  const setCuboidActionScope = useStore(Selector.setCuboidActionScope);
  const selectedSideIndex = useStore(Selector.selectedSideIndex);

  const cuboid = getSelectedElement() as CuboidModel;
  const [selectedColor, setSelectedColor] = useState<string>(cuboid?.color ?? 'gray');
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const lang = { lng: language };

  useEffect(() => {
    updateSelectedColor();
  }, [cuboid, selectedSideIndex]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setCuboidActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const updateSelectedColor = () => {
    if (cuboid) {
      if (selectedSideIndex >= 0 && cuboid.faceColors) {
        setSelectedColor(cuboid.faceColors[selectedSideIndex]);
      } else {
        setSelectedColor(cuboid.color ?? 'gray');
      }
    }
  };

  const needChange = (color: string) => {
    switch (cuboidActionScope) {
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
    switch (cuboidActionScope) {
      case Scope.AllObjectsOfThisType:
        const oldColorsAll = new Map<string, string[]>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Cuboid) {
            const cm = elem as CuboidModel;
            if (cm.faceColors) {
              oldColorsAll.set(elem.id, [...cm.faceColors]);
            } else {
              const c = cm.color ?? 'gray';
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
                  updateCuboidColorBySide(i, id, colors[i]);
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
        break;
      case Scope.OnlyThisObject:
        if (cuboid) {
          let oldColors;
          if (cuboid.faceColors) {
            oldColors = [...cuboid.faceColors];
          } else {
            const c = cuboid.color ?? 'gray';
            oldColors = [c, c, c, c, c, c];
          }
          const undoableChange = {
            name: 'Set Color for All Sides of Selected Cuboid',
            timestamp: Date.now(),
            oldValue: oldColors,
            newValue: value,
            changedElementId: cuboid.id,
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
        }
        break;
      default:
        if (cuboid && selectedSideIndex >= 0) {
          const oldColor = cuboid.faceColors ? cuboid.faceColors[selectedSideIndex] : cuboid.color;
          const undoableChange = {
            name: 'Set Color for Selected Side of Cuboid',
            timestamp: Date.now(),
            oldValue: oldColor,
            newValue: value,
            changedElementId: cuboid.id,
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
        }
    }
    setUpdateFlag(!updateFlag);
  };

  const onStart = (event: DraggableEvent, uiData: DraggableData) => {
    if (dragRef.current) {
      const { clientWidth, clientHeight } = window.document.documentElement;
      const targetRect = dragRef.current.getBoundingClientRect();
      setBounds({
        left: -targetRect.left + uiData.x,
        right: clientWidth - (targetRect.right - uiData.x),
        top: -targetRect.top + uiData.y,
        bottom: clientHeight - (targetRect?.bottom - uiData.y),
      });
    }
  };

  const currentColor =
    selectedSideIndex >= 0 && cuboid?.faceColors ? cuboid.faceColors[selectedSideIndex] : cuboid?.color ?? 'gray';

  return (
    <>
      <Modal
        width={600}
        visible={colorDialogVisible}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('word.Color', lang)}
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setColor(selectedColor);
            }}
          >
            {i18n.t('word.Apply', lang)}
          </Button>,
          <Button
            key="Cancel"
            onClick={() => {
              updateSelectedColor();
              setColorDialogVisible(false);
            }}
          >
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button
            key="OK"
            type="primary"
            onClick={() => {
              setColor(selectedColor);
              setColorDialogVisible(false);
            }}
          >
            {i18n.t('word.OK', lang)}
          </Button>,
        ]}
        // this must be specified for the x button in the upper-right corner to work
        onCancel={() => {
          updateSelectedColor();
          setColorDialogVisible(false);
        }}
        destroyOnClose={false}
        modalRender={(modal) => (
          <Draggable disabled={!dragEnabled} bounds={bounds} onStart={(event, uiData) => onStart(event, uiData)}>
            <div ref={dragRef}>{modal}</div>
          </Draggable>
        )}
      >
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
            <Radio.Group onChange={onScopeChange} value={cuboidActionScope}>
              <Space direction="vertical">
                <Radio value={Scope.OnlyThisSide}>{i18n.t('cuboidMenu.OnlyThisSide', lang)}</Radio>
                <Radio value={Scope.OnlyThisObject}>{i18n.t('cuboidMenu.AllSidesOfThisCuboid', lang)}</Radio>
                <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('cuboidMenu.AllSidesOfAllCuboids', lang)}</Radio>
              </Space>
            </Radio.Group>
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default CuboidColorSelection;
