/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { Checkbox } from 'antd';
import i18n from 'src/i18n/i18n';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { MenuItem } from '../../menuItems';
import { useLanguage } from 'src/views/hooks';
import { ObjectType } from 'src/types';
import { useStore } from 'src/stores/common';
import { UndoableCheck } from 'src/undo/UndoableCheck';

interface SolarPanelMenuItemProps {
  solarPanel: SolarPanelModel;
  children?: React.ReactNode;
}

export const SolarPanelSunBeamCheckbox = ({ solarPanel }: SolarPanelMenuItemProps) => {
  const updateSolarCollectorDrawSunBeamById = useStore.getState().updateSolarCollectorDrawSunBeamById;

  const lang = useLanguage();

  const drawSunBeam = (checked: boolean) => {
    const undoableCheck = {
      name: 'Show Sun Beam',
      timestamp: Date.now(),
      checked: !solarPanel.drawSunBeam,
      selectedElementId: solarPanel.id,
      selectedElementType: ObjectType.SolarPanel,
      undo: () => {
        updateSolarCollectorDrawSunBeamById(solarPanel.id, !undoableCheck.checked);
      },
      redo: () => {
        updateSolarCollectorDrawSunBeamById(solarPanel.id, undoableCheck.checked);
      },
    } as UndoableCheck;
    useStore.getState().addUndoable(undoableCheck);
    updateSolarCollectorDrawSunBeamById(solarPanel.id, checked);
  };

  return (
    <MenuItem stayAfterClick>
      <Checkbox checked={!!solarPanel.drawSunBeam} onChange={(e) => drawSunBeam(e.target.checked)}>
        {i18n.t('solarCollectorMenu.DrawSunBeam', lang)}
      </Checkbox>
    </MenuItem>
  );
};
