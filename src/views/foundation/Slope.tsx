/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { Box, Extrude, Plane } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import { HALF_PI, ORIGIN_VECTOR2, RESIZE_HANDLE_COLOR, UNIT_VECTOR_POS_Z } from 'src/constants';
import { DoubleSide, Euler, Mesh, Shape, Texture, Vector2 } from 'three';
import { useHandleSize } from '../wall/hooks';
import { FoundationTexture, ObjectType, ResizeHandleType, SolarCollector, XYZO } from 'src/types';
import { useHandle } from '../solarPanel/hooks';
import React from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { useStore } from 'src/stores/common';
import { useRefStore } from 'src/stores/commonRef';
import { FoundationModel } from 'src/models/FoundationModel';
import { UndoableChange } from 'src/undo/UndoableChange';
import { Util } from 'src/Util';
import { tempEuler, tempVector3_0, tempVector3_1 } from 'src/helpers';
import * as Selector from '../../stores/selector';
import { ElementModel } from 'src/models/ElementModel';
import { UndoableAdd } from 'src/undo/UndoableAdd';
import { FOUNDATION_NAME } from './foundation';
import { useTransparent } from '../roof/hooks';
import { ParabolicTroughModel } from 'src/models/ParabolicTroughModel';
import { FresnelReflectorModel } from 'src/models/FresnelReflectorModel';
import { PolygonModel } from 'src/models/PolygonModel';
import { Point2 } from 'src/models/Point2';
import { SharedUtil } from '../SharedUtil';
import { UndoableResize } from 'src/undo/UndoableResize';

interface ResizeHandleProps {
  cx: number;
  cy: number;
  size: number;
  type: ResizeHandleType;
}

const ResizeHandle = React.memo(({ cx, cy, size, type }: ResizeHandleProps) => {
  const { _color, _onPointerDown, _onPointerMove, _onPointerLeave } = useHandle(RESIZE_HANDLE_COLOR, 'pointer');
  return (
    <Box
      name={type}
      position={[cx, cy, 0]}
      args={[size, size, size]}
      onPointerDown={_onPointerDown}
      onPointerMove={_onPointerMove}
      onPointerLeave={_onPointerLeave}
    >
      <meshBasicMaterial color={_color} />
    </Box>
  );
});

interface Props {
  foundation: FoundationModel;
  selected: boolean;
  enableShadow: boolean;
  textureType: FoundationTexture;
  texture: Texture;
  locked: boolean;
  showHeatmap: boolean;
  setHovered: (b: boolean) => void;
}

const Slope = ({
  foundation,
  selected,
  enableShadow,
  textureType,
  texture,
  locked,
  showHeatmap,
  setHovered,
}: Props) => {
  const { id, lx, ly, lz, slope = 0.2, cx, cy, rotation, color } = foundation;
  const [hx, hy, hz] = [lx / 2, ly / 2, lz / 2];
  const slopeLz = Math.tan(slope) * lx;

  const orthographic = useStore(Selector.viewState.orthographic);

  const handleSize = useHandleSize(0.5);
  const { transparent, opacity } = useTransparent();

  const [intersectionPlane, setIntersectionPlane] = useState<{ y: number; rot: number } | null>(null);

  const oldSlopeRef = useRef(slope);
  const planeRef = useRef<Mesh>(null!);
  const operationRef = useRef<'move' | 'resize' | null>(null);

  const shape = useMemo(() => {
    const s = new Shape();
    s.lineTo(0, -lz);
    s.lineTo(lx, -lz);
    s.lineTo(lx, slopeLz);
    s.closePath();
    return s;
  }, [hz, lx, slopeLz]);

  const setCommonStore = useStore(Selector.set);

  const legalToAdd = (type: ObjectType) => {
    switch (type) {
      case ObjectType.Human:
      case ObjectType.Tree:
      case ObjectType.Flower:
      case ObjectType.Polygon:
      case ObjectType.Sensor:
      case ObjectType.Light:
      case ObjectType.SolarPanel:
      case ObjectType.ParabolicDish:
      case ObjectType.ParabolicTrough:
      case ObjectType.FresnelReflector:
      case ObjectType.Heliostat:
      case ObjectType.BatteryStorage:
      case ObjectType.WindTurbine: {
        return true;
      }
      default: {
        return false;
      }
    }
  };

  const handleUndoableAdd = (element: ElementModel) => {
    const undoableAdd = {
      name: 'Add',
      timestamp: Date.now(),
      addedElement: element,
      undo: () => {
        useStore.getState().removeElementById(undoableAdd.addedElement.id, false);
      },
      redo: () => {
        setCommonStore((state) => {
          state.elements.push(undoableAdd.addedElement);
          state.selectedElement = undoableAdd.addedElement;
        });
      },
    } as UndoableAdd;
    useStore.getState().addUndoable(undoableAdd);
  };

  const updateUndoResize = (id: string, cx: number, cy: number, cz: number, lx: number, ly: number, lz: number) => {
    useStore.getState().set((state) => {
      const e = state.elements.find((e) => e.id === id);
      if (e) {
        e.cx = cx;
        e.cy = cy;
        e.cz = cz;
        e.lx = lx;
        e.ly = ly;
        e.lz = lz;
      }
    });
  };

  const updateSlope = (id: string, slope: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id && e.type === ObjectType.Foundation) {
          (e as FoundationModel).slope = slope;
        }
        if (e.parentId === id && (e.type === ObjectType.SolarPanel || e.type === ObjectType.BatteryStorage)) {
          e.cz = hz + (hx + e.cx) * Math.tan(slope);
        }
      }
    });
  };

  const onResizeHandlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    useRefStore.getState().setEnableOrbitController(false);
    const cameraDirection = useStore.getState().cameraDirection;
    const rot = -HALF_PI + Math.atan2(-cameraDirection.y, -cameraDirection.x) - rotation[2];
    oldSlopeRef.current = slope;
    switch (event.object.name) {
      case ResizeHandleType.Upper: {
        setIntersectionPlane({ y: hy, rot: rot });
        break;
      }
      case ResizeHandleType.Right: {
        setIntersectionPlane({ y: 0, rot: rot });
        break;
      }
      case ResizeHandleType.Lower: {
        setIntersectionPlane({ y: -hy, rot: rot });
        break;
      }
    }
  };

  const onGroupPointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (event.intersections.length == 0) {
      return;
    } else if (event.intersections[0].object.name === 'Polygon') {
      if (legalToAdd(useStore.getState().objectTypeToAdd)) {
        const addedElement = useStore.getState().addElement(foundation, event.point);
        if (addedElement) {
          handleUndoableAdd(addedElement);
        }
        setCommonStore((state) => {
          if (!state.actionModeLock) state.objectTypeToAdd = ObjectType.None;
        });
      }
      return;
    } else if (event.intersections[0].object !== event.object) {
      return;
    }

    useStore.getState().selectElement(id);
    // right click
    if (event.button === 2) {
      setCommonStore((state) => {
        state.clickObjectType = ObjectType.Foundation;
        state.pastePoint.copy(event.intersections[0].point);
        state.pasteNormal = UNIT_VECTOR_POS_Z;
        if (event.altKey) {
          // when alt key is pressed, don't invoke context menu as it is reserved for fast click-paste
          state.contextMenuObjectType = null;
        } else {
          state.contextMenuObjectType = ObjectType.Foundation;
        }
      });
    } else if (legalToAdd(useStore.getState().objectTypeToAdd)) {
      const addedElement = useStore.getState().addElement(foundation, event.point);
      if (addedElement) {
        handleUndoableAdd(addedElement);
      }
      setCommonStore((state) => {
        if (!state.actionModeLock) state.objectTypeToAdd = ObjectType.None;
      });
    }
  };

  const onGroupPointerMove = (event: ThreeEvent<PointerEvent>) => {
    const selectedElement = useStore.getState().selectedElement;
    if (!selectedElement || selectedElement.parentId !== id) return;

    const moveHandleType = useStore.getState().moveHandleType;
    const resizeHandleType = useStore.getState().resizeHandleType;

    if (!moveHandleType && !resizeHandleType) return;

    if (moveHandleType) {
      switch (selectedElement.type) {
        case ObjectType.WindTurbine:
        case ObjectType.Light:
        case ObjectType.Sensor:
        case ObjectType.ParabolicDish:
        case ObjectType.ParabolicTrough:
        case ObjectType.FresnelReflector:
        case ObjectType.Heliostat: {
          const absolutePosition = tempVector3_1
            .subVectors(event.point, tempVector3_0.set(cx, cy, 0))
            .applyEuler(tempEuler.set(0, 0, -rotation[2]));
          setCommonStore((state) => {
            const el = state.elements.find((e) => e.id === selectedElement.id);
            if (el) {
              el.cx = absolutePosition.x / lx;
              el.cy = absolutePosition.y / ly;
            }
          });
          break;
        }
        case ObjectType.Polygon: {
          const polygon = selectedElement as PolygonModel;
          const p = Util.relativeCoordinates(event.point.x, event.point.y, event.point.z, foundation);
          const centroid = Util.calculatePolygonCentroid(polygon.vertices);
          const dx = p.x - centroid.x;
          const dy = p.y - centroid.y;
          const copy = polygon.vertices.map((v) => ({ ...v }));
          copy.forEach((v: Point2) => {
            v.x += dx;
            v.y += dy;
          });
          // update all the vertices at once with the DEEP COPY above
          // do not update each vertex's position one by one (it is slower)
          useStore.getState().updatePolygonVerticesById(polygon.id, copy);
          break;
        }
      }
      operationRef.current = 'move';
    } else if (resizeHandleType) {
      if (Util.isCspCollectorType(selectedElement.type)) {
        const collector = selectedElement as SolarCollector;
        const p = event.point;
        const resizeAnchor = useStore.getState().resizeAnchor;
        const wp = new Vector2(p.x, p.y);
        const resizeAnchor2D = new Vector2(resizeAnchor.x, resizeAnchor.y);
        const distance = wp.distanceTo(resizeAnchor2D);
        const angle = collector.relativeAzimuth + rotation[2]; // world panel azimuth
        const rp = new Vector2().subVectors(wp, resizeAnchor2D); // relative vector from anchor to pointer
        const wbc = new Vector2(cx, cy); // world foundation center
        if (collector.type === ObjectType.ParabolicTrough) {
          const parabolicTrough = collector as ParabolicTroughModel;
          switch (resizeHandleType) {
            case ResizeHandleType.Lower:
            case ResizeHandleType.Upper:
              // these two handles change the length, which is controlled by module length
              {
                const sign = resizeHandleType === ResizeHandleType.Lower ? 1 : -1;
                const theta = rp.angle() - angle + sign * HALF_PI;
                let dyl = distance * Math.cos(theta);
                const n = Math.max(
                  1,
                  Math.ceil((dyl - parabolicTrough.moduleLength / 2) / parabolicTrough.moduleLength),
                );
                dyl = n * parabolicTrough.moduleLength;
                const wcx = resizeAnchor.x + (sign * (dyl * Math.sin(angle))) / 2;
                const wcy = resizeAnchor.y - (sign * (dyl * Math.cos(angle))) / 2;
                const wc = new Vector2(wcx, wcy); // world panel center
                const rc = new Vector2().subVectors(wc, wbc).rotateAround(ORIGIN_VECTOR2, -rotation[2]);
                const newCy = rc.y / ly;
                setCommonStore((state) => {
                  const el = state.elements.find((e) => e.id === collector.id);
                  if (el) {
                    el.ly = dyl;
                    el.cy = newCy;
                  }
                });
              }
              break;
            case ResizeHandleType.Left:
            case ResizeHandleType.Right:
              // these two handles change the width, which is not controlled by module length
              {
                const sign = resizeHandleType === ResizeHandleType.Left ? -1 : 1;
                const theta = rp.angle() - angle + (resizeHandleType === ResizeHandleType.Left ? Math.PI : 0);
                const dxl = distance * Math.cos(theta);
                const wcx = resizeAnchor.x + (sign * (dxl * Math.cos(angle))) / 2;
                const wcy = resizeAnchor.y + (sign * (dxl * Math.sin(angle))) / 2;
                const wc = new Vector2(wcx, wcy);
                const rc = new Vector2().subVectors(wc, wbc).rotateAround(ORIGIN_VECTOR2, -rotation[2]);
                const newCx = rc.x / lx;
                setCommonStore((state) => {
                  const el = state.elements.find((e) => e.id === collector.id);
                  if (el) {
                    el.lx = dxl;
                    el.cx = newCx;
                    el.cz = Util.getZOnSlope(lx, slope, newCx * foundation.lx);
                    state.actionState.parabolicTroughWidth = dxl;
                  }
                });
              }
              break;
          }
        } else if (collector.type === ObjectType.FresnelReflector) {
          const fresnelReflector = collector as FresnelReflectorModel;
          switch (resizeHandleType) {
            case ResizeHandleType.Lower:
            case ResizeHandleType.Upper:
              // these two handles change the length, which is controlled by module length
              {
                const sign = resizeHandleType === ResizeHandleType.Lower ? 1 : -1;
                const theta = rp.angle() - angle + sign * HALF_PI;
                let dyl = distance * Math.cos(theta);
                const n = Math.max(
                  1,
                  Math.ceil((dyl - fresnelReflector.moduleLength / 2) / fresnelReflector.moduleLength),
                );
                dyl = n * fresnelReflector.moduleLength;
                const wcx = resizeAnchor.x + (sign * (dyl * Math.sin(angle))) / 2;
                const wcy = resizeAnchor.y - (sign * (dyl * Math.cos(angle))) / 2;
                const wc = new Vector2(wcx, wcy); // world panel center
                const rc = new Vector2().subVectors(wc, wbc).rotateAround(ORIGIN_VECTOR2, -rotation[2]);
                const newCy = rc.y / ly;
                setCommonStore((state) => {
                  const el = state.elements.find((e) => e.id === collector.id);
                  if (el) {
                    el.ly = dyl;
                    el.cy = newCy;
                  }
                });
              }
              break;
            case ResizeHandleType.Left:
            case ResizeHandleType.Right:
              // these two handles change the width, which is not controlled by module length
              {
                const sign = resizeHandleType === ResizeHandleType.Left ? -1 : 1;
                const theta = rp.angle() - angle + (resizeHandleType === ResizeHandleType.Left ? Math.PI : 0);
                const dxl = distance * Math.cos(theta);
                const wcx = resizeAnchor.x + (sign * (dxl * Math.cos(angle))) / 2;
                const wcy = resizeAnchor.y + (sign * (dxl * Math.sin(angle))) / 2;
                const wc = new Vector2(wcx, wcy);
                const rc = new Vector2().subVectors(wc, wbc).rotateAround(ORIGIN_VECTOR2, -rotation[2]);
                const newCx = rc.x / lx;
                setCommonStore((state) => {
                  const el = state.elements.find((e) => e.id === collector.id);
                  if (el) {
                    el.lx = dxl;
                    el.cx = newCx;
                    el.cz = Util.getZOnSlope(lx, slope, newCx * foundation.lx);
                    state.actionState.fresnelReflectorWidth = dxl;
                  }
                });
              }
              break;
          }
        } else if (collector.type === ObjectType.ParabolicDish) {
          switch (resizeHandleType) {
            case ResizeHandleType.Left:
            case ResizeHandleType.Right:
            case ResizeHandleType.Lower:
            case ResizeHandleType.Upper: {
              // all handles change the diameter of the dish
              const diameter = Math.min(10, distance);
              setCommonStore((state) => {
                const el = state.elements.find((e) => e.id === collector.id);
                if (el) {
                  el.lx = diameter;
                  el.ly = diameter;
                  state.actionState.parabolicDishRimDiameter = diameter;
                }
              });
              break;
            }
          }
        }
      } else if (selectedElement.type === ObjectType.Polygon) {
        const polygon = selectedElement as PolygonModel;
        let p = event.point.clone();
        p.x -= foundation.cx;
        p.y -= foundation.cy;
        p.applyEuler(new Euler().fromArray(foundation.rotation.map((a) => -a) as XYZO));
        p = useStore.getState().enableFineGrid ? Util.snapToFineGrid(p) : Util.snapToNormalGrid(p);
        p.x /= foundation.lx;
        p.y /= foundation.ly;
        useStore.getState().updatePolygonVertexPositionById(polygon.id, polygon.selectedIndex, p.x, p.y);
      }
      operationRef.current = 'resize';
    } else {
      operationRef.current = null;
    }
  };

  const onIntersectionPlanePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (event.intersections.length > 0) {
      const slopeHeight = Math.max(0, event.intersections[0].point.z - hz * 2);
      const slope = Math.atan2(slopeHeight, lx);
      updateSlope(id, slope);
    }
  };

  // pointer up
  useEffect(() => {
    const onPointerUp = () => {
      // add undo slope
      if (intersectionPlane) {
        setIntersectionPlane(null);
        useRefStore.getState().setEnableOrbitController(true);
        const foundation = useStore
          .getState()
          .elements.find((e) => e.id === id && e.type === ObjectType.Foundation) as FoundationModel;
        if (foundation) {
          const undoableChange = {
            name: 'Update Foundation Slope',
            timestamp: Date.now(),
            oldValue: oldSlopeRef.current,
            newValue: foundation.slope,
            changedElementId: foundation.id,
            changedElementType: foundation.type,
            undo: () => {
              updateSlope(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateSlope(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          useStore.getState().addUndoable(undoableChange);
        }
      }

      const selectedElement = useStore.getState().selectedElement;
      if (selectedElement && selectedElement.parentId === id) {
        if (operationRef.current === 'move') {
          if (
            selectedElement.type === ObjectType.Tree ||
            selectedElement.type === ObjectType.Flower ||
            selectedElement.type === ObjectType.Human
          ) {
            SharedUtil.addUndoableMove(true);
          } else {
            SharedUtil.addUndoableMove(false);
          }
        } else if (operationRef.current === 'resize') {
          switch (selectedElement.type) {
            case ObjectType.Polygon: {
              SharedUtil.addUndoableMove(false);
              break;
            }
            case ObjectType.ParabolicDish:
            case ObjectType.ParabolicTrough:
            case ObjectType.FresnelReflector: {
              const oldElement = selectedElement;
              const newElement = useStore.getState().elements.find((e) => e.id === oldElement.id);
              if (newElement) {
                const undoableResize = {
                  name: 'Resize ' + oldElement.type,
                  timestamp: Date.now(),
                  resizedElementId: oldElement.id,
                  resizedElementType: oldElement.type,
                  oldCx: oldElement.cx,
                  oldCy: oldElement.cy,
                  oldCz: oldElement.cz,
                  newCx: newElement.cx,
                  newCy: newElement.cy,
                  newCz: newElement.cz,
                  oldLx: oldElement.lx,
                  oldLy: oldElement.ly,
                  oldLz: oldElement.lz,
                  newLx: newElement.lx,
                  newLy: newElement.ly,
                  newLz: newElement.lz,
                  undo: () => {
                    updateUndoResize(
                      undoableResize.resizedElementId,
                      undoableResize.oldCx,
                      undoableResize.oldCy,
                      undoableResize.oldCz,
                      undoableResize.oldLx,
                      undoableResize.oldLy,
                      undoableResize.oldLz,
                    );
                  },
                  redo: () => {
                    updateUndoResize(
                      undoableResize.resizedElementId,
                      undoableResize.newCx,
                      undoableResize.newCy,
                      undoableResize.newCz,
                      undoableResize.newLx,
                      undoableResize.newLy,
                      undoableResize.newLz,
                    );
                  },
                } as UndoableResize;
                useStore.getState().addUndoable(undoableResize);
              }
              break;
            }
          }
        }
        operationRef.current = null;
      }
    };
    window.addEventListener('pointerup', onPointerUp);
    return () => window.removeEventListener('pointerup', onPointerUp);
  }, [intersectionPlane]);

  const bodyRef = useRef<Mesh>(null!);
  const texturePlaneRef = useRef<Mesh>(null!);

  useEffect(() => {
    if (bodyRef.current) {
      // @ts-expect-error ignore
      bodyRef.current.material.needsUpdate = true;
    }
    if (texturePlaneRef.current) {
      // @ts-expect-error ignore
      texturePlaneRef.current.material.needsUpdate = true;
    }
  }, [transparent]);

  // pv limitation (tilt/resize)
  // cube texture on building simulation
  return (
    // don't wrap a group here, element's movement need parent object.
    <>
      <Extrude
        ref={bodyRef}
        name={FOUNDATION_NAME}
        userData={{ simulation: true, stand: true, id: id, aabb: true }}
        args={[shape, { steps: 1, depth: ly, bevelEnabled: false }]}
        position={[-hx, hy, hz]}
        rotation={[HALF_PI, 0, 0]}
        castShadow={enableShadow}
        receiveShadow={enableShadow}
        onPointerDown={onGroupPointerDown}
        onPointerMove={onGroupPointerMove}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial color={color} transparent={transparent} opacity={opacity} />
      </Extrude>

      {(textureType !== FoundationTexture.NoTexture || showHeatmap) && (
        <Plane
          ref={texturePlaneRef}
          args={[lx / Math.cos(slope), ly]}
          rotation={[0, -slope, 0]}
          position={[0, 0, hz + slopeLz / 2 + 0.001]}
          receiveShadow={enableShadow}
          castShadow={false}
        >
          <meshStandardMaterial color={'white'} map={texture} transparent={transparent} opacity={opacity} />
        </Plane>
      )}

      {selected && !orthographic && !locked && (
        <group position={[hx, 0, hz + slopeLz]} onPointerDown={onResizeHandlePointerDown}>
          <ResizeHandle cx={0} cy={hy} size={handleSize} type={ResizeHandleType.Upper} />
          <ResizeHandle cx={0} cy={0} size={handleSize} type={ResizeHandleType.Right} />
          <ResizeHandle cx={0} cy={-hy} size={handleSize} type={ResizeHandleType.Lower} />
        </group>
      )}

      {/* intersection plane */}
      {intersectionPlane && (
        <Plane
          ref={planeRef}
          args={[1000, 1000]}
          rotation={[HALF_PI, intersectionPlane.rot, 0]}
          position={[hx, intersectionPlane.y, hz]}
          onPointerMove={onIntersectionPlanePointerMove}
          visible={false}
        >
          <meshBasicMaterial side={DoubleSide} />
        </Plane>
      )}
    </>
  );
};

export default Slope;
