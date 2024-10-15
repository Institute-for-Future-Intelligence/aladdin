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
import { HIGHLIGHT_HANDLE_COLOR } from 'src/constants';
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
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { SharedUtil } from '../SharedUtil';
import { BuildingParts } from 'src/models/FoundationModel';

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

const addUndoableAddRooftopElement = (elem: ElementModel) => {
  const undoableAdd = {
    name: `Add ${elem.type} on Roof`,
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
      if (intersection.object.name.includes('Flat roof')) {
        return intersection.point.clone().setZ(intersection.point.z - 0.01);
      } else {
        return intersection.point;
      }
    }
  }
  return e.intersections[0].point;
};

const handleAddElementOnRoof = (
  e: ThreeEvent<PointerEvent>,
  foundationId: string,
  roofId: string,
  roofSegments: RoofSegmentProps[],
  ridgeMidPoint: Vector3,
) => {
  if (e.intersections.length === 0) return;

  const objectTypeToAdd = useStore.getState().objectTypeToAdd;
  if (objectTypeToAdd === ObjectType.None) return;

  const roof = useStore.getState().getElementById(roofId);
  const foundation = useStore.getState().getElementById(foundationId);
  if (!roof || !foundation) return;

  const pointer = getPointerOnRoof(e);
  const posRelToFoundation = new Vector3()
    .subVectors(pointer, new Vector3(foundation.cx, foundation.cy, foundation.lz / 2))
    .applyEuler(new Euler(0, 0, -foundation.rotation[2]));
  const posRelToCentroid = posRelToFoundation.clone().sub(ridgeMidPoint);

  switch (objectTypeToAdd) {
    case ObjectType.SolarPanel: {
      const { normal, rotation } = RoofUtil.computeState(roofSegments, posRelToCentroid);
      const actionState = useStore.getState().actionState;
      const newElement = ElementModelFactory.makeSolarPanel(
        roof,
        useStore.getState().getPvModule(actionState.solarPanelModelName ?? 'SPR-X21-335-BLK'),
        posRelToFoundation.x,
        posRelToFoundation.y,
        posRelToFoundation.z,
        actionState.solarPanelOrientation ?? Orientation.landscape,
        actionState.solarPanelPoleHeight ?? 1,
        actionState.solarPanelPoleSpacing ?? 3,
        actionState.solarPanelTiltAngle ?? 0,
        actionState.solarPanelRelativeAzimuth ?? 0,
        normal,
        rotation ?? [0, 0, 1],
        actionState.solarPanelFrameColor,
      );
      useStore.getState().set((state) => {
        state.elements.push(newElement);
        state.selectedElementIdSet.clear();
        state.selectedElementIdSet.add(newElement.id);
        if (!state.actionModeLock) state.objectTypeToAdd = ObjectType.None;
      });
      addUndoableAddRooftopElement(newElement);
      break;
    }
    case ObjectType.WaterHeater: {
      const { normal, rotation } = RoofUtil.computeState(roofSegments, posRelToCentroid);
      const actionState = useStore.getState().actionState;
      const newElement = ElementModelFactory.makeWaterHeater(
        roof,
        posRelToFoundation.x,
        posRelToFoundation.y,
        posRelToFoundation.z,
        normal,
        rotation ?? [0, 0, 1],
      );
      useStore.getState().set((state) => {
        state.elements.push(newElement);
        state.selectedElementIdSet.clear();
        state.selectedElementIdSet.add(newElement.id);
        if (!state.actionModeLock) state.objectTypeToAdd = ObjectType.None;
      });
      addUndoableAddRooftopElement(newElement);
      break;
    }
    case ObjectType.Window: {
      const { normal, rotation } = RoofUtil.computeState(roofSegments, posRelToCentroid);
      const newElement = ElementModelFactory.makeWindow(
        roof,
        posRelToFoundation.x,
        posRelToFoundation.y,
        posRelToFoundation.z,
        ObjectType.Roof,
        rotation,
        0.5,
        0.5,
      );
      useStore.getState().set((state) => {
        state.elements.push(newElement);
        state.selectedElementIdSet.clear();
        state.selectedElementIdSet.add(newElement.id);
        if (!state.actionModeLock) state.objectTypeToAdd = ObjectType.None;
      });
      addUndoableAddRooftopElement(newElement);

      break;
    }
    case ObjectType.Sensor: {
      const { normal, rotation } = RoofUtil.computeState(roofSegments, posRelToCentroid);
      const newElement = ElementModelFactory.makeSensor(
        roof,
        posRelToFoundation.x / foundation.lx,
        posRelToFoundation.y / foundation.ly,
        posRelToFoundation.z,
        normal,
        rotation ?? [0, 0, 1],
      );
      useStore.getState().set((state) => {
        state.elements.push(newElement);
        state.selectedElementIdSet.clear();
        state.selectedElementIdSet.add(newElement.id);
        if (!state.actionModeLock) state.objectTypeToAdd = ObjectType.None;
      });
      addUndoableAddRooftopElement(newElement);

      break;
    }
    case ObjectType.Light: {
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
        posRelToFoundation.z,
        normal,
        rotation ?? [0, 0, 1],
      );
      useStore.getState().set((state) => {
        state.elements.push(newElement);
        state.selectedElementIdSet.clear();
        state.selectedElementIdSet.add(newElement.id);
        if (!state.actionModeLock) state.objectTypeToAdd = ObjectType.None;
      });
      addUndoableAddRooftopElement(newElement);

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
      state.contextMenuObjectType = null;
      if (state.groupActionMode) {
        if (!state.multiSelectionsMode) {
          state.selectedElementIdSet.clear();
        }
        if (state.selectedElementIdSet.has(foundationId)) {
          state.selectedElementIdSet.delete(foundationId);
        } else {
          state.selectedElementIdSet.add(foundationId);
        }
      } else {
        for (const e of state.elements) {
          if (e.id === id) {
            e.selected = true;
            state.selectedElement = e;
            if (state.multiSelectionsMode) {
              if (state.selectedElementIdSet.has(id)) {
                state.selectedElementIdSet.delete(id);
              } else {
                state.selectedElementIdSet.add(id);
              }
            } else {
              state.selectedElementIdSet.clear();
              state.selectedElementIdSet.add(id);
            }
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
      useStore.getState().updateRoofRiseById(undoable.resizedElementId, undoable.oldRise, 0);
    },
    redo: () => {
      useStore.getState().updateRoofRiseById(undoable.resizedElementId, undoable.newRise, 0);
    },
  } as UndoableResizeRoofRise;
  useStore.getState().addUndoable(undoable);
};

export const spBoundaryCheck = (solarPanelVertices: Vector3[], wallVertices: Point2[]) => {
  const lang = { lng: useStore.getState().language };
  if (RoofUtil.rooftopElementBoundaryCheck(solarPanelVertices, wallVertices)) {
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
  isFlatGambrel?: boolean,
) => {
  if (foundation === null) return;
  useStore.getState().set((state) => {
    if (foundation === null) return;
    for (const e of state.elements) {
      if (e.parentId === roofId && e.foundationId) {
        if (e.type === ObjectType.SolarPanel) {
          const posRelToFoundation = new Vector3(e.cx, e.cy, e.cz);
          const posRelToCentroid = posRelToFoundation.clone().sub(centroid);
          const { segmentVertices, normal, rotation } = RoofUtil.computeState(
            roofSegments,
            posRelToCentroid,
            isFlatGambrel,
          );
          let z;
          if (segmentVertices) {
            z = RoofUtil.getRooftopElementZ(segmentVertices, posRelToCentroid, h + thickness);
          } else {
            z = h + thickness;
          }
          if (normal && rotation && z !== undefined) {
            e.normal = normal.toArray();
            e.rotation = [...rotation];
            e.cz = z + foundation.lz / 2;
          }
        } else if (e.type === ObjectType.Window) {
          const posRelToFoundation = new Vector3(e.cx, e.cy, e.cz + foundation.lz);
          const posRelToCentroid = posRelToFoundation.clone().sub(centroid);
          const { segmentVertices, normal, rotation } = RoofUtil.computeState(
            roofSegments,
            posRelToCentroid,
            isFlatGambrel,
          );
          let z;
          if (segmentVertices) {
            z = RoofUtil.getRooftopElementZ(segmentVertices, posRelToCentroid, h + thickness);
          } else {
            z = h + thickness;
          }
          if (normal && rotation && z !== undefined) {
            e.rotation = [...rotation];
            e.cz = z;
          }
        } else if (e.type === ObjectType.Sensor || e.type === ObjectType.Light) {
          const posRelToFoundation = new Vector3(e.cx * foundation.lx, e.cy * foundation.ly, e.cz + foundation.lz);
          const posRelToCentroid = posRelToFoundation.clone().sub(centroid);
          const { segmentVertices, normal, rotation } = RoofUtil.computeState(
            roofSegments,
            posRelToCentroid,
            isFlatGambrel,
          );
          let z;
          if (segmentVertices) {
            z = RoofUtil.getRooftopElementZ(segmentVertices, posRelToCentroid, h + thickness);
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
  foundationId: string,
  roofId: string,
  roofSegments: RoofSegmentProps[],
  centroid: Vector3,
) => {
  if (e.button === 2) return;
  // click on child
  if (e.intersections[0].eventObject.name !== e.eventObject.name) {
  }
  // click on roof body
  else {
    handleRoofBodyPointerDown(e, roofId, foundationId);
    handleAddElementOnRoof(e, foundationId, roofId, roofSegments, centroid);
  }
};

export const handlePointerUp = (event: ThreeEvent<PointerEvent>, roofModel: RoofModel) => {
  const selectedElement = useStore.getState().selectedElement;
  if (!selectedElement || !RoofUtil.isValidOnRoof(selectedElement)) return;

  const element = useStore.getState().getElementById(selectedElement.id);
  if (element && useStore.getState().moveHandleType) {
    const intersections = SharedUtil.getIntersectionObjects(event);
    const isFirstIntersectedRoof = intersections[0].eventObject.userData.roofId === roofModel.id;
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
              SharedUtil.undoInvalidOperation();
            } else {
              SharedUtil.addUndoableMove();
            }
            break;
          }
          case ObjectType.Sensor:
            SharedUtil.addUndoableMove();
            break;
          case ObjectType.Light:
            SharedUtil.addUndoableMove();
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
        const intersectionObjects = SharedUtil.getIntersectionObjects(event);
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

          // right click on selected element
          if (state.selectedElementIdSet.has(id)) {
            // de-select other type of elements
            for (const elem of state.elements) {
              if (state.selectedElementIdSet.has(elem.id) && elem.type !== state.selectedElement.type) {
                state.selectedElementIdSet.delete(elem.id);
              }
            }
          }
          // right click on new element
          else {
            if (state.multiSelectionsMode) {
              state.selectedElementIdSet.add(id);
              for (const elem of state.elements) {
                if (state.selectedElementIdSet.has(elem.id) && elem.type !== state.selectedElement.type) {
                  state.selectedElementIdSet.delete(elem.id);
                }
              }
            } else {
              state.selectedElementIdSet.clear();
              state.selectedElementIdSet.add(id);
            }
          }
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
  const haveFiredEvent = useRef(false);
  const handleRef = useRef<Mesh>(null);

  const [color, setColor] = useState('white');

  const setHeightLight = (b: boolean) => {
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
        haveFiredEvent.current = true;
      }

      if (!hoveredRef.current && pointerDownRef.current) {
        setHeightLight(false);
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
          haveFiredEvent.current = false;
          if (!hoveredRef.current) {
            hoveredRef.current = true;
            setHeightLight(true);
          }
        } else {
          setColor('white');
        }
      }}
      // this will fire once after pointerup when hovered
      onPointerOut={(e) => {
        if (haveFiredEvent.current) {
          return;
        }
        if (!pointerDownRef.current) {
          if (e.intersections.length > 0 && e.intersections[0].eventObject.name === 'Roof Handle') {
            setColor('white');
          } else {
            setHeightLight(false);
          }
        }
        hoveredRef.current = false;
        setCommonStore((state) => {
          state.hoveredHandle = null;
        });
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

export interface RoofRendererProps extends BuildingParts {
  roofModel: RoofModel;
}

const RoofRenderer = ({ roofModel, foundationModel }: RoofRendererProps) => {
  const removeElementById = useStore(Selector.removeElementById);

  const { id, wallsId, roofType } = roofModel;

  useEffect(() => {
    if (wallsId.length === 0) {
      removeElementById(id, false);
    }
  }, [wallsId]);

  const renderRoof = () => {
    switch (roofType) {
      case RoofType.Pyramid:
        return <PyramidRoof roofModel={roofModel as PyramidRoofModel} foundationModel={foundationModel} />;
      case RoofType.Gable:
        return <GableRoof roofModel={roofModel as GableRoofModel} foundationModel={foundationModel} />;
      case RoofType.Hip:
        return <HipRoof roofModel={roofModel as HipRoofModel} foundationModel={foundationModel} />;
      case RoofType.Gambrel:
        return <GambrelRoof roofModel={roofModel as GambrelRoofModel} foundationModel={foundationModel} />;
      case RoofType.Mansard:
        return <MansardRoof roofModel={roofModel as MansardRoofModel} foundationModel={foundationModel} />;
      default:
        return null;
    }
  };

  return renderRoof();
};

export function areRoofsEqual(prev: RoofRendererProps, curr: RoofRendererProps) {
  return (
    prev.roofModel === curr.roofModel &&
    prev.foundationModel.lx === curr.foundationModel.lx &&
    prev.foundationModel.ly === curr.foundationModel.ly &&
    prev.foundationModel.lz === curr.foundationModel.lz
  );
}

export default React.memo(RoofRenderer, areRoofsEqual);
