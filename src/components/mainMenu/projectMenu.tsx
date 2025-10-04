/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { useStore } from 'src/stores/common';
import { showInfo, showSuccess } from 'src/helpers';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { CreateNewProjectItem } from './createNewProjectItem';
import { SaveProjectAsItem } from './saveProjectAsItem';
import { HOME_URL } from '../../constants';
import { useLanguage } from 'src/hooks';
import { t } from 'i18next';
import i18n from 'src/i18n/i18n';
import { MainMenuItem, MainSubMenu } from './mainMenuItems';

const ProjectMenu = () => {
  const lang = useLanguage();

  const user = useStore.getState().user;
  const loggable = useStore.getState().loggable;
  const projectState = useStore.getState().projectState;
  const projectView = useStore.getState().projectView;

  const setCommonStore = useStore.getState().set;

  const handleListProject = () => {
    if (!user.uid) {
      showInfo(i18n.t('menu.project.YouMustLogInToOpenProject', lang) + '.');
      return;
    }
    usePrimitiveStore.getState().set((state) => {
      state.showProjectsFlag = true;
      state.openModelsMap = false;
    });
    setCommonStore((state) => {
      state.selectedFloatingWindow = 'projectListPanel';
    });
    if (loggable) {
      setCommonStore((state) => {
        state.actionInfo = {
          name: 'Open Project List',
          timestamp: new Date().getTime(),
        };
      });
    }
  };

  const handleGenerateProjectLink = () => {
    if (!projectState.title || !user.uid) return;
    const url = HOME_URL + '?client=web&userid=' + user.uid + '&project=' + encodeURIComponent(projectState.title);
    navigator.clipboard.writeText(url).then(() => {
      showSuccess(i18n.t('projectListPanel.ProjectLinkGeneratedInClipBoard', lang) + '.');
      if (loggable) {
        setCommonStore((state) => {
          state.actionInfo = {
            name: 'Generate Project Link',
            timestamp: new Date().getTime(),
            details: url,
          };
        });
      }
    });
  };

  return (
    <MainSubMenu label={t('menu.projectSubMenu', lang)}>
      {/* create new project */}
      <CreateNewProjectItem />

      {/* open project */}
      <MainMenuItem onClick={handleListProject}>{i18n.t('menu.project.OpenProject', lang)}...</MainMenuItem>

      {/* save project as */}
      {projectView && projectState.title && user.uid && <SaveProjectAsItem />}

      {/* generate project link */}
      {user.uid && projectState.title && (
        <MainMenuItem onClick={handleGenerateProjectLink}>
          {i18n.t('projectListPanel.GenerateProjectLink', lang)}
        </MainMenuItem>
      )}
    </MainSubMenu>
  );
};

export default ProjectMenu;
