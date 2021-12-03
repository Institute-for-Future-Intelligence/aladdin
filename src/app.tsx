/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
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
import queryString from 'querystring';

const App = () => {
  const locale = useStore(Selector.locale);
  const query = queryString.parse(window.location.search);
  const world = useStore((state: CommonStoreState) => state.world);
  const elements = useStore((state: CommonStoreState) => state.elements);
  const viewState = useStore((state: CommonStoreState) => state.viewState);
  const notes = useStore((state: CommonStoreState) => state.notes);
  const setChanged = useStore(Selector.setChanged);
  const skipChange = useStore(Selector.skipChange);
  const setSkipChange = useStore(Selector.setSkipChange);

  console.log('a');

  useEffect(() => {
    if (skipChange) {
      setSkipChange(false);
    } else {
      setChanged(true);
    }
  }, [world, viewState, elements, notes]);

  return (
    <ConfigProvider locale={locale}>
      <ErrorPage>
        {query.viewonly === 'true' ? (
          <AppCreator viewOnly={true} />
        ) : (
          <Beforeunload onBeforeunload={() => ''}>
            <AppCreator viewOnly={false} />{' '}
          </Beforeunload>
        )}
      </ErrorPage>
    </ConfigProvider>
  );
};

export default App;
