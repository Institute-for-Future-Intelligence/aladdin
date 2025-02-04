/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { useCallback } from 'react';
import { BatteryStorageModel } from 'src/models/BatteryStorageModel';
import { useStore } from 'src/stores/common';
import { shallow } from 'zustand/shallow';
import BatteryStorage from './batteryStorage';
import { ElementModel } from 'src/models/ElementModel';
import { ObjectType } from 'src/types';
import { BATTERY_STORAGE_WRAPPER_NAME } from './batteryStorageConstants';

interface Props {
  foundationId: string;
  hz: number;
}

/**
 * position is absolute to foundation center. cz is 0
 */
const BatteryStorageWrapper = ({ foundationId, hz }: Props) => {
  const filterFn = useCallback((elem: ElementModel) => {
    return elem.type === ObjectType.BatteryStorage && elem.foundationId === foundationId;
  }, []);

  const batteryStorage = useStore((state) => state.elements.filter(filterFn) as BatteryStorageModel[], shallow);

  return (
    <group name={BATTERY_STORAGE_WRAPPER_NAME} position={[0, 0, hz]}>
      {batteryStorage.map((bs) => (
        <BatteryStorage key={bs.id} {...bs} />
      ))}
    </group>
  );
};

export default BatteryStorageWrapper;
