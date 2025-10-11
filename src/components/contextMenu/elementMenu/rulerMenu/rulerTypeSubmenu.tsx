/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { useLanguage } from 'src/hooks';
import { RulerModel, RulerType } from 'src/models/RulerModel';
import { ContextSubMenu } from '../../menuItems';
import i18n from 'src/i18n/i18n';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { UndoableChangeRulerType } from 'src/undo/UndoableChange';
import { useState } from 'react';
import { ClickEvent, MenuItem, MenuRadioGroup, RadioChangeEvent } from '@szhsin/react-menu';

interface Props {
  ruler: RulerModel;
}

export const RulerTypeSubmenu = ({ ruler }: Props) => {
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
    const newType = e.value;
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

  const onClickItem = (e: ClickEvent) => {
    e.keepOpen = true;
  };

  return (
    <ContextSubMenu label={i18n.t('rulerMenu.RulerDirection', lang)}>
      <MenuRadioGroup value={_type} onRadioChange={handleChange}>
        <MenuItem type="radio" value={RulerType.Horizontal} onClick={onClickItem}>
          {i18n.t('rulerMenu.Horizontal', lang)}
        </MenuItem>
        <MenuItem type="radio" value={RulerType.Vertical} onClick={onClickItem}>
          {i18n.t('rulerMenu.Vertical', lang)}
        </MenuItem>
        {/* <Radio style={{ width: '100%' }} value={RulerType.Arbitrary}>
            {i18n.t('rulerMenu.Arbitrary', lang)}
          </Radio> */}
      </MenuRadioGroup>
    </ContextSubMenu>
  );
};
