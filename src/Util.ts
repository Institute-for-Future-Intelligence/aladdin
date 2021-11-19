/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { Euler, Vector3 } from 'three';
import { ElementModel } from './models/ElementModel';
import { SolarPanelModel } from './models/SolarPanelModel';
import { Orientation } from './types';
import { PvModel } from './models/PvModel';

export class Util {
  static get UNIT_VECTOR_POS_X() {
    return new Vector3(1, 0, 0);
  }

  static get UNIT_VECTOR_NEG_X() {
    return new Vector3(-1, 0, 0);
  }

  static get UNIT_VECTOR_POS_Y() {
    return new Vector3(0, 1, 0);
  }

  static get UNIT_VECTOR_NEG_Y() {
    return new Vector3(0, -1, 0);
  }

  static get UNIT_VECTOR_POS_Z() {
    return new Vector3(0, 0, 1);
  }

  static get UNIT_VECTOR_NEG_Z() {
    return new Vector3(0, 0, -1);
  }

  static panelizeLx(solarPanel: SolarPanelModel, pvModel: PvModel, value: number) {
    const dx = solarPanel.orientation === Orientation.portrait ? pvModel.width : pvModel.length;
    let lx = value ?? 1;
    const n = Math.max(1, Math.ceil((lx - dx / 2) / dx));
    lx = n * dx;
    return lx;
  }

  static panelizeLy(solarPanel: SolarPanelModel, pvModel: PvModel, value: number) {
    const dy = solarPanel.orientation === Orientation.portrait ? pvModel.length : pvModel.width;
    let ly = value ?? 1;
    const n = Math.max(1, Math.ceil((ly - dy / 2) / dy));
    ly = n * dy;
    return ly;
  }

  static isSame(u: Vector3, v: Vector3) {
    return (
      Math.abs(u.x - v.x) < Util.ZERO_TOLERANCE &&
      Math.abs(u.y - v.y) < Util.ZERO_TOLERANCE &&
      Math.abs(u.z - v.z) < Util.ZERO_TOLERANCE
    );
  }

  static isIdentical(u?: number[], v?: number[]) {
    if (!u || !v || u.length !== v.length) return false;
    if (u === v) return true;
    for (let i = 0; i < u.length; i++) {
      if (Math.abs(u[i] - v[i]) > Util.ZERO_TOLERANCE) return false;
    }
    return true;
  }

  static isZero(x: number) {
    return Math.abs(x) < Util.ZERO_TOLERANCE;
  }

  static get ZERO_TOLERANCE() {
    return 0.0001;
  }

  static get HALF_PI() {
    return Math.PI / 2;
  }

  static get TWO_PI() {
    return Math.PI * 2;
  }

  static deleteElement(a: any[], e: any) {
    const i = a.indexOf(e, 0);
    if (i > -1) {
      a.splice(i, 1);
    }
  }

  static relativeCoordinates(x: number, y: number, z: number, parent: ElementModel) {
    const v = new Vector3(x - parent.cx, y - parent.cy, z - parent.cz);
    v.applyEuler(new Euler().fromArray(parent.rotation.map((x) => -x)));
    v.x /= parent.lx;
    v.y /= parent.ly;
    v.z /= parent.lz;
    return v;
  }

  static absoluteCoordinates(x: number, y: number, z: number, parent: ElementModel) {
    const v = new Vector3(x * parent.lx, y * parent.ly, z * parent.lz);
    v.applyEuler(new Euler().fromArray(parent.rotation));
    v.x += parent.cx;
    v.y += parent.cy;
    v.z += parent.cz;
    return v;
  }

  static wallAbsolutePosition(v: Vector3, parent: ElementModel) {
    const parentPos = new Vector3(parent.cx, parent.cy);
    return new Vector3().addVectors(
      parentPos,
      new Vector3(v.x, v.y).applyAxisAngle(Util.UNIT_VECTOR_POS_Z, parent.rotation[2]),
    );
  }

  static wallRelativePosition(v: Vector3, parent: ElementModel) {
    const parentPos = new Vector3(parent.cx, parent.cy);
    return new Vector3()
      .subVectors(new Vector3(v.x, v.y), parentPos)
      .applyAxisAngle(Util.UNIT_VECTOR_POS_Z, -parent.rotation[2]);
  }

  static toRadians(degrees: number) {
    return degrees * (Math.PI / 180);
  }

  static toDegrees(radians: number) {
    return radians * (180 / Math.PI);
  }

  static sphericalToCartesianZ(sphereCoords: Vector3) {
    let a = sphereCoords.x * Math.cos(sphereCoords.z);
    let x = a * Math.cos(sphereCoords.y);
    let y = a * Math.sin(sphereCoords.y);
    let z = sphereCoords.x * Math.sin(sphereCoords.z);
    sphereCoords.set(x, y, z);
    return sphereCoords;
  }

  // the spherical law of cosines: https://en.wikipedia.org/wiki/Spherical_law_of_cosines
  static getDistance(lng1: number, lat1: number, lng2: number, lat2: number) {
    lng1 = Util.toRadians(lng1);
    lat1 = Util.toRadians(lat1);
    lng2 = Util.toRadians(lng2);
    lat2 = Util.toRadians(lat2);
    return Math.acos(
      Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(Math.abs(lng1 - lng2)),
    );
  }

  static minutesIntoDay(date: Date) {
    return date.getHours() * 60 + date.getMinutes();
  }

  static daysIntoYear(date: string) {
    return Util.dayOfYear(new Date(date));
  }

  static dayOfYear(date: Date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  static daysOfMonth(month: number, year: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  static fahrenheitToCelsius(temp: number) {
    return ((temp - 32) * 5) / 9;
  }

  static celsiusToFahrenheit(temp: number) {
    return temp * (9 / 5) + 32;
  }

  static getOS() {
    const userAgent = window.navigator.userAgent;
    const platform = window.navigator.platform;
    const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
    const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
    const iosPlatforms = ['iPhone', 'iPad', 'iPod'];
    let os = null;
    if (macosPlatforms.indexOf(platform) !== -1) {
      os = 'Mac OS';
    } else if (iosPlatforms.indexOf(platform) !== -1) {
      os = 'iOS';
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
      os = 'Windows';
    } else if (/Android/.test(userAgent)) {
      os = 'Android';
    } else if (!os && /Linux/.test(platform)) {
      os = 'Linux';
    }
    return os;
  }
}
