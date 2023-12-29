/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import TinyLockImage from './assets/tiny_lock.png';
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
import FlowerImage from './assets/flower.png';
import HumanImage from './assets/human.png';
import ParabolicTroughImage from './assets/parabolic_trough.png';
import ParabolicDishImage from './assets/parabolic_dish.png';
import FresnelReflectorImage from './assets/fresnel_reflector.png';
import HeliostatImage from './assets/heliostat.png';
import WindTurbineImage from './assets/wind_turbine.png';
import VerticalAxisWindTurbineImage from './assets/vertical_axis_wind_turbine.png';
import LightImage from './assets/led_light.png';
import GroupImage from './assets/group.png';
import ClearImage from './assets/clear.png';
import HeliodonImage from './assets/heliodon.png';
import AnalyzeImage from './assets/analyze.png';

import React, { useMemo, useState } from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { Dropdown, Menu, MenuProps, Modal } from 'antd';
import 'antd/dist/reset.css';
import { ObjectType } from './types';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import i18n from './i18n/i18n';
import { UndoableRemoveAll } from './undo/UndoableRemoveAll';
import { UndoableCheck } from './undo/UndoableCheck';
import { useRefStore } from './stores/commonRef';
import { showInfo } from './helpers';
import { Util } from './Util';
import { usePrimitiveStore } from './stores/commonPrimitive';
import { useLanguage } from './views/hooks';
import { MenuItem } from './components/contextMenu/menuItems';

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

interface ToolBarMenuItemProps {
  objectType: ObjectType;
  srcImg: string;
  setFlag: (val: React.SetStateAction<ObjectType>) => void;
  replacingText?: string; // sometimes we don't want to use the type name as the name in the menu
}

const defaultFilter = 'invert(41%) sepia(0%) saturate(0%) hue-rotate(224deg) brightness(93%) contrast(81%)';
const selectFilter = 'invert(93%) sepia(3%) saturate(1955%) hue-rotate(26deg) brightness(113%) contrast(96%)';

const ToolBarMenuItem = ({ objectType, srcImg, setFlag, replacingText }: ToolBarMenuItemProps) => {
  const setMode = (type: ObjectType) => {
    useStore.getState().set((state) => {
      state.objectTypeToAdd = type;
      state.groupActionMode = false;
      state.actionModeLock = false;
    });
    useRefStore.getState().setEnableOrbitController(false);
    useStore.getState().selectNone();
  };

  const lang = useLanguage();

  return (
    <MenuItem
      noPadding
      textSelectable={false}
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
      {i18n.t(`toolbar.Add${replacingText ?? objectType.replaceAll(' ', '')}`, lang)}
    </MenuItem>
  );
};

const MainToolBarButtons = () => {
  const setCommonStore = useStore(Selector.set);
  const setPrimitiveStore = usePrimitiveStore(Selector.setPrimitiveStore);
  const loggable = useStore(Selector.loggable);
  const elements = useStore.getState().elements;
  const language = useStore(Selector.language);
  const selectNone = useStore(Selector.selectNone);
  const actionModeLock = useStore(Selector.actionModeLock);
  const showHeliodonPanel = useStore(Selector.viewState.showHeliodonPanel);
  const noAnimationForHeatmapSimulation = useStore(Selector.world.noAnimationForHeatmapSimulation);
  const showSolarRadiationHeatmap = usePrimitiveStore(Selector.showSolarRadiationHeatmap);
  const clearContent = useStore(Selector.clearContent);
  const objectTypeToAdd = useStore(Selector.objectTypeToAdd);
  const addedFoundationId = useStore(Selector.addedFoundationId);
  const addedCuboidId = useStore(Selector.addedCuboidId);
  const addedWallId = useStore(Selector.addedWallId);
  const addedWindowId = useStore(Selector.addedWindowId);
  const addedDoorId = useStore(Selector.addedDoorId);
  const addUndoable = useStore(Selector.addUndoable);
  const runDynamicSimulation = usePrimitiveStore(Selector.runDynamicSimulation);
  const runStaticSimulation = usePrimitiveStore(Selector.runStaticSimulation);
  const groupAction = useStore(Selector.groupActionMode);

  const [category1Flag, setCategory1Flag] = useState<ObjectType>(ObjectType.Foundation);
  const [category2Flag, setCategory2Flag] = useState<ObjectType>(ObjectType.Wall);
  const [category3Flag, setCategory3Flag] = useState<ObjectType>(ObjectType.SolarPanel);

  const lang = useMemo(() => {
    return { lng: language };
  }, [language]);

  const resetToSelectMode = () => {
    setCommonStore((state) => {
      state.objectTypeToAdd = ObjectType.None;
      state.groupActionMode = false;
      state.actionModeLock = false;
    });
  };

  const handleGroupActionMode = () => {
    setCommonStore((state) => {
      if (!state.groupActionMode) {
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
      if (state.viewState.showHeliodonPanel) state.selectedFloatingWindow = 'heliodonPanel';
    });
  };

  const toggleStaticSolarRadiationHeatmap = () => {
    if (!runStaticSimulation) {
      showInfo(i18n.t('message.SimulationStarted', lang));
    }
    // give it 0.1 second for the info to show up
    setTimeout(() => {
      selectNone();
      setPrimitiveStore('runStaticSimulation', !runStaticSimulation);
      setCommonStore((state) => {
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
      setPrimitiveStore('runDynamicSimulation', !runDynamicSimulation);
      setCommonStore((state) => {
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
      state.actionModeLock = false;
    });
    useRefStore.getState().setEnableOrbitController(false);
    selectNone();
  };

  // only the following types of elements need to be added in a large quantity
  const needToLock = (type: ObjectType) => {
    switch (type) {
      case ObjectType.Human:
      case ObjectType.Tree:
      case ObjectType.Flower:
      case ObjectType.Sensor:
      case ObjectType.SolarPanel:
      case ObjectType.ParabolicDish:
      case ObjectType.ParabolicTrough:
      case ObjectType.FresnelReflector:
      case ObjectType.Heliostat:
      case ObjectType.WindTurbine:
      case ObjectType.VerticalAxisWindTurbine:
      case ObjectType.Light:
      case ObjectType.Wall:
      case ObjectType.Window:
        return true;
      default:
        return false;
    }
  };

  const buttonImg = (objectType: ObjectType, srcImg: string, addedElemId?: string | null, text?: string) => {
    const needLock = needToLock(objectType);
    return (
      <>
        <img
          title={
            i18n.t(`toolbar.Add${text ?? objectType.replaceAll(' ', '')}`, lang) +
            (needLock
              ? '\n' +
                (actionModeLock
                  ? i18n.t(`toolbar.ClickToUnlockThisModeForNextAction`, lang)
                  : i18n.t(`toolbar.DoubleClickToLockThisModeForNextAction`, lang))
              : '')
          }
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
          onDoubleClick={() => {
            if (needLock) {
              setCommonStore((state) => {
                state.actionModeLock = true;
              });
            }
          }}
        />
        {(objectTypeToAdd === objectType || addedElemId) && needLock && actionModeLock && (
          <img
            alt={'Tiny lock'}
            src={TinyLockImage}
            style={{
              marginLeft: '-2px', // this is used to overlay the images a bit
              filter: objectTypeToAdd === objectType || addedElemId ? selectFilter : defaultFilter,
              verticalAlign: 'top',
            }}
          />
        )}
      </>
    );
  };

  const dropdownButton = (menu: MenuProps) => {
    return (
      <Dropdown menu={menu} trigger={['click']}>
        <span
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
        </span>
      </Dropdown>
    );
  };

  const category1Menu: MenuProps['items'] = [
    {
      key: 'add-foundation',
      label: <ToolBarMenuItem objectType={ObjectType.Foundation} srcImg={FoundationImage} setFlag={setCategory1Flag} />,
    },
    {
      key: 'add-cuboid',
      label: <ToolBarMenuItem objectType={ObjectType.Cuboid} srcImg={CuboidImage} setFlag={setCategory1Flag} />,
    },
    {
      key: 'add-tree',
      label: <ToolBarMenuItem objectType={ObjectType.Tree} srcImg={TreeImage} setFlag={setCategory1Flag} />,
    },
    {
      key: 'add-flower',
      label: <ToolBarMenuItem objectType={ObjectType.Flower} srcImg={FlowerImage} setFlag={setCategory1Flag} />,
    },
    {
      key: 'add-human',
      label: (
        <ToolBarMenuItem
          objectType={ObjectType.Human}
          srcImg={HumanImage}
          setFlag={setCategory1Flag}
          replacingText="People"
        />
      ),
    },
  ];

  const category2Menu: MenuProps['items'] = [
    {
      key: 'add-wall',
      label: <ToolBarMenuItem objectType={ObjectType.Wall} srcImg={WallImage} setFlag={setCategory2Flag} />,
    },
    {
      key: 'add-window',
      label: <ToolBarMenuItem objectType={ObjectType.Window} srcImg={WindowImage} setFlag={setCategory2Flag} />,
    },
    {
      key: 'add-door',
      label: <ToolBarMenuItem objectType={ObjectType.Door} srcImg={DoorImage} setFlag={setCategory2Flag} />,
    },
    {
      key: 'add-pyramid-roof',
      label: (
        <ToolBarMenuItem objectType={ObjectType.PyramidRoof} srcImg={PyramidRoofImage} setFlag={setCategory2Flag} />
      ),
    },
    {
      key: 'add-hip-roof',
      label: <ToolBarMenuItem objectType={ObjectType.HipRoof} srcImg={HipRoofImage} setFlag={setCategory2Flag} />,
    },
    {
      key: 'add-gable-roof',
      label: <ToolBarMenuItem objectType={ObjectType.GableRoof} srcImg={GableRoofImage} setFlag={setCategory2Flag} />,
    },
    {
      key: 'add-gambrel-roof',
      label: (
        <ToolBarMenuItem objectType={ObjectType.GambrelRoof} srcImg={GambrelRoofImage} setFlag={setCategory2Flag} />
      ),
    },
    {
      key: 'add-mansard-roof',
      label: (
        <ToolBarMenuItem objectType={ObjectType.MansardRoof} srcImg={MansardRoofImage} setFlag={setCategory2Flag} />
      ),
    },
  ];

  const category3Menu: MenuProps['items'] = [
    {
      key: 'add-solar-panel',
      label: <ToolBarMenuItem objectType={ObjectType.SolarPanel} srcImg={SolarPanelImage} setFlag={setCategory3Flag} />,
    },
    {
      key: 'add-parabolic-trough',
      label: (
        <ToolBarMenuItem
          objectType={ObjectType.ParabolicTrough}
          srcImg={ParabolicTroughImage}
          setFlag={setCategory3Flag}
        />
      ),
    },
    {
      key: 'add-parabolic-dish',
      label: (
        <ToolBarMenuItem objectType={ObjectType.ParabolicDish} srcImg={ParabolicDishImage} setFlag={setCategory3Flag} />
      ),
    },
    {
      key: 'add-fresnel-reflector',
      label: (
        <ToolBarMenuItem
          objectType={ObjectType.FresnelReflector}
          srcImg={FresnelReflectorImage}
          setFlag={setCategory3Flag}
        />
      ),
    },
    {
      key: 'add-heliostat',
      label: <ToolBarMenuItem objectType={ObjectType.Heliostat} srcImg={HeliostatImage} setFlag={setCategory3Flag} />,
    },
    {
      key: 'add-wind-turbine',
      label: (
        <ToolBarMenuItem objectType={ObjectType.WindTurbine} srcImg={WindTurbineImage} setFlag={setCategory3Flag} />
      ),
    },
    // {
    //   key: 'add-vertical-axis-wind-turbine',
    //   label: <ToolBarMenuItem objectType={ObjectType.VerticalAxisWindTurbine} srcImg={VerticalAxisWindTurbineImage} setFlag={setCategory3Flag} />,
    // },
    {
      key: 'add-sensor',
      label: <ToolBarMenuItem objectType={ObjectType.Sensor} srcImg={SensorImage} setFlag={setCategory3Flag} />,
    },
    {
      key: 'add-light',
      label: <ToolBarMenuItem objectType={ObjectType.Light} srcImg={LightImage} setFlag={setCategory3Flag} />,
    },
    // {
    //   key: 'add-water-heater',
    //   label: <ToolBarMenuItem objectType={ObjectType.WaterHeater} srcImg={WaterHeaterImage} setFlag={setCategory3Flag} />,
    // },
  ];

  const category1Button = (objectType: ObjectType) => {
    switch (objectType) {
      case ObjectType.Foundation:
        return buttonImg(objectType, FoundationImage, useStore.getState().addedFoundationId);
      case ObjectType.Cuboid:
        return buttonImg(objectType, CuboidImage, useStore.getState().addedCuboidId);
      case ObjectType.Tree:
        return buttonImg(objectType, TreeImage);
      case ObjectType.Flower:
        return buttonImg(objectType, FlowerImage);
      case ObjectType.Human:
        return buttonImg(objectType, HumanImage, undefined, 'People');
    }
  };

  const category2Button = (objectType: ObjectType) => {
    switch (objectType) {
      case ObjectType.Wall:
        return buttonImg(objectType, WallImage, useStore.getState().addedWallId);
      case ObjectType.Window:
        return buttonImg(objectType, WindowImage, useStore.getState().addedWindowId);
      case ObjectType.Door:
        return buttonImg(objectType, DoorImage, useStore.getState().addedDoorId);
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
      case ObjectType.VerticalAxisWindTurbine:
        return buttonImg(objectType, VerticalAxisWindTurbineImage);
      case ObjectType.Light:
        return buttonImg(objectType, LightImage);
    }
  };

  const inSelectionMode = () => {
    return (
      objectTypeToAdd === ObjectType.None &&
      !addedFoundationId &&
      !addedCuboidId &&
      !addedWallId &&
      !addedWindowId &&
      !addedDoorId &&
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

      <ToolBarButton>
        <img
          title={i18n.t('toolbar.ManipulateGroup', lang)}
          alt={'Group'}
          src={GroupImage}
          height={36}
          width={36}
          style={{
            filter: groupAction ? selectFilter : defaultFilter,
            cursor: 'pointer',
            verticalAlign: 'middle',
          }}
          onClick={handleGroupActionMode}
        />
      </ToolBarButton>

      {/* add buttons in category 1 */}
      <ToolBarButton>
        {category1Button(category1Flag)}
        {/* {dropdownButton(category1Menu)} */}
        {dropdownButton({ items: category1Menu })}
      </ToolBarButton>

      {/* add buttons in category 2 */}
      <ToolBarButton>
        {category2Button(category2Flag)}
        {dropdownButton({ items: category2Menu })}
      </ToolBarButton>

      {/* add buttons in category 3 */}
      <ToolBarButton>
        {category3Button(category3Flag)}
        {dropdownButton({ items: category3Menu })}
      </ToolBarButton>

      <ToolBarButton>
        <img
          title={i18n.t('toolbar.ClearScene', lang)}
          alt={'Clear'}
          src={ClearImage}
          height={36}
          width={36}
          color={'#666666'}
          style={{ cursor: 'pointer' }}
          onClick={removeAllContent}
        />
      </ToolBarButton>

      <ToolBarButton>
        <img
          title={i18n.t('toolbar.SpatialAnalysisOfEnergy', lang)}
          alt={'Spatial analysis'}
          src={AnalyzeImage}
          height={36}
          width={36}
          color={'#666666'}
          style={{
            filter: showSolarRadiationHeatmap ? selectFilter : defaultFilter,
            cursor: 'pointer',
            verticalAlign: 'middle',
          }}
          onClick={() => {
            if (showSolarRadiationHeatmap) {
              usePrimitiveStore.getState().set((state) => {
                state.showSolarRadiationHeatmap = false;
                state.showHeatFluxes = false;
              });
            } else {
              if (!noAnimationForHeatmapSimulation || Util.hasMovingParts(elements)) {
                toggleDynamicSolarRadiationHeatmap();
              } else {
                toggleStaticSolarRadiationHeatmap();
              }
            }
          }}
        />
      </ToolBarButton>

      <ToolBarButton>
        <img
          title={i18n.t('toolbar.ShowSunAndTimeSettings', lang)}
          alt={'Heliodon'}
          src={HeliodonImage}
          height={36}
          width={36}
          color={'#666666'}
          style={{
            filter: showHeliodonPanel ? selectFilter : defaultFilter,
            cursor: 'pointer',
            verticalAlign: 'middle',
          }}
          onClick={toggleSunAndTimeSettingsPanel}
        />
      </ToolBarButton>
    </div>
  );
};

export default React.memo(MainToolBarButtons);
