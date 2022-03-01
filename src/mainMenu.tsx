/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import sun_angles from './examples/sun_angles.json';
import insolation_and_climate from './examples/insolation_and_climate.json';
import solar_radiation_to_box from './examples/solar_radiation_to_box.json';
import sun_beam_at_center from './examples/sun_beam_at_center.json';
import office_building_01 from './examples/office_building_01.json';
import solar_farm_01 from './examples/solar_farm_01.json';
import solar_farm_02 from './examples/solar_farm_02.json';
import solar_farm_03 from './examples/solar_farm_03.json';
import solar_trackers from './examples/solar_trackers.json';
import simple_house_01 from './examples/simple_house_01.json';
import hotel_01 from './examples/hotel_01.json';
import heatmap_01 from './examples/heatmap_01.json';
import vegetative_buffer_01 from './examples/vegetative_buffer_01.json';
import effect_tilt_angle_solar_panel from './examples/effect_tilt_angle_solar_panel.json';
import effect_azimuth_solar_panel from './examples/effect_azimuth_solar_panel.json';
import effect_azimuth_parabolic_trough from './examples/effect_azimuth_parabolic_trough.json';
import effect_latus_rectum_parabolic_trough from './examples/effect_latus_rectum_parabolic_trough.json';
import effect_orientation_solar_panel from './examples/effect_orientation_solar_panel.json';
import why_solar_array from './examples/why_solar_array.json';
import solar_canopy_form_factors from './examples/solar_canopy_form_factors.json';
import inter_row_spacing from './examples/inter_row_spacing.json';
import parabolic_trough_array from './examples/parabolic_trough_array.json';
import parabolic_dish_focus_sunlight from './examples/parabolic_dish_focus_sunlight.json';
import parabolic_dish_array from './examples/parabolic_dish_array.json';
import linear_fresnel_reflectors from './examples/linear_fresnel_reflectors.json';
import linear_fresnel_reflectors_two_receivers from './examples/linear_fresnel_reflectors_two_receivers.json';
import effect_receiver_tube_height from './examples/effect_receiver_tube_height.json';
import effect_azimuth_fresnel_reflector from './examples/effect_azimuth_fresnel_reflector.json';
import cosine_efficiency_heliostats from './examples/cosine_efficiency_heliostats.json';
import shadowing_blocking_heliostats from './examples/shadowing_blocking_heliostats.json';
import effect_solar_power_tower_height from './examples/effect_solar_power_tower_height.json';
import solar_power_tower from './examples/solar_power_tower.json';
import solar_radiation_predicted_vs_measured from './examples/solar_radiation_predicted_vs_measured.json';

import zhCN from 'antd/lib/locale/zh_CN';
import zhTW from 'antd/lib/locale/zh_TW';
import esES from 'antd/lib/locale/es_ES';
import trTR from 'antd/lib/locale/tr_TR';
import enUS from 'antd/lib/locale/en_US';

import React, { useState } from 'react';
import { useStore } from './stores/common';
import styled from 'styled-components';
import { Checkbox, Dropdown, InputNumber, Menu, Modal, Radio, Space, Switch } from 'antd';
import logo from './assets/magic-lamp.png';
import 'antd/dist/antd.css';
import About from './about';
import { saveImage, showInfo } from './helpers';
import { Language, ObjectType } from './types';
import * as Selector from './stores/selector';
import i18n from './i18n/i18n';
import { Util } from './Util';
import { UndoableCheck } from './undo/UndoableCheck';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { UndoableResetView } from './undo/UndoableResetView';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Undoable } from './undo/Undoable';
import { useStoreRef } from './stores/commonRef';
import { UndoableDelete } from './undo/UndoableDelete';
import { UndoablePaste } from './undo/UndoablePaste';
import CspSimulationSettings from './components/contextMenu/elementMenu/cspSimulationSettings';
import PvSimulationSettings from './components/contextMenu/elementMenu/pvSimulationSettings';

const { SubMenu } = Menu;

const radioStyle = {
  display: 'block',
  height: '30px',
  paddingLeft: '10px',
  lineHeight: '30px',
};

const StyledImage = styled.img`
  position: absolute;
  top: 10px;
  left: 10px;
  height: 40px;
  transition: 0.5s;
  opacity: 1;
  cursor: pointer;
  user-select: none;

  &:hover {
    opacity: 0.5;
  }
`;

const LabelContainer = styled.div`
  position: absolute;
  top: 54px;
  left: 0;
  width: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  z-index: 9;
`;

export interface MainMenuProps {
  viewOnly: boolean;
  set2DView: (selected: boolean) => void;
  resetView: () => void;
  zoomView: (scale: number) => void;
  canvas?: HTMLCanvasElement | null;
}

const MainMenu = ({ viewOnly, set2DView, resetView, zoomView, canvas }: MainMenuProps) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const elements = useStore.getState().elements;
  const selectNone = useStore(Selector.selectNone);
  const undoManager = useStore(Selector.undoManager);
  const addUndoable = useStore(Selector.addUndoable);
  const timesPerHour = useStore(Selector.world.timesPerHour);
  const solarPanelVisibilityGridCellSize = useStore(Selector.world.solarPanelVisibilityGridCellSize);
  const solarRadiationHeatmapGridCellSize = useStore(Selector.world.solarRadiationHeatmapGridCellSize);
  const solarRadiationHeatmapMaxValue = useStore(Selector.viewState.solarRadiationHeatmapMaxValue);
  const orthographic = useStore(Selector.viewState.orthographic);
  const autoRotate = useStore(Selector.viewState.autoRotate);
  const showSiteInfoPanel = useStore(Selector.viewState.showSiteInfoPanel);
  const showDesignInfoPanel = useStore(Selector.viewState.showDesignInfoPanel);
  const showInstructionPanel = useStore(Selector.viewState.showInstructionPanel);
  const showMapPanel = useStore(Selector.viewState.showMapPanel);
  const showWeatherPanel = useStore(Selector.viewState.showWeatherPanel);
  const showStickyNotePanel = useStore(Selector.viewState.showStickyNotePanel);
  const showHeliodonPanel = useStore(Selector.viewState.showHeliodonPanel);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const cameraPosition = useStore(Selector.viewState.cameraPosition);
  const panCenter = useStore(Selector.viewState.panCenter);
  const importContent = useStore(Selector.importContent);
  const changed = useStore(Selector.changed);
  const cloudFile = useStore(Selector.cloudFile);
  const user = useStore(Selector.user);
  const axes = useStore(Selector.viewState.axes);
  const countObservers = useStore(Selector.countObservers);
  const countElementsByType = useStore(Selector.countElementsByType);
  const selectedElement = useStore(Selector.selectedElement);
  const elementsToPaste = useStore(Selector.elementsToPaste);
  const pasteElements = useStore(Selector.pasteElementsByKey);
  const copyElementById = useStore(Selector.copyElementById);
  const removeElementById = useStore(Selector.removeElementById);
  const copyCutElements = useStore(Selector.copyCutElements);
  const getElementById = useStore(Selector.getElementById);
  const runDynamicSimulation = useStore(Selector.runDynamicSimulation);
  const runStaticSimulation = useStore(Selector.runStaticSimulation);
  const noAnimationForHeatmapSimulation = useStore(Selector.world.noAnimationForHeatmapSimulation);
  const noAnimationForSensorDataCollection = useStore(Selector.world.noAnimationForSensorDataCollection);
  const solarRadiationHeatmapReflectionOnly = useStore(Selector.viewState.solarRadiationHeatmapReflectionOnly);

  const [aboutUs, setAboutUs] = useState(false);

  const lang = { lng: language };
  const isMac = Util.getOS()?.startsWith('Mac');

  const openAboutUs = (on: boolean) => {
    setAboutUs(on);
  };

  const gotoAboutPage = () => {
    openAboutUs(true);
  };

  const takeScreenshot = () => {
    if (canvas) {
      saveImage('screenshot.png', canvas.toDataURL('image/png'));
    }
  };

  const loadFile = (e: any) => {
    let input: any;
    switch (e.key) {
      case 'sun_angles':
        input = sun_angles;
        break;
      case 'insolation_and_climate':
        input = insolation_and_climate;
        break;
      case 'solar_radiation_to_box':
        input = solar_radiation_to_box;
        break;
      case 'sun_beam_at_center':
        input = sun_beam_at_center;
        break;
      case 'office_building_01':
        input = office_building_01;
        break;
      case 'hotel_01':
        input = hotel_01;
        break;
      case 'heatmap_01':
        input = heatmap_01;
        break;
      case 'vegetative_buffer_01':
        input = vegetative_buffer_01;
        break;
      case 'solar_canopy_form_factors':
        input = solar_canopy_form_factors;
        break;
      case 'effect_tilt_angle_solar_panel':
        input = effect_tilt_angle_solar_panel;
        break;
      case 'effect_azimuth_solar_panel':
        input = effect_azimuth_solar_panel;
        break;
      case 'effect_azimuth_parabolic_trough':
        input = effect_azimuth_parabolic_trough;
        break;
      case 'effect_latus_rectum_parabolic_trough':
        input = effect_latus_rectum_parabolic_trough;
        break;
      case 'parabolic_dish_focus_sunlight':
        input = parabolic_dish_focus_sunlight;
        break;
      case 'effect_orientation_solar_panel':
        input = effect_orientation_solar_panel;
        break;
      case 'why_solar_array':
        input = why_solar_array;
        break;
      case 'inter_row_spacing':
        input = inter_row_spacing;
        break;
      case 'solar_farm_01':
        input = solar_farm_01;
        break;
      case 'solar_farm_02':
        input = solar_farm_02;
        break;
      case 'solar_farm_03':
        input = solar_farm_03;
        break;
      case 'solar_trackers':
        input = solar_trackers;
        break;
      case 'parabolic_trough_array':
        input = parabolic_trough_array;
        break;
      case 'parabolic_dish_array':
        input = parabolic_dish_array;
        break;
      case 'linear_fresnel_reflectors':
        input = linear_fresnel_reflectors;
        break;
      case 'linear_fresnel_reflectors_two_receivers':
        input = linear_fresnel_reflectors_two_receivers;
        break;
      case 'effect_receiver_tube_height':
        input = effect_receiver_tube_height;
        break;
      case 'effect_azimuth_fresnel_reflector':
        input = effect_azimuth_fresnel_reflector;
        break;
      case 'cosine_efficiency_heliostats':
        input = cosine_efficiency_heliostats;
        break;
      case 'shadowing_blocking_heliostats':
        input = shadowing_blocking_heliostats;
        break;
      case 'effect_solar_power_tower_height':
        input = effect_solar_power_tower_height;
        break;
      case 'solar_power_tower':
        input = solar_power_tower;
        break;
      case 'simple_house_01':
        input = simple_house_01;
        break;
      case 'solar_radiation_predicted_vs_measured':
        input = solar_radiation_predicted_vs_measured;
        break;
    }
    if (input) {
      if (!viewOnly && changed) {
        Modal.confirm({
          title: i18n.t('message.DoYouWantToSaveChanges', lang),
          icon: <ExclamationCircleOutlined />,
          onOk: () => saveAndImport(input),
          onCancel: () => importContent(input),
          okText: i18n.t('word.Yes', lang),
          cancelText: i18n.t('word.No', lang),
        });
      } else {
        importContent(input);
      }
    }
  };

  const saveAndImport = (input: any) => {
    if (cloudFile) {
      setCommonStore((state) => {
        state.localContentToImportAfterCloudFileUpdate = input;
        state.saveCloudFileFlag = !state.saveCloudFileFlag;
      });
    } else {
      if (user.uid) {
        // no cloud file has been created
        setCommonStore((state) => {
          state.localContentToImportAfterCloudFileUpdate = input;
          state.showCloudFileTitleDialogFlag = !state.showCloudFileTitleDialogFlag;
          state.showCloudFileTitleDialog = true;
        });
      } else {
        showInfo(i18n.t('menu.file.ToSaveYourWorkPleaseSignIn', lang));
      }
    }
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
            state.updateSceneRadius();
          }
        });
      },
      redo: () => {
        setCommonStore((state) => {
          state.viewState.shadowEnabled = undoableCheck.checked;
          if (state.viewState.shadowEnabled) {
            state.updateSceneRadius();
          }
        });
      },
    } as UndoableCheck;
    addUndoable(undoableCheck);
    setCommonStore((state) => {
      state.viewState.shadowEnabled = !state.viewState.shadowEnabled;
      if (state.viewState.shadowEnabled) {
        state.updateSceneRadius();
      }
    });
  };

  const toggleSiteInfoPanel = () => {
    const undoableCheck = {
      name: 'Show Site Information',
      timestamp: Date.now(),
      checked: !showSiteInfoPanel,
      undo: () => {
        setCommonStore((state) => {
          state.viewState.showSiteInfoPanel = !undoableCheck.checked;
        });
      },
      redo: () => {
        setCommonStore((state) => {
          state.viewState.showSiteInfoPanel = undoableCheck.checked;
        });
      },
    } as UndoableCheck;
    addUndoable(undoableCheck);
    setCommonStore((state) => {
      state.viewState.showSiteInfoPanel = !state.viewState.showSiteInfoPanel;
    });
  };

  const toggleDesignInfoPanel = () => {
    const undoableCheck = {
      name: 'Show Design Information',
      timestamp: Date.now(),
      checked: !showDesignInfoPanel,
      undo: () => {
        setCommonStore((state) => {
          state.viewState.showDesignInfoPanel = !undoableCheck.checked;
        });
      },
      redo: () => {
        setCommonStore((state) => {
          state.viewState.showDesignInfoPanel = undoableCheck.checked;
        });
      },
    } as UndoableCheck;
    addUndoable(undoableCheck);
    setCommonStore((state) => {
      state.viewState.showDesignInfoPanel = !state.viewState.showDesignInfoPanel;
    });
  };

  const toggleInstructionPanel = () => {
    const undoableCheck = {
      name: 'Show Instruction Panel',
      timestamp: Date.now(),
      checked: !showInstructionPanel,
      undo: () => {
        setCommonStore((state) => {
          state.viewState.showInstructionPanel = !undoableCheck.checked;
        });
      },
      redo: () => {
        setCommonStore((state) => {
          state.viewState.showInstructionPanel = undoableCheck.checked;
        });
      },
    } as UndoableCheck;
    addUndoable(undoableCheck);
    setCommonStore((state) => {
      state.viewState.showInstructionPanel = !state.viewState.showInstructionPanel;
    });
  };

  const toggleStickyNote = () => {
    const undoableCheck = {
      name: 'Show Sticky Note',
      timestamp: Date.now(),
      checked: !showStickyNotePanel,
      undo: () => {
        setCommonStore((state) => {
          state.viewState.showStickyNotePanel = !undoableCheck.checked;
        });
      },
      redo: () => {
        setCommonStore((state) => {
          state.viewState.showStickyNotePanel = undoableCheck.checked;
        });
      },
    } as UndoableCheck;
    addUndoable(undoableCheck);
    setCommonStore((state) => {
      state.viewState.showStickyNotePanel = !state.viewState.showStickyNotePanel;
    });
  };

  const openHeliodonPanel = () => {
    const undoable = {
      name: 'Open Heliodon Control Panel',
      timestamp: Date.now(),
      undo: () => {
        setCommonStore((state) => {
          state.viewState.showHeliodonPanel = false;
        });
      },
      redo: () => {
        setCommonStore((state) => {
          state.viewState.showHeliodonPanel = true;
        });
      },
    } as Undoable;
    addUndoable(undoable);
    setCommonStore((state) => {
      state.viewState.showHeliodonPanel = true;
    });
  };

  const openMapPanel = () => {
    const undoable = {
      name: 'Open Maps',
      timestamp: Date.now(),
      undo: () => {
        setCommonStore((state) => {
          state.viewState.showMapPanel = false;
        });
      },
      redo: () => {
        setCommonStore((state) => {
          state.viewState.showMapPanel = true;
        });
      },
    } as Undoable;
    addUndoable(undoable);
    setCommonStore((state) => {
      state.viewState.showMapPanel = true;
    });
  };

  const openWeatherPanel = () => {
    const undoable = {
      name: 'Open Weather Panel',
      timestamp: Date.now(),
      undo: () => {
        setCommonStore((state) => {
          state.viewState.showWeatherPanel = false;
        });
      },
      redo: () => {
        setCommonStore((state) => {
          state.viewState.showWeatherPanel = true;
        });
      },
    } as Undoable;
    addUndoable(undoable);
    setCommonStore((state) => {
      state.viewState.showWeatherPanel = true;
    });
  };

  const toggleAxes = (e: CheckboxChangeEvent) => {
    const checked = e.target.checked;
    const undoableCheck = {
      name: 'Show Axes',
      timestamp: Date.now(),
      checked: checked,
      undo: () => {
        setCommonStore((state) => {
          state.viewState.axes = !undoableCheck.checked;
        });
      },
      redo: () => {
        setCommonStore((state) => {
          state.viewState.axes = undoableCheck.checked;
        });
      },
    } as UndoableCheck;
    addUndoable(undoableCheck);
    setCommonStore((state) => {
      state.viewState.axes = checked;
    });
  };

  const toggle2DView = (e: CheckboxChangeEvent) => {
    const undoableCheck = {
      name: 'Toggle 2D View',
      timestamp: Date.now(),
      checked: !orthographic,
      undo: () => {
        set2DView(!undoableCheck.checked);
      },
      redo: () => {
        set2DView(undoableCheck.checked);
      },
    } as UndoableCheck;
    addUndoable(undoableCheck);
    set2DView(e.target.checked);
    setCommonStore((state) => {
      state.viewState.autoRotate = false;
    });
  };

  const toggleAutoRotate = () => {
    if (!orthographic) {
      const undoableCheck = {
        name: 'Auto Rotate',
        timestamp: Date.now(),
        checked: !autoRotate,
        undo: () => {
          setCommonStore((state) => {
            state.objectTypeToAdd = ObjectType.None;
            state.viewState.autoRotate = !undoableCheck.checked;
          });
        },
        redo: () => {
          setCommonStore((state) => {
            state.objectTypeToAdd = ObjectType.None;
            state.viewState.autoRotate = undoableCheck.checked;
          });
        },
      } as UndoableCheck;
      addUndoable(undoableCheck);
      setCommonStore((state) => {
        state.objectTypeToAdd = ObjectType.None;
        state.viewState.autoRotate = !state.viewState.autoRotate;
      });
    }
  };

  const copySelectedElement = () => {
    if (selectedElement) {
      copyElementById(selectedElement.id);
    }
  };

  const cutSelectedElement = () => {
    if (selectedElement) {
      removeElementById(selectedElement.id, true);
      const cutElements = copyCutElements();
      const undoableCut = {
        name: 'Cut',
        timestamp: Date.now(),
        deletedElements: cutElements,
        undo: () => {
          setCommonStore((state) => {
            if (undoableCut.deletedElements && undoableCut.deletedElements.length > 0) {
              for (const e of undoableCut.deletedElements) {
                state.elements.push(e);
              }
              state.selectedElement = undoableCut.deletedElements[0];
            }
          });
        },
        redo: () => {
          if (undoableCut.deletedElements && undoableCut.deletedElements.length > 0) {
            const elem = getElementById(undoableCut.deletedElements[0].id);
            if (elem) {
              removeElementById(elem.id, true);
            }
          }
        },
      } as UndoableDelete;
      addUndoable(undoableCut);
    }
  };

  const pasteSelectedElement = () => {
    if (elementsToPaste && elementsToPaste.length > 0) {
      const pastedElements = pasteElements();
      if (pastedElements.length > 0) {
        const undoablePaste = {
          name: 'Paste by Key',
          timestamp: Date.now(),
          pastedElements: JSON.parse(JSON.stringify(pastedElements)),
          undo: () => {
            for (const elem of undoablePaste.pastedElements) {
              removeElementById(elem.id, false);
            }
          },
          redo: () => {
            setCommonStore((state) => {
              state.elements.push(...undoablePaste.pastedElements);
              state.selectedElement = undoablePaste.pastedElements[0];
              state.updateDesignInfo();
            });
          },
        } as UndoablePaste;
        addUndoable(undoablePaste);
      }
    }
  };

  const viewAlreadyReset =
    cameraPosition[0] === cameraPosition[1] &&
    cameraPosition[1] === cameraPosition[2] &&
    panCenter[0] === 0 &&
    panCenter[1] === 0 &&
    panCenter[2] === 0;

  const toggleStaticSolarRadiationHeatmap = () => {
    if (!runStaticSimulation) {
      showInfo(i18n.t('message.SimulationStarted', lang));
    }
    // give it 0.1 second for the info to show up
    setTimeout(() => {
      selectNone();
      setCommonStore((state) => {
        state.runStaticSimulation = !state.runStaticSimulation;
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
      });
    }, 100);
  };

  const readyToPaste = elementsToPaste && elementsToPaste.length > 0;

  const menu = (
    <Menu>
      {/* file menu */}
      <SubMenu key={'file'} title={i18n.t('menu.fileSubMenu', lang)}>
        <Menu.Item
          key="create-new-file"
          onClick={() => {
            undoManager.clear();
            setCommonStore((state) => {
              state.createNewFileFlag = !state.createNewFileFlag;
              state.objectTypeToAdd = ObjectType.None;
            });
          }}
        >
          {i18n.t('menu.file.CreateNewFile', lang)}
          <label style={{ paddingLeft: '2px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+F)</label>
        </Menu.Item>

        <Menu.Item
          key="open-local-file"
          onClick={() => {
            undoManager.clear();
            setCommonStore((state) => {
              state.openLocalFileFlag = !state.openLocalFileFlag;
              state.objectTypeToAdd = ObjectType.None;
            });
          }}
        >
          {i18n.t('menu.file.OpenLocalFile', lang)}
          <label style={{ paddingLeft: '2px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+O)</label>
        </Menu.Item>

        <Menu.Item
          key="save-local-file"
          onClick={() => {
            setCommonStore((state) => {
              state.saveLocalFileDialogVisible = true;
            });
          }}
        >
          {i18n.t('menu.file.SaveAsLocalFile', lang)}
          <label style={{ paddingLeft: '2px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+S)</label>
        </Menu.Item>

        {user.uid && (
          <Menu.Item
            key="open-cloud-file"
            onClick={() => {
              setCommonStore((state) => {
                state.listCloudFilesFlag = !state.listCloudFilesFlag;
              });
            }}
          >
            {i18n.t('menu.file.OpenCloudFile', lang)}
            <label style={{ paddingLeft: '2px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+Shift+O)</label>
          </Menu.Item>
        )}

        {user.uid && cloudFile && (
          <Menu.Item
            key="save-cloud-file"
            onClick={() => {
              setCommonStore((state) => {
                state.saveCloudFileFlag = !state.saveCloudFileFlag;
              });
            }}
          >
            {i18n.t('menu.file.SaveCloudFile', lang)}
            <label style={{ paddingLeft: '2px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+Shift+S)</label>
          </Menu.Item>
        )}

        {user.uid && (
          <Menu.Item
            key="save-as-cloud-file"
            onClick={() => {
              setCommonStore((state) => {
                state.showCloudFileTitleDialogFlag = !state.showCloudFileTitleDialogFlag;
                state.showCloudFileTitleDialog = true;
              });
            }}
          >
            {i18n.t('menu.file.SaveAsCloudFile', lang)}
          </Menu.Item>
        )}

        <Menu.Item key="screenshot" onClick={takeScreenshot}>
          {i18n.t('menu.file.TakeScreenshot', lang)}
        </Menu.Item>
      </SubMenu>

      {/* edit menu */}
      {(selectedElement || readyToPaste || undoManager.hasUndo() || undoManager.hasRedo()) && (
        <SubMenu key={'edit'} title={i18n.t('menu.editSubMenu', lang)}>
          {selectedElement && (
            <Menu.Item key="copy" onClick={copySelectedElement}>
              {i18n.t('word.Copy', lang)}
              <label style={{ paddingLeft: '2px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+C)</label>
            </Menu.Item>
          )}
          {selectedElement && (
            <Menu.Item key="cut" onClick={cutSelectedElement}>
              {i18n.t('word.Cut', lang)}
              <label style={{ paddingLeft: '2px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+X)</label>
            </Menu.Item>
          )}
          {readyToPaste && (
            <Menu.Item key="paste" onClick={pasteSelectedElement}>
              {i18n.t('word.Paste', lang)}
              <label style={{ paddingLeft: '2px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+V)</label>
            </Menu.Item>
          )}
          {undoManager.hasUndo() && (
            <Menu.Item
              key="undo"
              onClick={() => {
                if (undoManager.hasUndo()) {
                  undoManager.undo();
                }
              }}
            >
              {i18n.t('menu.edit.Undo', lang)}
              <label style={{ paddingLeft: '2px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+Z)</label>
            </Menu.Item>
          )}
          {undoManager.hasRedo() && (
            <Menu.Item
              key="redo"
              onClick={() => {
                if (undoManager.hasRedo()) {
                  undoManager.redo();
                }
              }}
            >
              {i18n.t('menu.edit.Redo', lang)}
              <label style={{ paddingLeft: '2px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+Y)</label>
            </Menu.Item>
          )}
        </SubMenu>
      )}

      {/* view menu */}
      <SubMenu key={'view'} title={i18n.t('menu.viewSubMenu', lang)}>
        {!orthographic && !viewAlreadyReset && (
          <Menu.Item
            key={'reset-view'}
            onClick={() => {
              const undoableResetView = {
                name: 'Reset View',
                timestamp: Date.now(),
                oldCameraPosition: [...cameraPosition],
                oldPanCenter: [...panCenter],
                undo: () => {
                  const orbitControlsRef = useStoreRef.getState().orbitControlsRef;
                  if (orbitControlsRef?.current) {
                    orbitControlsRef.current.object.position.set(
                      undoableResetView.oldCameraPosition[0],
                      undoableResetView.oldCameraPosition[1],
                      undoableResetView.oldCameraPosition[2],
                    );
                    orbitControlsRef.current.target.set(
                      undoableResetView.oldPanCenter[0],
                      undoableResetView.oldPanCenter[1],
                      undoableResetView.oldPanCenter[2],
                    );
                    orbitControlsRef.current.update();
                    setCommonStore((state) => {
                      const v = state.viewState;
                      v.cameraPosition = [...undoableResetView.oldCameraPosition];
                      v.panCenter = [...undoableResetView.oldPanCenter];
                    });
                  }
                },
                redo: () => {
                  resetView();
                },
              } as UndoableResetView;
              addUndoable(undoableResetView);
              resetView();
              setCommonStore((state) => {
                state.objectTypeToAdd = ObjectType.None;
                state.viewState.orthographic = false;
              });
            }}
            style={{ paddingLeft: '36px' }}
          >
            {i18n.t('menu.view.ResetView', lang)}
            <label style={{ paddingLeft: '2px', fontSize: 9 }}>(Ctrl+Home)</label>
          </Menu.Item>
        )}
        <Menu.Item
          key={'zoom-out-view'}
          onClick={() => {
            zoomView(1.1);
          }}
          style={{ paddingLeft: '36px' }}
        >
          {i18n.t('menu.view.ZoomOut', lang)}
          <label style={{ paddingLeft: '2px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+])</label>
        </Menu.Item>
        <Menu.Item
          key={'zoom-in-view'}
          onClick={() => {
            zoomView(0.9);
          }}
          style={{ paddingLeft: '36px' }}
        >
          {i18n.t('menu.view.ZoomIn', lang)}
          <label style={{ paddingLeft: '2px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+[)</label>
        </Menu.Item>
        <Menu.Item key={'axes-check-box'}>
          <Checkbox checked={axes} onChange={toggleAxes}>
            {i18n.t('skyMenu.Axes', lang)}
          </Checkbox>
        </Menu.Item>
        <Menu.Item key={'orthographic-check-box'}>
          <Checkbox checked={orthographic} onChange={toggle2DView}>
            {i18n.t('menu.view.TwoDimensionalView', lang)}
            <label style={{ paddingLeft: '2px', fontSize: 9 }}>(F2)</label>
          </Checkbox>
        </Menu.Item>
        {!orthographic && (
          <Menu.Item key={'auto-rotate-check-box'}>
            <Checkbox checked={autoRotate} onChange={toggleAutoRotate}>
              {i18n.t('menu.view.AutoRotate', lang)}
              <label style={{ paddingLeft: '2px', fontSize: 9 }}>(F4)</label>
            </Checkbox>
          </Menu.Item>
        )}
        <Menu.Item key={'shadow-check-box'}>
          <Checkbox checked={shadowEnabled} onChange={toggleShadow}>
            {i18n.t('menu.view.ShowShadow', lang)}
          </Checkbox>
        </Menu.Item>
        <Menu.Item key={'site-info-panel-check-box'}>
          <Checkbox checked={showSiteInfoPanel} onChange={toggleSiteInfoPanel}>
            {i18n.t('menu.view.SiteInformation', lang)}
          </Checkbox>
        </Menu.Item>
        <Menu.Item key={'design-info-panel-check-box'}>
          <Checkbox checked={showDesignInfoPanel} onChange={toggleDesignInfoPanel}>
            {i18n.t('menu.view.DesignInformation', lang)}
          </Checkbox>
        </Menu.Item>
        <Menu.Item key={'instruction-panel-check-box'}>
          <Checkbox checked={showInstructionPanel} onChange={toggleInstructionPanel}>
            {i18n.t('menu.view.Instruction', lang)}
          </Checkbox>
        </Menu.Item>
        <Menu.Item key={'sticky-note-panel-check-box'}>
          <Checkbox checked={showStickyNotePanel} onChange={toggleStickyNote}>
            {i18n.t('menu.view.StickyNote', lang)}
          </Checkbox>
        </Menu.Item>
      </SubMenu>

      {/* tool menu */}
      <SubMenu key={'tool'} title={i18n.t('menu.toolSubMenu', lang)}>
        {!showHeliodonPanel && (
          <Menu.Item key={'heliodon-panel-check-box'} onClick={openHeliodonPanel}>
            {i18n.t('menu.tool.SunAndTime', lang)}
          </Menu.Item>
        )}
        {!showMapPanel && (
          <Menu.Item key={'map-panel-check-box'} onClick={openMapPanel}>
            {i18n.t('menu.tool.Map', lang)}
          </Menu.Item>
        )}
        {!showWeatherPanel && (
          <Menu.Item key={'weather-panel-check-box'} onClick={openWeatherPanel}>
            {i18n.t('menu.tool.WeatherData', lang)}
          </Menu.Item>
        )}
        <SubMenu key={'benchmarks'} title={i18n.t('menu.benchmarksSubMenu', lang)}>
          <Menu.Item key="solar_radiation_predicted_vs_measured" onClick={loadFile}>
            {i18n.t('menu.benchmarks.SolarRadiationPredictionVsMeasurement', lang)}
          </Menu.Item>
        </SubMenu>
      </SubMenu>

      {/* analysis menu */}
      <SubMenu key={'analysis'} title={i18n.t('menu.analysisSubMenu', lang)}>
        {/* physics */}
        <SubMenu key={'physics'} title={i18n.t('menu.physicsSubMenu', lang)}>
          <Menu.Item
            key={'daily-solar-radiation-heatmap'}
            onClick={
              !noAnimationForHeatmapSimulation || Util.hasMovingParts(elements)
                ? toggleDynamicSolarRadiationHeatmap
                : toggleStaticSolarRadiationHeatmap
            }
          >
            {i18n.t('menu.physics.DailySolarRadiationHeatmap', lang)}
          </Menu.Item>
          <SubMenu
            key={'solar-radiation-heatmap-options'}
            title={i18n.t('menu.physics.SolarRadiationHeatmapOptions', lang)}
          >
            <Menu>
              <Menu.Item key={'solar-radiation-heatmap-grid-cell-size'}>
                <Space style={{ width: '280px' }}>
                  {i18n.t('menu.physics.SolarRadiationHeatmapGridCellSize', lang) + ':'}
                </Space>
                <InputNumber
                  min={0.1}
                  max={20}
                  step={0.1}
                  style={{ width: 60 }}
                  precision={1}
                  value={solarRadiationHeatmapGridCellSize ?? 0.5}
                  formatter={(a) => Number(a).toFixed(1)}
                  onChange={(value) => {
                    setCommonStore((state) => {
                      state.world.solarRadiationHeatmapGridCellSize = value;
                    });
                  }}
                />
                <Space style={{ paddingLeft: '10px' }}>{i18n.t('word.MeterAbbreviation', lang)}</Space>
              </Menu.Item>
              <Menu.Item key={'solar-radiation-heatmap-max-value'}>
                <Space style={{ width: '280px' }}>
                  {i18n.t('menu.physics.SolarRadiationHeatmapMaxValue', lang) + ':'}
                </Space>
                <InputNumber
                  min={0.5}
                  max={50}
                  step={0.5}
                  style={{ width: 60 }}
                  precision={1}
                  value={solarRadiationHeatmapMaxValue ?? 5}
                  formatter={(a) => Number(a).toFixed(1)}
                  onChange={(value) => {
                    setCommonStore((state) => {
                      state.viewState.solarRadiationHeatMapMaxValue = value;
                    });
                  }}
                />
              </Menu.Item>
              {Util.hasHeliostatOrFresnelReflectors(elements) && (
                <Menu.Item key={'solar-radiation-heatmap-reflection-only'}>
                  <Space style={{ width: '280px' }}>{i18n.t('menu.physics.ReflectionHeatmap', lang) + ':'}</Space>
                  <Switch
                    checked={solarRadiationHeatmapReflectionOnly}
                    onChange={(checked) => {
                      setCommonStore((state) => {
                        state.viewState.solarRadiationHeatMapReflectionOnly = checked;
                      });
                    }}
                  />
                </Menu.Item>
              )}
              {!Util.hasMovingParts(elements) && (
                <Menu.Item key={'solar-radiation-heatmap-no-animation'}>
                  <Space style={{ width: '280px' }}>
                    {i18n.t('menu.physics.SolarRadiationHeatmapNoAnimation', lang) + ':'}
                  </Space>
                  <Switch
                    checked={noAnimationForHeatmapSimulation}
                    onChange={(checked) => {
                      setCommonStore((state) => {
                        state.world.noAnimationForHeatmapSimulation = checked;
                      });
                    }}
                  />
                </Menu.Item>
              )}
            </Menu>
          </SubMenu>
        </SubMenu>

        {/* sensors */}
        <SubMenu key={'sensors'} title={i18n.t('menu.sensorSubMenu', lang)}>
          <Menu.Item
            key={'sensor-collect-daily-data'}
            onClick={() => {
              const sensorCount = countElementsByType(ObjectType.Sensor);
              if (sensorCount === 0) {
                showInfo(i18n.t('analysisManager.NoSensorForCollectingData', lang));
                return;
              }
              showInfo(i18n.t('message.SimulationStarted', lang));
              // give it 0.1 second for the info to show up
              setTimeout(() => {
                setCommonStore((state) => {
                  state.simulationInProgress = true;
                  state.runDailyLightSensor = true;
                });
              }, 100);
            }}
          >
            {i18n.t('menu.sensor.CollectDailyData', lang)}
          </Menu.Item>
          <Menu.Item
            key={'sensor-collect-yearly-data'}
            onClick={() => {
              const sensorCount = countElementsByType(ObjectType.Sensor);
              if (sensorCount === 0) {
                showInfo(i18n.t('analysisManager.NoSensorForCollectingData', lang));
                return;
              }
              showInfo(i18n.t('message.SimulationStarted', lang));
              // give it 0.1 second for the info to show up
              setTimeout(() => {
                setCommonStore((state) => {
                  state.simulationInProgress = true;
                  state.runYearlyLightSensor = true;
                });
              }, 100);
            }}
          >
            {i18n.t('menu.sensor.CollectYearlyData', lang)}
          </Menu.Item>
          <SubMenu key={'sensor-simulation-options'} title={i18n.t('word.Options', lang)}>
            <Menu>
              <Menu.Item key={'sensor-simulation-sampling-frequency'}>
                <Space style={{ width: '150px' }}>{i18n.t('menu.option.SamplingFrequency', lang) + ':'}</Space>
                <InputNumber
                  min={1}
                  max={60}
                  step={1}
                  style={{ width: 60 }}
                  precision={0}
                  value={timesPerHour}
                  formatter={(a) => Number(a).toFixed(0)}
                  onChange={(value) => {
                    setCommonStore((state) => {
                      state.world.timesPerHour = value;
                    });
                  }}
                />
                <Space style={{ paddingLeft: '10px' }}>{i18n.t('menu.option.TimesPerHour', lang)}</Space>
              </Menu.Item>
              {!Util.hasMovingParts(elements) && (
                <Menu.Item key={'sensor-simulation-no-animation'}>
                  <Space style={{ width: '280px' }}>
                    {i18n.t('menu.sensor.SensorSimulationNoAnimation', lang) + ':'}
                  </Space>
                  <Switch
                    checked={noAnimationForSensorDataCollection}
                    onChange={(checked) => {
                      setCommonStore((state) => {
                        state.world.noAnimationForSensorDataCollection = checked;
                      });
                    }}
                  />
                </Menu.Item>
              )}
            </Menu>
          </SubMenu>
        </SubMenu>

        {/* solar panels */}
        <SubMenu key={'solar-panels'} title={i18n.t('menu.solarPanelSubMenu', lang)}>
          <Menu.Item
            key={'solar-panel-daily-yield'}
            onClick={() => {
              const solarPanelCount = countElementsByType(ObjectType.SolarPanel);
              if (solarPanelCount === 0) {
                showInfo(i18n.t('analysisManager.NoSolarPanelForAnalysis', lang));
                return;
              }
              showInfo(i18n.t('message.SimulationStarted', lang));
              // give it 0.1 second for the info to show up
              setTimeout(() => {
                setCommonStore((state) => {
                  state.simulationInProgress = true;
                  state.dailyPvIndividualOutputs = false;
                  state.runDailySimulationForSolarPanels = true;
                });
              }, 100);
            }}
          >
            {i18n.t('menu.solarPanel.AnalyzeDailyYield', lang)}
          </Menu.Item>
          <Menu.Item
            key={'solar-panel-yearly-yield'}
            onClick={() => {
              const solarPanelCount = countElementsByType(ObjectType.SolarPanel);
              if (solarPanelCount === 0) {
                showInfo(i18n.t('analysisManager.NoSolarPanelForAnalysis', lang));
                return;
              }
              showInfo(i18n.t('message.SimulationStarted', lang));
              // give it 0.1 second for the info to show up
              setTimeout(() => {
                setCommonStore((state) => {
                  state.simulationInProgress = true;
                  state.yearlyPvIndividualOutputs = false;
                  state.runYearlySimulationForSolarPanels = true;
                });
              }, 100);
            }}
          >
            {i18n.t('menu.solarPanel.AnalyzeYearlyYield', lang)}
          </Menu.Item>
          <PvSimulationSettings />
          <Menu.Item
            key={'solar-panel-visibility'}
            onClick={() => {
              const observerCount = countObservers();
              if (observerCount === 0) {
                showInfo(i18n.t('analysisManager.NoObserverForVisibilityAnalysis', lang));
                return;
              }
              showInfo(i18n.t('message.SimulationStarted', lang));
              // give it 0.1 second for the info to show up
              setTimeout(() => {
                setCommonStore((state) => {
                  state.simulationInProgress = true;
                  state.runSolarPanelVisibilityAnalysis = !state.runSolarPanelVisibilityAnalysis;
                });
              }, 100);
            }}
          >
            {i18n.t('menu.solarPanel.AnalyzeVisibility', lang)}
          </Menu.Item>
          <SubMenu
            key={'solar-panel-visibility-analysis-options'}
            title={i18n.t('menu.solarPanel.VisibilityAnalysisOptions', lang)}
          >
            <Menu>
              <Menu.Item key={'solar-panel-visibility-grid-cell-size'}>
                <Space style={{ paddingRight: '10px' }}>
                  {i18n.t('menu.solarPanel.VisibilityGridCellSize', lang) + ':'}
                </Space>
                <InputNumber
                  min={0.1}
                  max={5}
                  step={0.1}
                  style={{ width: 60 }}
                  precision={1}
                  value={solarPanelVisibilityGridCellSize ?? 0.2}
                  formatter={(a) => Number(a).toFixed(1)}
                  onChange={(value) => {
                    setCommonStore((state) => {
                      state.world.solarPanelVisibilityGridCellSize = value;
                    });
                  }}
                />
                <Space style={{ paddingLeft: '10px' }}>{i18n.t('word.MeterAbbreviation', lang)}</Space>
              </Menu.Item>
            </Menu>
          </SubMenu>
        </SubMenu>

        {/* parabolic troughs */}
        <SubMenu key={'parabolic-trough'} title={i18n.t('menu.parabolicTroughSubMenu', lang)}>
          <Menu.Item
            key={'parabolic-trough-daily-yield'}
            onClick={() => {
              const parabolicTroughCount = countElementsByType(ObjectType.ParabolicTrough);
              if (parabolicTroughCount === 0) {
                showInfo(i18n.t('analysisManager.NoParabolicTroughForAnalysis', lang));
                return;
              }
              showInfo(i18n.t('message.SimulationStarted', lang));
              // give it 0.1 second for the info to show up
              setTimeout(() => {
                setCommonStore((state) => {
                  state.simulationInProgress = true;
                  state.dailyParabolicTroughIndividualOutputs = false;
                  state.runDailySimulationForParabolicTroughs = true;
                });
              }, 100);
            }}
          >
            {i18n.t('menu.parabolicTrough.AnalyzeDailyYield', lang)}
          </Menu.Item>
          <Menu.Item
            key={'parabolic-trough-yearly-yield'}
            onClick={() => {
              const parabolicTroughCount = countElementsByType(ObjectType.ParabolicTrough);
              if (parabolicTroughCount === 0) {
                showInfo(i18n.t('analysisManager.NoParabolicTroughForAnalysis', lang));
                return;
              }
              showInfo(i18n.t('message.SimulationStarted', lang));
              // give it 0.1 second for the info to show up
              setTimeout(() => {
                setCommonStore((state) => {
                  state.simulationInProgress = true;
                  state.yearlyParabolicTroughIndividualOutputs = false;
                  state.runYearlySimulationForParabolicTroughs = true;
                });
              }, 100);
            }}
          >
            {i18n.t('menu.parabolicTrough.AnalyzeYearlyYield', lang)}
          </Menu.Item>
          <CspSimulationSettings name={'parabolic-trough'} />
        </SubMenu>

        {/* parabolic dishes */}
        <SubMenu key={'parabolic-dish'} title={i18n.t('menu.parabolicDishSubMenu', lang)}>
          <Menu.Item
            key={'parabolic-dish-daily-yield'}
            onClick={() => {
              const parabolicDishCount = countElementsByType(ObjectType.ParabolicDish);
              if (parabolicDishCount === 0) {
                showInfo(i18n.t('analysisManager.NoParabolicDishForAnalysis', lang));
                return;
              }
              showInfo(i18n.t('message.SimulationStarted', lang));
              // give it 0.1 second for the info to show up
              setTimeout(() => {
                setCommonStore((state) => {
                  state.simulationInProgress = true;
                  state.dailyParabolicDishIndividualOutputs = false;
                  state.runDailySimulationForParabolicDishes = true;
                });
              }, 100);
            }}
          >
            {i18n.t('menu.parabolicDish.AnalyzeDailyYield', lang)}
          </Menu.Item>
          <Menu.Item
            key={'parabolic-dish-yearly-yield'}
            onClick={() => {
              const parabolicDishCount = countElementsByType(ObjectType.ParabolicDish);
              if (parabolicDishCount === 0) {
                showInfo(i18n.t('analysisManager.NoParabolicDishForAnalysis', lang));
                return;
              }
              showInfo(i18n.t('message.SimulationStarted', lang));
              // give it 0.1 second for the info to show up
              setTimeout(() => {
                setCommonStore((state) => {
                  state.simulationInProgress = true;
                  state.yearlyParabolicDishIndividualOutputs = false;
                  state.runYearlySimulationForParabolicDishes = true;
                });
              }, 100);
            }}
          >
            {i18n.t('menu.parabolicDish.AnalyzeYearlyYield', lang)}
          </Menu.Item>
          <CspSimulationSettings name={'parabolic-dish'} />
        </SubMenu>

        {/* Fresnel reflector */}
        <SubMenu key={'fresnel-reflector'} title={i18n.t('menu.fresnelReflectorSubMenu', lang)}>
          <Menu.Item
            key={'fresnel-reflector-daily-yield'}
            onClick={() => {
              const fresnelReflectorCount = countElementsByType(ObjectType.FresnelReflector);
              if (fresnelReflectorCount === 0) {
                showInfo(i18n.t('analysisManager.NoFresnelReflectorForAnalysis', lang));
                return;
              }
              showInfo(i18n.t('message.SimulationStarted', lang));
              // give it 0.1 second for the info to show up
              setTimeout(() => {
                setCommonStore((state) => {
                  state.simulationInProgress = true;
                  state.dailyFresnelReflectorIndividualOutputs = false;
                  state.runDailySimulationForFresnelReflectors = true;
                });
              }, 100);
            }}
          >
            {i18n.t('menu.fresnelReflector.AnalyzeDailyYield', lang)}
          </Menu.Item>
          <Menu.Item
            key={'fresnel-reflector-yearly-yield'}
            onClick={() => {
              const fresnelReflectorCount = countElementsByType(ObjectType.FresnelReflector);
              if (fresnelReflectorCount === 0) {
                showInfo(i18n.t('analysisManager.NoFresnelReflectorForAnalysis', lang));
                return;
              }
              showInfo(i18n.t('message.SimulationStarted', lang));
              // give it 0.1 second for the info to show up
              setTimeout(() => {
                setCommonStore((state) => {
                  state.simulationInProgress = true;
                  state.yearlyFresnelReflectorIndividualOutputs = false;
                  state.runYearlySimulationForFresnelReflectors = true;
                });
              }, 100);
            }}
          >
            {i18n.t('menu.fresnelReflector.AnalyzeYearlyYield', lang)}
          </Menu.Item>
          <CspSimulationSettings name={'fresnel-reflector'} />
        </SubMenu>

        {/* heliostat */}
        <SubMenu key={'heliostat'} title={i18n.t('menu.heliostatSubMenu', lang)}>
          <Menu.Item
            key={'heliostat-daily-yield'}
            onClick={() => {
              const heliostatCount = countElementsByType(ObjectType.Heliostat);
              if (heliostatCount === 0) {
                showInfo(i18n.t('analysisManager.NoHeliostatForAnalysis', lang));
                return;
              }
              showInfo(i18n.t('message.SimulationStarted', lang));
              // give it 0.1 second for the info to show up
              setTimeout(() => {
                setCommonStore((state) => {
                  state.simulationInProgress = true;
                  state.dailyHeliostatIndividualOutputs = false;
                  state.runDailySimulationForHeliostats = true;
                });
              }, 100);
            }}
          >
            {i18n.t('menu.heliostat.AnalyzeDailyYield', lang)}
          </Menu.Item>
          <Menu.Item
            key={'heliostat-yearly-yield'}
            onClick={() => {
              const heliostatCount = countElementsByType(ObjectType.Heliostat);
              if (heliostatCount === 0) {
                showInfo(i18n.t('analysisManager.NoHeliostatForAnalysis', lang));
                return;
              }
              showInfo(i18n.t('message.SimulationStarted', lang));
              // give it 0.1 second for the info to show up
              setTimeout(() => {
                setCommonStore((state) => {
                  state.simulationInProgress = true;
                  state.yearlyHeliostatIndividualOutputs = false;
                  state.runYearlySimulationForHeliostats = true;
                });
              }, 100);
            }}
          >
            {i18n.t('menu.heliostat.AnalyzeYearlyYield', lang)}
          </Menu.Item>
          <CspSimulationSettings name={'heliostat'} />
        </SubMenu>
      </SubMenu>

      {/* tutorials menu */}
      <SubMenu key={'tutorials'} title={i18n.t('menu.tutorialsSubMenu', lang)}>
        {/* solar science */}
        <SubMenu key={'solar-energy-science'} title={i18n.t('menu.solarEnergyScienceSubMenu', lang)}>
          <Menu.Item key="sun_angles" onClick={loadFile}>
            {i18n.t('menu.tutorials.SunAngles', lang)}
          </Menu.Item>
          <Menu.Item key="insolation_and_climate" onClick={loadFile}>
            {i18n.t('menu.tutorials.InsolationAndClimate', lang)}
          </Menu.Item>
          <Menu.Item key="solar_radiation_to_box" onClick={loadFile}>
            {i18n.t('menu.tutorials.SolarRadiationToBox', lang)}
          </Menu.Item>
        </SubMenu>
        {/* photovoltaic solar power */}
        <SubMenu key={'photovoltaic-solar-power'} title={i18n.t('menu.photovoltaicSolarPowerSubMenu', lang)}>
          <Menu.Item key="effect_tilt_angle_solar_panel" onClick={loadFile}>
            {i18n.t('menu.tutorials.EffectOfTiltAngleOfSolarPanel', lang)}
          </Menu.Item>
          <Menu.Item key="effect_azimuth_solar_panel" onClick={loadFile}>
            {i18n.t('menu.tutorials.EffectOfAzimuthOfSolarPanel', lang)}
          </Menu.Item>
          <Menu.Item key="solar_trackers" onClick={loadFile}>
            {i18n.t('menu.tutorials.SolarTrackers', lang)}
          </Menu.Item>
          <Menu.Item key="why_solar_array" onClick={loadFile}>
            {i18n.t('menu.tutorials.CoveringGroundWithSolarPanels', lang)}
          </Menu.Item>
          <Menu.Item key="inter_row_spacing" onClick={loadFile}>
            {i18n.t('menu.tutorials.InterRowSpacingOfSolarPanelArray', lang)}
          </Menu.Item>
          <Menu.Item key="effect_orientation_solar_panel" onClick={loadFile}>
            {i18n.t('menu.tutorials.EffectOfOrientationOfSolarPanels', lang)}
          </Menu.Item>
        </SubMenu>
        {/* concentrated solar power */}
        <SubMenu key={'concentrated-solar-power'} title={i18n.t('menu.concentratedSolarPowerSubMenu', lang)}>
          <Menu.Item key="parabolic_dish_focus_sunlight" onClick={loadFile}>
            {i18n.t('menu.tutorials.FocusSunlightWithParabolicDish', lang)}
          </Menu.Item>
          <Menu.Item key="effect_azimuth_parabolic_trough" onClick={loadFile}>
            {i18n.t('menu.tutorials.EffectOfAzimuthOfParabolicTrough', lang)}
          </Menu.Item>
          <Menu.Item key="effect_latus_rectum_parabolic_trough" onClick={loadFile}>
            {i18n.t('menu.tutorials.EffectOfLatusRectumOfParabolicTrough', lang)}
          </Menu.Item>
          <Menu.Item key="linear_fresnel_reflectors" onClick={loadFile}>
            {i18n.t('menu.tutorials.LinearFresnelReflectors', lang)}
          </Menu.Item>
          <Menu.Item key="effect_receiver_tube_height" onClick={loadFile}>
            {i18n.t('menu.tutorials.EffectOfReceiverTubeHeightForLinearFresnelReflectors', lang)}
          </Menu.Item>
          <Menu.Item key="effect_azimuth_fresnel_reflector" onClick={loadFile}>
            {i18n.t('menu.tutorials.EffectOfAzimuthOfLinearFresnelReflectors', lang)}
          </Menu.Item>
          <Menu.Item key="linear_fresnel_reflectors_two_receivers" onClick={loadFile}>
            {i18n.t('menu.tutorials.LinearFresnelReflectorsWithTwoReceivers', lang)}
          </Menu.Item>
          <Menu.Item key="solar_power_tower" onClick={loadFile}>
            {i18n.t('menu.tutorials.SolarPowerTower', lang)}
          </Menu.Item>
          <Menu.Item key="cosine_efficiency_heliostats" onClick={loadFile}>
            {i18n.t('menu.tutorials.CosineEfficiencyOfHeliostats', lang)}
          </Menu.Item>
          <Menu.Item key="shadowing_blocking_heliostats" onClick={loadFile}>
            {i18n.t('menu.tutorials.ShadowingAndBlockingOfHeliostats', lang)}
          </Menu.Item>
          <Menu.Item key="effect_solar_power_tower_height" onClick={loadFile}>
            {i18n.t('menu.tutorials.EffectSolarPowerTowerHeight', lang)}
          </Menu.Item>
        </SubMenu>
      </SubMenu>

      {/* example menu */}
      <SubMenu key={'examples'} title={i18n.t('menu.examplesSubMenu', lang)}>
        {/* solar energy */}
        <SubMenu key={'solar-energy'} title={i18n.t('menu.solarEnergySubMenu', lang)}>
          <Menu.Item key="sun_beam_at_center" onClick={loadFile}>
            {i18n.t('menu.examples.SunBeamAndHeliodon', lang)}
          </Menu.Item>
          <Menu.Item key="solar_farm_01" onClick={loadFile}>
            {i18n.t('menu.examples.SolarFarm', lang)}
          </Menu.Item>
          <Menu.Item key="solar_canopy_form_factors" onClick={loadFile}>
            {i18n.t('menu.examples.SolarCanopyFormFactors', lang)}
          </Menu.Item>
          <Menu.Item key="vegetative_buffer_01" onClick={loadFile}>
            {i18n.t('menu.examples.VegetativeBuffer', lang)}
          </Menu.Item>
          <Menu.Item key="parabolic_trough_array" onClick={loadFile}>
            {i18n.t('menu.examples.ParabolicTroughArray', lang)}
          </Menu.Item>
          <Menu.Item key="parabolic_dish_array" onClick={loadFile}>
            {i18n.t('menu.examples.ParabolicDishArray', lang)}
          </Menu.Item>
          <Menu.Item key="solar_farm_02" onClick={loadFile}>
            {i18n.t('menu.examples.SolarFarmInRealWorld', lang)}
          </Menu.Item>
          <Menu.Item key="solar_farm_03" onClick={loadFile}>
            {i18n.t('menu.examples.SolarTrackersInRealWorld', lang)}
          </Menu.Item>
        </SubMenu>

        {/* buildings */}
        <SubMenu key={'buildings'} title={i18n.t('menu.buildingsSubMenu', lang)}>
          <Menu.Item key="simple_house_01" onClick={loadFile}>
            {i18n.t('menu.examples.SimpleHouse', lang)}
          </Menu.Item>
          <Menu.Item key="office_building_01" onClick={loadFile}>
            {i18n.t('menu.examples.OfficeBuilding', lang)}
          </Menu.Item>
          <Menu.Item key="hotel_01" onClick={loadFile}>
            {i18n.t('menu.examples.Hotel', lang)}
          </Menu.Item>
          <Menu.Item key="heatmap_01" onClick={loadFile}>
            {i18n.t('menu.examples.Heatmap1', lang)}
          </Menu.Item>
        </SubMenu>
      </SubMenu>

      {/*language menu*/}
      <SubMenu key={'language'} title={i18n.t('menu.languageSubMenu', lang)}>
        <Radio.Group
          value={language}
          style={{ height: '170px' }}
          onChange={(e) => {
            setCommonStore((state) => {
              state.language = e.target.value;
              switch (state.language) {
                case 'zh_cn':
                  state.locale = zhCN;
                  break;
                case 'zh_tw':
                  state.locale = zhTW;
                  break;
                case 'es':
                  state.locale = esES;
                  break;
                case 'tr':
                  state.locale = trTR;
                  break;
                default:
                  state.locale = enUS;
              }
            });
          }}
        >
          <Radio style={radioStyle} value={'en'}>
            {Language.English}
          </Radio>
          <Radio style={radioStyle} value={'es'}>
            {Language.Spanish}
          </Radio>
          <Radio style={radioStyle} value={'zh_cn'}>
            {Language.ChineseSimplified}
          </Radio>
          <Radio style={radioStyle} value={'zh_tw'}>
            {Language.ChineseTraditional}
          </Radio>
          <Radio style={radioStyle} value={'tr'}>
            {Language.Turkish}
          </Radio>
        </Radio.Group>
      </SubMenu>
      {/* about menu */}
      <Menu.Item key="about" onClick={gotoAboutPage}>
        {i18n.t('menu.AboutUs', lang)}
      </Menu.Item>
    </Menu>
  );

  return (
    <>
      <Dropdown overlay={menu} trigger={['click']}>
        <StyledImage src={logo} title={i18n.t('tooltip.clickToOpenMenu', lang)} />
      </Dropdown>
      <Dropdown overlay={menu} trigger={['click']}>
        <LabelContainer>
          <label style={{ fontSize: '10px', alignContent: 'center', cursor: 'pointer' }}>
            {i18n.t('menu.mainMenu', lang)}
          </label>
        </LabelContainer>
      </Dropdown>
      {aboutUs && <About openAboutUs={openAboutUs} />}
    </>
  );
};

export default React.memo(MainMenu);
