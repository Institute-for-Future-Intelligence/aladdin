/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useMemo, useState } from 'react';
import { useStore } from '../../stores/common';
import styled from 'styled-components';
import logo from 'src/assets/magic-lamp.png';
import 'antd/dist/reset.css';
import About from '../../about';
import * as Selector from '../../stores/selector';
import i18n from '../../i18n/i18n';
import { Util } from '../../Util';
import { usePrimitiveStore } from '../../stores/commonPrimitive';
import { useTranslation } from 'react-i18next';
import { LanguageRadioGroup } from './languageMenu';
import PublicMenu from './publicMenu';
import AccessoriesMenu from './accessoriesMenu';
import AnalysisMenu from './analysisMenu';
import TutorialsMenu from './tutorialsMenu';
import ExamplesMenu from './exampleMenu';
import FileMenu from './fileMenu';
import ProjectMenu from './projectMenu';
import EditMenu from './editMenu';
import ViewMenu from './viewMenu';
import SettingsMenu from './settingsMenu';
import { Menu } from '@szhsin/react-menu';
import { MainMenuItem } from './mainMenuItems';
import '@szhsin/react-menu/dist/index.css';
import '@szhsin/react-menu/dist/transitions/zoom.css';
import './style.css';

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
  viewOnly: boolean;
  canvas?: HTMLCanvasElement | null;
}

const MainMenu = React.memo(({ viewOnly, canvas }: MainMenuProps) => {
  const openModelsMap = usePrimitiveStore(Selector.openModelsMap);

  const language = useStore(Selector.language);
  const user = useStore(Selector.user);

  const [aboutUs, setAboutUs] = useState(false);

  const { t } = useTranslation();
  const lang = useMemo(() => {
    return { lng: language };
  }, [language]);

  const isMac = useMemo(() => Util.isMac(), []);

  const openAboutUs = () => {
    setAboutUs(true);
  };

  const closeAboutUs = () => {
    setAboutUs(false);
  };

  const menuButton = (
    <MainMenuContainer>
      <StyledImage src={logo} title={t('tooltip.clickToOpenMenu', lang)} />
      <LabelContainer>
        <span style={{ fontSize: '10px', alignContent: 'center', cursor: 'pointer' }}>{t('menu.mainMenu', lang)}</span>
      </LabelContainer>
    </MainMenuContainer>
  );

  return (
    <>
      <Menu
        menuStyle={{ fontSize: '14px', minWidth: '4rem', borderRadius: '0.35rem' }}
        menuButton={menuButton}
        transition
      >
        {/* File Menu */}
        {!openModelsMap && <FileMenu viewOnly={viewOnly} isMac={isMac} canvas={canvas} />}

        {/* Project Menu */}
        {!openModelsMap && !viewOnly && user.uid && <ProjectMenu />}

        {/* Edit Menu */}
        {!openModelsMap && <EditMenu isMac={isMac} />}

        {/* View Menu */}
        {!openModelsMap && <ViewMenu isMac={isMac} />}

        {/* Settings Menu */}
        {!openModelsMap && <SettingsMenu />}

        {/* Accessories Menu */}
        {!openModelsMap && <AccessoriesMenu />}

        {/* Analysis Menu */}
        {!openModelsMap && <AnalysisMenu />}

        {/* Tutorials Menu */}
        <TutorialsMenu />

        {/* Example Menu */}
        <ExamplesMenu />

        {/* Public Menu */}
        <PublicMenu uid={user.uid} viewOnly={viewOnly} openModelsMap={openModelsMap} />

        {/* Language Menu */}
        <LanguageRadioGroup />

        {/* About Us Menu */}
        <MainMenuItem onClick={openAboutUs}>{i18n.t('menu.AboutUs', lang)}...</MainMenuItem>
      </Menu>

      {aboutUs && <About close={closeAboutUs} />}
    </>
  );
});

export default MainMenu;
