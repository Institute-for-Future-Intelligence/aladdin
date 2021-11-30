/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DoubleSide } from 'three';
import { Plane } from '@react-three/drei';
import { WindowModel } from 'src/models/WindowModel';
import { CommonStoreState, useStore } from 'src/stores/common';
import { ActionType, ObjectType } from 'src/types';
import * as Selector from 'src/stores/selector';
import WindowWireFrame from './windowWireFrame';
import WindowHandleWrapper from './windowHandleWrapper';

const Window = ({ id, parentId, lx, lz, cx, cz, selected, locked, color }: WindowModel) => {
  const setCommonStore = useStore(Selector.set);
  const selectMe = useStore(Selector.selectMe);

  const buildingWallIDRef = useRef(useStore.getState().buildingWallID);

  const [wlx, setWlx] = useState(lx);
  const [wlz, setWlz] = useState(lz);
  const [wcx, setWcx] = useState(cx);
  const [wcz, setWcz] = useState(cz);

  const parentSelector = useCallback((state: CommonStoreState) => {
    for (const e of state.elements) {
      if (e.id === parentId) {
        return e;
      }
    }
    return null;
  }, []);

  const parent = useStore(parentSelector);

  // subscribe common store
  useEffect(() => {
    useStore.subscribe((state) => (buildingWallIDRef.current = state.buildingWallID));
  }, []);

  useEffect(() => {
    if (parent) {
      setWlx(lx * parent.lx);
      setWlz(lz * parent.lz);
      setWcx(cx * parent.lx);
      setWcz(cz * parent.lz);
    }
  }, [lx, lz, cx, cz, parent?.lx, parent?.lx]);

  return (
    <group key={id} name={`Window group ${id}`} position={[wcx, 0, wcz]} castShadow receiveShadow>
      <Plane
        name={'window ' + id}
        args={[wlx, wlz]}
        rotation={[Math.PI / 2, 0, 0]}
        onContextMenu={(e) => {
          if (!selected) {
            selectMe(id, e, ActionType.Select);
          }
          if (e.intersections[0].object.name === 'window ' + id) {
            setCommonStore((state) => {
              state.contextMenuObjectType = ObjectType.Window;
            });
          }
        }}
        onPointerDown={(e) => {
          if (e.button === 2 || buildingWallIDRef.current) return; // ignore right-click
          if (e.intersections[0].object.name === 'window ' + id) {
            if (!selected) {
              selectMe(id, e, ActionType.Select);
            }
          }
        }}
      >
        <meshBasicMaterial side={DoubleSide} color={color} opacity={0.5} transparent={true} />
      </Plane>

      {/* wireframes */}
      <WindowWireFrame x={wlx / 2} z={wlz / 2} />

      {/* handles */}
      {selected && !locked && <WindowHandleWrapper lx={wlx} lz={wlz} />}
    </group>
  );
};

export default React.memo(Window);
