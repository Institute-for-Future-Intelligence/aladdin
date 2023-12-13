/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { MenuProps } from 'antd';
import { CommonStoreState, useStore } from '../../../stores/common';
import i18n from '../../../i18n/i18n';
import { PolygonModel } from '../../../models/PolygonModel';
import { UndoableChange } from '../../../undo/UndoableChange';
import { Point2 } from '../../../models/Point2';
import { ObjectType, PolygonVertexAction } from '../../../types';
import { ElementModel } from 'src/models/ElementModel';
import { MenuItem } from '../menuItems';

const deletePolygonVertexByIndex = (id: string, index: number) => {
  useStore.getState().set((state: CommonStoreState) => {
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
  useStore.getState().set((state: CommonStoreState) => {
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
  useStore.getState().set((state: CommonStoreState) => {
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

const changeVertex = (polygon: PolygonModel, action: PolygonVertexAction) => {
  if (polygon.selectedIndex >= 0) {
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
          useStore.getState().updatePolygonVerticesById(undoableChange.changedElementId, oldVertices as Point2[]);
        }
      },
      redo: () => {
        useStore.getState().updatePolygonVerticesById(undoableChange.changedElementId, newVertices as Point2[]);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
  }
};

export const createPolygonVertexMenu = (selectedElement: ElementModel) => {
  const items: MenuProps['items'] = [];

  if (selectedElement.type !== ObjectType.Polygon) return { items };

  const polygon = selectedElement as PolygonModel;

  const lang = { lng: useStore.getState().language };

  items.push(
    {
      key: 'polygon-vertex-insert-before-index',
      label: <MenuItem noPadding>{i18n.t('polygonMenu.InsertVertexBeforeIndex', lang)}</MenuItem>,
    },
    {
      key: 'polygon-vertex-insert-after-index',
      label: <MenuItem noPadding>{i18n.t('polygonMenu.InsertVertexAfterIndex', lang)}</MenuItem>,
    },
  );

  if (polygon.vertices.length > 3) {
    items.push({
      key: 'polygon-vertex-delete',
      label: <MenuItem noPadding>{i18n.t('polygonMenu.DeleteVertex', lang)}</MenuItem>,
    });
  }

  const handleClick: MenuProps['onClick'] = ({ key }) => {
    switch (key) {
      case 'polygon-vertex-insert-before-index':
        changeVertex(polygon, PolygonVertexAction.InsertBeforeIndex);
        break;
      case 'polygon-vertex-insert-after-index':
        changeVertex(polygon, PolygonVertexAction.InsertAfterIndex);
        break;
      case 'polygon-vertex-delete':
        changeVertex(polygon, PolygonVertexAction.Delete);
        break;
    }
  };

  return { items, onClick: handleClick } as MenuProps;
};
