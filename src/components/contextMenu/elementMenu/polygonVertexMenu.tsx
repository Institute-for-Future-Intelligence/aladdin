/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Menu } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import i18n from '../../../i18n/i18n';
import { PolygonModel } from '../../../models/PolygonModel';

export const PolygonVertexMenu = () => {
  const language = useStore(Selector.language);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const deletePolygonVertexByIndex = useStore(Selector.deletePolygonVertexByIndex);
  const insertPolygonVertexAfterIndex = useStore(Selector.insertPolygonVertexAfterIndex);
  const addUndoable = useStore(Selector.addUndoable);

  const polygon = getSelectedElement() as PolygonModel;
  const lang = { lng: language };

  const deleteVertex = () => {
    if (polygon && polygon.selectedIndex >= 0) {
      deletePolygonVertexByIndex(polygon.id, polygon.selectedIndex);
    }
  };

  const insertVertex = () => {
    if (polygon && polygon.selectedIndex >= 0) {
      insertPolygonVertexAfterIndex(polygon.id, polygon.selectedIndex);
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
