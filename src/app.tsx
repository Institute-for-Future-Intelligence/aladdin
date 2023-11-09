/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 *
 * @author Charles Xie, Xiaotong Ding
 */

import React, { useEffect } from 'react';
import { CommonStoreState, useStore } from './stores/common';
import * as Selector from 'src/stores/selector';
import './app.css';
import ErrorPage from './ErrorPage';
import { Beforeunload } from 'react-beforeunload';
import { ConfigProvider } from 'antd';
import AppCreator from './appCreator';
import LocalFileManager from './localFileManager';
import { usePrimitiveStore } from './stores/commonPrimitive';

const App = () => {
  const locale = useStore(Selector.locale);
  const world = useStore((state: CommonStoreState) => state.world);
  const elements = useStore((state: CommonStoreState) => state.elements);
  const viewState = useStore((state: CommonStoreState) => state.viewState);
  const notes = useStore((state: CommonStoreState) => state.notes);
  const showSolarRadiationHeatmap = usePrimitiveStore(Selector.showSolarRadiationHeatmap);
  const showHeatFluxes = usePrimitiveStore(Selector.showHeatFluxes);
  const setChanged = usePrimitiveStore(Selector.setChanged);
  const setSkipChange = usePrimitiveStore(Selector.setSkipChange);
  const loadWeatherData = useStore(Selector.loadWeatherData);
  const loadHorizontalSolarRadiationData = useStore(Selector.loadHorizontalSolarRadiationData);
  const loadVerticalSolarRadiationData = useStore(Selector.loadVerticalSolarRadiationData);
  const loadPvModules = useStore(Selector.loadPvModules);

  const params = new URLSearchParams(window.location.search);
  const viewOnly = params.get('viewonly') === 'true';
  const map = params.get('map') === 'true';

  useEffect(() => {
    loadWeatherData();
    loadHorizontalSolarRadiationData();
    loadVerticalSolarRadiationData();
    loadPvModules();
    usePrimitiveStore.getState().set((state) => {
      state.openModelsMap = map;
      if (map) {
        state.modelsMapFlag = true;
        state.modelsMapWeatherStations = false;
        state.leaderboardFlag = true;
        state.showLeaderboard = true;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (usePrimitiveStore.getState().skipChange) {
      setSkipChange(false);
    } else if (!usePrimitiveStore.getState().changed) {
      setChanged(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world, viewState, elements, notes]);

  useEffect(() => {
    if (showSolarRadiationHeatmap) {
      usePrimitiveStore.getState().set((state) => {
        state.showSolarRadiationHeatmap = false;
      });
    }
    if (showHeatFluxes) {
      usePrimitiveStore.getState().set((state) => {
        state.showHeatFluxes = false;
      });
    }
  }, [world, elements]);

  return (
    <ConfigProvider locale={locale}>
      <ErrorPage>
        {viewOnly ? (
          <AppCreator viewOnly={true} />
        ) : (
          <Beforeunload onBeforeunload={() => ''}>
            <AppCreator viewOnly={false} />{' '}
          </Beforeunload>
        )}
        <LocalFileManager viewOnly={viewOnly} />
      </ErrorPage>
    </ConfigProvider>
  );
};

export default App;
