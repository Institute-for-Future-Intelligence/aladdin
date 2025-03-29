/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Euler, Intersection, Object3D, Raycaster, Vector2, Vector3 } from 'three';
import { useThree } from '@react-three/fiber';
import { useStore } from '../stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType } from '../types';
import { Util } from '../Util';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { HumanModel } from '../models/HumanModel';
import { Vantage } from './Vantage';
import { showInfo } from '../helpers';
import i18n from '../i18n/i18n';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { useDataStore } from '../stores/commonData';
import { useLanguage } from '../hooks';
import { WallModel } from 'src/models/WallModel';
import { FoundationModel } from 'src/models/FoundationModel';

const SolarPanelVisibility = React.memo(() => {
  const world = useStore.getState().world;
  const elements = useStore.getState().elements;
  const setCommonStore = useStore(Selector.set);
  const setPrimitiveStore = usePrimitiveStore(Selector.setPrimitiveStore);
  const getParent = useStore(Selector.getParent);
  const getFoundation = useStore(Selector.getFoundation);
  const runAnalysis = usePrimitiveStore(Selector.runSolarPanelVisibilityAnalysis);

  const { scene } = useThree();
  const lang = useLanguage();
  const ray = useMemo(() => new Raycaster(), []);
  const cellSize = world.solarPanelVisibilityGridCellSize ?? 0.2;
  const vantagesRef = useRef<Vantage[]>([]);
  const objectsRef = useRef<Object3D[]>([]); // reuse array in intersection detection
  const intersectionsRef = useRef<Intersection[]>([]); // reuse array in intersection detection

  useEffect(() => {
    if (runAnalysis) {
      if (elements && elements.length > 0) {
        analyze();
        setPrimitiveStore('runSolarPanelVisibilityAnalysis', false);
        setCommonStore((state) => {
          state.viewState.showSolarPanelVisibilityResultsPanel = true;
          state.selectedFloatingWindow = 'visibilityResultsPanel';
        });
        showInfo(i18n.t('message.SimulationCompleted', lang));
      }
    }
    setPrimitiveStore('simulationInProgress', false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runAnalysis]);

  const fetchObjects = () => {
    const content = scene.children.filter((c) => c.name === 'Content');
    if (content.length > 0) {
      const components = content[0].children;
      objectsRef.current.length = 0;
      for (const c of components) {
        Util.fetchSimulationElements(c, objectsRef.current);
      }
    }
  };

  const fetchVantages = () => {
    vantagesRef.current = [];
    for (const e of elements) {
      if (e.type === ObjectType.Human) {
        const human = e as HumanModel;
        if (human.observer) {
          const parent = getParent(human);
          const position = parent
            ? Util.absoluteHumanOrTreeCoordinates(human.cx, human.cy, human.cz, parent)
            : new Vector3(human.cx, human.cy, human.cz);
          position.z += human.lz;
          vantagesRef.current.push(new Vantage(position, human));
        }
      }
    }
  };

  const analyze = () => {
    useDataStore.getState().clearSolarPanelVisibilityResults();
    fetchVantages();
    if (vantagesRef.current.length === 0) return;
    fetchObjects();
    for (const vantage of vantagesRef.current) {
      const resultMap = new Map<string, number>();
      for (const e of elements) {
        if (e.type === ObjectType.SolarPanel) {
          const sp = e as SolarPanelModel;
          resultMap.set(sp.parentId, 0);
        }
      }
      for (const e of elements) {
        if (e.type === ObjectType.SolarPanel) {
          const sp = e as SolarPanelModel;
          let vf = resultMap.get(sp.parentId) ?? 0;
          vf += getVisibilityFactor(sp, vantage.position) * 100; // multiplied by 100 as view factor is between 0 and 1
          resultMap.set(sp.parentId, vf);
        }
      }
      useDataStore.getState().setSolarPanelVisibilityResult(vantage, resultMap);
    }
  };

  // visibility factor is similar to but different from view factor: https://en.wikipedia.org/wiki/View_factor
  // visibility factor is a sum over all the directions around a vantage point
  const getVisibilityFactor = (panel: SolarPanelModel, vantage: Vector3) => {
    let parent = getParent(panel);
    if (!parent) throw new Error('parent of solar panel does not exist');
    let rooftop = false;
    const walltop = panel.parentType === ObjectType.Wall;
    const cubeside = parent.type === ObjectType.Cuboid && !Util.isEqual(panel.normal[2], 1);
    if (parent.type === ObjectType.Roof) {
      parent = getFoundation(parent);
      if (!parent) throw new Error('foundation of solar panel does not exist');
      rooftop = true;
    }
    const slopetop = parent.type === ObjectType.Foundation && (parent as FoundationModel).enableSlope;
    const center = walltop
      ? Util.absoluteCoordinates(panel.cx, panel.cy, panel.cz, parent, getFoundation(panel), panel.lz)
      : Util.absoluteCoordinates(panel.cx, panel.cy, panel.cz, parent, undefined, undefined, true);
    if (rooftop) {
      center.z = panel.cz + parent.cz;
    }
    if (slopetop) {
      const f = parent as FoundationModel;
      center.z = f.lz + Util.getZOnSlope(f.lx, f.slope, panel.cx);
    }
    const normal = new Vector3().fromArray(panel.normal);
    if (walltop) {
      normal.applyEuler(new Euler(0, 0, (parent as WallModel).relativeAngle));
    }
    const rot = parent.type === ObjectType.Cuboid ? Util.getWorldDataById(parent.id).rot : parent.rotation[2];
    let zRot = rot + (walltop || cubeside ? 0 : panel.relativeAzimuth);
    if (Math.abs(panel.tiltAngle) > 0.001) {
      normal.applyEuler(new Euler(panel.tiltAngle, 0, zRot, 'ZYX'));
    }
    const lx = panel.lx;
    const ly = panel.ly * Math.cos(panel.tiltAngle);
    const lz = panel.ly * Math.abs(Math.sin(panel.tiltAngle));
    const nx = Math.max(2, Math.round(panel.lx / cellSize));
    const ny = Math.max(2, Math.round(panel.ly / cellSize));
    const dx = lx / nx;
    const dy = ly / ny;
    const dz = lz / ny;
    const x0 = center.x - lx / 2;
    const y0 = center.y - ly / 2;
    const z0 = (rooftop || walltop ? center.z : panel.poleHeight + center.z) - lz / 2;
    const center2d = new Vector2(center.x, center.y);
    let integral = 0;
    const point = new Vector3();
    const direction = new Vector3();
    let rsq;
    const v2 = new Vector2();
    const zRotZero = Util.isZero(zRot);
    for (let kx = 0; kx < nx; kx++) {
      for (let ky = 0; ky < ny; ky++) {
        v2.set(x0 + kx * dx, y0 + ky * dy);
        if (!zRotZero) v2.rotateAround(center2d, zRot);
        point.set(v2.x, v2.y, z0 + ky * dz);
        direction.set(vantage.x - point.x, vantage.y - point.y, vantage.z - point.z);
        rsq = direction.lengthSq();
        if (rsq !== 0) {
          direction.normalize();
          if (isVisible(panel.id, point, direction)) {
            integral += Math.abs(direction.dot(normal)) / rsq;
          }
        }
      }
    }
    return (integral * cellSize * cellSize) / (4 * Math.PI);
  };

  const isVisible = (panelId: string, point: Vector3, direction: Vector3) => {
    if (objectsRef.current.length > 1) {
      intersectionsRef.current.length = 0;
      ray.set(point, direction);
      const objects = objectsRef.current.filter((obj) => obj.uuid !== panelId); // exclude this panel itself
      ray.intersectObjects(objects, false, intersectionsRef.current);
      if (intersectionsRef.current.length === 0) return true;
      for (const [index, intersect] of intersectionsRef.current.entries()) {
        if (intersect.object.name.endsWith('eyeball')) {
          if (index === 0) return true;
        }
      }
      return false;
    }
    return true;
  };

  return <></>;
});

export default SolarPanelVisibility;
