/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import sun_angles from './examples/sun_angles.json';
import solar_radiation_to_box from './examples/solar_radiation_to_box.json';
import sun_beam_at_center from './examples/sun_beam_at_center.json';
import office_building_01 from './examples/office_building_01.json';
import solar_farm_01 from './examples/solar_farm_01.json';
import solar_farm_02 from './examples/solar_farm_02.json';
import solar_farm_03 from './examples/solar_farm_03.json';
import solar_trackers from './examples/solar_trackers.json';
import simple_house_01 from './examples/simple_house_01.json';
import hotel_01 from './examples/hotel_01.json';

import zhCN from 'antd/lib/locale/zh_CN';
import zhTW from 'antd/lib/locale/zh_TW';
import esES from 'antd/lib/locale/es_ES';
import trTR from 'antd/lib/locale/tr_TR';
import enUS from 'antd/lib/locale/en_US';

import React, { useState } from 'react';
import { useStore } from './stores/common';
import styled from 'styled-components';
import { Checkbox, Dropdown, InputNumber, Menu, Modal, Radio, Select, Space } from 'antd';
import logo from './assets/magic-lamp.png';
import 'antd/dist/antd.css';
import About from './about';
import { saveImage, showInfo } from './helpers';
import { Discretization, Language, ObjectType } from './types';
import * as Selector from './stores/selector';
import i18n from './i18n/i18n';
import { Util } from './Util';
import { UndoableCheck } from './undo/UndoableCheck';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { UndoableResetView } from './undo/UndoableResetView';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { SubMenu } = Menu;
const { Option } = Select;

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
  canvas?: HTMLCanvasElement;
}

const MainMenu = ({ viewOnly, set2DView, resetView, zoomView, canvas }: MainMenuProps) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const undoManager = useStore(Selector.undoManager);
  const addUndoable = useStore(Selector.addUndoable);
  const timesPerHour = useStore(Selector.world.timesPerHour);
  const discretization = useStore(Selector.world.discretization);
  const solarPanelGridCellSize = useStore(Selector.world.solarPanelGridCellSize);
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
      // TODO
      saveImage('screenshot.png', canvas.toDataURL('image/png'));
    }
  };

  const loadFile = (e: any) => {
    let input: any;
    switch (e.key) {
      case 'sun_angles':
        input = sun_angles;
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
      case 'simple_house_01':
        input = simple_house_01;
        break;
    }
    if (input) {
      if (!viewOnly && changed) {
        Modal.confirm({
          title: i18n.t('shared.DoYouWantToSaveChanges', lang),
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

  const toggleHelidonPanel = () => {
    const undoableCheck = {
      name: 'Show Heliodon Control Panel',
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

  const toggleMapPanel = () => {
    const undoableCheck = {
      name: 'Show Maps',
      timestamp: Date.now(),
      checked: !showMapPanel,
      undo: () => {
        setCommonStore((state) => {
          state.viewState.showMapPanel = !undoableCheck.checked;
        });
      },
      redo: () => {
        setCommonStore((state) => {
          state.viewState.showMapPanel = undoableCheck.checked;
        });
      },
    } as UndoableCheck;
    addUndoable(undoableCheck);
    setCommonStore((state) => {
      state.viewState.showMapPanel = !state.viewState.showMapPanel;
    });
  };

  const toggleWeatherPanel = () => {
    const undoableCheck = {
      name: 'Show Weather Panel',
      timestamp: Date.now(),
      checked: !showWeatherPanel,
      undo: () => {
        setCommonStore((state) => {
          state.viewState.showWeatherPanel = !undoableCheck.checked;
        });
      },
      redo: () => {
        setCommonStore((state) => {
          state.viewState.showWeatherPanel = undoableCheck.checked;
        });
      },
    } as UndoableCheck;
    addUndoable(undoableCheck);
    setCommonStore((state) => {
      state.viewState.showWeatherPanel = !state.viewState.showWeatherPanel;
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

  const viewAlreadyReset =
    cameraPosition[0] === cameraPosition[1] &&
    cameraPosition[1] === cameraPosition[2] &&
    panCenter[0] === 0 &&
    panCenter[1] === 0 &&
    panCenter[2] === 0;

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
      {(undoManager.hasUndo() || undoManager.hasRedo()) && (
        <SubMenu key={'edit'} title={i18n.t('menu.editSubMenu', lang)}>
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
                  setCommonStore((state) => {
                    const v = state.viewState;
                    v.cameraPosition = [...undoableResetView.oldCameraPosition];
                    v.panCenter = [...undoableResetView.oldPanCenter];
                  });
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
        <Menu.Item key={'heliodon-panel-check-box'}>
          <Checkbox checked={showHeliodonPanel} onChange={toggleHelidonPanel}>
            {i18n.t('menu.tool.Heliodon', lang)}
          </Checkbox>
        </Menu.Item>
        <Menu.Item key={'map-panel-check-box'}>
          <Checkbox checked={showMapPanel} onChange={toggleMapPanel}>
            {i18n.t('menu.tool.Map', lang)}
          </Checkbox>
        </Menu.Item>
        <Menu.Item key={'weather-panel-check-box'}>
          <Checkbox checked={showWeatherPanel} onChange={toggleWeatherPanel}>
            {i18n.t('menu.tool.WeatherData', lang)}
          </Checkbox>
        </Menu.Item>
      </SubMenu>

      {/* analysis menu */}
      <SubMenu key={'analysis'} title={i18n.t('menu.analysisSubMenu', lang)}>
        {/*sensors*/}
        <SubMenu key={'sensors'} title={i18n.t('menu.sensorsSubMenu', lang)}>
          <Menu.Item
            key={'sensor-collect-daily-data'}
            onClick={() => {
              setCommonStore((state) => {
                state.dailyLightSensorFlag = !state.dailyLightSensorFlag;
              });
            }}
          >
            {i18n.t('menu.sensors.CollectDailyData', lang)}
          </Menu.Item>
          <Menu.Item
            key={'sensor-collect-yearly-data'}
            onClick={() => {
              setCommonStore((state) => {
                state.yearlyLightSensorFlag = !state.yearlyLightSensorFlag;
              });
            }}
          >
            {i18n.t('menu.sensors.CollectYearlyData', lang)}
          </Menu.Item>
          <SubMenu key={'sensor-simulation-options'} title={i18n.t('word.Options', lang)}>
            <Menu>
              <Menu.Item key={'sensor-simulation-sampling-frequency'}>
                <Space style={{ width: '150px' }}>{i18n.t('menu.sensors.SamplingFrequency', lang) + ':'}</Space>
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
                <Space style={{ paddingLeft: '10px' }}>{i18n.t('menu.sensors.TimesPerHour', lang)}</Space>
              </Menu.Item>
            </Menu>
          </SubMenu>
        </SubMenu>

        {/* solar panels */}
        <SubMenu key={'solar-panels'} title={i18n.t('menu.solarPanelsSubMenu', lang)}>
          <Menu.Item
            key={'solar-panel-daily-yield'}
            onClick={() => {
              setCommonStore((state) => {
                state.simulationInProgress = true;
                state.dailyPvIndividualOutputs = false;
                state.dailyPvFlag = !state.dailyPvFlag;
                console.log('simulation started', state.simulationInProgress);
              });
            }}
          >
            {i18n.t('menu.solarPanels.AnalyzeDailyYield', lang)}
          </Menu.Item>
          <Menu.Item
            key={'solar-panel-yearly-yield'}
            onClick={() => {
              setCommonStore((state) => {
                state.simulationInProgress = true;
                state.yearlyPvIndividualOutputs = false;
                state.yearlyPvFlag = !state.yearlyPvFlag;
              });
            }}
          >
            {i18n.t('menu.solarPanels.AnalyzeYearlyYield', lang)}
          </Menu.Item>
          <SubMenu key={'solar-panel-simulation-options'} title={i18n.t('word.Options', lang)}>
            <Menu>
              <Menu.Item key={'solar-panel-simulation-sampling-frequency'}>
                <Space style={{ width: '150px' }}>{i18n.t('menu.sensors.SamplingFrequency', lang) + ':'}</Space>
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
                <Space style={{ paddingLeft: '10px' }}>{i18n.t('menu.sensors.TimesPerHour', lang)}</Space>
              </Menu.Item>
              <Menu.Item key={'solar-panel-discretization'}>
                <Space style={{ width: '150px' }}>{i18n.t('menu.solarPanels.PanelDiscretization', lang) + ':'}</Space>
                <Select
                  style={{ width: '165px' }}
                  value={discretization ?? Discretization.EXACT}
                  onChange={(value) => {
                    setCommonStore((state) => {
                      state.world.discretization = value;
                    });
                  }}
                >
                  <Option key={Discretization.EXACT} value={Discretization.EXACT}>
                    {i18n.t('menu.solarPanels.Exact', lang)}
                  </Option>
                  )
                  <Option key={Discretization.APPROXIMATE} value={Discretization.APPROXIMATE}>
                    {i18n.t('menu.solarPanels.Approximate', lang)}
                  </Option>
                  )
                </Select>
              </Menu.Item>
              {discretization === Discretization.APPROXIMATE && (
                <Menu.Item key={'solar-panel-simulation-grid-cell-size'}>
                  <Space style={{ width: '150px' }}>Grid Cell Size: </Space>
                  <InputNumber
                    min={0.1}
                    max={5}
                    step={0.1}
                    style={{ width: 60 }}
                    precision={1}
                    value={solarPanelGridCellSize ?? 0.5}
                    formatter={(a) => Number(a).toFixed(1)}
                    onChange={(value) => {
                      setCommonStore((state) => {
                        state.world.solarPanelGridCellSize = value;
                      });
                    }}
                  />
                  <Space style={{ paddingLeft: '10px' }}>m</Space>
                </Menu.Item>
              )}
            </Menu>
          </SubMenu>
        </SubMenu>
      </SubMenu>

      {/* example menu */}
      <SubMenu key={'examples'} title={i18n.t('menu.examplesSubMenu', lang)}>
        {/* solar energy */}
        <SubMenu key={'solar-energy'} title={i18n.t('menu.solarEnergySubMenu', lang)}>
          <Menu.Item key="sun_angles" onClick={loadFile}>
            {i18n.t('menu.examples.SunAngles', lang)}
          </Menu.Item>
          <Menu.Item key="solar_radiation_to_box" onClick={loadFile}>
            {i18n.t('menu.examples.SolarRadiationToBox', lang)}
          </Menu.Item>
          <Menu.Item key="sun_beam_at_center" onClick={loadFile}>
            {i18n.t('menu.examples.SunBeamAndHeliodon', lang)}
          </Menu.Item>
          <Menu.Item key="solar_farm_01" onClick={loadFile}>
            {i18n.t('menu.examples.SolarFarm', lang)}
          </Menu.Item>
          <Menu.Item key="solar_farm_02" onClick={loadFile}>
            {i18n.t('menu.examples.SolarFarmInRealWorld', lang)}
          </Menu.Item>
          <Menu.Item key="solar_trackers" onClick={loadFile}>
            {i18n.t('menu.examples.SolarTrackers', lang)}
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
