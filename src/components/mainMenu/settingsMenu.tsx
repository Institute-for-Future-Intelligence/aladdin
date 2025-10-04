/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { useStore } from 'src/stores/common';
import i18n from 'src/i18n/i18n';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { Undoable } from 'src/undo/Undoable';
import { useLanguage } from 'src/hooks';
import { MainMenuItem, MainSubMenu } from './mainMenuItems';

const SettingsMenu = () => {
  const lang = useLanguage();

  const setCommonStore = useStore.getState().set;
  const addUndoable = useStore.getState().addUndoable;
  const showHeliodonPanel = useStore.getState().viewState.showHeliodonPanel;
  const showMapPanel = useStore.getState().viewState.showMapPanel;
  const showWeatherPanel = useStore.getState().viewState.showWeatherPanel;
  const showDiurnalTemperaturePanel = useStore.getState().viewState.showDiurnalTemperaturePanel;
  const showSolarPanelCustomizationPanel = usePrimitiveStore.getState().showSolarPanelCustomizationPanel;
  const showEconomicsPanel = usePrimitiveStore.getState().showEconomicsPanel;
  const showEditorPanel = usePrimitiveStore.getState().showEditorPanel;
  const showNavigationPanel = usePrimitiveStore.getState().showNavigationPanel;
  const showShadowSettings = usePrimitiveStore.getState().showShadowSettings;
  const loggable = useStore.getState().loggable;

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
      state.selectedFloatingWindow = 'heliodonPanel';
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
      state.selectedFloatingWindow = 'mapPanel';
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
      state.selectedFloatingWindow = 'weatherPanel';
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
      state.selectedFloatingWindow = 'diurnalTemperaturePanel';
    });
  };

  const openSolarPanelCustomizationPanel = () => {
    usePrimitiveStore.getState().set((state) => {
      state.showSolarPanelCustomizationPanel = true;
    });
    if (loggable) {
      setCommonStore((state) => {
        state.actionInfo = {
          name: 'Open Solar Panel Customization Panel',
          timestamp: new Date().getTime(),
        };
      });
    }
  };

  const openEconomicsPanel = () => {
    usePrimitiveStore.getState().set((state) => {
      state.showEconomicsPanel = true;
    });
    if (loggable) {
      setCommonStore((state) => {
        state.actionInfo = {
          name: 'Open Economics Panel',
          timestamp: new Date().getTime(),
        };
      });
    }
  };

  const openEditorPanel = () => {
    usePrimitiveStore.getState().set((state) => {
      state.showEditorPanel = true;
    });
    if (loggable) {
      setCommonStore((state) => {
        state.actionInfo = {
          name: 'Open Editor Panel',
          timestamp: new Date().getTime(),
        };
      });
    }
  };

  const openNavigationPanel = () => {
    usePrimitiveStore.getState().set((state) => {
      state.showNavigationPanel = true;
    });
    if (loggable) {
      setCommonStore((state) => {
        state.actionInfo = {
          name: 'Open Navigation Panel',
          timestamp: new Date().getTime(),
        };
      });
    }
  };

  const openShadowSettings = () => {
    usePrimitiveStore.getState().set((state) => {
      state.showShadowSettings = true;
    });
    if (loggable) {
      setCommonStore((state) => {
        state.actionInfo = {
          name: 'Open Shadow Settings',
          timestamp: new Date().getTime(),
        };
      });
    }
  };

  return (
    <MainSubMenu label={i18n.t('menu.settingsSubMenu', lang)}>
      {/* sun time */}
      {!showHeliodonPanel && (
        <MainMenuItem onClick={openHeliodonPanel}>{i18n.t('menu.settings.SunAndTime', lang)}...</MainMenuItem>
      )}

      {/* show map panel */}
      {!showMapPanel && <MainMenuItem onClick={openMapPanel}>{i18n.t('word.Location', lang)}...</MainMenuItem>}

      {/* weather panel */}
      {!showWeatherPanel && (
        <MainMenuItem onClick={openWeatherPanel}>{i18n.t('menu.settings.WeatherData', lang)}...</MainMenuItem>
      )}

      {/* diurnal temperature panel */}
      {!showDiurnalTemperaturePanel && (
        <MainMenuItem onClick={openDiurnalTemperaturePanel}>
          {i18n.t('menu.settings.DiurnalTemperature', lang)}...
        </MainMenuItem>
      )}

      {/* solar panel customization */}
      {!showSolarPanelCustomizationPanel && (
        <MainMenuItem onClick={openSolarPanelCustomizationPanel}>
          {i18n.t('menu.settings.CustomSolarPanels', lang)}...
        </MainMenuItem>
      )}

      {/* economics panel */}
      {!showEconomicsPanel && (
        <MainMenuItem onClick={openEconomicsPanel}>
          {i18n.t('economicsPanel.EconomicsParameters', lang)}...
        </MainMenuItem>
      )}

      {/* editor panel */}
      {!showEditorPanel && (
        <MainMenuItem onClick={openEditorPanel}>{i18n.t('editorPanel.EditorParameters', lang)}...</MainMenuItem>
      )}

      {/* navigation panel */}
      {!showNavigationPanel && (
        <MainMenuItem onClick={openNavigationPanel}>
          {i18n.t('navigationPanel.NavigationParameters', lang)}...
        </MainMenuItem>
      )}

      {/* shadow settings */}
      {!showShadowSettings && (
        <MainMenuItem onClick={openShadowSettings}>
          {i18n.t('shadowSettingsPanel.ShadowSettings', lang)}...
        </MainMenuItem>
      )}
    </MainSubMenu>
  );
};

export default SettingsMenu;
