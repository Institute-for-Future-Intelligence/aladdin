/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { BatteryStorageModel } from 'src/models/BatteryStorageModel';
import { ObjectType } from 'src/types';
import { Copy, Cut, DialogItem, EditableId, Lock } from '../../menuItems';
import LabelSubmenu from '../../labelSubmenuItems';
import i18n from 'src/i18n/i18n';
import BatteryStorageAzimuthInput from './batteryStorageAzimuthInput';
import BatteryStorageHeightInput from './batteryStorageHeightInput';
import BatteryStorageWidthInput from './batteryStorageWidthInput';
import BatteryStorageLengthInput from './batteryStorageLengthInput';
import BatteryStorageColorSelection from './batteryStorageColorSelection';
import BatteryStorageHvacIdSelection from './batteryStorageHvacIdSelection';
import BatteryStorageChargingEfficiencyInput from './batteryStorageChargingEfficiencyInput';
import BatteryStorageDischargingEfficiencyInput from './batteryStorageDischargingEfficiencyInput';
import { useLanguage } from 'src/hooks';
import { useContextMenuElement } from '../menuHooks';

const BatteryStorageMenu = () => {
  const lang = useLanguage();
  const batteryStorage = useContextMenuElement(ObjectType.BatteryStorage) as BatteryStorageModel;
  if (!batteryStorage) return null;

  const editable = !batteryStorage.locked;

  return (
    <>
      {/* battery-storage-id */}
      <EditableId element={batteryStorage} />

      {/* battery-storage-copy */}
      <Copy />

      {/* battery-storage-cut */}
      {editable && <Cut />}

      {/* battery-storage-lock */}
      <Lock selectedElement={batteryStorage} />

      {editable && (
        <>
          {/* battery-storage-color */}
          <DialogItem Dialog={BatteryStorageColorSelection}>{i18n.t('word.Color', lang)} ...</DialogItem>

          {/* battery-storage-length */}
          <DialogItem Dialog={BatteryStorageLengthInput}>{i18n.t('word.Length', lang)} ...</DialogItem>

          {/* battery-storage-width */}
          <DialogItem Dialog={BatteryStorageWidthInput}>{i18n.t('word.Width', lang)} ...</DialogItem>

          {/* battery-storage-height */}
          <DialogItem Dialog={BatteryStorageHeightInput}>{i18n.t('word.Height', lang)} ...</DialogItem>

          {/* battery-storage-azimuth */}
          <DialogItem Dialog={BatteryStorageAzimuthInput}>{i18n.t('word.Azimuth', lang)} ...</DialogItem>

          {/* battery-storage-charging-efficiency */}
          <DialogItem Dialog={BatteryStorageChargingEfficiencyInput}>
            {i18n.t('batteryStorageMenu.ChargingEfficiency', lang)} ...
          </DialogItem>

          {/* battery-storage-discharging-efficiency */}
          <DialogItem Dialog={BatteryStorageDischargingEfficiencyInput}>
            {i18n.t('batteryStorageMenu.DischargingEfficiency', lang)} ...
          </DialogItem>

          {/* battery-storage-hvacId-selection */}
          <DialogItem Dialog={BatteryStorageHvacIdSelection}>
            {i18n.t('batteryStorageMenu.HvacIdSelection', lang)} ...
          </DialogItem>

          {/* battery-storage-label */}
          <LabelSubmenu element={batteryStorage} />
        </>
      )}
    </>
  );
};

export default BatteryStorageMenu;
