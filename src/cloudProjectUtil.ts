/*
 * @Copyright 2023-2025. Institute for Future Intelligence, Inc.
 */

import { useStore } from './stores/common';
import { showError, showInfo } from './helpers';
import i18n from './i18n/i18n';
import { Design, DesignProblem, DataColoring, ProjectState, Range } from './types';
import { Util } from './Util';
import { usePrimitiveStore } from './stores/commonPrimitive';
import { Filter } from './Filter';
import { arrayRemove, arrayUnion, deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { firestore } from './firebase';
import { GenAIUtil } from './panels/GenAIUtil';

export const doesProjectExist = async (uid: string, projectName: string, callbackOnError: (error: string) => void) => {
  try {
    const docRef = doc(firestore, 'users', uid, 'projects', projectName);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    callbackOnError(error as string);
  }
};

export const fetchProject = async (
  userid: string,
  project: string,
  setProjectState: (projectState: ProjectState) => void,
) => {
  const lang = { lng: useStore.getState().language };
  try {
    const docRef = doc(firestore, 'users', userid, 'projects', project);
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();

    if (data) {
      setProjectState({
        owner: userid,
        title: docSnap.id,
        timestamp: data.timestamp,
        description: data.description,
        dataColoring: data.dataColoring ?? DataColoring.ALL,
        type: data.type,
        designs: data.designs,
        ranges: data.ranges ?? [],
        filters: data.filters ?? [],
        hiddenParameters: data.hiddenParameters,
        counter: data.counter ?? 0,
        selectedProperty: data.selectedProperty,
        sortDescending: data.sortDescending,
        xAxisNameScatterPlot: data.xAxisNameScatterPlot,
        yAxisNameScatterPlot: data.yAxisNameScatterPlot,
        dotSizeScatterPlot: data.dotSizeScatterPlot,
        thumbnailWidth: data.thumbnailWidth,
        reasoningEffort: data.reasoningEffort,
        aIModel: data.aIModel,
        independentPrompt: !!data.independentPrompt,
        generateBuildingPrompt: data.generateBuildingPrompt,
      } as ProjectState);
    } else {
      showError(i18n.t('message.CannotOpenProject', lang) + ': ' + project);
    }
  } catch (error) {
    showError(i18n.t('message.CannotOpenProject', lang) + ': ' + error);
  }
};

export const removeDesignFromProject = async (userid: string, projectTitle: string, design: Design) => {
  const lang = { lng: useStore.getState().language };
  try {
    const projectRef = doc(firestore, 'users', userid, 'projects', projectTitle);
    const snapshot = await getDoc(projectRef);
    if (!snapshot.exists()) throw new Error(`Can't find project.`);

    const data = snapshot.data();
    const newDesigns = (data.designs || []).filter((d: Design) => d.title !== design.title);

    await updateDoc(projectRef, { designs: newDesigns });

    usePrimitiveStore.getState().set((state) => {
      state.updateProjectsFlag = true;
    });
    // also delete the design
    try {
      const designRef = doc(firestore, 'users', userid, 'designs', design.title);
      await deleteDoc(designRef);

      useStore.getState().set((state) => {
        if (design.title === state.cloudFile) {
          state.cloudFile = undefined;
        }
      });

      showInfo(i18n.t('message.DesignRemovedFromProject', lang) + '.');
    } catch (error) {
      showError(i18n.t('message.CannotDeleteCloudFile', lang) + ': ' + error);
      throw new Error((error as Error).message);
    }
  } catch (error) {
    showError(i18n.t('message.CannotRemoveDesignFromProject', lang) + ': ' + error);
    throw new Error((error as Error).message);
  }
};

export const updateHiddenParameters = async (
  userid: string,
  projectTitle: string,
  hiddenParameter: string,
  add: boolean, // true is to add, false is to remove
) => {
  const lang = { lng: useStore.getState().language };
  try {
    await updateDoc(doc(firestore, 'users', userid, 'projects', projectTitle), {
      hiddenParameters: add ? arrayUnion(hiddenParameter) : arrayRemove(hiddenParameter),
    });
  } catch (error) {
    showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
  }
};

export const addRange = async (userid: string, projectTitle: string, range: Range) => {
  const lang = { lng: useStore.getState().language };
  try {
    await updateDoc(doc(firestore, 'users', userid, 'projects', projectTitle), {
      ranges: arrayUnion(range),
    });
  } catch (error) {
    showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
  }
};

export const updateRanges = async (userid: string, projectTitle: string, ranges: Range[]) => {
  const lang = { lng: useStore.getState().language };
  try {
    await updateDoc(doc(firestore, 'users', userid, 'projects', projectTitle), {
      ranges,
    });
  } catch (error) {
    showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
  }
};

export const addFilter = async (userid: string, projectTitle: string, filter: Filter) => {
  const lang = { lng: useStore.getState().language };
  try {
    await updateDoc(doc(firestore, 'users', userid, 'projects', projectTitle), {
      filters: arrayUnion(filter),
    });
  } catch (error) {
    showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
  }
};

export const updateFilters = async (userid: string, projectTitle: string, filters: Filter[]) => {
  const lang = { lng: useStore.getState().language };
  try {
    await updateDoc(doc(firestore, 'users', userid, 'projects', projectTitle), { filters });
  } catch (error) {
    showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
  }
};

export const updateDescription = async (userid: string, projectTitle: string, description: string | null) => {
  const lang = { lng: useStore.getState().language };
  try {
    await updateDoc(doc(firestore, 'users', userid, 'projects', projectTitle), { description });
  } catch (error) {
    showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
  }
};

export const updateDataColoring = async (userid: string, projectTitle: string, dataColoring: DataColoring) => {
  const lang = { lng: useStore.getState().language };
  try {
    await updateDoc(doc(firestore, 'users', userid, 'projects', projectTitle), { dataColoring });
  } catch (error) {
    showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
  }
};

export const updateSelectedProperty = async (userid: string, projectTitle: string, selectedProperty: string | null) => {
  const lang = { lng: useStore.getState().language };
  try {
    await updateDoc(doc(firestore, 'users', userid, 'projects', projectTitle), { selectedProperty });
  } catch (error) {
    showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
  }
};

export const updateXAxisNameScatterPlot = async (
  userid: string,
  projectTitle: string,
  xAxisNameScatterPlot: string | null,
) => {
  const lang = { lng: useStore.getState().language };
  try {
    await updateDoc(doc(firestore, 'users', userid, 'projects', projectTitle), {
      xAxisNameScatterPlot: xAxisNameScatterPlot,
    });
  } catch (error) {
    showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
  }
};

export const updateYAxisNameScatterPlot = async (
  userid: string,
  projectTitle: string,
  yAxisNameScatterPlot: string | null,
) => {
  const lang = { lng: useStore.getState().language };
  try {
    await updateDoc(doc(firestore, 'users', userid, 'projects', projectTitle), {
      yAxisNameScatterPlot: yAxisNameScatterPlot,
    });
  } catch (error) {
    showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
  }
};

export const updateDotSizeScatterPlot = async (userid: string, projectTitle: string, dotSizeScatterPlot: number) => {
  const lang = { lng: useStore.getState().language };
  try {
    await updateDoc(doc(firestore, 'users', userid, 'projects', projectTitle), {
      dotSizeScatterPlot: dotSizeScatterPlot,
    });
  } catch (error) {
    showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
  }
};

export const updateGenerateBuildingPrompt = async (
  userid: string,
  projectTitle: string,
  generateBuildingPrompt: string,
) => {
  const lang = { lng: useStore.getState().language };
  try {
    await updateDoc(doc(firestore, 'users', userid, 'projects', projectTitle), {
      generateBuildingPrompt,
    });
  } catch (error) {
    showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
  }
};

export const updateGenerateSolarPowerTowerPrompt = async (
  userid: string,
  projectTitle: string,
  generateSolarPowerTowerPrompt: string,
) => {
  const lang = { lng: useStore.getState().language };
  try {
    await updateDoc(doc(firestore, 'users', userid, 'projects', projectTitle), {
      generateSolarPowerTowerPrompt,
    });
  } catch (error) {
    showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
  }
};

export const updateAIMemory = async (userid: string, projectTitle: string, memory: boolean) => {
  const lang = { lng: useStore.getState().language };
  try {
    await updateDoc(doc(firestore, 'users', userid, 'projects', projectTitle), { independentPrompt: !memory });
  } catch (error) {
    showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
  }
};

export const updateThumbnailWidth = async (userid: string, projectTitle: string, thumbnailWidth: number) => {
  const lang = { lng: useStore.getState().language };
  try {
    await updateDoc(doc(firestore, 'users', userid, 'projects', projectTitle), { thumbnailWidth });
  } catch (error) {
    showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
  }
};

export const createDesign = (type: string, title: string, thumbnail: string): Design => {
  let design = { timestamp: Date.now(), title, thumbnail, excluded: false } as Design;
  switch (type) {
    case DesignProblem.SOLAR_PANEL_ARRAY: {
      const latitude = useStore.getState().world.latitude;
      const panelCount = Util.countAllSolarPanels();
      const dailyYield = Util.countAllSolarPanelDailyYields();
      const yearlyYield = Util.countAllSolarPanelYearlyYields();
      const economicsParams = useStore.getState().economicsParams;
      const unitCost = economicsParams.operationalCostPerUnit;
      const sellingPrice = economicsParams.electricitySellingPrice;
      design = {
        latitude,
        unitCost,
        sellingPrice,
        panelCount,
        dailyYield,
        yearlyYield,
        ...design,
        ...useStore.getState().solarPanelArrayLayoutParams,
      };
      break;
    }
    case DesignProblem.SOLAR_PANEL_TILT_ANGLE:
      // TODO: Each row has a different tilt angle
      break;
    case DesignProblem.BUILDING_DESIGN: {
      const genAIData = useStore.getState().genAIData;
      if (genAIData) {
        design.aIModel = genAIData.aIModel;
        design.prompt = genAIData.prompt;
        design.data = genAIData.data;
      }
      GenAIUtil.calculateBuildingSolutionSpace(design);
      break;
    }
    case DesignProblem.SOLAR_POWER_TOWER_DESIGN: {
      const genAIData = useStore.getState().genAIData;
      if (genAIData) {
        design.aIModel = genAIData.aIModel;
        design.prompt = genAIData.prompt;
        design.data = genAIData.data;
      }
      GenAIUtil.calculateSolarPowerTowerSolutionSpace(design);
      break;
    }
  }
  return design;
};

// change the design titles of a project based on its current title (used when copying or renaming a project)
export const changeDesignTitles = (projectTitle: string, projectDesigns: Design[] | null): Design[] | null => {
  if (!projectDesigns) return null;
  const newDesigns: Design[] = [];
  // The order of for-of on arrays is guaranteed by the array iterator definition.
  // It will visit the entries in the array in numeric index order
  // So the returned array has the same order as the original array.
  for (const design of projectDesigns) {
    const copy = { ...design };
    copy.title = createDesignTitle(projectTitle, design.title);
    copy.timestamp = Date.now();
    newDesigns.push(copy);
  }
  return newDesigns;
};

// the design title is named after the project title plus the current counter of the project
// for example, "project title 0", "project title 1", etc.
export const createDesignTitle = (projectTitle: string, designTitle: string) => {
  const index = designTitle.lastIndexOf(' ');
  return projectTitle + designTitle.substring(index);
};

export const getImageData = (image: HTMLImageElement) => {
  const c = document.createElement('canvas');
  c.width = image.width;
  c.height = image.height;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.drawImage(image, 1, 1); // 1 is for padding
  }
  return c.toDataURL();
};

export const copyDesign = async (original: string, copy: string, owner: string | null, userid: string) => {
  const lang = { lng: useStore.getState().language };
  try {
    const originalDocRef = doc(firestore, 'users', owner ?? userid, 'designs', original);
    const originalDocSnap = await getDoc(originalDocRef);

    if (originalDocSnap.exists()) {
      const data = originalDocSnap.data();

      if (data) {
        const copyDocRef = doc(firestore, 'users', userid, 'designs', copy);
        await setDoc(copyDocRef, data);

        showInfo(i18n.t('message.CloudFileCopied', lang) + ': ' + copy);
      }
    } else {
      showError(i18n.t('message.CannotReadCloudFile', lang));
    }
  } catch (error) {
    showError(i18n.t('message.CannotReadCloudFile', lang) + ': ' + error);
  }
};

export const updateDesignVisibility = async (userid: string, projectTitle: string, design: Design) => {
  const lang = { lng: useStore.getState().language };
  try {
    const projectDocRef = doc(firestore, 'users', userid, 'projects', projectTitle);
    const documentSnapshot = await getDoc(projectDocRef);
    if (documentSnapshot.exists()) {
      const data = documentSnapshot.data();
      if (data) {
        const updatedDesigns: Design[] = [];
        updatedDesigns.push(...data.designs);
        // Get the index of the design to be modified by the title
        let index = -1;
        for (const [i, d] of updatedDesigns.entries()) {
          if (d.title === design.title) {
            index = i;
            break;
          }
        }
        // If found, update the design in the array
        if (index >= 0) {
          updatedDesigns[index].invisible = !design.invisible;
          // Finally, upload the updated design array back to Firestore
          try {
            const projectDocRef = doc(firestore, 'users', userid, 'projects', projectTitle);
            await updateDoc(projectDocRef, { designs: updatedDesigns });
          } catch (error) {
            showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
          }
        }
      }
    }
  } catch (error) {
    showError(i18n.t('message.CannotFetchProjectData', lang) + ': ' + error);
  }
};

export const updateDesign = async (
  userid: string,
  projectType: string,
  projectTitle: string,
  thumbnailWidth: number,
  designTitle: string,
  canvas: HTMLCanvasElement | null,
) => {
  const lang = { lng: useStore.getState().language };
  usePrimitiveStore.getState().set((state) => {
    state.waiting = true;
  });

  // First we update the design file by overwriting it with the current content
  try {
    const designDocRef = doc(firestore, 'users', userid, 'designs', designTitle);
    const exportContent = useStore.getState().exportContent();
    await setDoc(designDocRef, exportContent);
  } catch (error) {
    console.error(error);
  }
  usePrimitiveStore.getState().setChanged(false);
  if (canvas) {
    // update the thumbnail image as well
    const thumbnail = Util.resizeCanvas(canvas, thumbnailWidth).toDataURL();
    try {
      const projectDocRef = doc(firestore, 'users', userid, 'projects', projectTitle);
      const documentSnapshot = await getDoc(projectDocRef);
      if (documentSnapshot.exists()) {
        const data_1 = documentSnapshot.data();
        if (data_1) {
          const updatedDesigns: Design[] = [];
          updatedDesigns.push(...data_1.designs);
          // Get the index of the design to be modified by the title
          let index = -1;
          for (const [i, d] of updatedDesigns.entries()) {
            if (d.title === designTitle) {
              index = i;
              break;
            }
          }
          // If found, update the design in the array
          if (index >= 0) {
            // Update design from the current parameters and results and the new thumbnail
            if (projectType === DesignProblem.BUILDING_DESIGN) {
              const prompt = updatedDesigns[index].prompt;
              const data = updatedDesigns[index].data;
              updatedDesigns[index] = createDesign(projectType, designTitle, thumbnail);
              if (prompt && data) {
                updatedDesigns[index].prompt = prompt;
                updatedDesigns[index].data = data;
              }
              const _designs = useStore.getState().projectState.designs;
              if (_designs) {
                updatedDesigns[index].heating = _designs[index].heating;
                updatedDesigns[index].cooling = _designs[index].cooling;
                updatedDesigns[index].solar = _designs[index].solar;
                updatedDesigns[index].net = _designs[index].net;
                updatedDesigns[index].modelChanged = !!usePrimitiveStore.getState().modelChanged;
              }
            } else if (projectType === DesignProblem.SOLAR_POWER_TOWER_DESIGN) {
              const prompt = updatedDesigns[index].prompt;
              const data = updatedDesigns[index].data;
              updatedDesigns[index] = createDesign(projectType, designTitle, thumbnail);
              if (prompt && data) {
                updatedDesigns[index].prompt = prompt;
                updatedDesigns[index].data = data;
              }
            } else {
              updatedDesigns[index] = createDesign(projectType, designTitle, thumbnail);
            }
            // Finally, upload the updated design array back to Firestore
            try {
              const projectDocRef = doc(firestore, 'users', userid, 'projects', projectTitle);
              await updateDoc(projectDocRef, { designs: updatedDesigns });
            } catch (error) {
              showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
            } finally {
              // Update the cached array in the local storage via the common store
              useStore.getState().set((state_1) => {
                state_1.projectState.designs = updatedDesigns;
              });
              usePrimitiveStore.getState().set((state_2) => {
                state_2.updateProjectsFlag = true;
                state_2.waiting = false;
              });
            }
          }
        }
      }
    } catch (error) {
      showError(i18n.t('message.CannotFetchProjectData', lang) + ': ' + error);
    }
  }
};
