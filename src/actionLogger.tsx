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
  const actionInfo = useStore(Selector.actionInfo);
  const currentUndoable = useStore(Selector.currentUndoable);
  const user = useStore(Selector.user);
  const cloudFile = useStore(Selector.cloudFile);

  const firstCallUndo = useRef<boolean>(true);
  const firstCallAction = useRef<boolean>(true);
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
    if (firstCallUndo.current) {
      firstCallUndo.current = false;
    } else {
      if (currentUndoable) {
        // we cannot use hh:mm:SSS as suggested by dayjs's format documentation
        // because SSS only takes the last three digits of the millisecond string,
        // resulting in incorrect ordering of the log. so we use the millisecond string
        // to ensure the order and use the formatted string to provide readability.
        const timestamp =
          dayjs(new Date(currentUndoable.timestamp)).format('MM-DD-YYYY hh:mm a') +
          ' (' +
          currentUndoable.timestamp +
          ')';
        databaseRef.current.ref(user.uid + '/' + timestamp).set({
          file: cloudFile ?? 'Untitled',
          action: JSON.stringify(currentUndoable),
        });
      }
    }
  }, [currentUndoable, user.uid]);

  useEffect(() => {
    if (firstCallAction.current) {
      firstCallAction.current = false;
    } else {
      if (actionInfo) {
        const timestamp =
          dayjs(new Date(actionInfo.timestamp)).format('MM-DD-YYYY hh:mm a') + ' (' + actionInfo.timestamp + ')';
        databaseRef.current.ref(user.uid + '/' + timestamp).set({
          file: cloudFile ?? 'Untitled',
          action: JSON.stringify(actionInfo),
        });
      }
    }
  }, [actionInfo, user.uid]);

  return <></>;
};

export default React.memo(ActionLogger);
