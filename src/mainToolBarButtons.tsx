/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import FoundationImage from './resources/foundation.png';
import SolarPanelImage from './resources/solar-panel.png';
import ShadowImage from './resources/shadow.png';
import WallImage from './resources/wall.png';
import WindowImage from './resources/window.png';
import RoofImage from './resources/roof.png';

import React from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { Modal } from 'antd';
import 'antd/dist/antd.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCube,
  faEraser,
  faMousePointer,
  faSun,
  faTachometerAlt,
  faTree,
  faWalking,
} from '@fortawesome/free-solid-svg-icons';
import { ObjectType } from './types';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import i18n from './i18n/i18n';
import { UndoableRemoveAll } from './undo/UndoableRemoveAll';
import { UndoableCheck } from './undo/UndoableCheck';

const MainToolBarButtons = () => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const selectNone = useStore(Selector.selectNone);
  const showHeliodonPanel = useStore(Selector.viewState.showHeliodonPanel);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const clearContent = useStore(Selector.clearContent);
  const objectTypeToAdd = useStore(Selector.objectTypeToAdd);
  const addUndoable = useStore(Selector.addUndoable);

  const lang = { lng: language };

  const resetToSelectMode = () => {
    setCommonStore((state) => {
      state.objectTypeToAdd = ObjectType.None;
    });
  };

  const removeAllContent = () => {
    Modal.confirm({
      title: i18n.t('toolbar.DoYouReallyWantToClearContent', lang) + '?',
      icon: <ExclamationCircleOutlined />,
      onOk: () => {
        const removedElements = JSON.parse(JSON.stringify(useStore.getState().elements));
        clearContent();
        const undoableClearContent = {
          name: 'Clear Scene',
          timestamp: Date.now(),
          removedElements: removedElements,
          undo: () => {
            setCommonStore((state) => {
              state.elements.push(...undoableClearContent.removedElements);
            });
          },
          redo: () => {
            clearContent();
          },
        } as UndoableRemoveAll;
        addUndoable(undoableClearContent);
      },
    });
    resetToSelectMode();
  };

  const toggleShadow = () => {
    const undoableCheck = {
      name: 'Show Shadow',
      timestamp: Date.now(),
      checked: !shadowEnabled,
      undo: () => {
        setCommonStore((state) => {
          state.viewState.shadowEnabled = !undoableCheck.checked;
          if (state.viewState.shadowEnabled) {
            state.updateSceneRadiusFlag = !state.updateSceneRadiusFlag;
          }
        });
      },
      redo: () => {
        setCommonStore((state) => {
          state.viewState.shadowEnabled = undoableCheck.checked;
          if (state.viewState.shadowEnabled) {
            state.updateSceneRadiusFlag = !state.updateSceneRadiusFlag;
          }
        });
      },
    } as UndoableCheck;
    addUndoable(undoableCheck);
    setCommonStore((state) => {
      state.viewState.shadowEnabled = !state.viewState.shadowEnabled;
      if (state.viewState.shadowEnabled) {
        state.updateSceneRadiusFlag = !state.updateSceneRadiusFlag;
      }
    });
    resetToSelectMode();
  };

  const toggleHelidonPanel = () => {
    setCommonStore((state) => {
      state.viewState.showHeliodonPanel = !state.viewState.showHeliodonPanel;
    });
    resetToSelectMode();
  };

  return (
    <div>
      <FontAwesomeIcon
        title={i18n.t('toolbar.Select', lang)}
        icon={faMousePointer}
        size={'3x'}
        color={objectTypeToAdd === ObjectType.None ? 'antiquewhite' : '#666666'}
        style={{ paddingRight: '12px', cursor: 'pointer' }}
        onClick={resetToSelectMode}
      />
      <img
        title={i18n.t('toolbar.AddFoundation', lang)}
        alt={'Foundation'}
        src={FoundationImage}
        height={56}
        width={48}
        style={{
          paddingRight: '12px',
          paddingBottom: '20px',
          // CSS filter generator of color: https://codepen.io/sosuke/pen/Pjoqqp
          filter:
            objectTypeToAdd === ObjectType.Foundation
              ? 'invert(93%) sepia(3%) saturate(1955%) hue-rotate(26deg) brightness(113%) contrast(96%)'
              : 'invert(41%) sepia(0%) saturate(0%) hue-rotate(224deg) brightness(93%) contrast(81%)',
          cursor: 'pointer',
          verticalAlign: 'middle',
        }}
        onClick={() => {
          setCommonStore((state) => {
            state.objectTypeToAdd = ObjectType.Foundation;
          });
        }}
      />
      <img
        title={i18n.t('toolbar.AddWall', lang)}
        alt={'Wall'}
        src={WallImage}
        height={56}
        width={48}
        style={{
          paddingRight: '12px',
          paddingBottom: '20px',
          // CSS filter generator of color: https://codepen.io/sosuke/pen/Pjoqqp
          filter:
            objectTypeToAdd === ObjectType.Wall
              ? 'invert(93%) sepia(3%) saturate(1955%) hue-rotate(26deg) brightness(113%) contrast(96%)'
              : 'invert(41%) sepia(0%) saturate(0%) hue-rotate(224deg) brightness(93%) contrast(81%)',
          cursor: 'pointer',
          verticalAlign: 'middle',
        }}
        onClick={() => {
          setCommonStore((state) => {
            state.objectTypeToAdd = ObjectType.Wall;
          });
          selectNone();
        }}
      />
      <img
        title={i18n.t('toolbar.AddWindow', lang)}
        alt={'Window'}
        src={WindowImage}
        height={56}
        width={48}
        style={{
          paddingRight: '12px',
          paddingBottom: '20px',
          filter:
            objectTypeToAdd === ObjectType.Window
              ? 'invert(93%) sepia(3%) saturate(1955%) hue-rotate(26deg) brightness(113%) contrast(96%)'
              : 'invert(41%) sepia(0%) saturate(0%) hue-rotate(224deg) brightness(93%) contrast(81%)',
          cursor: 'pointer',
          verticalAlign: 'middle',
        }}
        onClick={() => {
          setCommonStore((state) => {
            state.objectTypeToAdd = ObjectType.Window;
          });
          selectNone();
        }}
      />
      <img
        title={i18n.t('toolbar.AddRoof', lang)}
        alt={'Roof'}
        src={RoofImage}
        height={56}
        width={48}
        style={{
          paddingRight: '12px',
          paddingBottom: '20px',
          filter:
            objectTypeToAdd === ObjectType.Roof
              ? 'invert(93%) sepia(3%) saturate(1955%) hue-rotate(26deg) brightness(113%) contrast(96%)'
              : 'invert(41%) sepia(0%) saturate(0%) hue-rotate(224deg) brightness(93%) contrast(81%)',
          cursor: 'pointer',
          verticalAlign: 'middle',
        }}
        onClick={() => {
          setCommonStore((state) => {
            state.objectTypeToAdd = ObjectType.Roof;
          });
          selectNone();
        }}
      />
      <FontAwesomeIcon
        title={i18n.t('toolbar.AddCuboid', lang)}
        icon={faCube}
        size={'3x'}
        color={objectTypeToAdd === ObjectType.Cuboid ? 'antiquewhite' : '#666666'}
        style={{ paddingRight: '12px', cursor: 'pointer' }}
        onClick={() => {
          setCommonStore((state) => {
            state.objectTypeToAdd = ObjectType.Cuboid;
          });
        }}
      />
      <FontAwesomeIcon
        title={i18n.t('toolbar.AddSensor', lang)}
        icon={faTachometerAlt}
        size={'3x'}
        color={objectTypeToAdd === ObjectType.Sensor ? 'antiquewhite' : '#666666'}
        style={{ paddingRight: '12px', cursor: 'pointer' }}
        onClick={() => {
          setCommonStore((state) => {
            state.objectTypeToAdd = ObjectType.Sensor;
          });
        }}
      />
      <img
        title={i18n.t('toolbar.AddSolarPanel', lang)}
        alt={'Solar panel'}
        src={SolarPanelImage}
        height={56}
        width={48}
        style={{
          paddingRight: '12px',
          paddingBottom: '20px',
          filter:
            objectTypeToAdd === ObjectType.SolarPanel
              ? 'invert(93%) sepia(3%) saturate(1955%) hue-rotate(26deg) brightness(113%) contrast(96%)'
              : 'invert(41%) sepia(0%) saturate(0%) hue-rotate(224deg) brightness(93%) contrast(81%)',
          cursor: 'pointer',
          verticalAlign: 'middle',
        }}
        onClick={() => {
          setCommonStore((state) => {
            state.objectTypeToAdd = ObjectType.SolarPanel;
          });
        }}
      />
      <FontAwesomeIcon
        title={i18n.t('toolbar.AddTree', lang)}
        icon={faTree}
        size={'3x'}
        color={objectTypeToAdd === ObjectType.Tree ? 'antiquewhite' : '#666666'}
        style={{ paddingRight: '12px', cursor: 'pointer' }}
        onClick={() => {
          setCommonStore((state) => {
            state.objectTypeToAdd = ObjectType.Tree;
          });
        }}
      />
      <FontAwesomeIcon
        title={i18n.t('toolbar.AddPeople', lang)}
        icon={faWalking}
        size={'3x'}
        color={objectTypeToAdd === ObjectType.Human ? 'antiquewhite' : '#666666'}
        style={{ paddingRight: '12px', cursor: 'pointer' }}
        onClick={() => {
          setCommonStore((state) => {
            state.objectTypeToAdd = ObjectType.Human;
          });
        }}
      />
      <FontAwesomeIcon
        title={i18n.t('toolbar.ClearScene', lang)}
        icon={faEraser}
        size={'3x'}
        color={'#666666'}
        style={{ paddingRight: '12px', cursor: 'pointer' }}
        onClick={removeAllContent}
      />
      <FontAwesomeIcon
        title={i18n.t('toolbar.ShowHeliodonPanel', lang)}
        icon={faSun}
        size={'3x'}
        color={showHeliodonPanel ? 'antiquewhite' : '#666666'}
        style={{ paddingRight: '12px', cursor: 'pointer' }}
        onClick={toggleHelidonPanel}
      />
      <img
        title={i18n.t('toolbar.ShowShadow', lang)}
        alt={'Shadow effect'}
        src={ShadowImage}
        height={48}
        width={36}
        style={{
          paddingRight: '2px',
          paddingBottom: '20px',
          filter: shadowEnabled
            ? 'invert(41%) sepia(0%) saturate(0%) hue-rotate(224deg) brightness(93%) contrast(81%)'
            : 'invert(93%) sepia(3%) saturate(1955%) hue-rotate(26deg) brightness(113%) contrast(96%)',
          cursor: 'pointer',
          verticalAlign: 'middle',
        }}
        onClick={toggleShadow}
      />
    </div>
  );
};

export default React.memo(MainToolBarButtons);
