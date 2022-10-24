/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect } from 'react';
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
import { UndoableResizeRoofHeight } from 'src/undo/UndoableResize';
import MansardRoof from './mansardRoof';
import { Euler, Vector3 } from 'three';
import { ObjectType, Orientation } from 'src/types';
import { ThreeEvent } from '@react-three/fiber';
import { WallModel } from 'src/models/WallModel';
import { LOCKED_ELEMENT_SELECTION_COLOR } from 'src/constants';
import { Point2 } from 'src/models/Point2';
import { showError } from 'src/helpers';
import i18n from 'src/i18n/i18n';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { ElementModel } from 'src/models/ElementModel';
import { RoofUtil } from './RoofUtil';
import { ElementModelFactory } from 'src/models/ElementModelFactory';
import { UndoableAdd } from 'src/undo/UndoableAdd';

export interface ConvexGeoProps {
  points: Vector3[];
  direction: number;
  length: number;
}

export interface RoofWireframeProps {
  roofSegments: ConvexGeoProps[];
  thickness: number;
  lineWidth: number;
  lineColor: string;
}

const addUndoableAddSP = (elem: ElementModel) => {
  const undoableAdd = {
    name: 'Add Solar Panel On Roof',
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

const getPointerOnRoof = (e: ThreeEvent<PointerEvent>, roofType: RoofType) => {
  for (const intersection of e.intersections) {
    if (intersection.eventObject.name === `${roofType} Roof Segments Group`) {
      return intersection.point;
    }
  }
  return e.intersections[0].point;
};

const handlAddElementOnRoof = (
  e: ThreeEvent<PointerEvent>,
  roofId: string,
  foundation: ElementModel,
  roofSegments: ConvexGeoProps[],
  ridgeMidPoint: Vector3,
) => {
  switch (useStore.getState().objectTypeToAdd) {
    case ObjectType.SolarPanel:
      const roof = useStore.getState().getElementById(roofId);
      if (roof && foundation && e.intersections[0]) {
        const pointer = e.intersections[0].point;
        const posRelToFoundation = new Vector3()
          .subVectors(pointer, new Vector3(foundation.cx, foundation.cy))
          .applyEuler(new Euler(0, 0, -foundation.rotation[2]));
        const posRelToCentroid = posRelToFoundation.clone().sub(ridgeMidPoint);

        const { normal, rotation } = RoofUtil.computeState(roofSegments, posRelToCentroid);
        const newElement = ElementModelFactory.makeSolarPanel(
          roof,
          useStore.getState().getPvModule('SPR-X21-335-BLK'),
          posRelToFoundation.x / foundation.lx,
          posRelToFoundation.y / foundation.ly,
          posRelToFoundation.z - foundation.lz,
          Orientation.landscape,
          normal,
          rotation ?? [0, 0, 1],
          undefined,
          undefined,
          ObjectType.Roof,
        );
        useStore.getState().set((state) => {
          state.elements.push(newElement as ElementModel);
          state.objectTypeToAdd = ObjectType.None;
        });
        addUndoableAddSP(newElement);
      }
      break;
  }
};

export const handleRoofBodyPointerDown = (e: ThreeEvent<PointerEvent>, id: string, foundationId: string) => {
  if (useStore.getState().isAddingElement()) {
    return;
  }
  if (e.intersections.length > 0 && e.intersections[0].eventObject.name === e.eventObject.name) {
    e.stopPropagation();
    useStore.getState().set((state) => {
      if (state.groupActionMode) {
        for (const e of state.elements) {
          e.selected = e.id === foundationId;
        }
        state.elementGroupId = foundationId;
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

export const addUndoableResizeRoofHeight = (
  elemId: string,
  oldHeight: number,
  newHeight: number,
  oldRelativeHeight: number,
  newRelativeHeight: number,
  updateRelativeHeight: (h: number) => void,
) => {
  const undoable = {
    name: 'Resize Roof Height',
    timestamp: Date.now(),
    resizedElementId: elemId,
    resizedElementType: ObjectType.Roof,
    oldHeight: oldHeight,
    newHeight: newHeight,
    oldRelativeHeight: oldRelativeHeight,
    newRelativeHeight: newRelativeHeight,
    undo: () => {
      useStore.getState().updateRoofHeightById(undoable.resizedElementId, undoable.oldHeight);
      updateRelativeHeight(oldRelativeHeight);
    },
    redo: () => {
      useStore.getState().updateRoofHeightById(undoable.resizedElementId, undoable.newHeight);
      updateRelativeHeight(newRelativeHeight);
    },
  } as UndoableResizeRoofHeight;
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

export const updateRooftopSolarPanel = (
  foundation: ElementModel | null,
  roofId: string,
  roofSegments: ConvexGeoProps[],
  centroid: Vector3,
  h: number,
  thickness: number,
) => {
  useStore.getState().set((state) => {
    if (foundation === null) return;
    for (const e of state.elements) {
      if (e.type === ObjectType.SolarPanel && e.parentId === roofId && e.foundationId) {
        const posRelToFoundation = new Vector3(e.cx * foundation.lx, e.cy * foundation.ly, e.cz + foundation.lz);
        const posRelToCentroid = posRelToFoundation.clone().sub(centroid);
        const { segmentVertices, normal, rotation } = RoofUtil.computeState(roofSegments, posRelToCentroid);
        let z;
        if (segmentVertices) {
          z = RoofUtil.getSolarPanelZ(segmentVertices, posRelToCentroid, h + thickness);
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
  });
};

// handle pointer events
export const handlePointerDown = (
  e: ThreeEvent<PointerEvent>,
  roofId: string,
  foundation: ElementModel | null,
  roofSegments: ConvexGeoProps[],
  centroid: Vector3,
  setOldRefData: (elem: ElementModel) => void,
) => {
  if (!foundation) return;
  handlAddElementOnRoof(e, roofId, foundation, roofSegments, centroid);
  // click on child
  if (e.intersections[0].eventObject.name !== e.eventObject.name) {
    const selectedElement = useStore.getState().getSelectedElement();
    if (
      selectedElement &&
      selectedElement.id !== roofId &&
      selectedElement.type === ObjectType.SolarPanel &&
      selectedElement.parentId === roofId
    ) {
      setOldRefData(selectedElement);
    }
  }
  // click on roof body
  else {
    handleRoofBodyPointerDown(e, roofId, foundation.id);
  }
};

export const handlePointerUp = (
  grabRef: React.MutableRefObject<ElementModel | null>,
  foundation: ElementModel | null,
  wall: WallModel,
  roofId: string,
  overhang: number,
  undoMove: () => void,
  addUndoableMove: (sp: SolarPanelModel) => void,
) => {
  if (grabRef.current && useStore.getState().moveHandleType) {
    const sp = useStore.getState().getElementById(grabRef.current.id) as SolarPanelModel;
    if (sp && foundation) {
      const boundaryVertices = RoofUtil.getBoundaryVertices(roofId, wall, overhang);
      const solarPanelVertices = RoofUtil.getSolarPanelVerticesOnRoof(sp, foundation);
      if (
        !spBoundaryCheck(solarPanelVertices, boundaryVertices) ||
        !spCollisionCheck(sp, foundation, solarPanelVertices)
      ) {
        undoMove();
      } else {
        addUndoableMove(sp);
      }
    }
  }
  grabRef.current = null;
  useStore.getState().set((state) => {
    state.moveHandleType = null;
  });
};

export const handlePointerMove = (
  event: ThreeEvent<PointerEvent>,
  elem: ElementModel | null,
  foundation: ElementModel | null,
  roofType: RoofType,
  roofSegments: ConvexGeoProps[],
  centroid: Vector3,
) => {
  if (elem === null) {
    return;
  }
  switch (elem.type) {
    case ObjectType.SolarPanel:
      if (useStore.getState().moveHandleType) {
        if (foundation) {
          const pointer = getPointerOnRoof(event, roofType);
          const posRelToFoundation = new Vector3()
            .subVectors(pointer, new Vector3(foundation.cx, foundation.cy))
            .applyEuler(new Euler(0, 0, -foundation.rotation[2]));
          const posRelToCentroid = posRelToFoundation.clone().sub(centroid);

          const { normal, rotation } = RoofUtil.computeState(roofSegments, posRelToCentroid);
          useStore.getState().set((state) => {
            for (const e of state.elements) {
              if (e.id === elem.id) {
                e.cx = posRelToFoundation.x / foundation.lx;
                e.cy = posRelToFoundation.y / foundation.ly;
                e.cz = posRelToFoundation.z - foundation.lz;
                e.rotation = [...rotation];
                e.normal = normal.toArray();
                break;
              }
            }
          });
        }
      }
      break;
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

  if (props.thickness === undefined || props.overhang === undefined) {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          (e as RoofModel).thickness = props.thickness ?? 0.2;
          (e as RoofModel).overhang = props.overhang ?? 0.3;
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

export default RoofRenderer;
