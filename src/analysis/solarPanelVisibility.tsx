/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Euler, Intersection, Object3D, Raycaster, Vector3 } from 'three';
import { useThree } from '@react-three/fiber';
import { useStore } from '../stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Orientation } from '../types';
import { Util } from '../Util';
import { SolarPanelModel } from '../models/SolarPanelModel';

export interface SolarPanelVisibilityProps {
  vantage: Vector3;
}

const SolarPanelVisibility = ({ vantage }: SolarPanelVisibilityProps) => {
  const setCommonStore = useStore(Selector.set);
  const world = useStore.getState().world;
  const elements = useStore.getState().elements;
  const getElementById = useStore(Selector.getElementById);
  const solarPanelVisibilityFlag = useStore(Selector.solarPanelVisibilityFlag);

  const { scene } = useThree();
  const ray = useMemo(() => new Raycaster(), []);
  const cellSize = world.solarPanelVisibilityGridCellSize ?? 0.2;
  const loaded = useRef(false);
  const objectsRef = useRef<Object3D[]>([]); // reuse array in intersection detection
  const intersectionsRef = useRef<Intersection[]>([]); // reuse array in intersection detection

  useEffect(() => {
    if (loaded.current) {
      // avoid calling on first render
      if (elements && elements.length > 0) {
        // analyze();
      }
    } else {
      loaded.current = true;
    }
    analyze();
    setCommonStore((state) => {
      state.simulationInProgress = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solarPanelVisibilityFlag]);

  const fetchObjects = () => {
    const content = scene.children.filter((c) => c.name === 'Content');
    if (content.length > 0) {
      const components = content[0].children;
      objectsRef.current.length = 0;
      for (const c of components) {
        fetchSimulationElements(c, objectsRef.current);
      }
    }
  };

  const fetchSimulationElements = (obj: Object3D, arr: Object3D[]) => {
    if (obj.userData['simulation']) {
      arr.push(obj);
    }
    if (obj.children.length > 0) {
      for (const c of obj.children) {
        fetchSimulationElements(c, arr);
      }
    }
  };

  const analyze = () => {
    fetchObjects();
    let total = 0;
    for (const e of elements) {
      if (e.type === ObjectType.SolarPanel) {
        total += getViewFactor(e as SolarPanelModel);
      }
    }
    console.log('visibility = ' + total);
    return total;
  };

  // view factor: https://en.wikipedia.org/wiki/View_factor
  const getViewFactor = (panel: SolarPanelModel) => {
    const parent = getElementById(panel.parentId);
    if (!parent) throw new Error('parent of solar panel does not exist');
    const center = Util.absoluteCoordinates(panel.cx, panel.cy, panel.cz, parent);
    const normal = new Vector3().fromArray(panel.normal);
    normal.applyEuler(new Euler(panel.tiltAngle, panel.relativeAzimuth + parent.rotation[2], 0, 'XYZ'));
    const lx = panel.lx;
    const ly = panel.ly * Math.cos(panel.tiltAngle);
    const lz = panel.ly * Math.abs(Math.sin(panel.tiltAngle));
    let nx: number, ny: number;
    if (panel.orientation === Orientation.portrait) {
      nx = Math.max(2, Math.round(panel.lx / cellSize));
      ny = Math.max(2, Math.round(panel.ly / cellSize));
    } else {
      nx = Math.max(2, Math.round(panel.ly / cellSize));
      ny = Math.max(2, Math.round(panel.lx / cellSize));
    }
    const dx = lx / nx;
    const dy = ly / ny;
    const dz = lz / ny;
    const x0 = center.x - lx / 2;
    const y0 = center.y - ly / 2;
    const z0 = panel.poleHeight + center.z - lz / 2;
    let integral = 0;
    const point = new Vector3();
    const direction = new Vector3();
    let r;
    for (let kx = 0; kx < nx; kx++) {
      for (let ky = 0; ky < ny; ky++) {
        point.set(x0 + kx * dx, y0 + ky * dy, z0 + ky * dz);
        direction.set(vantage.x - point.x, vantage.y - point.y, vantage.z - point.z);
        r = direction.length();
        if (r > 0) {
          direction.normalize();
          if (isVisible(panel.id, point, direction)) {
            integral += Math.abs(direction.dot(normal)) / (r * r);
          }
        }
      }
    }
    return (integral * dx * dy) / (4 * Math.PI);
  };

  const isVisible = (panelId: string, point: Vector3, direction: Vector3) => {
    if (objectsRef.current.length > 1) {
      intersectionsRef.current.length = 0;
      ray.set(point, direction);
      const objects = objectsRef.current.filter((obj) => obj.uuid !== panelId); // exclude this panel itself
      ray.intersectObjects(objects, false, intersectionsRef.current);
      return intersectionsRef.current.length === 0;
    }
    return true;
  };

  return <></>;
};

export default React.memo(SolarPanelVisibility);
