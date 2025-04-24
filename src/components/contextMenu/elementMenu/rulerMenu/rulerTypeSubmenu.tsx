import { Radio, RadioChangeEvent, Space } from 'antd';
import { useLanguage } from 'src/hooks';
import { RulerModel, RulerType } from 'src/models/RulerModel';
import { MenuItem } from '../../menuItems';
import i18n from 'src/i18n/i18n';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { UndoableChange } from 'src/undo/UndoableChange';
import { useState } from 'react';

interface Props {
  id: string;
  type: RulerType;
}

export const RulerTypeRadioGroup = ({ id, type }: Props) => {
  const [_type, setType] = useState(type);

  const lang = useLanguage();

  const updateRulerType = (id: string, type: RulerType) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === id && e.type === ObjectType.Ruler) {
          (e as RulerModel).rulerType = type;
          break;
        }
      }
    });
  };

  const handleChange = (e: RadioChangeEvent) => {
    const newType = e.target.value;
    const undoableChange = {
      name: 'Select Ruler Type',
      timestamp: Date.now(),
      oldValue: _type,
      newValue: newType,
      changedElementId: id,
      changedElementType: ObjectType.Ruler,
      undo: () => {
        updateRulerType(undoableChange.changedElementId, undoableChange.oldValue as RulerType);
      },
      redo: () => {
        updateRulerType(undoableChange.changedElementId, undoableChange.newValue as RulerType);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    updateRulerType(id, newType);
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
