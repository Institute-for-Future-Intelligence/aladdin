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
import RoofImage from './assets/roof.png';
import TreeImage from './assets/tree.png';
import HumanImage from './assets/human.png';
import ParabolicTroughImage from './assets/parabolic_trough.png';
import ParabolicDishImage from './assets/parabolic_dish.png';

import React, { useState } from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { Dropdown, Menu, Modal } from 'antd';
import 'antd/dist/antd.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEraser, faEye, faSun } from '@fortawesome/free-solid-svg-icons';
import { ObjectType } from './types';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import i18n from './i18n/i18n';
import { UndoableRemoveAll } from './undo/UndoableRemoveAll';
import { UndoableCheck } from './undo/UndoableCheck';
import { useStoreRef } from './stores/commonRef';
import { showInfo } from './helpers';

const MainToolBarButtons = () => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const selectNone = useStore(Selector.selectNone);
  const showHeliodonPanel = useStore(Selector.viewState.showHeliodonPanel);
  const showSolarRadiationHeatmap = useStore(Selector.showSolarRadiationHeatmap);
  const clearContent = useStore(Selector.clearContent);
  const objectTypeToAdd = useStore(Selector.objectTypeToAdd);
  const addedFoundationId = useStore(Selector.addedFoundationId);
  const addedCuboidId = useStore(Selector.addedCuboidId);
  const addedWallId = useStore(Selector.addedWallId);
  const addedWindowId = useStore(Selector.addedWindowId);
  const addUndoable = useStore(Selector.addUndoable);

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

  const toggleSolarRadiationHeatmap = () => {
    showInfo(i18n.t('message.SimulationStarted', lang));
    // give it 0.1 second for the info to show up
    setTimeout(() => {
      selectNone();
      setCommonStore((state) => {
        state.simulationInProgress = true;
        // set below to false first to ensure update (it will be set to true after the simulation)
        state.showSolarRadiationHeatmap = false;
        state.dailySolarRadiationSimulationFlag = !state.dailySolarRadiationSimulationFlag;
      });
    }, 100);
  };

  const setMode = (type: ObjectType) => {
    setCommonStore((state) => {
      state.objectTypeToAdd = type;
    });
    useStoreRef.getState().setEnableOrbitController(false);
    selectNone();
  };

  const category1Menu = (
    <Menu>
      <Menu.Item
        style={{ userSelect: 'none' }}
        key="add-foundation-menu-item"
        onClick={() => {
          setCategory1Flag(ObjectType.Foundation);
          setMode(ObjectType.Foundation);
        }}
      >
        <img
          alt={'Foundation'}
          src={FoundationImage}
          height={36}
          width={36}
          style={{
            filter: defaultFilter,
            verticalAlign: 'middle',
            marginRight: '10px',
          }}
        />
        {i18n.t('toolbar.SwitchToAddingFoundation', lang)}
      </Menu.Item>
      <Menu.Item
        style={{ userSelect: 'none' }}
        key="add-cuboid-menu-item"
        onClick={() => {
          setCategory1Flag(ObjectType.Cuboid);
          setMode(ObjectType.Cuboid);
        }}
      >
        <img
          alt={'Cuboid'}
          src={CuboidImage}
          height={36}
          width={36}
          style={{
            filter: defaultFilter,
            verticalAlign: 'middle',
            marginRight: '10px',
          }}
        />
        {i18n.t('toolbar.SwitchToAddingCuboid', lang)}
      </Menu.Item>
    </Menu>
  );

  const category2Menu = (
    <Menu>
      <Menu.Item
        style={{ userSelect: 'none' }}
        key="add-wall-menu-item"
        onClick={() => {
          setCategory2Flag(ObjectType.Wall);
          setMode(ObjectType.Wall);
        }}
      >
        <img
          alt={'Wall'}
          src={WallImage}
          height={36}
          width={36}
          style={{
            filter: defaultFilter,
            verticalAlign: 'middle',
            marginRight: '10px',
          }}
        />
        {i18n.t('toolbar.SwitchToAddingWall', lang)}
      </Menu.Item>
      <Menu.Item
        style={{ userSelect: 'none' }}
        key="add-window-menu-item"
        onClick={() => {
          setCategory2Flag(ObjectType.Window);
          setMode(ObjectType.Window);
        }}
      >
        <img
          alt={'Window'}
          src={WindowImage}
          height={36}
          width={36}
          style={{
            filter: defaultFilter,
            verticalAlign: 'middle',
            marginRight: '10px',
          }}
        />
        {i18n.t('toolbar.SwitchToAddingWindow', lang)}
      </Menu.Item>
      <Menu.Item
        style={{ userSelect: 'none' }}
        key="add-roof-menu-item"
        onClick={() => {
          setCategory2Flag(ObjectType.Roof);
          setMode(ObjectType.Roof);
        }}
      >
        <img
          alt={'Roof'}
          src={RoofImage}
          height={36}
          width={36}
          style={{
            filter: defaultFilter,
            verticalAlign: 'middle',
            marginRight: '10px',
          }}
        />
        {i18n.t('toolbar.SwitchToAddingRoof', lang)}
      </Menu.Item>
    </Menu>
  );

  const category3Menu = (
    <Menu>
      <Menu.Item
        style={{ userSelect: 'none' }}
        key="add-solar-panel-menu-item"
        onClick={() => {
          setCategory3Flag(ObjectType.SolarPanel);
          setMode(ObjectType.SolarPanel);
        }}
      >
        <img
          alt={'Solar Panel'}
          src={SolarPanelImage}
          height={36}
          width={36}
          style={{
            filter: defaultFilter,
            verticalAlign: 'middle',
            marginRight: '10px',
          }}
        />
        {i18n.t('toolbar.SwitchToAddingSolarPanel', lang)}
      </Menu.Item>
      <Menu.Item
        style={{ userSelect: 'none' }}
        key="add-sensor-menu-item"
        onClick={() => {
          setCategory3Flag(ObjectType.Sensor);
          setMode(ObjectType.Sensor);
        }}
      >
        <img
          alt={'Sensor'}
          src={SensorImage}
          height={36}
          width={36}
          style={{
            filter: defaultFilter,
            verticalAlign: 'middle',
            marginRight: '10px',
          }}
        />
        {i18n.t('toolbar.SwitchToAddingSensor', lang)}
      </Menu.Item>
      <Menu.Item
        style={{ userSelect: 'none' }}
        key="add-parabolic-trough-menu-item"
        onClick={() => {
          setCategory3Flag(ObjectType.ParabolicTrough);
          setMode(ObjectType.ParabolicTrough);
        }}
      >
        <img
          alt={'Parabolic Trough'}
          src={ParabolicTroughImage}
          height={36}
          width={36}
          style={{
            filter: defaultFilter,
            verticalAlign: 'middle',
            marginRight: '10px',
          }}
        />
        {i18n.t('toolbar.SwitchToAddingParabolicTrough', lang)}
      </Menu.Item>
      <Menu.Item
        style={{ userSelect: 'none' }}
        key="add-parabolic-dish-menu-item"
        onClick={() => {
          setCategory3Flag(ObjectType.ParabolicDish);
          setMode(ObjectType.ParabolicDish);
        }}
      >
        <img
          alt={'Parabolic Dish'}
          src={ParabolicDishImage}
          height={36}
          width={36}
          style={{
            filter: defaultFilter,
            verticalAlign: 'middle',
            marginRight: '10px',
          }}
        />
        {i18n.t('toolbar.SwitchToAddingParabolicDish', lang)}
      </Menu.Item>
    </Menu>
  );

  const category4Menu = (
    <Menu>
      <Menu.Item
        style={{ userSelect: 'none' }}
        key="add-tree-menu-item"
        onClick={() => {
          setCategory4Flag(ObjectType.Tree);
          setMode(ObjectType.Tree);
        }}
      >
        <img
          alt={'Tree'}
          src={TreeImage}
          height={36}
          width={36}
          style={{
            filter: defaultFilter,
            verticalAlign: 'middle',
            marginRight: '10px',
          }}
        />
        {i18n.t('toolbar.SwitchToAddingTree', lang)}
      </Menu.Item>
      <Menu.Item
        style={{ userSelect: 'none' }}
        key="add-human-menu-item"
        onClick={() => {
          setCategory4Flag(ObjectType.Human);
          setMode(ObjectType.Human);
        }}
      >
        <img
          alt={'Human'}
          src={HumanImage}
          height={36}
          width={36}
          style={{
            filter: defaultFilter,
            verticalAlign: 'middle',
            marginRight: '10px',
          }}
        />
        {i18n.t('toolbar.SwitchToAddingPeople', lang)}
      </Menu.Item>
    </Menu>
  );

  const inSelectionMode = () => {
    return (
      objectTypeToAdd === ObjectType.None && !addedFoundationId && !addedCuboidId && !addedWallId && !addedWindowId
    );
  };

  return (
    <div>
      {/* default to select */}
      <div
        style={{
          verticalAlign: 'top',
          display: 'inline-block',
          marginTop: '4px',
          marginRight: '8px',
        }}
      >
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
      </div>

      {/* add buttons in category 1 */}
      <div
        style={{
          verticalAlign: 'top',
          display: 'inline-block',
          marginTop: '4px',
          marginRight: '8px',
        }}
      >
        {category1Flag === ObjectType.Foundation && (
          <img
            title={i18n.t('toolbar.AddFoundation', lang)}
            alt={'Foundation'}
            src={FoundationImage}
            height={36}
            width={36}
            style={{
              filter: objectTypeToAdd === ObjectType.Foundation || addedFoundationId ? selectFilter : defaultFilter,
              cursor: 'pointer',
              verticalAlign: 'middle',
            }}
            onClick={() => {
              setMode(ObjectType.Foundation);
            }}
          />
        )}
        {category1Flag === ObjectType.Cuboid && (
          <img
            title={i18n.t('toolbar.AddCuboid', lang)}
            alt={'Cuboid'}
            src={CuboidImage}
            height={36}
            width={36}
            style={{
              filter: objectTypeToAdd === ObjectType.Cuboid || addedCuboidId ? selectFilter : defaultFilter,
              cursor: 'pointer',
              verticalAlign: 'middle',
            }}
            onClick={() => {
              setMode(ObjectType.Cuboid);
            }}
          />
        )}
        <Dropdown overlay={category1Menu} trigger={['click']}>
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
      </div>

      {/* add buttons in category 2 */}
      <div
        style={{
          verticalAlign: 'top',
          display: 'inline-block',
          marginTop: '4px',
          marginRight: '8px',
        }}
      >
        {category2Flag === ObjectType.Wall && (
          <img
            title={i18n.t('toolbar.AddWall', lang)}
            alt={'Wall'}
            src={WallImage}
            height={36}
            width={36}
            style={{
              filter: objectTypeToAdd === ObjectType.Wall || addedWallId ? selectFilter : defaultFilter,
              cursor: 'pointer',
              verticalAlign: 'middle',
            }}
            onClick={() => {
              setMode(ObjectType.Wall);
            }}
          />
        )}
        {category2Flag === ObjectType.Window && (
          <img
            title={i18n.t('toolbar.AddWindow', lang)}
            alt={'Window'}
            src={WindowImage}
            height={36}
            width={36}
            style={{
              filter: objectTypeToAdd === ObjectType.Window || addedWindowId ? selectFilter : defaultFilter,
              cursor: 'pointer',
              verticalAlign: 'middle',
            }}
            onClick={() => {
              setMode(ObjectType.Window);
            }}
          />
        )}
        {category2Flag === ObjectType.Roof && (
          <img
            title={i18n.t('toolbar.AddRoof', lang)}
            alt={'Roof'}
            src={RoofImage}
            height={36}
            width={36}
            style={{
              filter: objectTypeToAdd === ObjectType.Roof ? selectFilter : defaultFilter,
              cursor: 'pointer',
              verticalAlign: 'middle',
            }}
            onClick={() => {
              setMode(ObjectType.Roof);
            }}
          />
        )}
        <Dropdown overlay={category2Menu} trigger={['click']}>
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
      </div>

      {/* add buttons in category 3 */}
      <div
        style={{
          verticalAlign: 'top',
          display: 'inline-block',
          marginTop: '4px',
          marginRight: '8px',
        }}
      >
        {category3Flag === ObjectType.SolarPanel && (
          <img
            title={i18n.t('toolbar.AddSolarPanel', lang)}
            alt={'Solar panel'}
            src={SolarPanelImage}
            height={36}
            width={36}
            style={{
              filter: objectTypeToAdd === ObjectType.SolarPanel ? selectFilter : defaultFilter,
              cursor: 'pointer',
              verticalAlign: 'middle',
            }}
            onClick={() => {
              setMode(ObjectType.SolarPanel);
            }}
          />
        )}
        {category3Flag === ObjectType.ParabolicTrough && (
          <img
            title={i18n.t('toolbar.AddParabolicTrough', lang)}
            alt={'Parabolic Trough'}
            src={ParabolicTroughImage}
            height={36}
            width={36}
            style={{
              filter: objectTypeToAdd === ObjectType.ParabolicTrough ? selectFilter : defaultFilter,
              cursor: 'pointer',
              verticalAlign: 'middle',
            }}
            onClick={() => {
              setMode(ObjectType.ParabolicTrough);
            }}
          />
        )}
        {category3Flag === ObjectType.ParabolicDish && (
          <img
            title={i18n.t('toolbar.AddParabolicDish', lang)}
            alt={'Parabolic Dish'}
            src={ParabolicDishImage}
            height={36}
            width={36}
            style={{
              filter: objectTypeToAdd === ObjectType.ParabolicDish ? selectFilter : defaultFilter,
              cursor: 'pointer',
              verticalAlign: 'middle',
            }}
            onClick={() => {
              setMode(ObjectType.ParabolicDish);
            }}
          />
        )}
        {category3Flag === ObjectType.Sensor && (
          <img
            title={i18n.t('toolbar.AddSensor', lang)}
            alt={'Sensor'}
            src={SensorImage}
            height={36}
            width={36}
            style={{
              filter: objectTypeToAdd === ObjectType.Sensor ? selectFilter : defaultFilter,
              cursor: 'pointer',
              verticalAlign: 'middle',
            }}
            onClick={() => {
              setMode(ObjectType.Sensor);
            }}
          />
        )}
        <Dropdown overlay={category3Menu} trigger={['click']}>
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
      </div>

      {/* add buttons in category 4 */}
      <div
        style={{
          verticalAlign: 'top',
          display: 'inline-block',
          marginTop: '4px',
          marginRight: '8px',
        }}
      >
        {category4Flag === ObjectType.Tree && (
          <img
            title={i18n.t('toolbar.AddTree', lang)}
            alt={'Tree'}
            src={TreeImage}
            height={36}
            width={36}
            style={{
              filter: objectTypeToAdd === ObjectType.Tree ? selectFilter : defaultFilter,
              cursor: 'pointer',
              verticalAlign: 'middle',
            }}
            onClick={() => {
              setMode(ObjectType.Tree);
            }}
          />
        )}
        {category4Flag === ObjectType.Human && (
          <img
            title={i18n.t('toolbar.AddPeople', lang)}
            alt={'Human'}
            src={HumanImage}
            height={36}
            width={36}
            style={{
              filter: objectTypeToAdd === ObjectType.Human ? selectFilter : defaultFilter,
              cursor: 'pointer',
              verticalAlign: 'middle',
            }}
            onClick={() => {
              setMode(ObjectType.Human);
            }}
          />
        )}
        <Dropdown overlay={category4Menu} trigger={['click']}>
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
      </div>

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
        onClick={toggleSolarRadiationHeatmap}
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
