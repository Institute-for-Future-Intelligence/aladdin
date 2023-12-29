/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { MenuProps } from 'antd';
import { useStore } from 'src/stores/common';
import { MenuItem } from '../contextMenu/menuItems';
import i18n from 'src/i18n/i18n';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { Undoable } from 'src/undo/Undoable';

export const createSettingsMenu = () => {
  const lang = { lng: useStore.getState().language };

  const setCommonStore = useStore.getState().set;
  const addUndoable = useStore.getState().addUndoable;
  const showHeliodonPanel = useStore.getState().viewState.showHeliodonPanel;
  const showMapPanel = useStore.getState().viewState.showMapPanel;
  const showWeatherPanel = useStore.getState().viewState.showWeatherPanel;
  const showDiurnalTemperaturePanel = useStore.getState().viewState.showDiurnalTemperaturePanel;
  const showEconomicsPanel = usePrimitiveStore.getState().showEconomicsPanel;
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

  const items: MenuProps['items'] = [];

  // sun-time
  if (!showHeliodonPanel) {
    items.push({
      key: 'sun-time',
      label: (
        <MenuItem noPadding onClick={openHeliodonPanel}>
          {i18n.t('menu.settings.SunAndTime', lang)}...
        </MenuItem>
      ),
    });
  }

  // show-map-panel
  if (!showMapPanel) {
    items.push({
      key: 'show-map-panel',
      label: (
        <MenuItem noPadding onClick={openMapPanel}>
          {i18n.t('word.Location', lang)}...
        </MenuItem>
      ),
    });
  }

  // weather-panel
  if (!showWeatherPanel) {
    items.push({
      key: 'weather-panel',
      label: (
        <MenuItem noPadding onClick={openWeatherPanel}>
          {i18n.t('menu.settings.WeatherData', lang)}...
        </MenuItem>
      ),
    });
  }

  // diurnal-temperature-panel
  if (!showDiurnalTemperaturePanel) {
    items.push({
      key: 'diurnal-temperature-panel',
      label: (
        <MenuItem noPadding onClick={openDiurnalTemperaturePanel}>
          {i18n.t('menu.settings.DiurnalTemperature', lang)}...
        </MenuItem>
      ),
    });
  }

  // economics-panel
  if (!showEconomicsPanel) {
    items.push({
      key: 'economics-panel',
      label: (
        <MenuItem noPadding onClick={openEconomicsPanel}>
          {i18n.t('economicsPanel.EconomicsParameters', lang)}...
        </MenuItem>
      ),
    });
  }

  // navigation-panel
  if (!showNavigationPanel) {
    items.push({
      key: 'navigation-panel',
      label: (
        <MenuItem noPadding onClick={openNavigationPanel}>
          {i18n.t('navigationPanel.NavigationParameters', lang)}...
        </MenuItem>
      ),
    });
  }

  // shadow-settings
  if (!showShadowSettings) {
    items.push({
      key: 'shadow-settings',
      label: (
        <MenuItem noPadding onClick={openShadowSettings}>
          {i18n.t('shadowSettingsPanel.ShadowSettings', lang)}...
        </MenuItem>
      ),
    });
  }

  return items;
};
