/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { Box, Sphere } from '@react-three/drei';
import { ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { useStore } from 'src/stores/common';
import { useRefStore } from 'src/stores/commonRef';
import { ObjectType, ResizeHandleType } from 'src/types';
import { Euler, Group, Mesh, Vector3 } from 'three';
import { useSelected } from '../../hooks';
import * as Selector from '../../stores/selector';
import { SOLAR_PANELS_WRAPPER_NAME } from './solarPanelWrapper';
import { useHandleSize } from '../wall/hooks';

enum Operation {
  Move = 'Move',
  Rotate = 'Rotate',
  ResizeX = 'ResizeX',
  ResizeY = 'ResizeY',
}

const RefSolarPanel = React.memo((refSolarPanel: SolarPanelModel) => {
  const { id, cx, cy, cz, lx, ly, lz, parentId } = refSolarPanel;
  const [hx, hy, hz] = [lx / 2, ly / 2, lz / 2];

  const selected = useSelected(id);
  const handleSize = useHandleSize();

  const { set } = useThree();

  const setCommonStore = useStore(Selector.set);

  // meshes ref
  const groupRef = useRef<Group>(null!);
  const boxMeshRef = useRef<Mesh>(null!);
  const resizeHandleGroupRef = useRef<Group>(null!);

  // vairables
  const vector = new Vector3();
  const euler = new Euler();
  const worldRotationRef = useRef(new Euler());
  const resizeAnchorRef = useRef(new Vector3());
  const newParentIdRef = useRef<string | null>(null);
  const operationRef = useRef<Operation | null>(null);

  const setFrameLoop = (frameloop: 'always' | 'demand') => {
    set({ frameloop });
  };

  // update child meshes position due to resize
  const updateChildMeshes = () => {
    if (!boxMeshRef.current) return;
    const [hx, hy] = boxMeshRef.current.scale.toArray().map((v) => v / 2);

    // update resize handle
    if (resizeHandleGroupRef.current) {
      for (const obj of resizeHandleGroupRef.current.children) {
        switch (obj.name) {
          case ResizeHandleType.Left: {
            obj.position.x = -hx;
            break;
          }
          case ResizeHandleType.Right: {
            obj.position.x = hx;
            break;
          }
          case ResizeHandleType.Upper: {
            obj.position.y = hy;
            break;
          }
          case ResizeHandleType.Lower: {
            obj.position.y = -hy;
            break;
          }
        }
      }
    }
  };

  const setSelected = (b: boolean) => {
    setCommonStore((state) => {
      if (!state.multiSelectionsMode) {
        if (b) {
          state.selectedElement = refSolarPanel;
          state.selectedElementIdSet.clear();
          state.selectedElementIdSet.add(id);
        } else {
          if (state.selectedElement?.id === id) {
            state.selectedElement = null;
          }
          if (state.selectedElementIdSet.has(id)) {
            state.selectedElementIdSet.delete(id);
          }
        }
      }
    });
  };

  /** Events */
  const onGroupPointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setSelected(true);
  };

  const onMoveHandlePointerDown = () => {
    if (!selected || !groupRef || !groupRef.current) return;
    setFrameLoop('always');
    useRefStore.getState().setEnableOrbitController(false);
    operationRef.current = Operation.Move;

    const foundationGroup = groupRef.current.parent?.parent;
    if (foundationGroup) {
      worldRotationRef.current.z = foundationGroup.rotation.z + groupRef.current.rotation.z;
    } else {
      worldRotationRef.current.z = 0;
    }
  };

  const onResizeHandleGroupPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!selected || !groupRef || !groupRef.current) return;
    setFrameLoop('always');
    useRefStore.getState().setEnableOrbitController(false);
    switch (e.object.name) {
      case ResizeHandleType.Left:
      case ResizeHandleType.Right: {
        operationRef.current = Operation.ResizeX;
        break;
      }
      case ResizeHandleType.Upper:
      case ResizeHandleType.Lower: {
        operationRef.current = Operation.ResizeY;
        break;
      }
    }
    groupRef.current.localToWorld(resizeAnchorRef.current.set(-e.object.position.x, -e.object.position.y, 0));
  };

  // todo: need update common state here
  const onWindowPointerUp = useCallback(() => {
    switch (operationRef.current) {
      case Operation.ResizeX:
      case Operation.ResizeY:
      case Operation.Move: {
        setCommonStore((state) => {
          if (!groupRef.current || !boxMeshRef.current) return;

          const sp = state.elements.find((e) => e.id === id);
          if (!sp) return;

          // change parent first if needed
          // todo: only for sp on foundation for now.
          if (sp.parentId !== newParentIdRef.current && newParentIdRef.current) {
            sp.parentId = newParentIdRef.current;
            sp.foundationId = newParentIdRef.current;
          }

          sp.cx = groupRef.current.position.x;
          sp.cy = groupRef.current.position.y;
          sp.lx = boxMeshRef.current.scale.x;
          sp.ly = boxMeshRef.current.scale.y;
        });
        break;
      }
    }
    setFrameLoop('demand');
    useRefStore.getState().setEnableOrbitController(true);
    operationRef.current = null;
    worldRotationRef.current.z = 0;
    newParentIdRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener('pointerup', onWindowPointerUp);
    return () => window.removeEventListener('pointerup', onWindowPointerUp);
  }, [onWindowPointerUp]);

  useFrame(({ camera, scene, raycaster }) => {
    if (!groupRef.current || !selected || !operationRef.current) return;

    const pointer = useRefStore.getState().pointer;
    raycaster.setFromCamera(pointer, camera);
    const intersections = raycaster.intersectObjects(scene.children);

    // todo: this should be foundation/cuboid/roof/wall mesh
    const firstIntersectedFoundation = intersections.find((obj) => obj.object.name === 'Foundation');
    if (!firstIntersectedFoundation) return;

    const foundationGroup = firstIntersectedFoundation.object.parent;
    if (!foundationGroup) return;

    switch (operationRef.current) {
      case Operation.Move: {
        const point = firstIntersectedFoundation.point;

        const refSolarPanelWrapper = foundationGroup?.children.find((obj) => obj.name === SOLAR_PANELS_WRAPPER_NAME);
        // changing parent
        if (refSolarPanelWrapper && refSolarPanelWrapper !== groupRef.current.parent) {
          const parent = groupRef.current.parent;
          if (parent) {
            parent.children = parent.children.filter((obj) => obj !== groupRef.current);
          }
          refSolarPanelWrapper.children.push(groupRef.current);
          groupRef.current.parent = refSolarPanelWrapper;
          newParentIdRef.current = refSolarPanelWrapper.parent?.name.split(' ')[1] ?? null;
        }

        // updating mesh
        groupRef.current.position.x = point.x - foundationGroup.position.x;
        groupRef.current.position.y = point.y - foundationGroup.position.y;
        euler.z = -foundationGroup.rotation.z;
        groupRef.current.position.applyEuler(euler);
        groupRef.current.rotation.z = worldRotationRef.current.z - foundationGroup.rotation.z;
        break;
      }
      // todo: resize with rotated
      case Operation.ResizeX:
      case Operation.ResizeY: {
        const point = firstIntersectedFoundation.point;

        const dx = point.x - resizeAnchorRef.current.x;
        const dy = point.y - resizeAnchorRef.current.y;
        const cx = (point.x + resizeAnchorRef.current.x) / 2;
        const cy = (point.y + resizeAnchorRef.current.y) / 2;

        if (!boxMeshRef.current) break;

        if (operationRef.current === Operation.ResizeX) {
          boxMeshRef.current.scale.x = dx;
          groupRef.current.position.x = cx - foundationGroup.position.x;
        } else if (operationRef.current === Operation.ResizeY) {
          boxMeshRef.current.scale.y = dy;
          groupRef.current.position.y = cy - foundationGroup.position.y;
        }

        updateChildMeshes();
        break;
      }
      case Operation.Rotate: {
        break;
      }
    }
  });

  return (
    <group
      name={`Ref_Solar_Panel_Group ${id}`}
      ref={groupRef}
      position={[cx, cy, hz]}
      onPointerDown={onGroupPointerDown}
      onPointerMissed={() => {
        if (selected) {
          setSelected(false);
        }
      }}
    >
      {/* panel */}
      <Box name="Box Mesh" ref={boxMeshRef} scale={[lx, ly, 0.1]}>
        <meshStandardMaterial color={'blue'} />
      </Box>

      {/* handles */}
      <group name="Handles Group" visible={selected}>
        {/* move handle group */}
        <group name="Move Handle Group">
          <Sphere args={[handleSize]} onPointerDown={onMoveHandlePointerDown} />
        </group>

        {/* resize handle group */}
        <group name="Resize Handle Group" ref={resizeHandleGroupRef} onPointerDown={onResizeHandleGroupPointerDown}>
          <Box name={ResizeHandleType.Right} position={[hx, 0, 0.1]} args={[handleSize, handleSize, 0.1]} />
          <Box name={ResizeHandleType.Left} position={[-hx, 0, 0.1]} args={[handleSize, handleSize, 0.1]} />
          <Box name={ResizeHandleType.Upper} position={[0, hy, 0.1]} args={[handleSize, handleSize, 0.1]} />
          <Box name={ResizeHandleType.Lower} position={[0, -hy, 0.1]} args={[handleSize, handleSize, 0.1]} />
        </group>
      </group>
    </group>
  );
});

export default RefSolarPanel;
