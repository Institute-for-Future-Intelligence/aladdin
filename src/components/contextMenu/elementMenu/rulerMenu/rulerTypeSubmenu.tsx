/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { Radio, RadioChangeEvent, Space } from 'antd';
import { useLanguage } from 'src/hooks';
import { RulerModel, RulerType } from 'src/models/RulerModel';
import { MenuItem } from '../../menuItems';
import i18n from 'src/i18n/i18n';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { UndoableChangeRulerType } from 'src/undo/UndoableChange';
import { useState } from 'react';

interface Props {
  ruler: RulerModel;
}

export const RulerTypeRadioGroup = ({ ruler }: Props) => {
  const [_type, setType] = useState(ruler.rulerType ?? RulerType.Horizontal);

  const lang = useLanguage();

  const update = (id: string, type: RulerType, rightPoint: number[]) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === id && e.type === ObjectType.Ruler) {
          const ruler = e as RulerModel;
          ruler.rulerType = type;
          ruler.rightEndPoint.position[0] = rightPoint[0];
          ruler.rightEndPoint.position[1] = rightPoint[1];
          ruler.rightEndPoint.position[2] = rightPoint[2];
          break;
        }
      }
    });
  };

  const handleChange = (e: RadioChangeEvent) => {
    const newType = e.target.value;
    const newRightPoint = [...ruler.leftEndPoint.position];
    if (newType === RulerType.Horizontal) {
      newRightPoint[0] += 5;
      newRightPoint[2] = 0;
    } else if (newType === RulerType.Vertical) {
      newRightPoint[2] = 5;
    }
    const undoableChange = {
      name: 'Select Ruler Type',
      timestamp: Date.now(),
      oldType: ruler.rulerType,
      newType: newType,
      oldRightPoint: [...ruler.rightEndPoint.position],
      newRightPoint: newRightPoint,
      id: ruler.id,
      changedElementType: ObjectType.Ruler,
      undo: () => {
        update(undoableChange.id, undoableChange.oldType as RulerType, undoableChange.oldRightPoint);
      },
      redo: () => {
        update(undoableChange.id, undoableChange.newType as RulerType, undoableChange.newRightPoint);
      },
    } as UndoableChangeRulerType;
    useStore.getState().addUndoable(undoableChange);
    update(ruler.id, newType, newRightPoint);
    setType(newType);
  };

  return (
    <MenuItem stayAfterClick noPadding>
      <Radio.Group value={_type} onChange={handleChange}>
        <Space direction="vertical">
          <Radio style={{ width: '100%' }} value={RulerType.Horizontal}>
            {i18n.t('rulerMenu.Horizontal', lang)}
          </Radio>
          <Radio style={{ width: '100%' }} value={RulerType.Vertical}>
            {i18n.t('rulerMenu.Vertical', lang)}
          </Radio>
          {/* <Radio style={{ width: '100%' }} value={RulerType.Arbitrary}>
            {i18n.t('rulerMenu.Arbitrary', lang)}
          </Radio> */}
        </Space>
      </Radio.Group>
    </MenuItem>
  );
};
