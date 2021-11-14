/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef } from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';

const ViewManager = () => {
  const setCommonStore = useStore(Selector.set);

  const firstCall = useRef<boolean>(true);

  useEffect(() => {
    if (firstCall.current) {
      firstCall.current = false;
    } else {
    }
  }, []);

  return <></>;
};

export default React.memo(ViewManager);
