/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { Vector3 } from 'three';
import { HumanModel } from '../models/HumanModel';

export class Vantage {
  position: Vector3;
  observer: HumanModel;

  constructor(position: Vector3, observer: HumanModel) {
    this.position = position;
    this.observer = observer;
  }
}
