/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import zhCN from 'antd/lib/locale/zh_CN';
import zhTW from 'antd/lib/locale/zh_TW';
import esES from 'antd/lib/locale/es_ES';
import trTR from 'antd/lib/locale/tr_TR';
import enUS from 'antd/lib/locale/en_US';

import React, { useMemo, useState } from 'react';
import { useStore } from './stores/common';
import styled from 'styled-components';
import { Checkbox, Dropdown, InputNumber, Menu, Modal, Radio, Space, Switch } from 'antd';
import logo from './assets/magic-lamp.png';
import 'antd/dist/antd.css';
import About from './about';
import { saveImage, showError, showInfo, showWarning } from './helpers';
import { ActionInfo, Language, ObjectType, SolarStructure } from './types';
import * as Selector from './stores/selector';
import i18n from './i18n/i18n';
import { Util } from './Util';
import { UndoableCheck } from './undo/UndoableCheck';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { UndoableResetView } from './undo/UndoableResetView';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Undoable } from './undo/Undoable';
import { useRefStore } from './stores/commonRef';
import { UndoableDelete } from './undo/UndoableDelete';
import { UndoablePaste } from './undo/UndoablePaste';
import CspSimulationSettings from './components/contextMenu/elementMenu/cspSimulationSettings';
import PvSimulationSettings from './components/contextMenu/elementMenu/pvSimulationSettings';
import SutSimulationSettings from './components/contextMenu/elementMenu/sutSimulationSettings';
import { UndoableChange } from './undo/UndoableChange';
import { DEFAULT_SOLAR_PANEL_SHININESS, FLOATING_WINDOW_OPACITY, HOME_URL, UNDO_SHOW_INFO_DURATION } from './constants';
import BuildingEnergySimulationSettings from './components/contextMenu/elementMenu/buildingEnergySimulationSettings';
import { usePrimitiveStore } from './stores/commonPrimitive';
import { getExample } from './examples';
import { checkBuilding, CheckStatus } from './analysis/heatTools';
import ModelAnnotationDialog from './components/contextMenu/elementMenu/modelAnnotationDialog';

const { SubMenu } = Menu;

const radioStyle = {
  display: 'block',
  height: '30px',
  paddingLeft: '10px',
  lineHeight: '30px',
};

const MainMenuContainer = styled.div`
  width: 100px;
`;

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
  owner: boolean;
  viewOnly: boolean;
  set2DView: (selected: boolean) => void;
  resetView: () => void;
  zoomView: (scale: number) => void;
  canvas?: HTMLCanvasElement | null;
}

const MainMenu = ({ owner, viewOnly, set2DView, resetView, zoomView, canvas }: MainMenuProps) => {
  const setCommonStore = useStore(Selector.set);
  const setPrimitiveStore = usePrimitiveStore(Selector.setPrimitiveStore);
  const pasteElements = useStore(Selector.pasteElementsByKey);
  const copyElementById = useStore(Selector.copyElementById);
  const removeElementById = useStore(Selector.removeElementById);
  const copyCutElements = useStore(Selector.copyCutElements);
  const getElementById = useStore(Selector.getElementById);
  const importContent = useStore(Selector.importContent);
  const countObservers = useStore(Selector.countObservers);
  const countElementsByType = useStore(Selector.countElementsByType);
  const getChildrenOfType = useStore(Selector.getChildrenOfType);
  const countSolarStructuresByType = useStore(Selector.countSolarStructuresByType);
  const selectNone = useStore(Selector.selectNone);
  const addUndoable = useStore(Selector.addUndoable);
  const openModelMap = useStore(Selector.openModelMap);

  const loggable = useStore.getState().loggable;
  const language = useStore.getState().language;
  const floatingWindowOpacity = useStore.getState().floatingWindowOpacity;
  const undoManager = useStore.getState().undoManager;
  const timesPerHour = useStore(Selector.world.timesPerHour);
  const solarPanelVisibilityGridCellSize = useStore(Selector.world.solarPanelVisibilityGridCellSize);
  const solarRadiationHeatmapGridCellSize = useStore(Selector.world.solarRadiationHeatmapGridCellSize);
  const solarRadiationHeatmapMaxValue = useStore(Selector.viewState.solarRadiationHeatmapMaxValue);
  const orthographic = useStore.getState().viewState.orthographic;
  const autoRotate = useStore.getState().viewState.autoRotate;
  const showSiteInfoPanel = useStore.getState().viewState.showSiteInfoPanel;
  const showDesignInfoPanel = useStore.getState().viewState.showDesignInfoPanel;
  const showInstructionPanel = useStore.getState().viewState.showInstructionPanel;
  const showMapPanel = useStore.getState().viewState.showMapPanel;
  const showWeatherPanel = useStore.getState().viewState.showWeatherPanel;
  const showDiurnalTemperaturePanel = useStore.getState().viewState.showDiurnalTemperaturePanel;
  const showEconomicsPanel = useStore.getState().viewState.showEconomicsPanel;
  const showStickyNotePanel = useStore.getState().viewState.showStickyNotePanel;
  const showHeliodonPanel = useStore.getState().viewState.showHeliodonPanel;
  const shadowEnabled = useStore.getState().viewState.shadowEnabled;
  const solarPanelShininess = useStore.getState().viewState.solarPanelShininess;
  const changed = useStore.getState().changed;
  const cloudFile = useStore.getState().cloudFile;
  const user = useStore.getState().user;
  const axes = useStore.getState().viewState.axes;
  const elementsToPaste = useStore.getState().elementsToPaste;
  const runDynamicSimulation = usePrimitiveStore.getState().runDynamicSimulation;
  const runStaticSimulation = usePrimitiveStore.getState().runStaticSimulation;
  const noAnimationForHeatmapSimulation = useStore(Selector.world.noAnimationForHeatmapSimulation);
  const noAnimationForSensorDataCollection = useStore(Selector.world.noAnimationForSensorDataCollection);
  const solarRadiationHeatmapReflectionOnly = useStore(Selector.viewState.solarRadiationHeatmapReflectionOnly);
  const elements = useStore.getState().elements;
  const cameraPosition = useStore.getState().viewState.cameraPosition;
  const panCenter = useStore.getState().viewState.panCenter;
  const selectedElement = useStore.getState().selectedElement;

  const [aboutUs, setAboutUs] = useState(false);
  const [modelAnnotationDialogVisible, setModelAnnotationDialogVisible] = useState(false);

  const lang = { lng: language };
  const isMac = Util.isMac();

  const keyHome = useMemo(() => {
    const os = Util.getOS();
    if (os) {
      if (os.includes('OS X')) {
        return 'Ctrl+Alt+H';
      }
      if (os.includes('Chrome')) {
        return 'Ctrl+Alt+H';
      }
    }
    return 'Ctrl+Home';
  }, []);

  const takeScreenshot = () => {
    if (canvas) {
      saveImage('screenshot.png', canvas.toDataURL('image/png'));
      setCommonStore((state) => {
        state.openModelMap = false;
        if (loggable) {
          state.actionInfo = {
            name: 'Take Screenshot',
            timestamp: new Date().getTime(),
          };
        }
      });
    }
  };

  const loadFile = (e: any) => {
    const input = getExample(e.key);
    if (input) {
      setCommonStore((state) => {
        state.openModelMap = false;
      });
      if (!viewOnly && changed) {
        Modal.confirm({
          title: i18n.t('message.DoYouWantToSaveChanges', lang),
          icon: <ExclamationCircleOutlined />,
          onOk: () => saveAndImport(input),
          onCancel: () => {
            setCommonStore((state) => {
              state.loadingFile = true;
            });
            // give it a brief moment for this modal to close
            // this may also put the function call to the last in the event queue
            setTimeout(() => {
              importContent(input);
            }, 10);
          },
          okText: i18n.t('word.Yes', lang),
          cancelText: i18n.t('word.No', lang),
        });
      } else {
        setCommonStore((state) => {
          state.loadingFile = true;
        });
        // give it a brief moment for the loading spinner to show
        // this may also put the function call to the last in the event queue
        setTimeout(() => {
          importContent(input);
        }, 10);
      }
      if (loggable) {
        setCommonStore((state) => {
          state.actionInfo = {
            name: 'Open Example: ' + e.key,
            timestamp: new Date().getTime(),
          };
        });
      }
      if (!viewOnly) {
        window.history.pushState({}, document.title, HOME_URL);
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

  const toggleTranslucency = (e: CheckboxChangeEvent) => {
    const oldOpacity = floatingWindowOpacity;
    const newOpacity = e.target.checked ? FLOATING_WINDOW_OPACITY : 1;
    const undoableChange = {
      name: 'Floating Window Opacity',
      timestamp: Date.now(),
      oldValue: oldOpacity,
      newValue: newOpacity,
      undo: () => {
        setCommonStore((state) => {
          state.floatingWindowOpacity = undoableChange.oldValue as number;
        });
      },
      redo: () => {
        setCommonStore((state) => {
          state.floatingWindowOpacity = undoableChange.newValue as number;
        });
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    setCommonStore((state) => {
      state.floatingWindowOpacity = newOpacity;
    });
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
      if (loggable) {
        state.actionInfo = {
          name: 'Show Shadow',
          result: !shadowEnabled,
          timestamp: new Date().getTime(),
        };
      }
    });
  };

  const setSurfaceShininess = (value: number) => {
    const undoableChange = {
      name: 'Set Surface Shininess',
      timestamp: Date.now(),
      oldValue: solarPanelShininess ?? DEFAULT_SOLAR_PANEL_SHININESS,
      newValue: value,
      undo: () => {
        setCommonStore((state) => {
          state.viewState.solarPanelShininess = undoableChange.oldValue as number;
        });
      },
      redo: () => {
        setCommonStore((state) => {
          state.viewState.solarPanelShininess = undoableChange.newValue as number;
        });
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    setCommonStore((state) => {
      state.viewState.solarPanelShininess = value;
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
      if (loggable) {
        state.actionInfo = {
          name: 'Show Sticky Note',
          result: !showStickyNotePanel,
          timestamp: new Date().getTime(),
        };
      }
    });
  };

  const openHeliodonPanel = () => {
    const undoable = {
      name: 'Open Sun and Time Settings Panel',
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
      if (loggable) {
        state.actionInfo = {
          name: 'Open Sun and Time Settings Panel',
          timestamp: new Date().getTime(),
        };
      }
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
      if (loggable) {
        state.actionInfo = {
          name: 'Open Maps',
          timestamp: new Date().getTime(),
        };
      }
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
      if (loggable) {
        state.actionInfo = {
          name: 'Open Weather Panel',
          timestamp: new Date().getTime(),
        };
      }
    });
  };

  const openDiurnalTemperaturePanel = () => {
    const undoable = {
      name: 'Open Diurnal Temperature Panel',
      timestamp: Date.now(),
      undo: () => {
        setCommonStore((state) => {
          state.viewState.showDiurnalTemperaturePanel = false;
        });
      },
      redo: () => {
        setCommonStore((state) => {
          state.viewState.showDiurnalTemperaturePanel = true;
        });
      },
    } as Undoable;
    addUndoable(undoable);
    setCommonStore((state) => {
      state.viewState.showDiurnalTemperaturePanel = true;
      if (loggable) {
        state.actionInfo = {
          name: 'Open Diurnal Temperature Panel',
          timestamp: new Date().getTime(),
        };
      }
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
      if (loggable) {
        state.actionInfo = {
          name: 'Show Axes',
          result: checked,
          timestamp: new Date().getTime(),
        };
      }
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
      if (loggable) {
        state.actionInfo = {
          name: 'Toggle 2D View',
          result: !orthographic,
          timestamp: new Date().getTime(),
        };
      }
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
            state.groupActionMode = false;
            state.elementGroupId = null;
            state.viewState.autoRotate = !undoableCheck.checked;
          });
        },
        redo: () => {
          setCommonStore((state) => {
            state.objectTypeToAdd = ObjectType.None;
            state.groupActionMode = false;
            state.elementGroupId = null;
            state.viewState.autoRotate = undoableCheck.checked;
          });
        },
      } as UndoableCheck;
      addUndoable(undoableCheck);
      setCommonStore((state) => {
        state.objectTypeToAdd = ObjectType.None;
        state.groupActionMode = false;
        state.elementGroupId = null;
        state.viewState.autoRotate = !state.viewState.autoRotate;
        if (loggable) {
          state.actionInfo = {
            name: 'Auto Rotate',
            result: !autoRotate,
            timestamp: new Date().getTime(),
          };
        }
      });
    }
  };

  const copySelectedElement = () => {
    if (selectedElement) {
      copyElementById(selectedElement.id);
      if (loggable) {
        setCommonStore((state) => {
          state.actionInfo = {
            name: 'Copy',
            timestamp: new Date().getTime(),
            elementId: selectedElement.id,
            elementType: selectedElement.type,
          } as ActionInfo;
        });
      }
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
      if (loggable) {
        setCommonStore((state) => {
          state.actionInfo = {
            name: 'Cut',
            timestamp: new Date().getTime(),
            elementId: selectedElement.id,
            elementType: selectedElement.type,
          } as ActionInfo;
        });
      }
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
            });
          },
        } as UndoablePaste;
        addUndoable(undoablePaste);
        if (loggable) {
          setCommonStore((state) => {
            state.actionInfo = {
              name: 'Paste',
              timestamp: new Date().getTime(),
            } as ActionInfo;
          });
        }
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
      setPrimitiveStore('runStaticSimulation', !runStaticSimulation);
      if (loggable) {
        setCommonStore((state) => {
          state.actionInfo = {
            name: 'Generate Daily Solar Radiation Heatmap (Static)',
            timestamp: new Date().getTime(),
          };
        });
      }
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
      if (loggable) {
        setCommonStore((state) => {
          state.actionInfo = {
            name: 'Generate Daily Solar Radiation Heatmap (Dynamic)',
            timestamp: new Date().getTime(),
          };
        });
      }
    }, 100);
  };

  const readyToPaste = elementsToPaste && elementsToPaste.length > 0;

  const menu = (
    <Menu triggerSubMenuAction={'click'}>
      {/* file menu */}
      {!openModelMap && (
        <SubMenu key={'file'} title={i18n.t('menu.fileSubMenu', lang)}>
          {!viewOnly && (
            <Menu.Item
              key="create-new-file"
              onClick={() => {
                undoManager.clear();
                setCommonStore((state) => {
                  state.createNewFileFlag = !state.createNewFileFlag;
                  state.objectTypeToAdd = ObjectType.None;
                  state.groupActionMode = false;
                  state.elementGroupId = null;
                  state.openModelMap = false; // in case the user uses the keyboard shortcut
                  window.history.pushState({}, document.title, HOME_URL);
                  if (loggable) {
                    state.actionInfo = {
                      name: 'Create New File',
                      timestamp: new Date().getTime(),
                    };
                  }
                });
              }}
            >
              {i18n.t('menu.file.CreateNewFile', lang)}
              <label style={{ paddingLeft: '2px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+F)</label>
            </Menu.Item>
          )}

          {!viewOnly && (
            <Menu.Item
              key="open-local-file"
              onClick={() => {
                undoManager.clear();
                setCommonStore((state) => {
                  state.openLocalFileFlag = !state.openLocalFileFlag;
                  state.objectTypeToAdd = ObjectType.None;
                  state.groupActionMode = false;
                  state.elementGroupId = null;
                  state.cloudFile = undefined;
                  state.openModelMap = false; // in case the user uses the keyboard shortcut
                  window.history.pushState({}, document.title, HOME_URL);
                  if (loggable) {
                    state.actionInfo = {
                      name: 'Open Local File',
                      timestamp: new Date().getTime(),
                    };
                  }
                });
              }}
            >
              {i18n.t('menu.file.OpenLocalFile', lang)}
              <label style={{ paddingLeft: '2px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+O)</label>...
            </Menu.Item>
          )}

          <Menu.Item
            key="save-local-file"
            onClick={() => {
              setCommonStore((state) => {
                state.saveLocalFileDialogVisible = true;
                if (loggable) {
                  state.actionInfo = {
                    name: 'Save as Local File',
                    timestamp: new Date().getTime(),
                  };
                }
              });
            }}
          >
            {i18n.t('menu.file.SaveAsLocalFile', lang)}
            <label style={{ paddingLeft: '2px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+S)</label>...
          </Menu.Item>

          {user.uid && !viewOnly && (
            <Menu.Item
              key="open-cloud-file"
              onClick={() => {
                setCommonStore((state) => {
                  state.listCloudFilesFlag = !state.listCloudFilesFlag;
                  state.openModelMap = false; // in case the user uses the keyboard shortcut
                  if (loggable) {
                    state.actionInfo = {
                      name: 'List Cloud Files',
                      timestamp: new Date().getTime(),
                    };
                  }
                });
              }}
            >
              {i18n.t('menu.file.OpenCloudFile', lang)}
              <label style={{ paddingLeft: '2px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+Shift+O)</label>...
            </Menu.Item>
          )}

          {user.uid && cloudFile && !viewOnly && (
            <Menu.Item
              key="save-cloud-file"
              onClick={() => {
                setCommonStore((state) => {
                  state.saveCloudFileFlag = !state.saveCloudFileFlag;
                  if (loggable) {
                    state.actionInfo = {
                      name: 'Save Cloud File',
                      timestamp: new Date().getTime(),
                    };
                  }
                });
              }}
            >
              {i18n.t('menu.file.SaveCloudFile', lang)}
              <label style={{ paddingLeft: '2px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+Shift+S)</label>
            </Menu.Item>
          )}

          {user.uid && !viewOnly && (
            <Menu.Item
              key="save-as-cloud-file"
              onClick={() => {
                setCommonStore((state) => {
                  state.showCloudFileTitleDialogFlag = !state.showCloudFileTitleDialogFlag;
                  state.showCloudFileTitleDialog = true;
                  if (loggable) {
                    state.actionInfo = {
                      name: 'Save as Cloud File',
                      timestamp: new Date().getTime(),
                    };
                  }
                });
              }}
            >
              {i18n.t('menu.file.SaveAsCloudFile', lang)}...
            </Menu.Item>
          )}

          {user.uid && cloudFile && !viewOnly && owner && (
            <>
              {modelAnnotationDialogVisible && (
                <ModelAnnotationDialog setDialogVisible={setModelAnnotationDialogVisible} />
              )}
              <Menu.Item key="publish-on-model-map" onClick={() => setModelAnnotationDialogVisible(true)}>
                {i18n.t('menu.file.PublishOnModelMap', lang)}
              </Menu.Item>
            </>
          )}

          <Menu.Item key="screenshot" onClick={takeScreenshot}>
            {i18n.t('menu.file.TakeScreenshot', lang)}
          </Menu.Item>
        </SubMenu>
      )}

      {/* edit menu */}
      {(selectedElement || readyToPaste || undoManager.hasUndo() || undoManager.hasRedo()) && !openModelMap && (
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
                  const commandName = undoManager.undo();
                  if (commandName)
                    showInfo(i18n.t('menu.edit.Undo', lang) + ': ' + commandName, UNDO_SHOW_INFO_DURATION);
                  if (loggable) {
                    setCommonStore((state) => {
                      state.actionInfo = {
                        name: 'Undo',
                        timestamp: new Date().getTime(),
                      };
                    });
                  }
                }
              }}
            >
              {i18n.t('menu.edit.Undo', lang) + ': ' + undoManager.getLastUndoName()}
              <label style={{ paddingLeft: '2px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+Z)</label>
            </Menu.Item>
          )}
          {undoManager.hasRedo() && (
            <Menu.Item
              key="redo"
              onClick={() => {
                if (undoManager.hasRedo()) {
                  const commandName = undoManager.redo();
                  if (commandName)
                    showInfo(i18n.t('menu.edit.Redo', lang) + ': ' + commandName, UNDO_SHOW_INFO_DURATION);
                  if (loggable) {
                    setCommonStore((state) => {
                      state.actionInfo = {
                        name: 'Redo',
                        timestamp: new Date().getTime(),
                      };
                    });
                  }
                }
              }}
            >
              {i18n.t('menu.edit.Redo', lang) + ': ' + undoManager.getLastRedoName()}
              <label style={{ paddingLeft: '2px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+Y)</label>
            </Menu.Item>
          )}
        </SubMenu>
      )}

      {/* view menu */}
      {!openModelMap && (
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
                    const orbitControlsRef = useRefStore.getState().orbitControlsRef;
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
                  state.groupActionMode = false;
                  state.elementGroupId = null;
                  state.viewState.orthographic = false;
                });
              }}
              style={{ paddingLeft: '36px' }}
            >
              {i18n.t('menu.view.ResetView', lang)}
              <label style={{ paddingLeft: '2px', fontSize: 9 }}>({keyHome})</label>
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
          <Menu.Item key={'orthographic-check-box'}>
            <Checkbox checked={orthographic} onChange={toggle2DView}>
              {i18n.t('menu.view.TwoDimensionalView', lang)}
              <label style={{ paddingLeft: '2px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+B)</label>
            </Checkbox>
          </Menu.Item>
          {!orthographic && (
            <Menu.Item key={'auto-rotate-check-box'}>
              <Checkbox checked={autoRotate} onChange={toggleAutoRotate}>
                {i18n.t('menu.view.AutoRotate', lang)}
                <label style={{ paddingLeft: '2px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+M)</label>
              </Checkbox>
            </Menu.Item>
          )}
          <Menu.Item key={'axes-check-box'}>
            <Checkbox checked={axes} onChange={toggleAxes}>
              {i18n.t('skyMenu.Axes', lang)}
            </Checkbox>
          </Menu.Item>
          <Menu.Item key={'shadow-check-box'}>
            <Checkbox checked={shadowEnabled} onChange={toggleShadow}>
              {i18n.t('menu.view.ShowShadow', lang)}
            </Checkbox>
          </Menu.Item>
          <Menu.Item key={'shininess-check-box'}>
            <Checkbox
              checked={solarPanelShininess === undefined || solarPanelShininess > 0}
              onChange={(e) => {
                setSurfaceShininess(e.target.checked ? DEFAULT_SOLAR_PANEL_SHININESS : 0);
              }}
            >
              {i18n.t('menu.view.ShowSurfaceShininess', lang)}
            </Checkbox>
          </Menu.Item>
          <Menu.Item key={'translucency-check-box'}>
            <Checkbox checked={floatingWindowOpacity < 1} onChange={toggleTranslucency}>
              {i18n.t('menu.view.TranslucentFloatingWindows', lang)}
            </Checkbox>
          </Menu.Item>
          <SubMenu
            key={'accessories'}
            style={{ paddingLeft: '24px' }}
            title={i18n.t('menu.view.accessoriesSubMenu', lang)}
          >
            <Menu.Item key={'site-info-panel-check-box'}>
              <Checkbox checked={showSiteInfoPanel} onChange={toggleSiteInfoPanel}>
                {i18n.t('menu.view.accessories.SiteInformation', lang)}
              </Checkbox>
            </Menu.Item>
            <Menu.Item key={'design-info-panel-check-box'}>
              <Checkbox checked={showDesignInfoPanel} onChange={toggleDesignInfoPanel}>
                {i18n.t('menu.view.accessories.DesignInformation', lang)}
              </Checkbox>
            </Menu.Item>
            <Menu.Item key={'instruction-panel-check-box'}>
              <Checkbox checked={showInstructionPanel} onChange={toggleInstructionPanel}>
                {i18n.t('menu.view.accessories.Instruction', lang)}
              </Checkbox>
            </Menu.Item>
            <Menu.Item key={'sticky-note-panel-check-box'}>
              <Checkbox checked={showStickyNotePanel} onChange={toggleStickyNote}>
                {i18n.t('menu.view.accessories.StickyNote', lang)}
              </Checkbox>
            </Menu.Item>
          </SubMenu>
        </SubMenu>
      )}

      {/* tool menu */}
      {!openModelMap && (
        <SubMenu key={'tool'} title={i18n.t('menu.toolSubMenu', lang)}>
          {!showHeliodonPanel && (
            <Menu.Item key={'heliodon-panel-check-box'} onClick={openHeliodonPanel}>
              {i18n.t('menu.tool.SunAndTime', lang)}...
            </Menu.Item>
          )}
          {!showMapPanel && (
            <Menu.Item key={'map-panel-check-box'} onClick={openMapPanel}>
              {i18n.t('word.Location', lang)}...
            </Menu.Item>
          )}
          {!showWeatherPanel && (
            <Menu.Item key={'weather-panel-check-box'} onClick={openWeatherPanel}>
              {i18n.t('menu.tool.WeatherData', lang)}...
            </Menu.Item>
          )}
          {!showDiurnalTemperaturePanel && (
            <Menu.Item key={'diurnal-temperature-panel-check-box'} onClick={openDiurnalTemperaturePanel}>
              {i18n.t('menu.tool.DiurnalTemperature', lang)}...
            </Menu.Item>
          )}
          {!showEconomicsPanel && (
            <Menu.Item
              key={'economics-panel-menu-item'}
              onClick={() => {
                setCommonStore((state) => {
                  state.viewState.showEconomicsPanel = true;
                  if (loggable) {
                    state.actionInfo = {
                      name: 'Open Economics Panel',
                      timestamp: new Date().getTime(),
                    };
                  }
                });
              }}
            >
              {i18n.t('economicsPanel.EconomicsParameters', lang)}...
            </Menu.Item>
          )}
        </SubMenu>
      )}

      {/* analysis menu */}
      {!openModelMap && (
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
                  if (loggable) {
                    setCommonStore((state) => {
                      state.actionInfo = { name: 'Collect Daily Data for Sensors', timestamp: new Date().getTime() };
                    });
                  }
                  usePrimitiveStore.setState((state) => {
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
                  if (loggable) {
                    setCommonStore((state) => {
                      state.actionInfo = { name: 'Collect Yearly Data for Sensors', timestamp: new Date().getTime() };
                    });
                  }
                  usePrimitiveStore.setState((state) => {
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

          {/* buildings */}
          <SubMenu key={'buildings'} title={i18n.t('menu.buildingSubMenu', lang)}>
            <Menu.Item
              key={'building-energy-daily-data'}
              onClick={() => {
                const status = checkBuilding(elements, countElementsByType, getChildrenOfType);
                if (status === CheckStatus.NO_BUILDING) {
                  showInfo(i18n.t('analysisManager.NoBuildingForAnalysis', lang));
                  return;
                }
                if (status === CheckStatus.AT_LEAST_ONE_BAD_NO_GOOD) {
                  showError(i18n.t('message.SimulationWillNotStartDueToErrors', lang));
                  return;
                }
                if (status === CheckStatus.AT_LEAST_ONE_BAD_AT_LEAST_ONE_GOOD) {
                  showWarning(i18n.t('message.SimulationWillStartDespiteErrors', lang));
                }
                showInfo(i18n.t('message.SimulationStarted', lang));
                // give it 0.1 second for the info to show up
                setTimeout(() => {
                  if (loggable) {
                    setCommonStore((state) => {
                      state.actionInfo = { name: 'Analyze Daily Building Energy', timestamp: new Date().getTime() };
                    });
                  }
                  usePrimitiveStore.setState((state) => {
                    state.runDailyThermalSimulation = true;
                    state.simulationInProgress = true;
                  });
                }, 100);
              }}
            >
              {i18n.t('menu.building.AnalyzeDailyBuildingEnergy', lang)}
            </Menu.Item>
            <Menu.Item
              key={'building-energy-yearly-data'}
              onClick={() => {
                const status = checkBuilding(elements, countElementsByType, getChildrenOfType);
                if (status === CheckStatus.NO_BUILDING) {
                  showInfo(i18n.t('analysisManager.NoBuildingForAnalysis', lang));
                  return;
                }
                if (status === CheckStatus.AT_LEAST_ONE_BAD_NO_GOOD) {
                  showError(i18n.t('message.SimulationWillNotStartDueToErrors', lang));
                  return;
                }
                if (status === CheckStatus.AT_LEAST_ONE_BAD_AT_LEAST_ONE_GOOD) {
                  showWarning(i18n.t('message.SimulationWillStartDespiteErrors', lang));
                }
                showInfo(i18n.t('message.SimulationStarted', lang));
                // give it 0.1 second for the info to show up
                setTimeout(() => {
                  usePrimitiveStore.setState((state) => {
                    state.runYearlyThermalSimulation = true;
                    state.simulationInProgress = true;
                  });
                  if (loggable) {
                    setCommonStore((state) => {
                      state.actionInfo = { name: 'Analyze Yearly Building Energy', timestamp: new Date().getTime() };
                    });
                  }
                }, 100);
              }}
            >
              {i18n.t('menu.building.AnalyzeYearlyBuildingEnergy', lang)}
            </Menu.Item>
            <BuildingEnergySimulationSettings />
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
                    if (state.graphState) state.graphState.dailyPvIndividualOutputs = false;
                    if (loggable) {
                      state.actionInfo = {
                        name: 'Run Daily Simulation For Solar Panels',
                        timestamp: new Date().getTime(),
                      };
                    }
                  });
                  usePrimitiveStore.setState((state) => {
                    state.simulationInProgress = true;
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
                    if (state.graphState) state.graphState.yearlyPvIndividualOutputs = false;
                    if (loggable) {
                      state.actionInfo = {
                        name: 'Run Yearly Simulation For Solar Panels',
                        timestamp: new Date().getTime(),
                      };
                    }
                  });
                  usePrimitiveStore.setState((state) => {
                    state.simulationInProgress = true;
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
                  usePrimitiveStore.setState((state) => {
                    state.runSolarPanelVisibilityAnalysis = !state.runSolarPanelVisibilityAnalysis;
                    state.simulationInProgress = true;
                  });
                  if (loggable) {
                    setCommonStore((state) => {
                      state.actionInfo = {
                        name: 'Run Visibility Analysis For Solar Panels',
                        timestamp: new Date().getTime(),
                      };
                    });
                  }
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
                    if (state.graphState) state.graphState.dailyParabolicTroughIndividualOutputs = false;
                    if (loggable) {
                      state.actionInfo = {
                        name: 'Run Daily Simulation for Parabolic Troughs',
                        timestamp: new Date().getTime(),
                      };
                    }
                  });
                  usePrimitiveStore.setState((state) => {
                    state.simulationInProgress = true;
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
                    if (state.graphState) state.graphState.yearlyParabolicTroughIndividualOutputs = false;
                    if (loggable) {
                      state.actionInfo = {
                        name: 'Run Yearly Simulation for Parabolic Troughs',
                        timestamp: new Date().getTime(),
                      };
                    }
                  });
                  usePrimitiveStore.setState((state) => {
                    state.simulationInProgress = true;
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
                    if (state.graphState) state.graphState.dailyParabolicDishIndividualOutputs = false;
                    if (loggable) {
                      state.actionInfo = {
                        name: 'Run Daily Simulation for Parabolic Dishes',
                        timestamp: new Date().getTime(),
                      };
                    }
                  });
                  usePrimitiveStore.setState((state) => {
                    state.simulationInProgress = true;
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
                    if (state.graphState) state.graphState.yearlyParabolicDishIndividualOutputs = false;
                    if (loggable) {
                      state.actionInfo = {
                        name: 'Run Yearly Simulation for Parabolic Dishes',
                        timestamp: new Date().getTime(),
                      };
                    }
                  });
                  usePrimitiveStore.setState((state) => {
                    state.simulationInProgress = true;
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
                    if (state.graphState) state.graphState.dailyFresnelReflectorIndividualOutputs = false;
                    if (loggable) {
                      state.actionInfo = {
                        name: 'Run Daily Simulation for Fresnel Reflectors',
                        timestamp: new Date().getTime(),
                      };
                    }
                  });
                  usePrimitiveStore.setState((state) => {
                    state.simulationInProgress = true;
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
                    if (state.graphState) state.graphState.yearlyFresnelReflectorIndividualOutputs = false;
                    if (loggable) {
                      state.actionInfo = {
                        name: 'Run Yearly Simulation for Fresnel Reflectors',
                        timestamp: new Date().getTime(),
                      };
                    }
                  });
                  usePrimitiveStore.setState((state) => {
                    state.simulationInProgress = true;
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
                    if (state.graphState) state.graphState.dailyHeliostatIndividualOutputs = false;
                    if (loggable) {
                      state.actionInfo = {
                        name: 'Run Daily Simulation for Heliostats',
                        timestamp: new Date().getTime(),
                      };
                    }
                  });
                  usePrimitiveStore.setState((state) => {
                    state.simulationInProgress = true;
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
                    if (state.graphState) state.graphState.yearlyHeliostatIndividualOutputs = false;
                    if (loggable) {
                      state.actionInfo = {
                        name: 'Run Yearly Simulation for Heliostats',
                        timestamp: new Date().getTime(),
                      };
                    }
                  });
                  usePrimitiveStore.setState((state) => {
                    state.simulationInProgress = true;
                    state.runYearlySimulationForHeliostats = true;
                  });
                }, 100);
              }}
            >
              {i18n.t('menu.heliostat.AnalyzeYearlyYield', lang)}
            </Menu.Item>
            <CspSimulationSettings name={'heliostat'} />
          </SubMenu>

          {/* solar updraft tower */}
          <SubMenu key={'solar-updraft-tower'} title={i18n.t('menu.solarUpdraftTowerSubMenu', lang)}>
            <Menu.Item
              key={'solar-updraft-tower-daily-yield'}
              onClick={() => {
                const towerCount = countSolarStructuresByType(SolarStructure.UpdraftTower);
                if (towerCount === 0) {
                  showInfo(i18n.t('analysisManager.NoSolarUpdraftTowerForAnalysis', lang));
                  return;
                }
                showInfo(i18n.t('message.SimulationStarted', lang));
                // give it 0.1 second for the info to show up
                setTimeout(() => {
                  setCommonStore((state) => {
                    if (state.graphState) state.graphState.dailyUpdraftTowerIndividualOutputs = false;
                    if (loggable) {
                      state.actionInfo = {
                        name: 'Run Daily Simulation for Solar Updraft Tower',
                        timestamp: new Date().getTime(),
                      };
                    }
                  });
                  usePrimitiveStore.setState((state) => {
                    state.simulationInProgress = true;
                    state.runDailySimulationForUpdraftTower = true;
                  });
                }, 100);
              }}
            >
              {i18n.t('menu.solarUpdraftTower.AnalyzeDailyYield', lang)}
            </Menu.Item>
            <Menu.Item
              key={'solar-updraft-tower-yearly-yield'}
              onClick={() => {
                const towerCount = countSolarStructuresByType(SolarStructure.UpdraftTower);
                if (towerCount === 0) {
                  showInfo(i18n.t('analysisManager.NoSolarUpdraftTowerForAnalysis', lang));
                  return;
                }
                showInfo(i18n.t('message.SimulationStarted', lang));
                // give it 0.1 second for the info to show up
                setTimeout(() => {
                  setCommonStore((state) => {
                    if (state.graphState) state.graphState.yearlyUpdraftTowerIndividualOutputs = false;
                    if (loggable) {
                      state.actionInfo = {
                        name: 'Run Yearly Simulation for Solar Updraft Tower',
                        timestamp: new Date().getTime(),
                      };
                    }
                  });
                  usePrimitiveStore.setState((state) => {
                    state.simulationInProgress = true;
                    state.runYearlySimulationForUpdraftTower = true;
                  });
                }, 100);
              }}
            >
              {i18n.t('menu.solarUpdraftTower.AnalyzeYearlyYield', lang)}
            </Menu.Item>
            <SutSimulationSettings />
          </SubMenu>
        </SubMenu>
      )}

      {/* benchmarks menu */}
      <SubMenu key={'benchmarks'} title={i18n.t('menu.benchmarksSubMenu', lang)}>
        <Menu.Item key="solar_radiation_predicted_vs_measured" onClick={loadFile}>
          {i18n.t('menu.benchmarks.SolarRadiationPredictionVsMeasurement', lang)}
        </Menu.Item>
        <Menu.Item key="bestest_case_600" onClick={loadFile}>
          {i18n.t('menu.benchmarks.BESTESTCase600', lang)}
        </Menu.Item>
        <Menu.Item key="bestest_case_610" onClick={loadFile}>
          {i18n.t('menu.benchmarks.BESTESTCase610', lang)}
        </Menu.Item>
        <Menu.Item key="bestest_case_620" onClick={loadFile}>
          {i18n.t('menu.benchmarks.BESTESTCase620', lang)}
        </Menu.Item>
        <Menu.Item key="bestest_case_630" onClick={loadFile}>
          {i18n.t('menu.benchmarks.BESTESTCase630', lang)}
        </Menu.Item>
      </SubMenu>

      {/* tutorials menu */}
      <SubMenu key={'tutorials'} title={i18n.t('menu.tutorialsSubMenu', lang)}>
        {/* solar science */}
        <SubMenu key={'solar-energy-science'} title={i18n.t('menu.solarEnergyScienceSubMenu', lang)}>
          <Menu.Item key="sun_angles" onClick={loadFile}>
            {i18n.t('menu.solarEnergyScienceTutorials.SunAngles', lang)}
          </Menu.Item>
          <Menu.Item key="insolation_and_climate" onClick={loadFile}>
            {i18n.t('menu.solarEnergyScienceTutorials.InsolationAndClimate', lang)}
          </Menu.Item>
          <Menu.Item key="solar_radiation_to_box" onClick={loadFile}>
            {i18n.t('menu.solarEnergyScienceTutorials.SolarRadiationToBox', lang)}
          </Menu.Item>
          <Menu.Item key="sun_beam_at_center" onClick={loadFile}>
            {i18n.t('menu.solarEnergyExamples.SunBeamAndHeliodon', lang)}
          </Menu.Item>
        </SubMenu>
        {/* building science */}
        <SubMenu key={'building-science'} title={i18n.t('menu.buildingScienceSubMenu', lang)}>
          <Menu.Item key="thermal_vs_building_envelope" onClick={loadFile}>
            {i18n.t('menu.buildingScienceTutorials.ThermalEnvelopeVsBuildingEnvelope', lang)}
          </Menu.Item>
          <Menu.Item key="effect_house_size" onClick={loadFile}>
            {i18n.t('menu.buildingScienceTutorials.EffectOfSizeOnBuildingEnergy', lang)}
          </Menu.Item>
          <Menu.Item key="effect_house_orientation" onClick={loadFile}>
            {i18n.t('menu.buildingScienceTutorials.EffectOfOrientationOnBuildingEnergy', lang)}
          </Menu.Item>
          <Menu.Item key="effect_wall_roof_insulation" onClick={loadFile}>
            {i18n.t('menu.buildingScienceTutorials.EffectOfInsulationOnBuildingEnergy', lang)}
          </Menu.Item>
          <Menu.Item key="effect_roof_color" onClick={loadFile}>
            {i18n.t('menu.buildingScienceTutorials.EffectOfRoofColorOnBuildingEnergy', lang)}
          </Menu.Item>
          <Menu.Item key="effect_eaves_overhang_length" onClick={loadFile}>
            {i18n.t('menu.buildingScienceTutorials.EffectOfEavesOverhangLengthOnBuildingEnergy', lang)}
          </Menu.Item>
          <Menu.Item key="effect_window_shgc" onClick={loadFile}>
            {i18n.t('menu.buildingScienceTutorials.EffectOfWindowSHGCOnBuildingEnergy', lang)}
          </Menu.Item>
          <Menu.Item key="effect_thermostat_setpoint" onClick={loadFile}>
            {i18n.t('menu.buildingScienceTutorials.EffectOfThermostatSetpointOnBuildingEnergy', lang)}
          </Menu.Item>
          <Menu.Item key="effect_solar_panels" onClick={loadFile}>
            {i18n.t('menu.buildingScienceTutorials.EffectOfSolarPanelsOnBuildingEnergy', lang)}
          </Menu.Item>
          <Menu.Item key="effect_ground_temperature" onClick={loadFile}>
            {i18n.t('menu.buildingScienceTutorials.EffectOfGroundTemperatureOnBuildingEnergy', lang)}
          </Menu.Item>
          <Menu.Item key="effect_trees" onClick={loadFile}>
            {i18n.t('menu.buildingScienceTutorials.EffectOfTreesOnBuildingEnergy', lang)}
          </Menu.Item>
        </SubMenu>
        {/* building design */}
        <SubMenu key={'building-design'} title={i18n.t('menu.buildingDesignSubMenu', lang)}>
          <Menu.Item key="cape_cod_with_shed_dormer" onClick={loadFile}>
            {i18n.t('menu.buildingDesignTutorials.CapeCodStyleHouseWithShedDormer', lang)}
          </Menu.Item>
          <Menu.Item key="mansard_roof_with_dormers" onClick={loadFile}>
            {i18n.t('menu.buildingDesignTutorials.MansardRoofWithDormers', lang)}
          </Menu.Item>
          <Menu.Item key="gable_roof_vs_hip_roof" onClick={loadFile}>
            {i18n.t('menu.buildingDesignTutorials.GableRoofVsHipRoof', lang)}
          </Menu.Item>
          <Menu.Item key="colonial_vs_saltbox" onClick={loadFile}>
            {i18n.t('menu.buildingDesignTutorials.ColonialVsSaltbox', lang)}
          </Menu.Item>
          <Menu.Item key="gambrel_roof_vs_mansard_roof" onClick={loadFile}>
            {i18n.t('menu.buildingDesignTutorials.GambrelRoofVsMansardRoof', lang)}
          </Menu.Item>
          <Menu.Item key="combination_roof_vs_bonnet_roof" onClick={loadFile}>
            {i18n.t('menu.buildingDesignTutorials.CombinationRoofVsBonnetRoof', lang)}
          </Menu.Item>
          <Menu.Item key="dutch_gable_roof" onClick={loadFile}>
            {i18n.t('menu.buildingDesignTutorials.DutchGableRoof', lang)}
          </Menu.Item>
          <Menu.Item key="gable_and_valley_roof" onClick={loadFile}>
            {i18n.t('menu.buildingDesignTutorials.GableAndValleyRoof', lang)}
          </Menu.Item>
          <Menu.Item key="clerestory_roof" onClick={loadFile}>
            {i18n.t('menu.buildingDesignTutorials.ClerestoryRoof', lang)}
          </Menu.Item>
          <Menu.Item key="monitor_roof" onClick={loadFile}>
            {i18n.t('menu.buildingDesignTutorials.MonitorRoof', lang)}
          </Menu.Item>
          <Menu.Item key="a_frame_house" onClick={loadFile}>
            {i18n.t('menu.buildingDesignTutorials.AFrameHouse', lang)}
          </Menu.Item>
          <Menu.Item key="all_roof_types" onClick={loadFile}>
            {i18n.t('menu.buildingDesignTutorials.AllBasicRoofTypes', lang)}
          </Menu.Item>
        </SubMenu>
        {/* photovoltaic solar power */}
        <SubMenu key={'photovoltaic-solar-power'} title={i18n.t('menu.photovoltaicSolarPowerSubMenu', lang)}>
          <Menu.Item key="effect_tilt_angle_solar_panel" onClick={loadFile}>
            {i18n.t('menu.photovoltaicSolarPowerTutorials.EffectOfTiltAngleOfSolarPanel', lang)}
          </Menu.Item>
          <Menu.Item key="effect_azimuth_solar_panel" onClick={loadFile}>
            {i18n.t('menu.photovoltaicSolarPowerTutorials.EffectOfAzimuthOfSolarPanel', lang)}
          </Menu.Item>
          <Menu.Item key="solar_panel_types" onClick={loadFile}>
            {i18n.t('menu.photovoltaicSolarPowerTutorials.SolarPanelTypes', lang)}
          </Menu.Item>
          <Menu.Item key="solar_trackers" onClick={loadFile}>
            {i18n.t('menu.photovoltaicSolarPowerTutorials.SolarTrackers', lang)}
          </Menu.Item>
          <Menu.Item key="why_solar_array" onClick={loadFile}>
            {i18n.t('menu.photovoltaicSolarPowerTutorials.CoveringGroundWithSolarPanels', lang)}
          </Menu.Item>
          <Menu.Item key="inter_row_spacing" onClick={loadFile}>
            {i18n.t('menu.photovoltaicSolarPowerTutorials.InterRowSpacingOfSolarPanelArray', lang)}
          </Menu.Item>
          <Menu.Item key="effect_orientation_solar_panel" onClick={loadFile}>
            {i18n.t('menu.photovoltaicSolarPowerTutorials.EffectOfOrientationOfSolarPanels', lang)}
          </Menu.Item>
          <Menu.Item key="solar_panel_array_auto_layout" onClick={loadFile}>
            {i18n.t('menu.photovoltaicSolarPowerTutorials.SolarPanelArrayAutomaticLayout', lang)}
          </Menu.Item>
          <Menu.Item key="rooftop_solar_panels" onClick={loadFile}>
            {i18n.t('menu.solarEnergyExamples.RooftopSolarPanels', lang)}
          </Menu.Item>
          <Menu.Item key="solar_canopy_form_factors" onClick={loadFile}>
            {i18n.t('menu.solarEnergyExamples.SolarCanopyFormFactors', lang)}
          </Menu.Item>
          <Menu.Item key="bipv_01" onClick={loadFile}>
            {i18n.t('menu.solarEnergyExamples.BuildingIntegratedPhotovoltaics', lang)}
          </Menu.Item>
        </SubMenu>
        {/* concentrated solar power */}
        <SubMenu key={'concentrated-solar-power'} title={i18n.t('menu.concentratedSolarPowerSubMenu', lang)}>
          <Menu.Item key="parabolic_dish_focus_sunlight" onClick={loadFile}>
            {i18n.t('menu.concentratedSolarPowerTutorials.FocusSunlightWithParabolicDish', lang)}
          </Menu.Item>
          <Menu.Item key="effect_azimuth_parabolic_trough" onClick={loadFile}>
            {i18n.t('menu.concentratedSolarPowerTutorials.EffectOfAzimuthOfParabolicTrough', lang)}
          </Menu.Item>
          <Menu.Item key="effect_latus_rectum_parabolic_trough" onClick={loadFile}>
            {i18n.t('menu.concentratedSolarPowerTutorials.EffectOfLatusRectumOfParabolicTrough', lang)}
          </Menu.Item>
          <Menu.Item key="linear_fresnel_reflectors" onClick={loadFile}>
            {i18n.t('menu.concentratedSolarPowerTutorials.LinearFresnelReflectors', lang)}
          </Menu.Item>
          <Menu.Item key="effect_absorber_pipe_height" onClick={loadFile}>
            {i18n.t('menu.concentratedSolarPowerTutorials.EffectOfAbsorberPipeHeightForLinearFresnelReflectors', lang)}
          </Menu.Item>
          <Menu.Item key="effect_azimuth_fresnel_reflector" onClick={loadFile}>
            {i18n.t('menu.concentratedSolarPowerTutorials.EffectOfAzimuthOfLinearFresnelReflectors', lang)}
          </Menu.Item>
          <Menu.Item key="linear_fresnel_reflectors_two_absorbers" onClick={loadFile}>
            {i18n.t('menu.concentratedSolarPowerTutorials.LinearFresnelReflectorsWithTwoAbsorbers', lang)}
          </Menu.Item>
          <Menu.Item key="solar_power_tower" onClick={loadFile}>
            {i18n.t('menu.concentratedSolarPowerTutorials.SolarPowerTower', lang)}
          </Menu.Item>
          <Menu.Item key="cosine_efficiency_heliostats" onClick={loadFile}>
            {i18n.t('menu.concentratedSolarPowerTutorials.CosineEfficiencyOfHeliostats', lang)}
          </Menu.Item>
          <Menu.Item key="shadowing_blocking_heliostats" onClick={loadFile}>
            {i18n.t('menu.concentratedSolarPowerTutorials.ShadowingAndBlockingOfHeliostats', lang)}
          </Menu.Item>
          <Menu.Item key="effect_solar_power_tower_height" onClick={loadFile}>
            {i18n.t('menu.concentratedSolarPowerTutorials.EffectSolarPowerTowerHeight', lang)}
          </Menu.Item>
        </SubMenu>
        {/* other types of solar power */}
        <SubMenu key={'other-types-of-solar-power'} title={i18n.t('menu.otherTypesOfSolarPowerSubMenu', lang)}>
          <Menu.Item key="solar_updraft_tower" onClick={loadFile}>
            {i18n.t('menu.otherTypesOfSolarPowerTutorials.SolarUpdraftTower', lang)}
          </Menu.Item>
        </SubMenu>
      </SubMenu>

      {/* example menu */}
      <SubMenu key={'examples'} title={i18n.t('menu.examplesSubMenu', lang)}>
        {/* solar energy */}
        <SubMenu key={'solar-energy'} title={i18n.t('menu.solarEnergySubMenu', lang)}>
          <SubMenu key={'photovoltaic-solar-power-examples'} title={i18n.t('menu.photovoltaicSolarPowerSubMenu', lang)}>
            <Menu.Item key="vegetative_buffer_01" onClick={loadFile}>
              {i18n.t('menu.solarEnergyExamples.VegetativeBuffer', lang)}
            </Menu.Item>
            <Menu.Item key="solar_canopy_over_bleachers" onClick={loadFile}>
              {i18n.t('menu.solarEnergyExamples.SolarCanopyOverBleachers', lang)}
            </Menu.Item>
            <Menu.Item key="solar_canopy_over_garage" onClick={loadFile}>
              {i18n.t('menu.solarEnergyExamples.SolarCanopyOverGarage', lang)}
            </Menu.Item>
            <Menu.Item key="solar_bus_stop" onClick={loadFile}>
              {i18n.t('menu.solarEnergyExamples.SolarBusStop', lang)}
            </Menu.Item>
            <Menu.Item key="solar_facade_tesla" onClick={loadFile}>
              {i18n.t('menu.solarEnergyExamples.SolarFacadeTesla', lang)}
            </Menu.Item>
            <Menu.Item key="floatovoltaics" onClick={loadFile}>
              {i18n.t('menu.solarEnergyExamples.Floatovoltaics', lang)}
            </Menu.Item>
            <Menu.Item key="agrivoltaics" onClick={loadFile}>
              {i18n.t('menu.solarEnergyExamples.Agrivoltaics', lang)}
            </Menu.Item>
            <Menu.Item key="solar_farm_fixed_array" onClick={loadFile}>
              {i18n.t('menu.solarEnergyExamples.FixedSolarPanelArraysFraminghamMA', lang)}
            </Menu.Item>
            <Menu.Item key="mickey_mouse_solar_farm" onClick={loadFile}>
              {i18n.t('menu.solarEnergyExamples.MickeyMouseSolarFarmOrlandoFL', lang)}
            </Menu.Item>
            <Menu.Item key="solar_panels_over_canal" onClick={loadFile}>
              {i18n.t('menu.solarEnergyExamples.SolarPanelsOverCanalBakersfieldCA', lang)}
            </Menu.Item>
            <Menu.Item key="solar_noise_barrier" onClick={loadFile}>
              {i18n.t('menu.solarEnergyExamples.SolarNoiseBarrierLexingtonMA', lang)}
            </Menu.Item>
            <Menu.Item key="solar_farm_hsat_array" onClick={loadFile}>
              {i18n.t('menu.solarEnergyExamples.HSATSolarTrackersRaleighNC', lang)}
            </Menu.Item>
            <Menu.Item key="solar_farm_aadat_array" onClick={loadFile}>
              {i18n.t('menu.solarEnergyExamples.AADATSolarTrackersLancasterCA', lang)}
            </Menu.Item>
          </SubMenu>
          <SubMenu key={'concentrated-solar-power-examples'} title={i18n.t('menu.concentratedSolarPowerSubMenu', lang)}>
            <Menu.Item key="nevada_solar_one_parabolic_troughs" onClick={loadFile}>
              {i18n.t('menu.solarEnergyExamples.NevadaSolarOneParabolicTroughArray', lang)}
            </Menu.Item>
            <Menu.Item key="tooele_parabolic_dish_array" onClick={loadFile}>
              {i18n.t('menu.solarEnergyExamples.TooeleParabolicDishArray', lang)}
            </Menu.Item>
            <Menu.Item key="tucson_sundt_station" onClick={loadFile}>
              {i18n.t('menu.solarEnergyExamples.TucsonLinearFresnelReflectors', lang)}
            </Menu.Item>
            <Menu.Item key="ps10_solar_power_tower" onClick={loadFile}>
              {i18n.t('menu.solarEnergyExamples.PS10SolarPowerTower', lang)}
            </Menu.Item>
          </SubMenu>
          <SubMenu
            key={'other-types-of-solar-power-examples'}
            title={i18n.t('menu.otherTypesOfSolarPowerSubMenu', lang)}
          >
            <Menu.Item key="solar_updraft_tower_city" onClick={loadFile}>
              {i18n.t('menu.solarEnergyExamples.SolarUpdraftTowerInCity', lang)}
            </Menu.Item>
          </SubMenu>
        </SubMenu>

        {/* built environments */}
        <SubMenu key={'built-environment'} title={i18n.t('menu.builtEnvironmentSubMenu', lang)}>
          <SubMenu key={'residential_buildings'} title={i18n.t('menu.residentialBuildingsSubMenu', lang)}>
            <Menu.Item key="colonial_house" onClick={loadFile}>
              {i18n.t('menu.residentialBuildingExamples.ColonialHouse', lang)}
            </Menu.Item>
            <Menu.Item key="dutch_colonial_house" onClick={loadFile}>
              {i18n.t('menu.residentialBuildingExamples.DutchColonialHouse', lang)}
            </Menu.Item>
            <Menu.Item key="t_shaped_house" onClick={loadFile}>
              {i18n.t('menu.residentialBuildingExamples.TShapedHouse', lang)}
            </Menu.Item>
            <Menu.Item key="cape_cod_with_garage" onClick={loadFile}>
              {i18n.t('menu.residentialBuildingExamples.CapeCodHouseWithGarage', lang)}
            </Menu.Item>
            <Menu.Item key="solarium" onClick={loadFile}>
              {i18n.t('menu.residentialBuildingExamples.Solarium', lang)}
            </Menu.Item>
            <Menu.Item key="butterfly_roof_house" onClick={loadFile}>
              {i18n.t('menu.residentialBuildingExamples.ButterflyRoofHouse', lang)}
            </Menu.Item>
            <Menu.Item key="adobe_taos_house" onClick={loadFile}>
              {i18n.t('menu.residentialBuildingExamples.AdobeTaosHouse', lang)}
            </Menu.Item>
            <Menu.Item key="bonnet_house" onClick={loadFile}>
              {i18n.t('menu.residentialBuildingExamples.BonnetHouse', lang)}
            </Menu.Item>
            <Menu.Item key="barn_house" onClick={loadFile}>
              {i18n.t('menu.residentialBuildingExamples.BarnStyleHouse', lang)}
            </Menu.Item>
            <Menu.Item key="modern_house_01" onClick={loadFile}>
              {i18n.t('menu.residentialBuildingExamples.ModernHouse', lang)}
            </Menu.Item>
          </SubMenu>
          <SubMenu key={'commercial_buildings'} title={i18n.t('menu.commercialBuildingsSubMenu', lang)}>
            <Menu.Item key="white_house" onClick={loadFile}>
              {i18n.t('menu.commercialBuildingExamples.WhiteHouse', lang)}
            </Menu.Item>
            <Menu.Item key="spanish_style_hotel" onClick={loadFile}>
              {i18n.t('menu.commercialBuildingExamples.SpanishStyleHotel', lang)}
            </Menu.Item>
            <Menu.Item key="apartment_building_01" onClick={loadFile}>
              {i18n.t('menu.commercialBuildingExamples.ApartmentBuilding', lang)}
            </Menu.Item>
            <Menu.Item key="office_building_01" onClick={loadFile}>
              {i18n.t('menu.commercialBuildingExamples.OfficeBuilding', lang)}
            </Menu.Item>
            <Menu.Item key="hotel_01" onClick={loadFile}>
              {i18n.t('menu.commercialBuildingExamples.Hotel', lang)}
            </Menu.Item>
          </SubMenu>
          <SubMenu key={'other_buildings'} title={i18n.t('menu.otherBuildingsSubMenu', lang)}>
            <Menu.Item key="greenhouse" onClick={loadFile}>
              {i18n.t('menu.otherBuildingExamples.Greenhouse', lang)}
            </Menu.Item>
            <Menu.Item key="church_01" onClick={loadFile}>
              {i18n.t('menu.residentialBuildingExamples.Church1', lang)}
            </Menu.Item>
            <Menu.Item key="cathedral_01" onClick={loadFile}>
              {i18n.t('menu.residentialBuildingExamples.Cathedral1', lang)}
            </Menu.Item>
            <Menu.Item key="cathedral_02" onClick={loadFile}>
              {i18n.t('menu.residentialBuildingExamples.Cathedral2', lang)}
            </Menu.Item>
            <Menu.Item key="mosque_01" onClick={loadFile}>
              {i18n.t('menu.residentialBuildingExamples.Mosque1', lang)}
            </Menu.Item>
            <Menu.Item key="pavilion" onClick={loadFile}>
              {i18n.t('menu.otherBuildingExamples.Pavilion', lang)}
            </Menu.Item>
            <Menu.Item key="octagonal_pagoda" onClick={loadFile}>
              {i18n.t('menu.otherBuildingExamples.OctagonalPagoda', lang)}
            </Menu.Item>
            <Menu.Item key="ocean_front" onClick={loadFile}>
              {i18n.t('menu.otherBuildingExamples.OceanFront', lang)}
            </Menu.Item>
            <Menu.Item key="egyptian_pyramids" onClick={loadFile}>
              {i18n.t('menu.otherBuildingExamples.EgyptianPyramids', lang)}
            </Menu.Item>
            <Menu.Item key="mayan_pyramid" onClick={loadFile}>
              {i18n.t('menu.otherBuildingExamples.MayanPyramid', lang)}
            </Menu.Item>
            <Menu.Item key="si_o_se_pol" onClick={loadFile}>
              {i18n.t('menu.otherBuildingExamples.SiOSePol', lang)}
            </Menu.Item>
          </SubMenu>
          <SubMenu key={'building_complexes'} title={i18n.t('menu.buildingComplexesSubMenu', lang)}>
            <Menu.Item key="south_burlington_high_school" onClick={loadFile}>
              {i18n.t('menu.buildingComplexExamples.SouthBurlingtonHighSchoolVermont', lang)}
            </Menu.Item>
            <Menu.Item key="mescalero_apache_school" onClick={loadFile}>
              {i18n.t('menu.buildingComplexExamples.MescaleroApacheSchoolNewMexico', lang)}
            </Menu.Item>
          </SubMenu>
          <SubMenu key={'urban_planning'} title={i18n.t('menu.urbanPlanningSubMenu', lang)}>
            <Menu.Item key="heatmap_01" onClick={loadFile}>
              {i18n.t('menu.urbanPlanningExamples.Heatmap1', lang)}
            </Menu.Item>
          </SubMenu>
        </SubMenu>

        {/* artificial intelligence */}
        <SubMenu key={'artificial-intelligence'} title={i18n.t('menu.artificialIntelligenceSubMenu', lang)}>
          <Menu.Item key="ai_tilt_angle_one_row" onClick={loadFile}>
            {i18n.t('menu.artificialIntelligenceExamples.OptimizingTiltAngleOfOneSolarPanelRow', lang)}
          </Menu.Item>
          <Menu.Item key="ai_tilt_angles_multiple_rows" onClick={loadFile}>
            {i18n.t('menu.artificialIntelligenceExamples.OptimizingTiltAnglesOfMultipleSolarPanelRows', lang)}
          </Menu.Item>
          <Menu.Item key="ai_solar_farm_design" onClick={loadFile}>
            {i18n.t('menu.artificialIntelligenceExamples.SolarFarmGenerativeDesign', lang)}
          </Menu.Item>
          <Menu.Item key="ai_solar_farm_design_block" onClick={loadFile}>
            {i18n.t('menu.artificialIntelligenceExamples.SolarFarmGenerativeDesignWithBlock', lang)}
          </Menu.Item>
          <Menu.Item key="ai_fitchburg_solar_farm" onClick={loadFile}>
            {i18n.t('menu.artificialIntelligenceExamples.FitchburgSolarFarmGenerativeDesign', lang)}
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
      {/* explore window */}
      {!viewOnly && !openModelMap && (
        <Menu.Item
          key="world"
          onClick={() => {
            setCommonStore((state) => {
              state.openModelMap = true;
              state.modelMapWeatherStations = false;
              if (loggable) {
                state.actionInfo = {
                  name: 'Open Model Map',
                  timestamp: new Date().getTime(),
                };
              }
            });
          }}
        >
          {i18n.t('menu.Explore', lang)}...
        </Menu.Item>
      )}
      {/* about window */}
      <Menu.Item
        key="about"
        onClick={() => {
          setCommonStore((state) => {
            state.openModelMap = false;
          });
          setAboutUs(true);
        }}
      >
        {i18n.t('menu.AboutUs', lang)}...
      </Menu.Item>
    </Menu>
  );

  // Manually update menu when visible to avoid listen to common store change.
  const [updateMenuFlag, setUpdateMenuFlag] = useState(false);

  const handleVisibleChange = (visible: boolean) => {
    if (visible) {
      setUpdateMenuFlag(!updateMenuFlag);
    }
  };

  return (
    <>
      <Dropdown overlay={menu} trigger={['click']} onVisibleChange={handleVisibleChange}>
        <MainMenuContainer>
          <StyledImage src={logo} title={i18n.t('tooltip.clickToOpenMenu', lang)} />
          <LabelContainer>
            <label style={{ fontSize: '10px', alignContent: 'center', cursor: 'pointer' }}>
              {i18n.t('menu.mainMenu', lang)}
            </label>
          </LabelContainer>
        </MainMenuContainer>
      </Dropdown>
      {aboutUs && <About close={() => setAboutUs(false)} />}
    </>
  );
};

export default React.memo(MainMenu);
