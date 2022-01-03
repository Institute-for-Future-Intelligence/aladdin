/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

export interface Undoable {
  undo: () => void;
  redo: () => void;
  name: string;
  timestamp: number; // for logging
}
