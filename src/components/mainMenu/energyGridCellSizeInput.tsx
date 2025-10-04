/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { InputNumber, Space } from 'antd';
import i18n from 'src/i18n/i18n';
import { useStore } from 'src/stores/common';
import { useLanguage } from 'src/hooks';
import * as Selector from '../../stores/selector';
import React, { useMemo } from 'react';
import { EnergyModelingType } from '../../types';
import { MainMenuItem } from './mainMenuItems';

export const EnergyGridCellSizeInput = React.memo(({ type }: { type: EnergyModelingType }) => {
  const radiationCellSize = useStore(Selector.world.solarRadiationHeatmapGridCellSize);
  const pvGridCellSize = useStore(Selector.world.pvGridCellSize);
  const cspGridCellSize = useStore(Selector.world.cspGridCellSize);
  const sutGridCellSize = useStore(Selector.world.sutGridCellSize);

  const lang = useLanguage();

  const cellSize = useMemo(() => {
    switch (type) {
      case EnergyModelingType.PV:
        return pvGridCellSize;
      case EnergyModelingType.CSP:
        return cspGridCellSize;
      case EnergyModelingType.SUT:
        return sutGridCellSize;
      default:
        return radiationCellSize;
    }
  }, [type, pvGridCellSize, cspGridCellSize, sutGridCellSize, radiationCellSize]);

  return (
    <MainMenuItem stayAfterClick>
      <Space style={{ width: '150px' }}>{i18n.t('menu.option.GridCellSize', lang) + ':'}</Space>
      <InputNumber
        min={0.1}
        max={5}
        step={0.05}
        style={{ width: 72 }}
        precision={2}
        value={cellSize ?? 0.5}
        onChange={(value) => {
          if (value === null) return;
          useStore.getState().set((state) => {
            switch (type) {
              case EnergyModelingType.PV:
                state.world.pvGridCellSize = value;
                break;
              case EnergyModelingType.CSP:
                state.world.cspGridCellSize = value;
                break;
              case EnergyModelingType.SUT:
                state.world.sutGridCellSize = value;
                break;
              default:
                state.world.solarRadiationHeatmapGridCellSize = value;
                break;
            }
          });
        }}
      />
      <Space style={{ paddingLeft: '10px' }}>{i18n.t('word.MeterAbbreviation', lang)}</Space>
    </MainMenuItem>
  );
});
