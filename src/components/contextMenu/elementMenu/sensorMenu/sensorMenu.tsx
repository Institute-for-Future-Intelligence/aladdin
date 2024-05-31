/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { type MenuProps } from 'antd';
import { ElementModel } from 'src/models/ElementModel';
import { SensorModel } from 'src/models/SensorModel';
import { ObjectType } from 'src/types';
import { Copy, Cut, Lock } from '../../menuItems';
import { SensorLabelTextInput, SensorShowLabelCheckbox } from './sensorMenuItems';

export const createSensorMenu = (selectedElement: ElementModel) => {
  const items: MenuProps['items'] = [];

  if (selectedElement.type !== ObjectType.Sensor) return { items };

  const sensor = selectedElement as SensorModel;

  const editable = !sensor.locked;

  items.push({
    key: 'sensor-copy',
    label: <Copy />,
  });

  if (editable) {
    items.push({
      key: 'sensor-cut',
      label: <Cut />,
    });
  }

  items.push({
    key: 'sensor-lock',
    label: <Lock selectedElement={sensor} />,
  });

  if (editable) {
    items.push({
      key: 'sensor-show-label',
      label: <SensorShowLabelCheckbox sensor={sensor} />,
    });
    items.push({
      key: 'sensor-label-text',
      label: <SensorLabelTextInput sensor={sensor} />,
    });
  }

  return { items } as MenuProps;
};
