/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';

export class UndoManager {
  private commands: Undoable[];
  private index: number;
  private limit: number;
  private isExecuting: boolean;

  constructor() {
    this.commands = [];
    this.index = -1;
    this.limit = 0;
    this.isExecuting = false;
  }

  // Add a command to the queue
  add(command: Undoable): void {
    if (this.isExecuting) {
      return;
    }
    // if we are here after having called undo, invalidate items higher on the stack
    this.commands.splice(this.index + 1, this.commands.length - this.index);
    this.commands.push(command);
    // if limit is set, remove items from the start of the commands array
    if (this.limit > 0 && this.commands.length > this.limit) {
      this.commands.splice(0, this.commands.length - this.limit);
    }
    // set the current index to the end
    this.index = this.commands.length - 1;
  }

  // Call the undo function at the current index and decrease the index by 1.
  undo(): string | undefined {
    const command = this.commands[this.index];
    if (!command) {
      return undefined;
    }
    this.isExecuting = true;
    command.undo();
    this.isExecuting = false;
    this.index--;
    return command.name;
  }

  // Call the redo function at the next index and increase the index by 1.
  redo(): string | undefined {
    const command = this.commands[this.index + 1];
    if (!command) {
      return undefined;
    }
    this.isExecuting = true;
    command.redo();
    this.isExecuting = false;
    this.index++;
    return command.name;
  }

  // Clears the memory, losing all stored states. Reset the index.
  clear(): void {
    this.commands = [];
    this.index = -1;
  }

  hasUndo(): boolean {
    return this.index !== -1;
  }

  hasRedo(): boolean {
    return this.index < this.commands.length - 1;
  }

  getLastUndoName(): string | undefined {
    const command = this.commands[this.index];
    if (!command) {
      return undefined;
    }
    return command.name;
  }

  getLastRedoName(): string | undefined {
    const command = this.commands[this.index + 1];
    if (!command) {
      return undefined;
    }
    return command.name;
  }

  getLastUndoCommand(): Undoable | undefined {
    const command = this.commands[this.index];
    if (!command) {
      return undefined;
    }
    return command;
  }

  setLimit(l: number): void {
    this.limit = l;
  }
}
