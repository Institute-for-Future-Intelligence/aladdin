/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { MenuProps } from 'antd';
import { useStore } from 'src/stores/common';
import { MenuItem } from '../contextMenu/menuItems';
import i18n from 'src/i18n/i18n';
import { MainMenuCheckbox, LabelMark } from './mainMenuItems';
import { useRefStore } from 'src/stores/commonRef';
import { ObjectType } from 'src/types';
import { UndoableResetView } from 'src/undo/UndoableResetView';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { UndoableCheck } from 'src/undo/UndoableCheck';
import { DEFAULT_VIEW_SOLAR_PANEL_SHININESS, FLOATING_WINDOW_OPACITY, KeyCtrl } from 'src/constants';
import { UndoableChange } from 'src/undo/UndoableChange';
import * as Selector from '../../stores/selector';
import { UndoableCameraChange } from '../../undo/UndoableCameraChange';

export const resetView = () => {
  const orbitControlsRef = useRefStore.getState().orbitControlsRef;
  if (orbitControlsRef?.current) {
    // I don't know why the reset method results in a black screen.
    // So we are resetting it here to a predictable position.
    const z = Math.min(50, useStore.getState().sceneRadius * 4);
    orbitControlsRef.current.object.position.set(z, z, z);
    orbitControlsRef.current.target.set(0, 0, 0);
    orbitControlsRef.current.update();
    useStore.getState().set((state) => {
      const v = state.viewState;
      v.cameraPosition = [z, z, z];
      v.panCenter = [0, 0, 0];
    });
  }
};

export const zoomView = (scale: number) => {
  if (useStore.getState().viewState.orthographic) {
    // Previously, we declared this in the header: const cameraZoom = useStore(Selector.viewState.cameraZoom) ?? 20;
    // But it causes the app to be re-rendered every time zoom is called.
    const cameraZoom = useStore.getState().viewState.cameraZoom ?? 20;
    const oldZoom = cameraZoom;
    const newZoom = cameraZoom / scale;
    const undoableChange = {
      name: 'Zoom',
      timestamp: Date.now(),
      oldValue: oldZoom,
      newValue: newZoom,
      undo: () => {
        useStore.getState().set((state) => {
          state.viewState.cameraZoom = undoableChange.oldValue as number;
        });
      },
      redo: () => {
        useStore.getState().set((state) => {
          state.viewState.cameraZoom = undoableChange.newValue as number;
        });
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    useStore.getState().set((state) => {
      state.viewState.cameraZoom = newZoom;
    });
  } else {
    const orbitControlsRef = useRefStore.getState().orbitControlsRef;
    if (orbitControlsRef?.current) {
      const p = orbitControlsRef.current.object.position;
      const x = p.x * scale;
      const y = p.y * scale;
      const z = p.z * scale;
      const undoableCameraChange = {
        name: 'Zoom',
        timestamp: Date.now(),
        oldCameraPosition: [p.x, p.y, p.z],
        newCameraPosition: [x, y, z],
        undo: () => {
          const oldX = undoableCameraChange.oldCameraPosition[0];
          const oldY = undoableCameraChange.oldCameraPosition[1];
          const oldZ = undoableCameraChange.oldCameraPosition[2];
          orbitControlsRef.current?.object.position.set(oldX, oldY, oldZ);
          orbitControlsRef.current?.update();
          useStore.getState().set((state) => {
            state.viewState.cameraPosition = [oldX, oldY, oldZ];
          });
        },
        redo: () => {
          const newX = undoableCameraChange.newCameraPosition[0];
          const newY = undoableCameraChange.newCameraPosition[1];
          const newZ = undoableCameraChange.newCameraPosition[2];
          orbitControlsRef.current?.object.position.set(newX, newY, newZ);
          orbitControlsRef.current?.update();
          useStore.getState().set((state) => {
            state.viewState.cameraPosition = [newX, newY, newZ];
          });
        },
      } as UndoableCameraChange;
      useStore.getState().addUndoable(undoableCameraChange);
      orbitControlsRef.current.object.position.set(x, y, z);
      orbitControlsRef.current.update();
      useStore.getState().set((state) => {
        state.viewState.cameraPosition = [x, y, z];
      });
    }
  }
};

export const createViewMenu = (keyHome: string, isMac: boolean) => {
  const lang = { lng: useStore.getState().language };
  const orthographic = useStore.getState().viewState.orthographic;
  const cameraPosition = useStore.getState().viewState.cameraPosition;
  const panCenter = useStore.getState().viewState.panCenter;

  const viewAlreadyReset =
    cameraPosition[0] === cameraPosition[1] &&
    cameraPosition[1] === cameraPosition[2] &&
    panCenter[0] === 0 &&
    panCenter[1] === 0 &&
    panCenter[2] === 0;

  const handleResetView = () => {
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
          useStore.getState().set((state) => {
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
    useStore.getState().addUndoable(undoableResetView);
    resetView();
    useStore.getState().set((state) => {
      state.objectTypeToAdd = ObjectType.None;
      state.groupActionMode = false;
      state.viewState.orthographic = false;
    });
  };

  const handleZoomOut = () => {
    zoomView(1.1);
  };

  const handleZoomIn = () => {
    zoomView(0.9);
  };

  const toggleModelTree = (e: CheckboxChangeEvent) => {
    const undoableCheck = {
      name: 'Toggle Model Tree',
      timestamp: Date.now(),
      checked: e.target.checked,
      undo: () => {
        useStore.getState().set((state) => {
          state.viewState.showModelTree = !undoableCheck.checked;
          state.canvasPercentWidth = state.viewState.showModelTree ? 75 : 100;
        });
      },
      redo: () => {
        useStore.getState().set((state) => {
          state.viewState.showModelTree = undoableCheck.checked;
          state.canvasPercentWidth = state.viewState.showModelTree ? 75 : 100;
        });
      },
    } as UndoableCheck;
    useStore.getState().addUndoable(undoableCheck);
    useStore.getState().set((state) => {
      state.viewState.showModelTree = e.target.checked;
      if (state.viewState.showModelTree) {
        state.projectView = false;
        state.canvasPercentWidth = 75;
      } else {
        state.canvasPercentWidth = 100;
      }
    });
  };

  const toggleNavigationView = (e: CheckboxChangeEvent) => {
    const setNavigationView = useStore.getState().setNavigationView;

    const undoableCheck = {
      name: 'Toggle Navigation View',
      timestamp: Date.now(),
      checked: e.target.checked,
      undo: () => {
        setNavigationView(!undoableCheck.checked);
      },
      redo: () => {
        setNavigationView(undoableCheck.checked);
      },
    } as UndoableCheck;
    useStore.getState().addUndoable(undoableCheck);
    useStore.getState().set((state) => {
      state.viewState.autoRotate = false;
    });
    setNavigationView(e.target.checked);
  };

  const toggle2DView = (e: CheckboxChangeEvent) => {
    const set2DView = useStore.getState().set2DView;

    const undoableCheck = {
      name: 'Toggle 2D View',
      timestamp: Date.now(),
      checked: e.target.checked,
      undo: () => {
        set2DView(!undoableCheck.checked);
      },
      redo: () => {
        set2DView(undoableCheck.checked);
      },
    } as UndoableCheck;
    useStore.getState().addUndoable(undoableCheck);
    set2DView(e.target.checked);
    useStore.getState().set((state) => {
      state.viewState.autoRotate = false;
    });
  };

  const toggleAutoRotate = (e: CheckboxChangeEvent) => {
    if (!useStore.getState().viewState.orthographic) {
      const undoableCheck = {
        name: 'Auto Rotate',
        timestamp: Date.now(),
        checked: e.target.checked,
        undo: () => {
          useStore.getState().set((state) => {
            state.objectTypeToAdd = ObjectType.None;
            state.groupActionMode = false;
            state.viewState.autoRotate = !undoableCheck.checked;
          });
        },
        redo: () => {
          useStore.getState().set((state) => {
            state.objectTypeToAdd = ObjectType.None;
            state.groupActionMode = false;
            state.viewState.autoRotate = undoableCheck.checked;
          });
        },
      } as UndoableCheck;
      useStore.getState().addUndoable(undoableCheck);
      useStore.getState().set((state) => {
        state.objectTypeToAdd = ObjectType.None;
        state.groupActionMode = false;
        state.viewState.autoRotate = !state.viewState.autoRotate;
      });
    }
  };

  const toggleAxes = (e: CheckboxChangeEvent) => {
    const checked = e.target.checked;
    const undoableCheck = {
      name: 'Show Axes',
      timestamp: Date.now(),
      checked: checked,
      undo: () => {
        useStore.getState().set((state) => {
          state.viewState.axes = !undoableCheck.checked;
        });
      },
      redo: () => {
        useStore.getState().set((state) => {
          state.viewState.axes = undoableCheck.checked;
        });
      },
    } as UndoableCheck;
    useStore.getState().addUndoable(undoableCheck);
    useStore.getState().set((state) => {
      state.viewState.axes = checked;
    });
  };

  const toggleShadow = (e: CheckboxChangeEvent) => {
    const undoableCheck = {
      name: 'Show Shadow',
      timestamp: Date.now(),
      checked: e.target.checked,
      undo: () => {
        useStore.getState().set((state) => {
          state.viewState.shadowEnabled = !undoableCheck.checked;
          if (state.viewState.shadowEnabled) {
            state.updateSceneRadius();
          }
        });
      },
      redo: () => {
        useStore.getState().set((state) => {
          state.viewState.shadowEnabled = undoableCheck.checked;
          if (state.viewState.shadowEnabled) {
            state.updateSceneRadius();
          }
        });
      },
    } as UndoableCheck;
    useStore.getState().addUndoable(undoableCheck);
    useStore.getState().set((state) => {
      state.viewState.shadowEnabled = e.target.checked;
      if (state.viewState.shadowEnabled) {
        state.updateSceneRadius();
      }
    });
  };

  const toggleShininess = (e: CheckboxChangeEvent) => {
    const value = e.target.checked ? DEFAULT_VIEW_SOLAR_PANEL_SHININESS : 0;

    const undoableChange = {
      name: 'Set Surface Shininess',
      timestamp: Date.now(),
      oldValue: useStore.getState().viewState.solarPanelShininess ?? DEFAULT_VIEW_SOLAR_PANEL_SHININESS,
      newValue: value,
      undo: () => {
        useStore.getState().set((state) => {
          state.viewState.solarPanelShininess = undoableChange.oldValue as number;
        });
      },
      redo: () => {
        useStore.getState().set((state) => {
          state.viewState.solarPanelShininess = undoableChange.newValue as number;
        });
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    useStore.getState().set((state) => {
      state.viewState.solarPanelShininess = value;
    });
  };

  const toggleTranslucency = (e: CheckboxChangeEvent) => {
    const oldOpacity = useStore.getState().floatingWindowOpacity;
    const newOpacity = e.target.checked ? FLOATING_WINDOW_OPACITY : 1;
    const undoableChange = {
      name: 'Floating Window Opacity',
      timestamp: Date.now(),
      oldValue: oldOpacity,
      newValue: newOpacity,
      undo: () => {
        useStore.getState().set((state) => {
          state.floatingWindowOpacity = undoableChange.oldValue as number;
        });
      },
      redo: () => {
        useStore.getState().set((state) => {
          state.floatingWindowOpacity = undoableChange.newValue as number;
        });
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    useStore.getState().set((state) => {
      state.floatingWindowOpacity = newOpacity;
    });
  };

  const items: MenuProps['items'] = [];

  // reset-view
  if (!orthographic && !viewAlreadyReset) {
    items.push({
      key: 'reset-view',
      label: (
        <MenuItem onClick={handleResetView}>
          {i18n.t('menu.view.ResetView', lang)}
          <LabelMark>({keyHome})</LabelMark>
        </MenuItem>
      ),
    });
  }

  // zoom-out-view
  items.push({
    key: 'zoom-out-view',
    label: (
      <MenuItem onClick={handleZoomOut}>
        {i18n.t('menu.view.ZoomOut', lang)}
        <LabelMark>({isMac ? '⌘' : 'Ctrl'}+])</LabelMark>
      </MenuItem>
    ),
  });

  // zoom-in-view
  items.push({
    key: 'zoom-in-view',
    label: (
      <MenuItem onClick={handleZoomIn}>
        {i18n.t('menu.view.ZoomIn', lang)}
        <LabelMark>({isMac ? '⌘' : 'Ctrl'}+[)</LabelMark>
      </MenuItem>
    ),
  });

  // model-tree-check-box
  items.push({
    key: 'model-tree-check-box',
    label: (
      <MainMenuCheckbox selector={Selector.viewState.showModelTree} onChange={toggleModelTree}>
        {i18n.t('menu.view.ModelTree', lang)}
      </MainMenuCheckbox>
    ),
  });

  // navigation-view-check-box
  items.push({
    key: 'navigation-view-check-box',
    label: (
      <MainMenuCheckbox selector={Selector.viewState.navigationView} onChange={toggleNavigationView}>
        {i18n.t('menu.view.NavigationView', lang)}
        <LabelMark>({KeyCtrl}+Q)</LabelMark>
      </MainMenuCheckbox>
    ),
  });

  // orthographic-check-box
  items.push({
    key: 'orthographic-check-box',
    label: (
      <MainMenuCheckbox selector={Selector.viewState.orthographic} onChange={toggle2DView}>
        {i18n.t('menu.view.TwoDimensionalView', lang)}
        <LabelMark>({KeyCtrl}+B)</LabelMark>
      </MainMenuCheckbox>
    ),
  });

  // auto-rotate-check-box
  if (!orthographic) {
    items.push({
      key: 'auto-rotate-check-box',
      label: (
        <MainMenuCheckbox selector={Selector.viewState.autoRotate} onChange={toggleAutoRotate}>
          {i18n.t('menu.view.AutoRotate', lang)}
          <LabelMark>({KeyCtrl}+M)</LabelMark>
        </MainMenuCheckbox>
      ),
    });
  }

  // axes-check-box
  items.push({
    key: 'axes-check-box',
    label: (
      <MainMenuCheckbox selector={Selector.viewState.axes} onChange={toggleAxes}>
        {i18n.t('skyMenu.Axes', lang)}
      </MainMenuCheckbox>
    ),
  });

  // shadow-check-box
  items.push({
    key: 'shadow-check-box',
    label: (
      <MainMenuCheckbox selector={Selector.viewState.shadowEnabled} onChange={toggleShadow}>
        {i18n.t('menu.view.ShowShadow', lang)}
      </MainMenuCheckbox>
    ),
  });

  // shininess-check-box
  items.push({
    key: 'shininess-check-box',
    label: (
      <MainMenuCheckbox
        selector={(state) =>
          state.viewState.solarPanelShininess === undefined || state.viewState.solarPanelShininess > 0
        }
        onChange={toggleShininess}
      >
        {i18n.t('menu.view.ShowSurfaceShininess', lang)}
      </MainMenuCheckbox>
    ),
  });

  // translucency-check-box
  items.push({
    key: 'translucency-check-box',
    label: (
      <MainMenuCheckbox selector={(state) => state.floatingWindowOpacity < 1} onChange={toggleTranslucency}>
        {i18n.t('menu.view.TranslucentFloatingWindows', lang)}
      </MainMenuCheckbox>
    ),
  });

  return items;
};
