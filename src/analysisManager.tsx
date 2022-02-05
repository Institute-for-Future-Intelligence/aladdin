/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef } from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';

const AnalysisManager = () => {
  const setCommonStore = useStore(Selector.set);
  const dailyLightSensorFlag = useStore(Selector.dailyLightSensorFlag);
  const yearlyLightSensorFlag = useStore(Selector.yearlyLightSensorFlag);
  const dailyPvFlag = useStore(Selector.dailyPvFlag);
  const yearlyPvFlag = useStore(Selector.yearlyPvFlag);
  const solarPanelVisibilityFlag = useStore(Selector.solarPanelVisibilityFlag);
  const dailyParabolicTroughFlag = useStore(Selector.dailyParabolicTroughFlag);
  const yearlyParabolicTroughFlag = useStore(Selector.yearlyParabolicTroughFlag);

  const firstCallSolarPanelVisibilityFlag = useRef<boolean>(true);
  const firstCallDailyLightSensorFlag = useRef<boolean>(true);
  const firstCallYearlyLightSensorFlag = useRef<boolean>(true);
  const firstCallDailyPvFlag = useRef<boolean>(true);
  const firstCallYearlyPvFlag = useRef<boolean>(true);
  const firstCallDailyParabolicTroughFlag = useRef<boolean>(true);
  const firstCallYearlyParabolicTroughFlag = useRef<boolean>(true);

  useEffect(() => {
    if (firstCallSolarPanelVisibilityFlag.current) {
      firstCallSolarPanelVisibilityFlag.current = false;
    } else {
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
      setCommonStore((state) => {
        state.viewState.showDailyPvYieldPanel = true;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyPvFlag]);

  useEffect(() => {
    if (firstCallYearlyPvFlag.current) {
      firstCallYearlyPvFlag.current = false;
    } else {
      setCommonStore((state) => {
        state.viewState.showYearlyPvYieldPanel = true;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearlyPvFlag]);

  useEffect(() => {
    if (firstCallDailyParabolicTroughFlag.current) {
      firstCallDailyParabolicTroughFlag.current = false;
    } else {
      setCommonStore((state) => {
        state.viewState.showDailyParabolicTroughYieldPanel = true;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyParabolicTroughFlag]);

  useEffect(() => {
    if (firstCallYearlyParabolicTroughFlag.current) {
      firstCallYearlyParabolicTroughFlag.current = false;
    } else {
      setCommonStore((state) => {
        state.viewState.showYearlyParabolicTroughYieldPanel = true;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearlyParabolicTroughFlag]);

  return <></>;
};

export default React.memo(AnalysisManager);
