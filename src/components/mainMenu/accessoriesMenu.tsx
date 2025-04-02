/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { MenuProps } from 'antd';
import { useStore } from 'src/stores/common';
import i18n from 'src/i18n/i18n';
import { MainMenuCheckbox } from './mainMenuItems';
import * as Selector from '../../stores/selector';
import { CheckboxChangeEvent } from 'antd/es/checkbox';
import { UndoableCheck } from 'src/undo/UndoableCheck';

export const createAccessoriesMenu = () => {
  const lang = { lng: useStore.getState().language };

  const setCommonStore = useStore.getState().set;
  const addUndoable = useStore.getState().addUndoable;

  const toggleSiteInfoPanel = (e: CheckboxChangeEvent) => {
    const checked = e.target.checked;
    const undoableCheck = {
      name: 'Show Site Information',
      timestamp: Date.now(),
      checked: checked,
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
      state.viewState.showSiteInfoPanel = checked;
    });
  };

  const toggleDesignInfoPanel = (e: CheckboxChangeEvent) => {
    const checked = e.target.checked;
    const undoableCheck = {
      name: 'Show Design Information',
      timestamp: Date.now(),
      checked: checked,
      undo: () => {
        setCommonStore((state) => {
          state.viewState.showDesignInfoPanel = !undoableCheck.checked;
          state.updateSceneRadiusFlag = !state.updateSceneRadiusFlag;
        });
      },
      redo: () => {
        setCommonStore((state) => {
          state.viewState.showDesignInfoPanel = undoableCheck.checked;
          state.updateSceneRadiusFlag = !state.updateSceneRadiusFlag;
        });
      },
    } as UndoableCheck;
    addUndoable(undoableCheck);
    setCommonStore((state) => {
      state.viewState.showDesignInfoPanel = !state.viewState.showDesignInfoPanel;
      state.updateSceneRadiusFlag = !state.updateSceneRadiusFlag;
    });
  };

  const toggleInstructionPanel = (e: CheckboxChangeEvent) => {
    const undoableCheck = {
      name: 'Show Instruction Panel',
      timestamp: Date.now(),
      checked: e.target.checked,
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

  const toggleStickyNote = (e: CheckboxChangeEvent) => {
    const undoableCheck = {
      name: 'Show Sticky Note',
      timestamp: Date.now(),
      checked: e.target.value,
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

  const toggleShareLinks = (e: CheckboxChangeEvent) => {
    const undoableCheck = {
      name: 'Show Share Links',
      timestamp: Date.now(),
      checked: !e.target.value,
      undo: () => {
        setCommonStore((state) => {
          state.viewState.hideShareLinks = !undoableCheck.checked;
        });
      },
      redo: () => {
        setCommonStore((state) => {
          state.viewState.hideShareLinks = undoableCheck.checked;
        });
      },
    } as UndoableCheck;
    addUndoable(undoableCheck);
    setCommonStore((state) => {
      state.viewState.hideShareLinks = !state.viewState.hideShareLinks;
    });
  };

  const items: MenuProps['items'] = [
    // site-info-panel-check-box
    {
      key: 'site-info-panel-check-box',
      label: (
        <MainMenuCheckbox selector={Selector.viewState.showSiteInfoPanel} onChange={toggleSiteInfoPanel}>
          {i18n.t('menu.view.accessories.SiteInformation', lang)}
        </MainMenuCheckbox>
      ),
    },
    // design-info-panel-check-box
    {
      key: 'design-info-panel-check-box',
      label: (
        <MainMenuCheckbox selector={Selector.viewState.showDesignInfoPanel} onChange={toggleDesignInfoPanel}>
          {i18n.t('menu.view.accessories.DesignInformation', lang)}
        </MainMenuCheckbox>
      ),
    },
    // instruction-panel-check-box
    {
      key: 'instruction-panel-check-box',
      label: (
        <MainMenuCheckbox selector={Selector.viewState.showInstructionPanel} onChange={toggleInstructionPanel}>
          {i18n.t('menu.view.accessories.Instruction', lang)}
        </MainMenuCheckbox>
      ),
    },
    // sticky-note-panel-check-box
    {
      key: 'sticky-note-panel-check-box',
      label: (
        <MainMenuCheckbox selector={Selector.viewState.showStickyNotePanel} onChange={toggleStickyNote}>
          {i18n.t('menu.view.accessories.StickyNote', lang)}
        </MainMenuCheckbox>
      ),
    },
    // share-links-check-box
    {
      key: 'share-links-check-box',
      label: (
        <MainMenuCheckbox selector={Selector.viewState.hideShareLinks} onChange={toggleShareLinks} negate>
          {i18n.t('menu.view.accessories.ShareLinks', lang)}
        </MainMenuCheckbox>
      ),
    },
  ];

  return items;
};
