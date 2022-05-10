/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef } from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import firebase from 'firebase/app';
import 'firebase/database';
import dayjs from 'dayjs';
import { FirebaseName } from './types';

const ActionLogger = () => {
  const actionLoggerFlag = useStore(Selector.actionLoggerFlag);
  const currentUndoable = useStore(Selector.currentUndoable);
  const user = useStore(Selector.user);

  const firstCall = useRef<boolean>(true);
  const databaseRef = useRef<any>();

  useEffect(() => {
    const config = {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      databaseURL: process.env.REACT_APP_FIREBASE_REAL_TIME_DATABASE_URL,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID,
    };
    let app = undefined;
    for (const a of firebase.apps) {
      if (a.name === FirebaseName.LOG_DATA) {
        app = a;
        break;
      }
    }
    if (!app) {
      app = firebase.initializeApp(config, FirebaseName.LOG_DATA);
    }
    if (app) {
      databaseRef.current = firebase.database(app);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (firstCall.current) {
      firstCall.current = false;
    } else {
      const timestamp = dayjs(new Date()).format('MM-DD-YYYY hh:mm:SSS a');
      if (currentUndoable) {
        databaseRef.current.ref(user.uid + '/' + timestamp).set({
          action: JSON.stringify(currentUndoable),
        });
      }
    }
  }, [actionLoggerFlag, user.uid]);

  return <></>;
};

export default React.memo(ActionLogger);
