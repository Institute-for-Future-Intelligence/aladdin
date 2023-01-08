/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 *
 * Adopted from https://github.com/ArthurClemens/Javascript-Undo-Manager
 */

export default class UndoManager {

  constructor() {

    this.commands = [];
    this.index = -1;
    this.limit = 0;
    this.isExecuting = false;
    this.callback = undefined;

    this.removeFromTo = (array, from, to) => {
      array.splice(from,
        !to ||
        1 + to - from + (!(to < 0 ^ from >= 0) && (to < 0 || -1) * array.length));
      return array.length;
    };

    this.execute = (command, action) => {
      if (!command || typeof command[action] !== "function") {
        return;
      }
      this.isExecuting = true;

      command[action]();

      this.isExecuting = false;
    };

    // Add a command to the queue.
    this.add = (command) => {
      if (this.isExecuting) {
        return;
      }
      // if we are here after having called undo, invalidate items higher on the stack
      this.commands.splice(this.index + 1, this.commands.length - this.index);

      this.commands.push(command);

      // if limit is set, remove items from the start
      if (this.limit && this.commands.length > this.limit) {
        this.removeFromTo(this.commands, 0, -(this.limit + 1));
      }

      // set the current index to the end
      this.index = this.commands.length - 1;
      if (this.callback) {
        this.callback();
      }
    };

    // Pass a function to be called on undo and redo actions.
    this.setCallback = (callbackFunc) => {
      this.callback = callbackFunc;
    };

    // Call the undo function at the current index and decrease the index by 1.
    this.undo = () => {
      const command = this.commands[this.index];
      if (!command) {
        return undefined;
      }
      this.execute(command, "undo");
      this.index--;
      if (this.callback) {
        this.callback();
      }
      return command['name'];
    };

    // Call the redo function at the next index and increase the index by 1.
    this.redo = () => {
      const command = this.commands[this.index + 1];
      if (!command) {
        return undefined;
      }
      this.execute(command, "redo");
      this.index++;
      if (this.callback) {
        this.callback();
      }
      return command['name'];
    };

    // Clears the memory, losing all stored states. Reset the index.
    this.clear = () => {
      const prev_size = this.commands.length;
      this.commands = [];
      this.index = -1;
      if (this.callback && (prev_size > 0)) {
        this.callback();
      }
    };

    this.hasUndo = () => {
      return this.index !== -1;
    };

    this.hasRedo = () => {
      return this.index < (this.commands.length - 1);
    };

    this.getCommands = () => {
      return this.commands;
    };

    this.getLastUndoName = () => {
      const command = this.commands[this.index];
      if (!command) {
        return undefined;
      }
      return command['name'];
    };

    this.getLastRedoName = () => {
      const command = this.commands[this.index + 1];
      if (!command) {
        return undefined;
      }
      return command['name'];
    };

    this.getIndex = () => {
      return this.index;
    };

    this.setLimit = (l) => {
      this.limit = l;
    };

  }

}
