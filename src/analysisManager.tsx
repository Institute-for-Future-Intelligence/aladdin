/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef } from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';

const AnalysisManager = () => {
  const setCommonStore = useStore(Selector.set);
  const dailyPvFlag = useStore(Selector.dailyPvFlag);
  const yearlyPvFlag = useStore(Selector.yearlyPvFlag);
  const solarPanelVisibilityFlag = useStore(Selector.solarPanelVisibilityFlag);
  const dailyParabolicTroughFlag = useStore(Selector.dailyParabolicTroughFlag);
  const yearlyParabolicTroughFlag = useStore(Selector.yearlyParabolicTroughFlag);
  const dailyParabolicDishFlag = useStore(Selector.dailyParabolicDishFlag);
  const yearlyParabolicDishFlag = useStore(Selector.yearlyParabolicDishFlag);

  const firstCallSolarPanelVisibilityFlag = useRef<boolean>(true);
  const firstCallDailyPvFlag = useRef<boolean>(true);
  const firstCallYearlyPvFlag = useRef<boolean>(true);
  const firstCallDailyParabolicTroughFlag = useRef<boolean>(true);
  const firstCallYearlyParabolicTroughFlag = useRef<boolean>(true);
  const firstCallDailyParabolicDishFlag = useRef<boolean>(true);
  const firstCallYearlyParabolicDishFlag = useRef<boolean>(true);

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

  useEffect(() => {
    if (firstCallDailyParabolicDishFlag.current) {
      firstCallDailyParabolicDishFlag.current = false;
    } else {
      setCommonStore((state) => {
        state.viewState.showDailyParabolicDishYieldPanel = true;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyParabolicDishFlag]);

  useEffect(() => {
    if (firstCallYearlyParabolicDishFlag.current) {
      firstCallYearlyParabolicDishFlag.current = false;
    } else {
      setCommonStore((state) => {
        state.viewState.showYearlyParabolicDishYieldPanel = true;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearlyParabolicDishFlag]);

  return <></>;
};

export default React.memo(AnalysisManager);
