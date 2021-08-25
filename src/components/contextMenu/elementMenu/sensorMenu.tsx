import React, { useState } from 'react';
import { Checkbox, Input, Menu } from 'antd';
import { useStore } from 'src/stores/common';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { Copy, Cut } from '../menuItems';

export const SensorMenu = () => {
  const updateElementById = useStore((state) => state.updateElementById);
  const getSelectedElement = useStore((state) => state.getSelectedElement);
  const selectedElement = getSelectedElement();

  const [labelText, setLabelText] = useState<string>(selectedElement?.label ?? '');

  const updateElementLabelText = () => {
    if (selectedElement) {
      updateElementById(selectedElement.id, { label: labelText });
      // setUpdateFlag(!updateFlag);
    }
  };

  const showElementLabel = (e: CheckboxChangeEvent) => {
    if (selectedElement) {
      updateElementById(selectedElement.id, { showLabel: e.target.checked });
      // setUpdateFlag(!updateFlag);
    }
  };

  return (
    <>
      <Copy />
      <Cut />
      <Menu>
        <Menu.Item key={'sensor-label-text'} style={{ paddingLeft: '40px' }}>
          <Input
            addonBefore="Label:"
            value={labelText}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabelText(e.target.value)}
            onPressEnter={updateElementLabelText}
            onBlur={updateElementLabelText}
          />
        </Menu.Item>
      </Menu>
      <Menu.Item key={'sensor-show-label'}>
        <Checkbox checked={!!selectedElement?.showLabel} onChange={showElementLabel}>
          Keep Showing Label
        </Checkbox>
      </Menu.Item>
    </>
  );
};
