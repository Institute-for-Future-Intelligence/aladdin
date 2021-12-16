/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Menu } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import i18n from '../../../i18n/i18n';
import { PolygonModel } from '../../../models/PolygonModel';
import { UndoableChange } from '../../../undo/UndoableChange';
import { Point2 } from '../../../models/Point2';

export const PolygonVertexMenu = () => {
  const language = useStore(Selector.language);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const deletePolygonVertexByIndex = useStore(Selector.deletePolygonVertexByIndex);
  const insertPolygonVertexAfterIndex = useStore(Selector.insertPolygonVertexAfterIndex);
  const updatePolygonVerticesById = useStore(Selector.updatePolygonVerticeById);
  const addUndoable = useStore(Selector.addUndoable);

  const polygon = getSelectedElement() as PolygonModel;
  const lang = { lng: language };

  const insertVertex = () => {
    changeVertex(true);
  };

  const deleteVertex = () => {
    changeVertex(false);
  };

  const changeVertex = (insert: boolean) => {
    if (polygon && polygon.selectedIndex >= 0) {
      const oldVertices = [...polygon.vertices];
      if (insert) {
        insertPolygonVertexAfterIndex(polygon.id, polygon.selectedIndex);
      } else {
        deletePolygonVertexByIndex(polygon.id, polygon.selectedIndex);
      }
      const newVertices = [...(useStore.getState().getSelectedElement() as PolygonModel).vertices];
      const undoableChange = {
        name: 'Delete Vertex of Polygon',
        timestamp: Date.now(),
        oldValue: oldVertices,
        newValue: newVertices,
        undo: () => {
          if (undoableChange.oldValue && Array.isArray(undoableChange.oldValue)) {
            updatePolygonVerticesById(polygon.id, oldVertices as Point2[]);
          }
        },
        redo: () => {
          updatePolygonVerticesById(polygon.id, newVertices as Point2[]);
        },
      } as UndoableChange;
      addUndoable(undoableChange);
    }
  };

  return (
    <>
      <Menu.Item key={'polygon-vertex-insert'} onClick={insertVertex}>
        {i18n.t('polygonMenu.InsertVertex', lang)}
      </Menu.Item>
      {polygon && polygon.vertices.length > 3 && (
        <Menu.Item key={'polygon-vertex-delete'} onClick={deleteVertex}>
          {i18n.t('polygonMenu.DeleteVertex', lang)}
        </Menu.Item>
      )}
    </>
  );
};
