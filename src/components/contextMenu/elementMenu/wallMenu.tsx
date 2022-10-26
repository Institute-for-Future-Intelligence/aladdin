/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Menu, Modal, Radio } from 'antd';
import SubMenu from 'antd/lib/menu/SubMenu';
import { CommonStoreState, useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Copy, Cut, Lock, Paste } from '../menuItems';
import i18n from '../../../i18n/i18n';
import WallTextureSelection from './wallTextureSelection';
import WallOpacityInput from './wallOpacityInput';
import WallThicknessInput from './wallThicknessInput';
import WallBodyColorSelection from './wallColorSelection';
import { WallModel, WallStructure } from 'src/models/WallModel';
import { ObjectType, WallTexture } from 'src/types';
import { ElementCounter } from '../../../stores/ElementCounter';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { UndoableRemoveAllChildren } from '../../../undo/UndoableRemoveAllChildren';
import { Util } from 'src/Util';
import WallHeightInput from './wallHeightInput';
import { UndoableChange } from 'src/undo/UndoableChange';
import WallStudSpacingInput from './wallStudSpacingInput';
import WallStudWidthInput from './wallStudWidthInput';
import WallStudColorSelection from './wallStudColorSelection';

const getSelectedWall = (state: CommonStoreState) => {
  for (const el of state.elements) {
    if (el.selected && el.type === ObjectType.Wall) {
      return el as WallModel;
    }
  }
  return null;
};

export const WallMenu = () => {
  const wall = useStore(getSelectedWall);

  const language = useStore(Selector.language);
  const setCommonStore = useStore(Selector.set);
  const setApplyCount = useStore(Selector.setApplyCount);
  const countAllOffspringsByType = useStore(Selector.countAllOffspringsByTypeAtOnce);
  const removeAllChildElementsByType = useStore(Selector.removeAllChildElementsByType);
  const addUndoable = useStore(Selector.addUndoable);
  const updateWallStructureById = useStore(Selector.updateWallStructureById);

  const [textureDialogVisible, setTextureDialogVisible] = useState(false);
  const [colorDialogVisible, setColorDialogVisible] = useState(false);
  const [heightDialogVisible, setHeightDialogVisible] = useState(false);
  const [opacityDialogVisible, setOpacityDialogVisible] = useState(false);
  const [structureSpacingDialogVisible, setStructureSpacingDialogVisible] = useState(false);
  const [structureWidthDialogVisible, setStructureWidthDialogVisible] = useState(false);
  const [structureColorDialogVisible, setStructureColorDialogVisible] = useState(false);
  const [thicknessDialogVisible, setThicknessDialogVisible] = useState(false);

  const lang = { lng: language };
  const paddingLeft = '36px';

  const legalToPaste = () => {
    const elementsToPaste = useStore.getState().elementsToPaste;
    if (elementsToPaste && elementsToPaste.length > 0) {
      const e = elementsToPaste[0];
      if (Util.isLegalOnWall(e.type)) {
        return true;
      }
    }
    return false;
  };

  const handleClearOk = (objectType: ObjectType) => {
    if (wall) {
      const removed = useStore
        .getState()
        .elements.filter((e) => !e.locked && e.type === objectType && e.parentId === wall.id);
      removeAllChildElementsByType(wall.id, objectType);
      const removedElements = JSON.parse(JSON.stringify(removed));
      const undoableRemoveAllWindowChildren = {
        name: `Remove All ${objectType}s on Wall`,
        timestamp: Date.now(),
        parentId: wall.id,
        removedElements: removedElements,
        undo: () => {
          setCommonStore((state) => {
            state.elements.push(...undoableRemoveAllWindowChildren.removedElements);
          });
        },
        redo: () => {
          removeAllChildElementsByType(undoableRemoveAllWindowChildren.parentId, objectType);
        },
      } as UndoableRemoveAllChildren;
      addUndoable(undoableRemoveAllWindowChildren);
    }
  };

  const radioStyle = {
    display: 'block',
    height: '30px',
    paddingLeft: '10px',
    lineHeight: '30px',
  };

  const renderCopy = () => <Copy keyName={'wall-copy'} />;

  const renderLock = () => <Lock keyName={'wall-lock'} />;

  const renderCut = () => {
    if (!wall || wall.locked) {
      return null;
    }
    return <Cut keyName={'wall-cut'} />;
  };

  const renderPaste = () => {
    if (!legalToPaste()) {
      return null;
    }
    return <Paste keyName={'wall-paste'} />;
  };

  const renderSturctureSubMenu = () => {
    if (!wall) {
      return null;
    }
    return (
      <SubMenu key={'wall-structure'} title={i18n.t('wallMenu.WallStructure', lang)} style={{ paddingLeft: '24px' }}>
        <Radio.Group
          value={wall.wallStructure ?? WallStructure.Default}
          style={{ height: '75px' }}
          onChange={(e) => {
            const undoableChange = {
              name: 'Select Wall Structure',
              timestamp: Date.now(),
              oldValue: wall.wallStructure,
              newValue: e.target.value,
              changedElementId: wall.id,
              changedElementType: wall.type,
              undo: () => {
                updateWallStructureById(undoableChange.changedElementId, undoableChange.oldValue as WallStructure);
              },
              redo: () => {
                updateWallStructureById(undoableChange.changedElementId, undoableChange.newValue as WallStructure);
              },
            } as UndoableChange;
            addUndoable(undoableChange);
            updateWallStructureById(wall.id, e.target.value);
          }}
        >
          <Radio style={radioStyle} value={WallStructure.Default}>
            {i18n.t('wallMenu.DefaultStructure', lang)}
          </Radio>
          <Radio style={radioStyle} value={WallStructure.Stud}>
            {i18n.t('wallMenu.StudStructure', lang)}
          </Radio>
          <Radio style={radioStyle} value={WallStructure.Pillar}>
            {i18n.t('wallMenu.PillarStructure', lang)}
          </Radio>
        </Radio.Group>
      </SubMenu>
    );
  };

  const renderStructureItems = () => {
    if (wall?.wallStructure === WallStructure.Stud || wall?.wallStructure === WallStructure.Pillar) {
      return (
        <>
          {renderMenuItem('wallMenu.StructureSpacing', setStructureSpacingDialogVisible)}

          {renderMenuItem('wallMenu.StructureWidth', setStructureWidthDialogVisible)}

          {renderMenuItem('wallMenu.StructureColor', setStructureColorDialogVisible)}

          {renderMenuItem('wallMenu.Opacity', setOpacityDialogVisible)}
        </>
      );
    }
    return null;
  };

  const renderMenuItem = (i18nText: string, setDialogVisible: (b: boolean) => void) => {
    return (
      <Menu.Item
        key={`wall-${i18nText}`}
        style={{ paddingLeft: paddingLeft }}
        onClick={() => {
          setApplyCount(0);
          setDialogVisible(true);
        }}
      >
        {i18n.t(i18nText, lang)} ...
      </Menu.Item>
    );
  };

  const renderTexture = () => {
    if (wall?.wallStructure === WallStructure.Default) {
      return renderMenuItem('word.Texture', setTextureDialogVisible);
    }
    return null;
  };

  const renderWallColor = () => {
    if (
      (wall?.wallStructure === WallStructure.Default || wall?.opacity === undefined || wall?.opacity > 0) &&
      (wall?.textureType === WallTexture.NoTexture || wall?.textureType === WallTexture.Default)
    ) {
      return renderMenuItem('wallMenu.WallColor', setColorDialogVisible);
    }
    return null;
  };

  const renderClearItem = (objectType: ObjectType, count: number) => {
    if (count === 0) return null;

    const titleText = (type: string, count: number) =>
      `${i18n.t(`wallMenu.DoYouReallyWantToRemoveAll${type}sOnThisWall`, lang)} (${count} ${i18n.t(
        `wallMenu.${type}s`,
        lang,
      )})?`;

    const objectTypeText = objectType.replaceAll(' ', '');

    return (
      <Menu.Item
        key={`remove-all-${objectTypeText}s-on-wall`}
        onClick={() => {
          Modal.confirm({
            title: titleText(objectTypeText, count),
            icon: <ExclamationCircleOutlined />,
            onOk: () => {
              handleClearOk(objectType);
            },
          });
        }}
      >
        {i18n.t(`wallMenu.RemoveAllUnlocked${objectTypeText}s`, lang)} ({count})
      </Menu.Item>
    );
  };

  const renderClearSubMenu = () => {
    const counter = wall ? countAllOffspringsByType(wall.id) : new ElementCounter();

    if (counter.gotSome() && useStore.getState().contextMenuObjectType) {
      return (
        <SubMenu key={'clear'} title={i18n.t('word.Clear', lang)} style={{ paddingLeft: '24px' }}>
          {renderClearItem(ObjectType.Window, counter.windowCount)}
          {renderClearItem(ObjectType.Door, counter.doorCount)}
          {renderClearItem(ObjectType.SolarPanel, counter.solarPanelCount)}
        </SubMenu>
      );
    }
    return null;
  };

  const renderDialogs = () => {
    return (
      <>
        {opacityDialogVisible && <WallOpacityInput setDialogVisible={setOpacityDialogVisible} />}
        {structureColorDialogVisible && <WallStudColorSelection setDialogVisible={setStructureColorDialogVisible} />}
        {structureSpacingDialogVisible && <WallStudSpacingInput setDialogVisible={setStructureSpacingDialogVisible} />}
        {structureWidthDialogVisible && <WallStudWidthInput setDialogVisible={setStructureWidthDialogVisible} />}
        {thicknessDialogVisible && <WallThicknessInput setDialogVisible={setThicknessDialogVisible} />}
        {heightDialogVisible && <WallHeightInput setDialogVisible={setHeightDialogVisible} />}
        {textureDialogVisible && <WallTextureSelection setDialogVisible={setTextureDialogVisible} />}
        {colorDialogVisible && <WallBodyColorSelection setDialogVisible={setColorDialogVisible} />}
      </>
    );
  };

  if (!wall) return null;

  return (
    <Menu.ItemGroup>
      {renderCut()}

      {renderCopy()}

      {renderPaste()}

      {renderLock()}

      {!wall.locked && (
        <>
          {renderDialogs()}

          {renderSturctureSubMenu()}

          {renderStructureItems()}

          {renderMenuItem('word.Thickness', setThicknessDialogVisible)}

          {renderMenuItem('word.Height', setHeightDialogVisible)}

          {renderTexture()}

          {renderWallColor()}

          {renderClearSubMenu()}
        </>
      )}
    </Menu.ItemGroup>
  );
};
