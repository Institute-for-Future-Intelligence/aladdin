/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import localforage from 'localforage';
import { isProd } from '../constants';

const DB_NAME = `aladdin_${isProd ? 'prod' : 'dev'}`;
const DB_VERSION = 5.2;
const MIGRATION_KEY = `DB_${DB_VERSION}_${import.meta.env.NODE_ENV}_MIGRATED`;

localforage.config({
  name: DB_NAME,
  version: DB_VERSION,
});

const migrated = localStorage.getItem(MIGRATION_KEY);
if (!migrated) {
  setTimeout(() => {
    console.log('New DB version found. Purge database...');
    localforage
      .dropInstance({
        name: DB_NAME,
      })
      .then(() => {
        console.log('Successfully purged database');
        localStorage.setItem(MIGRATION_KEY, 'true');
      })
      .catch((err) => console.log(err));
  }, 2000);
}

export default {
  ...localforage,
  createStore: (name: string) => {
    return localforage.createInstance({
      name: DB_NAME,
      version: DB_VERSION,
      storeName: name,
    });
  },
};
