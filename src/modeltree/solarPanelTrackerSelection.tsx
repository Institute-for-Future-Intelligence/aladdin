/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { Select, Space } from 'antd';
import { useStore } from '../stores/common';
import React from 'react';
import { useLanguage } from '../hooks';
import { useTranslation } from 'react-i18next';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { TrackerType } from '../types';
import { SolarPanelModel } from '../models/SolarPanelModel';

const SolarPanelTrackerSelection = ({ solarPanel }: { solarPanel: SolarPanelModel }) => {
  const addUndoable = useStore(Selector.addUndoable);

  const lang = useLanguage();
  const { t } = useTranslation();

  const updateTracker = (value: TrackerType) => {
    useStore.getState().set((state) => {
      const elem = state.elements.find((e) => e.id === solarPanel.id);
      if (elem) {
        (elem as SolarPanelModel).trackerType = value;
      }
    });
  };

  return (
    <Space>
      <span>{t('solarPanelMenu.Tracker', lang)} : </span>
      <Select
        value={solarPanel.trackerType}
        options={[
          {
            value: TrackerType.NO_TRACKER,
            label: <span title={t('solarPanelMenu.NoTracker', lang)}>{t('solarPanelMenu.NoTracker', lang)}</span>,
          },
          {
            value: TrackerType.HORIZONTAL_SINGLE_AXIS_TRACKER,
            label: (
              <span title={t('solarPanelMenu.HorizontalSingleAxisTracker', lang)}>
                {t('solarPanelMenu.HorizontalSingleAxisTracker', lang)}
              </span>
            ),
          },
          {
            value: TrackerType.VERTICAL_SINGLE_AXIS_TRACKER,
            label: (
              <span title={t('solarPanelMenu.VerticalSingleAxisTracker', lang)}>
                {t('solarPanelMenu.VerticalSingleAxisTracker', lang)}
              </span>
            ),
          },
          {
            value: TrackerType.ALTAZIMUTH_DUAL_AXIS_TRACKER,
            label: (
              <span title={t('solarPanelMenu.AltazimuthDualAxisTracker', lang)}>
                {t('solarPanelMenu.AltazimuthDualAxisTracker', lang)}
              </span>
            ),
          },
        ]}
        onChange={(value) => {
          const oldValue = solarPanel.trackerType;
          if (oldValue === value) return;
          const undoableChange = {
            name: 'Select Tracker for Solar Panel',
            timestamp: Date.now(),
            oldValue,
            newValue: value,
            changedElementId: solarPanel.id,
            changedElementType: solarPanel.type,
            undo: () => {
              updateTracker(undoableChange.oldValue as TrackerType);
            },
            redo: () => {
              updateTracker(undoableChange.newValue as TrackerType);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateTracker(value);
        }}
      />
    </Space>
  );
};

export default SolarPanelTrackerSelection;
