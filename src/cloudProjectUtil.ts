/*
 * @Copyright 2023-2024. Institute for Future Intelligence, Inc.
 */

import { useStore } from './stores/common';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/storage';
import { showError, showInfo } from './helpers';
import i18n from './i18n/i18n';
import { Design, DesignProblem, DataColoring, ProjectState, Range } from './types';
import { Util } from './Util';
import { usePrimitiveStore } from './stores/commonPrimitive';
import { Filter } from './Filter';

export const doesProjectExist = async (uid: string, projectName: string, callbackOnError: (error: string) => void) => {
  try {
    const doc = await firebase.firestore().collection('users').doc(uid).collection('projects').doc(projectName).get();
    return doc.exists;
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
  await firebase
    .firestore()
    .collection('users')
    .doc(userid)
    .collection('projects')
    .doc(project)
    .get()
    .then((doc) => {
      const data = doc.data();
      if (data) {
        setProjectState({
          owner: userid,
          title: doc.id,
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
        } as ProjectState);
      } else {
        showError(i18n.t('message.CannotOpenProject', lang) + ': ' + project);
      }
    })
    .catch((error) => {
      showError(i18n.t('message.CannotOpenProject', lang) + ': ' + error);
    });
};

export const removeDesignFromProject = async (userid: string, projectTitle: string, design: Design) => {
  const lang = { lng: useStore.getState().language };
  try {
    await firebase
      .firestore()
      .collection('users')
      .doc(userid)
      .collection('projects')
      .doc(projectTitle)
      .update({
        designs: firebase.firestore.FieldValue.arrayRemove(design),
      })
      .then(() => {
        usePrimitiveStore.getState().set((state) => {
          state.updateProjectsFlag = true;
        });
        // also delete the design
        firebase
          .firestore()
          .collection('users')
          .doc(userid)
          .collection('designs')
          .doc(design.title)
          .delete()
          .then(() => {
            useStore.getState().set((state_1) => {
              if (design.title === state_1.cloudFile) {
                state_1.cloudFile = undefined;
              }
            });
            showInfo(i18n.t('message.DesignRemovedFromProject', lang) + '.');
          })
          .catch((error) => {
            showError(i18n.t('message.CannotDeleteCloudFile', lang) + ': ' + error);
          });
      });
  } catch (error_1) {
    showError(i18n.t('message.CannotRemoveDesignFromProject', lang) + ': ' + error_1);
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
    await firebase
      .firestore()
      .collection('users')
      .doc(userid)
      .collection('projects')
      .doc(projectTitle)
      .update({
        hiddenParameters: add
          ? firebase.firestore.FieldValue.arrayUnion(hiddenParameter)
          : firebase.firestore.FieldValue.arrayRemove(hiddenParameter),
      });
  } catch (error) {
    showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
  }
};

export const addRange = async (userid: string, projectTitle: string, range: Range) => {
  const lang = { lng: useStore.getState().language };
  try {
    await firebase
      .firestore()
      .collection('users')
      .doc(userid)
      .collection('projects')
      .doc(projectTitle)
      .update({
        ranges: firebase.firestore.FieldValue.arrayUnion(range),
      });
  } catch (error) {
    showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
  }
};

export const updateRanges = async (userid: string, projectTitle: string, ranges: Range[]) => {
  const lang = { lng: useStore.getState().language };
  try {
    await firebase
      .firestore()
      .collection('users')
      .doc(userid)
      .collection('projects')
      .doc(projectTitle)
      .update({ ranges });
  } catch (error) {
    showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
  }
};

export const addFilter = async (userid: string, projectTitle: string, filter: Filter) => {
  const lang = { lng: useStore.getState().language };
  try {
    await firebase
      .firestore()
      .collection('users')
      .doc(userid)
      .collection('projects')
      .doc(projectTitle)
      .update({
        filters: firebase.firestore.FieldValue.arrayUnion(filter),
      });
  } catch (error) {
    showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
  }
};

export const updateFilters = async (userid: string, projectTitle: string, filters: Filter[]) => {
  const lang = { lng: useStore.getState().language };
  try {
    await firebase
      .firestore()
      .collection('users')
      .doc(userid)
      .collection('projects')
      .doc(projectTitle)
      .update({ filters });
  } catch (error) {
    showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
  }
};

export const updateDescription = async (userid: string, projectTitle: string, description: string | null) => {
  const lang = { lng: useStore.getState().language };
  try {
    await firebase
      .firestore()
      .collection('users')
      .doc(userid)
      .collection('projects')
      .doc(projectTitle)
      .update({ description });
  } catch (error) {
    showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
  }
};

export const updateDataColoring = async (userid: string, projectTitle: string, dataColoring: DataColoring) => {
  const lang = { lng: useStore.getState().language };
  try {
    await firebase
      .firestore()
      .collection('users')
      .doc(userid)
      .collection('projects')
      .doc(projectTitle)
      .update({ dataColoring });
  } catch (error) {
    showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
  }
};

export const updateSelectedProperty = async (userid: string, projectTitle: string, selectedProperty: string | null) => {
  const lang = { lng: useStore.getState().language };
  try {
    await firebase
      .firestore()
      .collection('users')
      .doc(userid)
      .collection('projects')
      .doc(projectTitle)
      .update({ selectedProperty });
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
    await firebase
      .firestore()
      .collection('users')
      .doc(userid)
      .collection('projects')
      .doc(projectTitle)
      .update({ xAxisNameScatterPlot: xAxisNameScatterPlot });
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
    await firebase
      .firestore()
      .collection('users')
      .doc(userid)
      .collection('projects')
      .doc(projectTitle)
      .update({ yAxisNameScatterPlot: yAxisNameScatterPlot });
  } catch (error) {
    showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
  }
};

export const updateDotSizeScatterPlot = async (userid: string, projectTitle: string, dotSizeScatterPlot: number) => {
  const lang = { lng: useStore.getState().language };
  try {
    await firebase
      .firestore()
      .collection('users')
      .doc(userid)
      .collection('projects')
      .doc(projectTitle)
      .update({ dotSizeScatterPlot: dotSizeScatterPlot });
  } catch (error) {
    showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
  }
};

export const updateThumbnailWidth = async (userid: string, projectTitle: string, thumbnailWidth: number) => {
  const lang = { lng: useStore.getState().language };
  try {
    await firebase
      .firestore()
      .collection('users')
      .doc(userid)
      .collection('projects')
      .doc(projectTitle)
      .update({ thumbnailWidth });
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
      const economicParams = useStore.getState().economicsParams;
      const unitCost = economicParams.operationalCostPerUnit;
      const sellingPrice = economicParams.electricitySellingPrice;
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

export const copyDesign = (original: string, copy: string, owner: string | null, userid: string) => {
  const lang = { lng: useStore.getState().language };
  firebase
    .firestore()
    .collection('users')
    .doc(owner ?? userid)
    .collection('designs')
    .doc(original)
    .get()
    .then((doc) => {
      if (doc.exists) {
        const data = doc.data();
        if (data) {
          firebase
            .firestore()
            .collection('users')
            .doc(userid)
            .collection('designs')
            .doc(copy)
            .set(data)
            .then(() => {
              showInfo(i18n.t('message.CloudFileCopied', lang) + ': ' + copy);
            })
            .catch((error) => {
              showError(i18n.t('message.CannotWriteCloudFile', lang) + ': ' + error);
            });
        }
      } else {
        showError(i18n.t('message.CannotReadCloudFile', lang));
      }
    })
    .catch((error) => {
      showError(i18n.t('message.CannotReadCloudFile', lang) + ': ' + error);
    });
};

export const updateDesignVisibility = async (userid: string, projectTitle: string, design: Design) => {
  const lang = { lng: useStore.getState().language };
  firebase
    .firestore()
    .collection('users')
    .doc(userid)
    .collection('projects')
    .doc(projectTitle)
    .get()
    .then((doc) => {
      if (doc.exists) {
        const data = doc.data();
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
            firebase
              .firestore()
              .collection('users')
              .doc(userid)
              .collection('projects')
              .doc(projectTitle)
              .update({ designs: updatedDesigns })
              .then(() => {
                // ignore
              })
              .catch((error) => {
                showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
              });
          }
        }
      }
    })
    .catch((error) => {
      showError(i18n.t('message.CannotFetchProjectData', lang) + ': ' + error);
    })
    .finally(() => {
      // ignore
    });
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
  await firebase
    .firestore()
    .collection('users')
    .doc(userid)
    .collection('designs')
    .doc(designTitle)
    .set(useStore.getState().exportContent());
  usePrimitiveStore.getState().setChanged(false);
  if (canvas) {
    // update the thumbnail image as well
    const thumbnail = Util.resizeCanvas(canvas, thumbnailWidth).toDataURL();
    firebase
      .firestore()
      .collection('users')
      .doc(userid)
      .collection('projects')
      .doc(projectTitle)
      .get()
      .then((doc) => {
        if (doc.exists) {
          const data_1 = doc.data();
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
              updatedDesigns[index] = createDesign(projectType, designTitle, thumbnail);
              // Finally, upload the updated design array back to Firestore
              firebase
                .firestore()
                .collection('users')
                .doc(userid)
                .collection('projects')
                .doc(projectTitle)
                .update({ designs: updatedDesigns })
                .then(() => {})
                .catch((error) => {
                  showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
                })
                .finally(() => {
                  // Update the cached array in the local storage via the common store
                  useStore.getState().set((state_1) => {
                    state_1.projectState.designs = updatedDesigns;
                  });
                  usePrimitiveStore.getState().set((state_2) => {
                    state_2.updateProjectsFlag = true;
                    state_2.waiting = false;
                  });
                });
            }
          }
        }
      })
      .catch((error_1) => {
        showError(i18n.t('message.CannotFetchProjectData', lang) + ': ' + error_1);
      })
      .finally(() => {
        // TODO
      });
  }
};
