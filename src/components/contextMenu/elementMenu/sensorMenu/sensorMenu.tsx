/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { SensorModel } from 'src/models/SensorModel';
import { ObjectType } from 'src/types';
import { Copy, Cut, Lock } from '../../menuItems';
import { SensorLabelTextInput, SensorShowLabelCheckbox } from './sensorMenuItems';
import { useContextMenuElement } from '../menuHooks';

const SensorMenu = () => {
  const sensor = useContextMenuElement(ObjectType.Sensor) as SensorModel;
  if (!sensor) return null;

  const editable = !sensor.locked;

  return (
    <>
      <Copy />

      {editable && <Cut />}

      <Lock selectedElement={sensor} />

      {editable && (
        <>
          <SensorShowLabelCheckbox sensor={sensor} />
          <SensorLabelTextInput sensor={sensor} />
        </>
      )}
    </>
  );
};

export default SensorMenu;
