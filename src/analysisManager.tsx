/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef } from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { ObjectType } from './types';
import { showInfo } from './helpers';
import i18n from './i18n/i18n';

const AnalysisManager = () => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const countElementsByType = useStore(Selector.countElementsByType);
  const countObservers = useStore(Selector.countObservers);
  const dailyLightSensorFlag = useStore(Selector.dailyLightSensorFlag);
  const yearlyLightSensorFlag = useStore(Selector.yearlyLightSensorFlag);
  const dailyPvFlag = useStore(Selector.dailyPvFlag);
  const yearlyPvFlag = useStore(Selector.yearlyPvFlag);
  const solarPanelVisibilityFlag = useStore(Selector.solarPanelVisibilityFlag);

  const firstCallSolarPanelVisibilityFlag = useRef<boolean>(true);
  const firstCallDailyLightSensorFlag = useRef<boolean>(true);
  const firstCallYearlyLightSensorFlag = useRef<boolean>(true);
  const firstCallDailyPvFlag = useRef<boolean>(true);
  const firstCallYearlyPvFlag = useRef<boolean>(true);
  const lang = { lng: language };

  useEffect(() => {
    if (firstCallSolarPanelVisibilityFlag.current) {
      firstCallSolarPanelVisibilityFlag.current = false;
    } else {
      const observerCount = countObservers();
      if (observerCount === 0) {
        showInfo(i18n.t('analysisManager.NoObserverForVisibilityAnalysis', lang));
        return;
      }
      setCommonStore((state) => {
        state.viewState.showSolarPanelVisibilityResultsPanel = true;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solarPanelVisibilityFlag]);

  useEffect(() => {
    if (firstCallDailyLightSensorFlag.current) {
      firstCallDailyLightSensorFlag.current = false;
    } else {
      const sensorCount = countElementsByType(ObjectType.Sensor);
      if (sensorCount === 0) {
        showInfo(i18n.t('analysisManager.NoSensorForCollectingData', lang));
        return;
      }
      setCommonStore((state) => {
        state.viewState.showDailyLightSensorPanel = true;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyLightSensorFlag]);

  useEffect(() => {
    if (firstCallYearlyLightSensorFlag.current) {
      firstCallYearlyLightSensorFlag.current = false;
    } else {
      const sensorCount = countElementsByType(ObjectType.Sensor);
      if (sensorCount === 0) {
        showInfo(i18n.t('analysisManager.NoSensorForCollectingData', lang));
        return;
      }
      setCommonStore((state) => {
        state.viewState.showYearlyLightSensorPanel = true;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearlyLightSensorFlag]);

  useEffect(() => {
    if (firstCallDailyPvFlag.current) {
      firstCallDailyPvFlag.current = false;
    } else {
      const solarPanelCount = countElementsByType(ObjectType.SolarPanel);
      if (solarPanelCount === 0) {
        showInfo(i18n.t('analysisManager.NoSolarPanelForAnalysis', lang));
        return;
      }
      setCommonStore((state) => {
        state.viewState.showDailyPvYieldPanel = true;
        state.viewState.showHeatmap = true;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyPvFlag]);

  useEffect(() => {
    if (firstCallYearlyPvFlag.current) {
      firstCallYearlyPvFlag.current = false;
    } else {
      const solarPanelCount = countElementsByType(ObjectType.SolarPanel);
      if (solarPanelCount === 0) {
        showInfo(i18n.t('analysisManager.NoSolarPanelForAnalysis', lang));
        return;
      }
      setCommonStore((state) => {
        state.viewState.showYearlyPvYieldPanel = true;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearlyPvFlag]);

  return <></>;
};

export default React.memo(AnalysisManager);
