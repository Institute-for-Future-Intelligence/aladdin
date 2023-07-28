/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import { useStore } from './stores/common';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/storage';
import { showError, showInfo } from './helpers';
import i18n from './i18n/i18n';
import { HOME_URL } from './constants';
import { Design, DesignProblem } from './types';
import { Util } from './Util';
import { usePrimitiveStore } from './stores/commonPrimitive';
import html2canvas from 'html2canvas';

export const removeDesignFromProject = (userid: string, projectTitle: string, design: Design) => {
  const lang = { lng: useStore.getState().language };

  return firebase
    .firestore()
    .collection('users')
    .doc(userid)
    .collection('projects')
    .doc(projectTitle)
    .update({
      designs: firebase.firestore.FieldValue.arrayRemove(design),
    })
    .then(() => {
      showInfo(i18n.t('message.DesignRemovedFromProject', lang) + '.');
    })
    .catch((error) => {
      showError(i18n.t('message.CannotRemoveDesignFromProject', lang) + ': ' + error);
    });
};

export const updateProjectHiddenParameters = (
  userid: string,
  projectTitle: string,
  hiddenParameter: string,
  add: boolean, // true is to add, false is to remove
) => {
  const lang = { lng: useStore.getState().language };

  return firebase
    .firestore()
    .collection('users')
    .doc(userid)
    .collection('projects')
    .doc(projectTitle)
    .update({
      hiddenParameters: add
        ? firebase.firestore.FieldValue.arrayUnion(hiddenParameter)
        : firebase.firestore.FieldValue.arrayRemove(hiddenParameter),
    })
    .then(() => {
      // ignore
    })
    .catch((error) => {
      showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
    });
};

export const updateProjectDescription = (userid: string, projectTitle: string, description: string | null) => {
  const lang = { lng: useStore.getState().language };

  return firebase
    .firestore()
    .collection('users')
    .doc(userid)
    .collection('projects')
    .doc(projectTitle)
    .update({ description })
    .then(() => {
      // ignore
    })
    .catch((error) => {
      showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
    });
};

export const createDesign = (type: string, title: string, thumbnailUrl: string): Design => {
  let design = { title, thumbnailUrl } as Design;
  switch (type) {
    case DesignProblem.SOLAR_PANEL_ARRAY:
      const panelCount = Util.countAllSolarPanels();
      const dailyYield = Util.countAllSolarPanelDailyYields();
      const yearlyYield = Util.countAllSolarPanelYearlyYields();
      const economicParams = useStore.getState().economicsParams;
      const unitCost = economicParams.operationalCostPerUnit;
      const sellingPrice = economicParams.electricitySellingPrice;
      design = {
        unitCost,
        sellingPrice,
        panelCount,
        dailyYield,
        yearlyYield,
        ...design,
        ...useStore.getState().solarPanelArrayLayoutParams,
      };
      break;
    case DesignProblem.SOLAR_PANEL_TILT_ANGLE:
      // TODO: Each row has a different tilt angle
      break;
  }
  return design;
};

export const changeDesignTitles = (projectTitle: string, projectDesigns: Design[] | null): Design[] | null => {
  if (!projectDesigns) return null;
  const newDesigns: Design[] = [];
  for (const design of projectDesigns) {
    const copy = { ...design };
    copy.title = createDesignTitle(projectTitle, design.title);
    newDesigns.push(copy);
  }
  return newDesigns;
};

export const uploadImages = (
  images: Map<string, HTMLImageElement>,
  designs: Design[],
  designsWithNewTitles: Design[],
) => {
  const lang = { lng: useStore.getState().language };
  for (const [i, d] of designs.entries()) {
    const image = images.get(d.title);
    if (image) {
      html2canvas(image, { allowTaint: true, foreignObjectRendering: true }).then((canvas) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const metadata = { contentType: 'image/png' };
            const uploadTask = firebase
              .storage()
              .ref()
              .child('images/' + designsWithNewTitles[i].title + '.png')
              .put(blob, metadata);
            // Listen for state changes, errors, and completion of the upload
            uploadTask.on(
              firebase.storage.TaskEvent.STATE_CHANGED,
              (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                if (progress > 0) {
                  showInfo(i18n.t('word.Upload', lang) + ': ' + progress + '%');
                }
              },
              (error) => {
                showError('Storage: ' + error);
                console.log(error);
              },
              () => {
                uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                  // designsWithNewTitles[i].thumbnailUrl = downloadURL;
                });
              },
            );
          }
        });
      });
    }
  }
};

export const createDesignTitle = (projectTitle: string, designTitle: string) => {
  if (designTitle.includes(projectTitle)) return designTitle;
  const index = designTitle.lastIndexOf(' ');
  return projectTitle + '' + designTitle.substring(index);
};

export const copyDesign = (userid: string, original: string, copy: string) => {
  const lang = { lng: useStore.getState().language };
  firebase
    .firestore()
    .collection('users')
    .doc(userid)
    .collection('files')
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
            .collection('files')
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

export const updateProjectDesign = (
  userid: string,
  projectType: string,
  projectTitle: string,
  designTitle: string,
  canvas: HTMLCanvasElement | null,
) => {
  const lang = { lng: useStore.getState().language };

  // First we update the design file by overwriting it with the current content
  return firebase
    .firestore()
    .collection('users')
    .doc(userid)
    .collection('files')
    .doc(designTitle)
    .set(useStore.getState().exportContent())
    .then(() => {
      useStore.getState().set((state) => {
        state.changed = false;
      });
      // Then we upload an updated thumbnail from the current design canvas to Firestore Storage
      if (canvas) {
        const storageRef = firebase.storage().ref();
        const thumbnail = Util.resizeCanvas(canvas, 200);
        thumbnail.toBlob((blob) => {
          if (blob) {
            const metadata = { contentType: 'image/png' };
            const uploadTask = storageRef
              .child('images/' + createDesignTitle(projectTitle, designTitle) + '.png')
              .put(blob, metadata);
            // Listen for state changes, errors, and completion of the upload
            uploadTask.on(
              firebase.storage.TaskEvent.STATE_CHANGED,
              (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                if (progress > 0) {
                  showInfo(i18n.t('word.Upload', lang) + ': ' + progress + '%');
                }
              },
              (error) => {
                showError('Storage: ' + error);
              },
              () => {
                uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                  if (!userid) return;
                  // After we get a new download URL for the thumbnail image, we then go on to upload other data
                  // Since Firestore doesn't have a way to modify just an element of an array,
                  // we have to download a copy of the entire design array first, modify it, and then upload it back
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
                          // Create an updated design from the current parameters and results
                          const design = createDesign(projectType, designTitle, downloadURL);
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
                            updatedDesigns[index] = design;
                          }
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
                            })
                            .finally(() => {
                              // Update the cached array in the local storage via the common store
                              useStore.getState().set((state) => {
                                state.projectDesigns = updatedDesigns;
                              });
                            });
                        }
                      }
                    })
                    .catch((error) => {
                      showError(i18n.t('message.CannotFetchProjectData', lang) + ': ' + error);
                    })
                    .finally(() => {
                      // ignore
                    });
                });
              },
            );
          }
        });
      }
    })
    .catch((error) => {
      showError(i18n.t('message.CannotSaveYourFileToCloud', lang) + ': ' + error);
    })
    .finally(() => {
      // ignore
    });
};

export const loadCloudFile = (userid: string, title: string, popState?: boolean, viewOnly?: boolean) => {
  const lang = { lng: useStore.getState().language };

  useStore.getState().undoManager.clear();
  usePrimitiveStore.setState((state) => {
    state.waiting = true;
  });

  return firebase
    .firestore()
    .collection('users')
    .doc(userid)
    .collection('files')
    .doc(title)
    .get()
    .then((doc) => {
      const data = doc.data();
      if (data) {
        useStore.getState().importContent(data, title);
      } else {
        showInfo(i18n.t('message.CloudFileNotFound', lang) + ': ' + title);
        useStore.getState().set((state) => {
          state.cloudFile = undefined;
        });
      }
      if (!popState && !viewOnly) {
        const newUrl = HOME_URL + '?client=web&userid=' + userid + '&title=' + encodeURIComponent(title);
        window.history.pushState({}, document.title, newUrl);
      }
    })
    .catch((error) => {
      showError(i18n.t('message.CannotOpenCloudFile', lang) + ': ' + error);
    })
    .finally(() => {
      usePrimitiveStore.setState((state) => {
        state.waiting = false;
      });
    });
};
