/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import SelectImage from './assets/select.png';
import FoundationImage from './assets/foundation.png';
import CuboidImage from './assets/cuboid.png';
import SensorImage from './assets/sensor.png';
import SolarPanelImage from './assets/solar-panel.png';
import WallImage from './assets/wall.png';
import WindowImage from './assets/window.png';
import DoorImage from './assets/door.png';
import PyramidRoofImage from './assets/pyramid_roof.png';
import HipRoofImage from './assets/hip_roof.png';
import GambrelRoofImage from './assets/gambrel_roof.png';
import MansardRoofImage from './assets/mansard_roof.png';
import GableRoofImage from './assets/gable_roof.png';
import TreeImage from './assets/tree.png';
import HumanImage from './assets/human.png';
import ParabolicTroughImage from './assets/parabolic_trough.png';
import ParabolicDishImage from './assets/parabolic_dish.png';
import FresnelReflectorImage from './assets/fresnel_reflector.png';
import HeliostatImage from './assets/heliostat.png';
import WindTurbineImage from './assets/wind_turbine.png';

import React, { useState } from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { Dropdown, Menu, Modal } from 'antd';
import 'antd/dist/antd.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEraser, faEye, faSun, faObjectGroup } from '@fortawesome/free-solid-svg-icons';
import { ObjectType } from './types';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import i18n from './i18n/i18n';
import { UndoableRemoveAll } from './undo/UndoableRemoveAll';
import { UndoableCheck } from './undo/UndoableCheck';
import { useStoreRef } from './stores/commonRef';
import { showInfo } from './helpers';
import { Util } from './Util';

const ToolBarButton = ({ ...props }) => {
  return (
    <div
      style={{
        verticalAlign: 'top',
        display: 'inline-block',
        marginTop: '4px',
        marginRight: '8px',
      }}
    >
      {props.children}
    </div>
  );
};

const MainToolBarButtons = () => {
  const setCommonStore = useStore(Selector.set);
  const loggable = useStore(Selector.loggable);
  const elements = useStore.getState().elements;
  const language = useStore(Selector.language);
  const selectNone = useStore(Selector.selectNone);
  const showHeliodonPanel = useStore(Selector.viewState.showHeliodonPanel);
  const noAnimationForHeatmapSimulation = useStore(Selector.world.noAnimationForHeatmapSimulation);
  const showSolarRadiationHeatmap = useStore(Selector.showSolarRadiationHeatmap);
  const clearContent = useStore(Selector.clearContent);
  const objectTypeToAdd = useStore(Selector.objectTypeToAdd);
  const addedFoundationId = useStore(Selector.addedFoundationId);
  const addedCuboidId = useStore(Selector.addedCuboidId);
  const addedWallId = useStore(Selector.addedWallId);
  const addedWindowId = useStore(Selector.addedWindowId);
  const addUndoable = useStore(Selector.addUndoable);
  const runDynamicSimulation = useStore(Selector.runDynamicSimulation);
  const runStaticSimulation = useStore(Selector.runStaticSimulation);
  const groupAction = useStore(Selector.groupActionMode);

  const [category1Flag, setCategory1Flag] = useState<ObjectType>(ObjectType.Foundation);
  const [category2Flag, setCategory2Flag] = useState<ObjectType>(ObjectType.Wall);
  const [category3Flag, setCategory3Flag] = useState<ObjectType>(ObjectType.SolarPanel);
  const [category4Flag, setCategory4Flag] = useState<ObjectType>(ObjectType.Tree);
  const lang = { lng: language };

  // CSS filter generator of color: https://codepen.io/sosuke/pen/Pjoqqp
  const defaultFilter = 'invert(41%) sepia(0%) saturate(0%) hue-rotate(224deg) brightness(93%) contrast(81%)';
  const selectFilter = 'invert(93%) sepia(3%) saturate(1955%) hue-rotate(26deg) brightness(113%) contrast(96%)';

  const resetToSelectMode = () => {
    setCommonStore((state) => {
      state.objectTypeToAdd = ObjectType.None;
      state.groupActionMode = false;
      state.elementGroupId = null;
    });
  };

  const handleGroupActionMode = () => {
    setCommonStore((state) => {
      if (state.groupActionMode) {
        state.elementGroupId = null;
      } else {
        if (state.selectedElement) {
          if (state.selectedElement.type === ObjectType.Foundation) {
            state.elementGroupId = state.selectedElement.id;
          } else {
            state.elementGroupId = state.selectedElement.foundationId ?? null;
            for (const e of state.elements) {
              e.selected = e.id === state.selectedElement.foundationId;
            }
          }
        } else {
          for (const e of state.elements) {
            e.selected = false;
          }
        }
        state.objectTypeToAdd = ObjectType.None;
      }
      state.groupActionMode = !state.groupActionMode;
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

  const toggleSunAndTimeSettingsPanel = () => {
    const undoableCheck = {
      name: 'Show Sun and Time Settings Panel',
      timestamp: Date.now(),
      checked: !showHeliodonPanel,
      undo: () => {
        setCommonStore((state) => {
          state.viewState.showHeliodonPanel = !undoableCheck.checked;
        });
      },
      redo: () => {
        setCommonStore((state) => {
          state.viewState.showHeliodonPanel = undoableCheck.checked;
        });
      },
    } as UndoableCheck;
    addUndoable(undoableCheck);
    setCommonStore((state) => {
      state.viewState.showHeliodonPanel = !state.viewState.showHeliodonPanel;
    });
  };

  const toggleStaticSolarRadiationHeatmap = () => {
    if (!runStaticSimulation) {
      showInfo(i18n.t('message.SimulationStarted', lang));
    }
    // give it 0.1 second for the info to show up
    setTimeout(() => {
      selectNone();
      setCommonStore((state) => {
        state.runStaticSimulation = !state.runStaticSimulation;
        if (loggable) {
          state.actionInfo = {
            name: 'Generate Daily Solar Radiation Heatmap (Static)',
            timestamp: new Date().getTime(),
          };
        }
      });
    }, 100);
  };

  const toggleDynamicSolarRadiationHeatmap = () => {
    if (!runDynamicSimulation) {
      showInfo(i18n.t('message.SimulationStarted', lang));
    }
    // give it 0.1 second for the info to show up
    setTimeout(() => {
      selectNone();
      setCommonStore((state) => {
        state.runDynamicSimulation = !state.runDynamicSimulation;
        if (loggable) {
          state.actionInfo = {
            name: 'Generate Daily Solar Radiation Heatmap (Dynamic)',
            timestamp: new Date().getTime(),
          };
        }
      });
    }, 100);
  };

  const setMode = (type: ObjectType) => {
    setCommonStore((state) => {
      state.objectTypeToAdd = type;
      state.groupActionMode = false;
      state.elementGroupId = null;
    });
    useStoreRef.getState().setEnableOrbitController(false);
    selectNone();
  };

  const menuItem = (
    objectType: ObjectType,
    srcImg: string,
    setFlag: (val: React.SetStateAction<ObjectType>) => void,
    text?: string,
  ) => {
    const key = objectType.charAt(0).toLowerCase() + objectType.slice(1).replace(/\s+/g, '');
    return (
      <Menu.Item
        style={{ userSelect: 'none' }}
        key={`add-${key}-menu-item`}
        onClick={() => {
          setFlag(objectType);
          setMode(objectType);
        }}
      >
        <img
          alt={objectType}
          src={srcImg}
          height={36}
          width={36}
          style={{
            filter: defaultFilter,
            verticalAlign: 'middle',
            marginRight: '10px',
          }}
        />
        {i18n.t(`toolbar.SwitchToAdding${text ?? objectType.replaceAll(' ', '')}`, lang)}
      </Menu.Item>
    );
  };

  const buttonImg = (objectType: ObjectType, srcImg: string, addedElemId?: string | null, text?: string) => {
    return (
      <img
        title={i18n.t(`toolbar.Add${text ?? objectType.replaceAll(' ', '')}`, lang)}
        alt={objectType}
        src={srcImg}
        height={36}
        width={36}
        style={{
          filter: objectTypeToAdd === objectType || addedElemId ? selectFilter : defaultFilter,
          cursor: 'pointer',
          verticalAlign: 'middle',
        }}
        onClick={() => {
          setMode(objectType);
        }}
      />
    );
  };

  const dropdownButton = (overlay: JSX.Element) => {
    return (
      <Dropdown overlay={overlay} trigger={['click']}>
        <label
          title={i18n.t('toolbar.ClickForMoreButtons', lang)}
          style={{
            cursor: 'pointer',
            verticalAlign: 'middle',
            fontSize: '10px',
            marginLeft: '4px',
            width: '10px',
            height: '36px',
            color: '#666666',
            fontWeight: 'bold',
          }}
        >
          ▼
        </label>
      </Dropdown>
    );
  };

  const category1Menu = (
    <Menu>
      {menuItem(ObjectType.Foundation, FoundationImage, setCategory1Flag)}
      {menuItem(ObjectType.Cuboid, CuboidImage, setCategory1Flag)}
    </Menu>
  );

  const category2Menu = (
    <Menu>
      {menuItem(ObjectType.Wall, WallImage, setCategory2Flag)}
      {menuItem(ObjectType.Window, WindowImage, setCategory2Flag)}
      {menuItem(ObjectType.Door, DoorImage, setCategory2Flag)}
      {menuItem(ObjectType.PyramidRoof, PyramidRoofImage, setCategory2Flag)}
      {menuItem(ObjectType.HipRoof, HipRoofImage, setCategory2Flag)}
      {menuItem(ObjectType.GableRoof, GableRoofImage, setCategory2Flag)}
      {menuItem(ObjectType.GambrelRoof, GambrelRoofImage, setCategory2Flag)}
      {menuItem(ObjectType.MansardRoof, MansardRoofImage, setCategory2Flag)}
    </Menu>
  );

  const category3Menu = (
    <Menu>
      {menuItem(ObjectType.SolarPanel, SolarPanelImage, setCategory3Flag)}
      {menuItem(ObjectType.ParabolicTrough, ParabolicTroughImage, setCategory3Flag)}
      {menuItem(ObjectType.ParabolicDish, ParabolicDishImage, setCategory3Flag)}
      {menuItem(ObjectType.FresnelReflector, FresnelReflectorImage, setCategory3Flag)}
      {menuItem(ObjectType.Heliostat, HeliostatImage, setCategory3Flag)}
      {menuItem(ObjectType.Sensor, SensorImage, setCategory3Flag)}
      {menuItem(ObjectType.WindTurbine, WindTurbineImage, setCategory3Flag)}
    </Menu>
  );

  const category4Menu = (
    <Menu>
      {menuItem(ObjectType.Tree, TreeImage, setCategory4Flag)}
      {menuItem(ObjectType.Human, HumanImage, setCategory4Flag, 'People')}
    </Menu>
  );

  const category1Button = (objectType: ObjectType) => {
    switch (objectType) {
      case ObjectType.Foundation:
        return buttonImg(objectType, FoundationImage, useStore.getState().addedFoundationId);
      case ObjectType.Cuboid:
        return buttonImg(objectType, CuboidImage, useStore.getState().addedCuboidId);
    }
  };

  const category2Button = (objectType: ObjectType) => {
    switch (objectType) {
      case ObjectType.Wall:
        return buttonImg(objectType, WallImage, useStore.getState().addedWallId);
      case ObjectType.Window:
        return buttonImg(objectType, WindowImage, useStore.getState().addedWindowId);
      case ObjectType.Door:
        return buttonImg(objectType, DoorImage);
      case ObjectType.PyramidRoof:
        return buttonImg(ObjectType.PyramidRoof, PyramidRoofImage);
      case ObjectType.HipRoof:
        return buttonImg(ObjectType.HipRoof, HipRoofImage);
      case ObjectType.GableRoof:
        return buttonImg(ObjectType.GableRoof, GableRoofImage);
      case ObjectType.GambrelRoof:
        return buttonImg(ObjectType.GambrelRoof, GambrelRoofImage);
      case ObjectType.MansardRoof:
        return buttonImg(ObjectType.MansardRoof, MansardRoofImage);
    }
  };

  const category3Button = (objectType: ObjectType) => {
    switch (objectType) {
      case ObjectType.SolarPanel:
        return buttonImg(objectType, SolarPanelImage);
      case ObjectType.ParabolicTrough:
        return buttonImg(objectType, ParabolicTroughImage);
      case ObjectType.ParabolicDish:
        return buttonImg(objectType, ParabolicDishImage);
      case ObjectType.FresnelReflector:
        return buttonImg(objectType, FresnelReflectorImage);
      case ObjectType.Heliostat:
        return buttonImg(objectType, HeliostatImage);
      case ObjectType.Sensor:
        return buttonImg(objectType, SensorImage);
      case ObjectType.WindTurbine:
        return buttonImg(objectType, WindTurbineImage);
    }
  };

  const category4Button = (objectType: ObjectType) => {
    switch (objectType) {
      case ObjectType.Tree:
        return buttonImg(objectType, TreeImage);
      case ObjectType.Human:
        return buttonImg(objectType, HumanImage, undefined, 'People');
    }
  };

  const inSelectionMode = () => {
    return (
      objectTypeToAdd === ObjectType.None &&
      !addedFoundationId &&
      !addedCuboidId &&
      !addedWallId &&
      !addedWindowId &&
      !groupAction
    );
  };

  return (
    <div>
      {/* default to select */}
      <ToolBarButton>
        <img
          title={i18n.t('toolbar.Select', lang)}
          alt={'Select'}
          src={SelectImage}
          height={36}
          width={36}
          style={{
            filter: inSelectionMode() ? selectFilter : defaultFilter,
            cursor: 'pointer',
            verticalAlign: 'middle',
          }}
          onClick={resetToSelectMode}
        />
      </ToolBarButton>

      {/* add buttons in category 1 */}
      <ToolBarButton>
        {category1Button(category1Flag)}
        {dropdownButton(category1Menu)}
      </ToolBarButton>

      {/* add buttons in category 2 */}
      <ToolBarButton>
        {category2Button(category2Flag)}
        {dropdownButton(category2Menu)}
      </ToolBarButton>

      {/* add buttons in category 3 */}
      <ToolBarButton>
        {category3Button(category3Flag)}
        {dropdownButton(category3Menu)}
      </ToolBarButton>

      {/* add buttons in category 4 */}
      <ToolBarButton>
        {category4Button(category4Flag)}
        {dropdownButton(category4Menu)}
      </ToolBarButton>

      <FontAwesomeIcon
        title={i18n.t('toolbar.ManipulateGroup', lang)}
        icon={faObjectGroup}
        size={'3x'}
        color={groupAction ? 'antiquewhite' : '#666666'}
        style={{ paddingRight: '12px', cursor: 'pointer' }}
        onClick={handleGroupActionMode}
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
        title={i18n.t('toolbar.ShowHeatmap', lang)}
        icon={faEye}
        size={'3x'}
        color={showSolarRadiationHeatmap ? 'antiquewhite' : '#666666'}
        style={{ paddingRight: '12px', cursor: 'pointer' }}
        onClick={
          !noAnimationForHeatmapSimulation || Util.hasMovingParts(elements)
            ? toggleDynamicSolarRadiationHeatmap
            : toggleStaticSolarRadiationHeatmap
        }
      />
      <FontAwesomeIcon
        title={i18n.t('toolbar.ShowSunAndTimeSettings', lang)}
        icon={faSun}
        size={'3x'}
        color={showHeliodonPanel ? 'antiquewhite' : '#666666'}
        style={{ paddingRight: '12px', cursor: 'pointer' }}
        onClick={toggleSunAndTimeSettingsPanel}
      />
    </div>
  );
};

export default React.memo(MainToolBarButtons);
