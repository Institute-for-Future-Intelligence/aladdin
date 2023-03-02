/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../stores/common';
import {
  GableRoofModel,
  GambrelRoofModel,
  HipRoofModel,
  MansardRoofModel,
  PyramidRoofModel,
  RoofModel,
  RoofType,
} from '../../models/RoofModel';
import * as Selector from '../../stores/selector';
import PyramidRoof from './pyramidRoof';
import GableRoof from './gableRoof';
import HipRoof from './hipRoof';
import GambrelRoof from './gambrelRoof';
import { UndoableResizeRoofRise } from 'src/undo/UndoableResize';
import MansardRoof from './mansardRoof';
import { Euler, Mesh, Vector3 } from 'three';
import { ObjectType, Orientation } from 'src/types';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { HIGHLIGHT_HANDLE_COLOR, LOCKED_ELEMENT_SELECTION_COLOR } from 'src/constants';
import { Point2 } from 'src/models/Point2';
import { showError } from 'src/helpers';
import i18n from 'src/i18n/i18n';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { ElementModel } from 'src/models/ElementModel';
import { RoofUtil } from './RoofUtil';
import { ElementModelFactory } from 'src/models/ElementModelFactory';
import { UndoableAdd } from 'src/undo/UndoableAdd';
import { Sphere } from '@react-three/drei';
import { useHandleSize } from '../wall/hooks';
import { addUndoableMove, undoInvalidOperation, WALL_OUTSIDE_SURFACE_MESH_NAME } from '../wall/wall';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';

export interface RoofSegmentGroupUserData {
  roofId: string;
  foundation: ElementModel | null;
  centroid: Vector3;
  roofSegments: RoofSegmentProps[];
}
export interface RoofSegmentProps {
  points: Vector3[];
  angle: number;
  length: number;
}

export interface RoofWireframeProps {
  roofSegments: RoofSegmentProps[];
  thickness: number;
  lineWidth: number;
  lineColor: string;
}

interface RoofHandleProps {
  position: [x: number, y: number, z: number];
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerUp?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOver?: (event: ThreeEvent<PointerEvent>) => void;
}

const addUndoableAddSolarPanel = (elem: ElementModel) => {
  const undoableAdd = {
    name: 'Add Solar Panel on Roof',
    timestamp: Date.now(),
    addedElement: elem,
    undo: () => {
      useStore.getState().removeElementById(elem.id, false);
    },
    redo: () => {
      useStore.getState().set((state) => {
        state.elements.push(undoableAdd.addedElement);
        state.selectedElement = undoableAdd.addedElement;
      });
    },
  } as UndoableAdd;
  useStore.getState().addUndoable(undoableAdd);
};

const getPointerOnRoof = (e: ThreeEvent<PointerEvent>) => {
  for (const intersection of e.intersections) {
    if (intersection.eventObject.name.includes('Roof Segments Group')) {
      return intersection.point;
    }
  }
  return e.intersections[0].point;
};

const handleAddElementOnRoof = (
  e: ThreeEvent<PointerEvent>,
  roofId: string,
  foundation: ElementModel,
  roofSegments: RoofSegmentProps[],
  ridgeMidPoint: Vector3,
) => {
  switch (useStore.getState().objectTypeToAdd) {
    case ObjectType.SolarPanel: {
      const roof = useStore.getState().getElementById(roofId);
      if (roof && foundation && e.intersections[0]) {
        const pointer = getPointerOnRoof(e);
        const posRelToFoundation = new Vector3()
          .subVectors(pointer, new Vector3(foundation.cx, foundation.cy))
          .applyEuler(new Euler(0, 0, -foundation.rotation[2]));
        const posRelToCentroid = posRelToFoundation.clone().sub(ridgeMidPoint);
        const { normal, rotation } = RoofUtil.computeState(roofSegments, posRelToCentroid);
        const actionState = useStore.getState().actionState;
        const newElement = ElementModelFactory.makeSolarPanel(
          roof,
          useStore.getState().getPvModule(actionState.solarPanelModelName ?? 'SPR-X21-335-BLK'),
          posRelToFoundation.x / foundation.lx,
          posRelToFoundation.y / foundation.ly,
          posRelToFoundation.z - foundation.lz,
          actionState.solarPanelOrientation ?? Orientation.landscape,
          actionState.solarPanelPoleHeight ?? 1,
          actionState.solarPanelPoleSpacing ?? 3,
          actionState.solarPanelTiltAngle ?? 0,
          actionState.solarPanelRelativeAzimuth ?? 0,
          normal,
          rotation ?? [0, 0, 1],
          actionState.solarPanelFrameColor,
          undefined,
          undefined,
          ObjectType.Roof,
        );
        useStore.getState().set((state) => {
          state.elements.push(newElement);
          if (!state.actionModeLock) state.objectTypeToAdd = ObjectType.None;
        });
        addUndoableAddSolarPanel(newElement);
      }
      break;
    }
    case ObjectType.Sensor: {
      const roof = useStore.getState().getElementById(roofId);
      if (roof?.type === ObjectType.Roof) {
        if (roof && foundation && e.intersections[0]) {
          const pointer = e.intersections[0].point;
          const posRelToFoundation = new Vector3()
            .subVectors(pointer, new Vector3(foundation.cx, foundation.cy))
            .applyEuler(new Euler(0, 0, -foundation.rotation[2]));
          const posRelToCentroid = posRelToFoundation.clone().sub(ridgeMidPoint);
          const { normal, rotation } = RoofUtil.computeState(roofSegments, posRelToCentroid);
          const newElement = ElementModelFactory.makeSensor(
            roof,
            posRelToFoundation.x / foundation.lx,
            posRelToFoundation.y / foundation.ly,
            posRelToFoundation.z - foundation.lz,
            normal,
            rotation ?? [0, 0, 1],
          );
          useStore.getState().set((state) => {
            state.elements.push(newElement);
            if (!state.actionModeLock) state.objectTypeToAdd = ObjectType.None;
          });
          addUndoableAddSolarPanel(newElement);
        }
      }
      break;
    }
    case ObjectType.Light: {
      const roof = useStore.getState().getElementById(roofId);
      if (roof?.type === ObjectType.Roof) {
        if (roof && foundation && e.intersections[0]) {
          const pointer = e.intersections[0].point;
          const posRelToFoundation = new Vector3()
            .subVectors(pointer, new Vector3(foundation.cx, foundation.cy))
            .applyEuler(new Euler(0, 0, -foundation.rotation[2]));
          const posRelToCentroid = posRelToFoundation.clone().sub(ridgeMidPoint);
          const { normal, rotation } = RoofUtil.computeState(roofSegments, posRelToCentroid);
          const actionState = useStore.getState().actionState;
          const newElement = ElementModelFactory.makeLight(
            roof,
            2,
            actionState.lightDistance,
            actionState.lightIntensity,
            actionState.lightColor,
            posRelToFoundation.x / foundation.lx,
            posRelToFoundation.y / foundation.ly,
            posRelToFoundation.z - foundation.lz,
            normal,
            rotation ?? [0, 0, 1],
          );
          useStore.getState().set((state) => {
            state.elements.push(newElement);
            if (!state.actionModeLock) state.objectTypeToAdd = ObjectType.None;
          });
          addUndoableAddSolarPanel(newElement);
        }
      }
      break;
    }
  }
};

export const handleRoofBodyPointerDown = (e: ThreeEvent<PointerEvent>, id: string, foundationId: string) => {
  if (useStore.getState().isAddingElement() || useStore.getState().objectTypeToAdd !== ObjectType.None) {
    return;
  }
  if (e.intersections.length > 0 && e.intersections[0].eventObject.name === e.eventObject.name) {
    e.stopPropagation();
    useStore.getState().set((state) => {
      if (state.groupActionMode) {
        for (const e of state.elements) {
          e.selected = e.id === foundationId;
        }
        state.groupMasterId = foundationId;
      } else {
        for (const e of state.elements) {
          if (e.id === id) {
            e.selected = true;
            state.selectedElement = e;
          } else {
            e.selected = false;
          }
        }
      }
    });
  }
};

export const addUndoableResizeRoofRise = (elemId: string, oldRise: number, newRise: number) => {
  const undoable = {
    name: 'Resize Roof Rise',
    timestamp: Date.now(),
    resizedElementId: elemId,
    resizedElementType: ObjectType.Roof,
    oldRise: oldRise,
    newRise: newRise,
    undo: () => {
      useStore.getState().updateRoofRiseById(undoable.resizedElementId, undoable.oldRise);
    },
    redo: () => {
      useStore.getState().updateRoofRiseById(undoable.resizedElementId, undoable.newRise);
    },
  } as UndoableResizeRoofRise;
  useStore.getState().addUndoable(undoable);
};

export const spBoundaryCheck = (solarPanelVertices: Vector3[], wallVertices: Point2[]) => {
  const lang = { lng: useStore.getState().language };
  if (RoofUtil.rooftopSPBoundaryCheck(solarPanelVertices, wallVertices)) {
    return true;
  } else {
    if (useStore.getState().moveHandleType || useStore.getState().viewState.orthographic) {
      showError(i18n.t('message.MoveOutsideBoundaryCancelled', lang));
    } else if (useStore.getState().resizeHandleType) {
      showError(i18n.t('message.ResizingOutsideBoundaryCancelled', lang));
    } else if (useStore.getState().rotateHandleType) {
      showError(i18n.t('message.RotationOutsideBoundaryCancelled', lang));
    }
    return false;
  }
};

export const spCollisionCheck = (sp: SolarPanelModel, foundation: ElementModel, spVertices: Vector3[]) => {
  const lang = { lng: useStore.getState().language };
  if (RoofUtil.rooftopSPCollisionCheck(sp, foundation, spVertices)) {
    return true;
  } else {
    if (useStore.getState().moveHandleType || useStore.getState().viewState.orthographic) {
      showError(i18n.t('message.MoveCancelledBecauseOfOverlap', lang));
    } else if (useStore.getState().resizeHandleType) {
      showError(i18n.t('message.ResizingCancelledBecauseOfOverlap', lang));
    } else if (useStore.getState().rotateHandleType) {
      showError(i18n.t('message.RotationCancelledBecauseOfOverlap', lang));
    }
    return false;
  }
};

export const updateRooftopElements = (
  foundation: ElementModel | null,
  roofId: string,
  roofSegments: RoofSegmentProps[],
  centroid: Vector3,
  h: number,
  thickness: number,
) => {
  useStore.getState().set((state) => {
    if (foundation === null) return;
    for (const e of state.elements) {
      if (e.parentId === roofId && e.foundationId) {
        if (e.type === ObjectType.SolarPanel) {
          const posRelToFoundation = new Vector3(e.cx * foundation.lx, e.cy * foundation.ly, e.cz + foundation.lz);
          const posRelToCentroid = posRelToFoundation.clone().sub(centroid);
          const { segmentVertices, normal, rotation } = RoofUtil.computeState(roofSegments, posRelToCentroid);
          let z;
          if (segmentVertices) {
            z = RoofUtil.getRooftopZ(segmentVertices, posRelToCentroid, h + thickness);
          } else {
            z = h + thickness;
          }
          if (normal && rotation && z !== undefined) {
            e.normal = normal.toArray();
            e.rotation = [...rotation];
            e.cz = z;
          }
        } else if (e.type === ObjectType.Sensor || e.type === ObjectType.Light) {
          const posRelToFoundation = new Vector3(e.cx * foundation.lx, e.cy * foundation.ly, e.cz + foundation.lz);
          const posRelToCentroid = posRelToFoundation.clone().sub(centroid);
          const { segmentVertices, normal, rotation } = RoofUtil.computeState(roofSegments, posRelToCentroid);
          let z;
          if (segmentVertices) {
            z = RoofUtil.getRooftopZ(segmentVertices, posRelToCentroid, h + thickness);
          } else {
            z = h + thickness;
          }
          if (normal && rotation && z !== undefined) {
            e.normal = normal.toArray();
            e.rotation = [...rotation];
            e.cz = z;
          }
        }
      }
    }
  });
};

// handle pointer events
export const handlePointerDown = (
  e: ThreeEvent<PointerEvent>,
  roofId: string,
  foundation: ElementModel | null,
  roofSegments: RoofSegmentProps[],
  centroid: Vector3,
) => {
  if (!foundation) return;
  handleAddElementOnRoof(e, roofId, foundation, roofSegments, centroid);
  // click on child
  if (e.intersections[0].eventObject.name !== e.eventObject.name) {
  }
  // click on roof body
  else {
    handleRoofBodyPointerDown(e, roofId, foundation.id);
  }
};

export const handlePointerUp = (event: ThreeEvent<PointerEvent>, roofModel: RoofModel) => {
  const selectedElement = useStore.getState().selectedElement;
  if (!selectedElement || !RoofUtil.isValidOnRoof(selectedElement)) return;

  const element = useStore.getState().getElementById(selectedElement.id);
  if (element && useStore.getState().moveHandleType) {
    const intersectionRoofs = event.intersections.filter((i) => i.eventObject.name.includes('Roof'));
    const isFirstIntersectedRoof = intersectionRoofs[0].eventObject.userData.roofId === roofModel.id;
    if (isFirstIntersectedRoof && element.foundationId) {
      const foundation = useStore.getState().getElementById(element.foundationId);

      if (foundation) {
        switch (element.type) {
          case ObjectType.SolarPanel: {
            const solarPanel = element as SolarPanelModel;
            const boundaryVertices = RoofUtil.getRoofBoundaryVertices(roofModel);
            const solarPanelVertices = RoofUtil.getSolarPanelVerticesOnRoof(solarPanel, foundation);
            if (
              !spBoundaryCheck(solarPanelVertices, boundaryVertices) ||
              !spCollisionCheck(solarPanel, foundation, solarPanelVertices)
            ) {
              undoInvalidOperation();
            } else {
              addUndoableMove();
            }
            break;
          }
          case ObjectType.Sensor:
            addUndoableMove();
            break;
          case ObjectType.Light:
            addUndoableMove();
            break;
        }
      }
    }
  }
  useStore.getState().set((state) => {
    state.moveHandleType = null;
  });
};

export const handlePointerMove = (event: ThreeEvent<PointerEvent>, id: string) => {
  const selectedElement = useStore.getState().getSelectedElement();
  if (!selectedElement || !RoofUtil.isValidOnRoof(selectedElement)) return;

  switch (selectedElement.type) {
    case ObjectType.Sensor:
    case ObjectType.Light:
    case ObjectType.SolarPanel: {
      if (
        selectedElement.type === ObjectType.SolarPanel &&
        (selectedElement as SolarPanelModel).parentType === undefined
      )
        return;
      if (useStore.getState().moveHandleType) {
        const intersectionObjects = event.intersections.filter(
          (i) => i.eventObject.name.includes('Roof') || i.eventObject.name.includes(WALL_OUTSIDE_SURFACE_MESH_NAME),
        );
        const isFirstIntersectedRoof = intersectionObjects[0].eventObject.userData.roofId === id;

        if (isFirstIntersectedRoof) {
          useStore.getState().set((state) => {
            for (const e of state.elements) {
              if (e.id === selectedElement.id) {
                const { roofId, foundation, centroid, roofSegments } = intersectionObjects[0].eventObject
                  .userData as RoofSegmentGroupUserData;

                if (foundation && centroid && roofSegments && roofId) {
                  const pointer = intersectionObjects[0].point;
                  const posRelToFoundation = new Vector3()
                    .subVectors(pointer, new Vector3(foundation.cx, foundation.cy))
                    .applyEuler(new Euler(0, 0, -foundation.rotation[2]));
                  const posRelToCentroid = posRelToFoundation.clone().sub(centroid);
                  const { normal, rotation } = RoofUtil.computeState(roofSegments, posRelToCentroid);
                  e.cx = posRelToFoundation.x / foundation.lx;
                  e.cy = posRelToFoundation.y / foundation.ly;
                  e.cz = posRelToFoundation.z - foundation.lz;
                  e.rotation = [...rotation];
                  e.normal = normal.toArray();
                  e.parentId = roofId;
                  e.foundationId = foundation.id;
                  if (e.type === ObjectType.SolarPanel) {
                    (e as SolarPanelModel).parentType = ObjectType.Roof;
                    e.color = '#fff';
                  }
                  if (state.selectedElement) {
                    state.selectedElement.parentId = roofId;
                    state.selectedElement.foundationId = foundation.id;
                  }
                  usePrimitiveStore.getState().setPrimitiveStore('showWallIntersectionPlaneId', null);
                }
                break;
              }
            }
          });
        }
      }
    }
  }
};

export const handleContextMenu = (e: ThreeEvent<MouseEvent>, id: string) => {
  if (e.intersections.length > 0 && e.intersections[0].eventObject.name === e.eventObject.name) {
    e.stopPropagation();
    useStore.getState().set((state) => {
      state.contextMenuObjectType = ObjectType.Roof;
      state.pastePoint.copy(e.intersections[0].point);
      for (const e of state.elements) {
        if (e.id === id) {
          e.selected = true;
          state.selectedElement = e;
        } else {
          e.selected = false;
        }
      }
    });
  }
};

export const RoofHandle = ({ position, onPointerDown, onPointerUp, onPointerOver }: RoofHandleProps) => {
  const setCommonStore = useStore(Selector.set);
  const roofHandleSize = useHandleSize();
  const { gl } = useThree();

  const pointerDownRef = useRef(false);
  const hoveredRef = useRef(false);
  const havefiredEvent = useRef(false);
  const handleRef = useRef<Mesh>();

  const [color, setColor] = useState('white');

  const setHightLight = (b: boolean) => {
    if (b) {
      setColor(HIGHLIGHT_HANDLE_COLOR);
      gl.domElement.style.cursor = 'pointer';
    } else {
      setColor('white');
      gl.domElement.style.cursor = 'default';
    }
  };

  useEffect(() => {
    const handlePointerUp = () => {
      if (hoveredRef.current) {
        havefiredEvent.current = true;
      }

      if (!hoveredRef.current && pointerDownRef.current) {
        setHightLight(false);
      }
      pointerDownRef.current = false;
    };
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  const isFirstHandle = (e: ThreeEvent<PointerEvent>) => {
    if (e.intersections.length > 0) {
      for (const { eventObject } of e.intersections) {
        if (eventObject.name === 'Roof Handle') {
          return eventObject === handleRef.current;
        }
      }
    }
    return false;
  };

  return (
    <Sphere
      name={'Roof Handle'}
      ref={handleRef}
      args={[roofHandleSize]}
      position={position}
      onPointerMove={(e) => {
        if (isFirstHandle(e)) {
          havefiredEvent.current = false;
          if (!hoveredRef.current) {
            hoveredRef.current = true;
            setHightLight(true);
          }
        } else {
          setColor('white');
        }
      }}
      // this will fire once after pointerup when hovered
      onPointerOut={(e) => {
        if (havefiredEvent.current) {
          return;
        }
        if (!pointerDownRef.current) {
          if (e.intersections.length > 0 && e.intersections[0].eventObject.name === 'Roof Handle') {
            setColor('white');
          } else {
            setHightLight(false);
          }
        }
        hoveredRef.current = false;
      }}
      onPointerDown={(e) => {
        if (isFirstHandle(e)) {
          if (onPointerDown) {
            onPointerDown(e);
          }
          pointerDownRef.current = true;
        }
      }}
      onPointerUp={(e) => {
        if (isFirstHandle(e)) {
          if (onPointerUp) {
            onPointerUp(e);
          }
        }
      }}
      onPointerOver={(e) => {
        if (isFirstHandle(e)) {
          if (onPointerOver) {
            onPointerOver(e);
          }
        }
      }}
      onPointerLeave={(e) => {
        if (isFirstHandle(e)) {
          setCommonStore((state) => {
            state.hoveredHandle = null;
          });
        }
      }}
    >
      <meshBasicMaterial attach="material" color={color} />
    </Sphere>
  );
};

const RoofRenderer = (props: RoofModel) => {
  const removeElementById = useStore(Selector.removeElementById);
  const setCommonStore = useStore(Selector.set);

  const { id, wallsId, roofType, selected, locked } = props;

  // some old files don't have these props
  const _lineColor = selected && locked ? LOCKED_ELEMENT_SELECTION_COLOR : props.lineColor ?? 'black';
  const _lineWidth = selected && locked ? 1 : props.lineWidth ?? 0.2;

  useEffect(() => {
    if (wallsId.length === 0) {
      removeElementById(id, false);
    }
  }, [wallsId]);

  if (props.thickness === undefined) {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          (e as RoofModel).thickness = props.thickness ?? 0.2;
          return;
        }
      }
    });
    return null;
  }

  const renderRoof = () => {
    switch (roofType) {
      case RoofType.Pyramid:
        return <PyramidRoof {...(props as PyramidRoofModel)} lineColor={_lineColor} lineWidth={_lineWidth} />;
      case RoofType.Gable:
        return <GableRoof {...(props as GableRoofModel)} lineColor={_lineColor} lineWidth={_lineWidth} />;
      case RoofType.Hip:
        return <HipRoof {...(props as HipRoofModel)} lineColor={_lineColor} lineWidth={_lineWidth} />;
      case RoofType.Gambrel:
        return <GambrelRoof {...(props as GambrelRoofModel)} lineColor={_lineColor} lineWidth={_lineWidth} />;
      case RoofType.Mansard:
        return <MansardRoof {...(props as MansardRoofModel)} lineColor={_lineColor} lineWidth={_lineWidth} />;
      default:
        return null;
    }
  };

  return renderRoof();
};

export default React.memo(RoofRenderer);
