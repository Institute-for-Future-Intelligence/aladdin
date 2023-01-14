/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
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
  const setChanged = useStore(Selector.setChanged);
  const setSkipChange = useStore(Selector.setSkipChange);
  const loadWeatherData = useStore(Selector.loadWeatherData);
  const loadHorizontalSolarRadiationData = useStore(Selector.loadHorizontalSolarRadiationData);
  const loadVerticalSolarRadiationData = useStore(Selector.loadVerticalSolarRadiationData);
  const loadPvModules = useStore(Selector.loadPvModules);

  useEffect(() => {
    loadWeatherData();
    loadHorizontalSolarRadiationData();
    loadVerticalSolarRadiationData();
    loadPvModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (useStore.getState().skipChange) {
      setSkipChange(false);
    } else if (!useStore.getState().changed) {
      setChanged(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world, viewState, elements, notes]);

  useEffect(() => {
    if (showSolarRadiationHeatmap) {
      usePrimitiveStore.setState((state) => {
        state.showSolarRadiationHeatmap = false;
      });
    }
    if (showHeatFluxes) {
      usePrimitiveStore.setState((state) => {
        state.showHeatFluxes = false;
      });
    }
  }, [world, elements]);

  const params = new URLSearchParams(window.location.search);
  const viewOnly = params.get('viewonly') === 'true';

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
