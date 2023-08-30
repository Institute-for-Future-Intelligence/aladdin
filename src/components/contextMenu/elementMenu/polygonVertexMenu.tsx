/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Menu } from 'antd';
import { CommonStoreState, useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import i18n from '../../../i18n/i18n';
import { PolygonModel } from '../../../models/PolygonModel';
import { UndoableChange } from '../../../undo/UndoableChange';
import { Point2 } from '../../../models/Point2';
import { ObjectType, PolygonVertexAction } from '../../../types';
import { useSelectedElement } from './menuHooks';

export const PolygonVertexMenu = React.memo(() => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const polygon = useSelectedElement(ObjectType.Polygon) as PolygonModel | undefined;
  const updatePolygonVerticesById = useStore(Selector.updatePolygonVerticesById);
  const addUndoable = useStore(Selector.addUndoable);

  if (!polygon || polygon.selectedIndex < 0) return null;

  const lang = { lng: language };

  const deletePolygonVertexByIndex = (id: string, index: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Polygon && e.id === id) {
          const p = e as PolygonModel;
          p.vertices.splice(index, 1);
          break;
        }
      }
    });
  };

  const insertPolygonVertexBeforeIndex = (id: string, index: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Polygon && e.id === id) {
          const p = e as PolygonModel;
          const n = p.vertices.length;
          if (index > 0 && index < n) {
            const newX = 0.5 * (p.vertices[index].x + p.vertices[index - 1].x);
            const newY = 0.5 * (p.vertices[index].y + p.vertices[index - 1].y);
            p.vertices.splice(index, 0, { x: newX, y: newY } as Point2);
          } else if (index === 0) {
            const newX = 0.5 * (p.vertices[index].x + p.vertices[n - 1].x);
            const newY = 0.5 * (p.vertices[index].y + p.vertices[n - 1].y);
            p.vertices.splice(n, 0, { x: newX, y: newY } as Point2);
          }
          break;
        }
      }
    });
  };

  const insertPolygonVertexAfterIndex = (id: string, index: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Polygon && e.id === id) {
          const p = e as PolygonModel;
          const n = p.vertices.length;
          if (index >= 0 && index < n - 1) {
            const newX = 0.5 * (p.vertices[index].x + p.vertices[index + 1].x);
            const newY = 0.5 * (p.vertices[index].y + p.vertices[index + 1].y);
            p.vertices.splice(index + 1, 0, { x: newX, y: newY } as Point2);
          } else if (index === n - 1) {
            const newX = 0.5 * (p.vertices[index].x + p.vertices[0].x);
            const newY = 0.5 * (p.vertices[index].y + p.vertices[0].y);
            p.vertices.splice(n, 0, { x: newX, y: newY } as Point2);
          }
          break;
        }
      }
    });
  };

  const insertVertexBeforeIndex = () => {
    changeVertex(PolygonVertexAction.InsertBeforeIndex);
  };

  const insertVertexAfterIndex = () => {
    changeVertex(PolygonVertexAction.InsertAfterIndex);
  };

  const deleteVertex = () => {
    changeVertex(PolygonVertexAction.Delete);
  };

  const changeVertex = (action: PolygonVertexAction) => {
    if (polygon && polygon.selectedIndex >= 0) {
      const oldVertices = polygon.vertices.map((v) => ({ ...v })); // deep copy
      switch (action) {
        case PolygonVertexAction.Delete:
          deletePolygonVertexByIndex(polygon.id, polygon.selectedIndex);
          break;
        case PolygonVertexAction.InsertBeforeIndex:
          insertPolygonVertexBeforeIndex(polygon.id, polygon.selectedIndex);
          break;
        case PolygonVertexAction.InsertAfterIndex:
          insertPolygonVertexAfterIndex(polygon.id, polygon.selectedIndex);
          break;
      }
      const newVertices = (useStore.getState().getElementById(polygon.id) as PolygonModel).vertices.map((v) => ({
        ...v,
      }));
      const undoableChange = {
        name: action,
        timestamp: Date.now(),
        changedElementId: polygon.id,
        changedElementType: polygon.type,
        oldValue: oldVertices,
        newValue: newVertices,
        undo: () => {
          if (undoableChange.oldValue && Array.isArray(undoableChange.oldValue)) {
            updatePolygonVerticesById(undoableChange.changedElementId, oldVertices as Point2[]);
          }
        },
        redo: () => {
          updatePolygonVerticesById(undoableChange.changedElementId, newVertices as Point2[]);
        },
      } as UndoableChange;
      addUndoable(undoableChange);
    }
  };

  return (
    <>
      <Menu.Item key={'polygon-vertex-insert-before-index'} onClick={insertVertexBeforeIndex}>
        {i18n.t('polygonMenu.InsertVertexBeforeIndex', lang)}
      </Menu.Item>
      <Menu.Item key={'polygon-vertex-insert-after-index'} onClick={insertVertexAfterIndex}>
        {i18n.t('polygonMenu.InsertVertexAfterIndex', lang)}
      </Menu.Item>
      {polygon && polygon.vertices.length > 3 && (
        <Menu.Item key={'polygon-vertex-delete'} onClick={deleteVertex}>
          {i18n.t('polygonMenu.DeleteVertex', lang)}
        </Menu.Item>
      )}
    </>
  );
});
