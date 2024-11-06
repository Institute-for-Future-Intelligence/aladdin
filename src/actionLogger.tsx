/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef } from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import firebase from 'firebase/app';
import 'firebase/database';
import dayjs from 'dayjs';
import { ClassID, FirebaseName, SchoolID } from './types';
import { showWarning } from './helpers';

const ActionLogger = React.memo(() => {
  const actionInfo = useStore(Selector.actionInfo);
  const currentUndoable = useStore(Selector.currentUndoable);
  const user = useStore(Selector.user);
  const cloudFile = useStore(Selector.cloudFile);

  const databaseRef = useRef<firebase.database.Database>();
  const schoolID = user.schoolID ?? SchoolID.UNKNOWN;
  const classID = user.classID ?? ClassID.UNKNOWN;

  useEffect(() => {
    const config = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      databaseURL: import.meta.env.VITE_FIREBASE_LOGGER_DATABASE_URL,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
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
    if (currentUndoable && user.uid) {
      // we cannot use hh:mm:SSS as suggested by dayjs's format documentation
      // because SSS only takes the last three digits of the millisecond string,
      // resulting in incorrect ordering of the log. so we use the millisecond string
      // to ensure the order and use the formatted string to provide readability.
      const logData = async () => {
        if (databaseRef.current) {
          const timestamp =
            currentUndoable.timestamp +
            ' (' +
            dayjs(new Date(currentUndoable.timestamp)).format('MM-DD-YYYY hh:mm A') +
            ')';
          await databaseRef.current.ref(schoolID + '/' + classID + '/' + user.uid + '/' + timestamp).set({
            file: cloudFile ?? 'Untitled',
            action: JSON.stringify(currentUndoable),
          });
        }
      };
      logData().catch((e) => {
        showWarning('Data logger error: ' + currentUndoable + ' - ' + e);
      });
    }
  }, [currentUndoable, user.uid, cloudFile]);

  useEffect(() => {
    if (actionInfo) {
      const logData = async () => {
        if (databaseRef.current) {
          const timestamp =
            actionInfo.timestamp + ' (' + dayjs(new Date(actionInfo.timestamp)).format('MM-DD-YYYY hh:mm A') + ')';
          await databaseRef.current.ref(schoolID + '/' + classID + '/' + user.uid + '/' + timestamp).set({
            file: cloudFile ?? 'Untitled',
            action: JSON.stringify(actionInfo),
          });
        }
      };
      logData().catch((e) => {
        showWarning('Data logger error: ' + actionInfo + ' - ' + e);
      });
    }
  }, [actionInfo, user.uid, classID, schoolID, cloudFile]);

  return <></>;
});

export default ActionLogger;
