/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect } from 'react';
import { Box3, Object3D, Vector3 } from 'three';
import { useThree } from '@react-three/fiber';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';

const SceneRadiusCalculator = () => {
  const setCommonStore = useStore(Selector.set);
  const updateSceneRadiusFlag = useStore(Selector.updateSceneRadiusFlag);

  const { scene } = useThree();

  useEffect(() => {
    const content = scene.children.filter((c) => c.name === 'Content');
    const objects: Object3D[] = [];
    if (content.length > 0) {
      const components = content[0].children;
      for (const c of components) {
        fetchAabbElements(c, objects);
      }
    }
    const boxes = [];
    for (const c of objects) {
      boxes.push(new Box3().setFromObject(c));
    }
    if (boxes.length > 0) {
      const min = new Vector3();
      const max = new Vector3();
      for (const box of boxes) {
        min.min(box.min);
        max.max(box.max);
      }
      let r = Math.abs(min.x);
      if (r < Math.abs(min.y)) r = Math.abs(min.y);
      if (r < Math.abs(min.z)) r = Math.abs(min.z);
      if (r < Math.abs(max.x)) r = Math.abs(max.x);
      if (r < Math.abs(max.y)) r = Math.abs(max.y);
      if (r < Math.abs(max.z)) r = Math.abs(max.z);
      setCommonStore((state) => {
        state.aabb = new Box3(min, max);
        if (!isNaN(r) && isFinite(r)) {
          // have to round this, otherwise the result is different even if nothing moved.
          state.sceneRadius = Math.round(Math.max(10, r * 1.25)); // make it 25% larger than the bounding box
        }
      });
    }
  }, [updateSceneRadiusFlag]);

  const fetchAabbElements = (obj: Object3D, arr: Object3D[]) => {
    if (obj.userData['aabb']) {
      arr.push(obj);
    }
    if (obj.children.length > 0) {
      for (const c of obj.children) {
        fetchAabbElements(c, arr);
      }
    }
  };

  return <></>;
};

export default React.memo(SceneRadiusCalculator);
