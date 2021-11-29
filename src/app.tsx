/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 *
 * @author Charles Xie, Xiaotong Ding
 */

import React from 'react';
import { useStore } from './stores/common';
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
