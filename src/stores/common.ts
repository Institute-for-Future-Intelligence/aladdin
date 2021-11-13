/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import produce, { enableMapSet } from 'immer';
import { WorldModel } from '../models/WorldModel';
import { ElementModel } from '../models/ElementModel';
import { WeatherModel } from '../models/WeatherModel';
import weather from '../resources/weather.csv';
import pvmodules from '../resources/pvmodules.csv';
import Papa from 'papaparse';
import { Util } from '../Util';
import {
  ActionType,
  DatumEntry,
  MoveHandleType,
  ObjectType,
  Orientation,
  ResizeHandleType,
  RotateHandleType,
  User,
} from '../types';
import { DefaultWorldModel } from './DefaultWorldModel';
import { Box3, Vector2, Vector3 } from 'three';
import { ElementModelCloner } from '../models/ElementModelCloner';
import { DefaultViewState } from './DefaultViewState';
import { ViewState } from '../views/ViewState';
import short from 'short-uuid';
import { ElementModelFactory } from '../models/ElementModelFactory';
import { GroundModel } from '../models/GroundModel';
import { PvModel } from '../models/PvModel';
import { ThreeEvent } from '@react-three/fiber';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { WallModel } from '../models/WallModel';
import { Locale } from 'antd/lib/locale-provider';
import enUS from 'antd/lib/locale/en_US';
import { Undoable } from '../undo/Undoable';
// @ts-ignore
import UndoManager from 'undo-manager';

enableMapSet();

export interface CommonStoreState {
  set: (fn: (state: CommonStoreState) => void) => void;

  // only the following properties are persisted (see the whitelist at the end)
  world: WorldModel;
  elements: ElementModel[];
  viewState: ViewState;
  notes: string[];
  user: User;
  language: string;
  cloudFile: string | undefined;

  exportContent: () => {};
  clearContent: () => void;
  undoManager: UndoManager;
  addUndoable: (undoable: Undoable) => void;

  weatherData: { [key: string]: WeatherModel };
  getWeather: (location: string) => WeatherModel;
  loadWeatherData: () => void;
  getClosestCity: (lat: number, lng: number) => string | null;

  pvModules: { [key: string]: PvModel };
  getPvModule: (name: string) => PvModel;
  loadPvModules: () => void;

  grid: boolean; // this should only show up when editing
  aabb: Box3; // axis-aligned bounding box of elements
  animateSun: boolean;
  enableOrbitController: boolean;
  clickObjectType: ObjectType | null;
  contextMenuObjectType: ObjectType | null;
  moveHandleType: MoveHandleType | null;
  resizeHandleType: ResizeHandleType | null;
  rotateHandleType: RotateHandleType | null;
  resizeAnchor: Vector3;
  showCloudFilePanel: boolean;
  showAccountSettingsPanel: boolean;
  selectedElement: ElementModel | null;
  getSelectedElement: () => ElementModel | null;
  getResizeHandlePosition: (e: ElementModel, type: ResizeHandleType) => Vector3;
  getElementById: (id: string) => ElementModel | null;
  selectMe: (id: string, e: ThreeEvent<MouseEvent>, action?: ActionType) => void;
  selectNone: () => void;
  updateElementById: (id: string, element: Partial<ElementModel>) => ElementModel | null;
  setElementPosition: (id: string, x: number, y: number, z?: number) => void;
  setElementRotation: (id: string, x: number, y: number, z: number) => void;
  setElementNormal: (id: string, x: number, y: number, z: number) => void;
  setElementSize: (id: string, lx: number, ly: number, lz?: number) => void;

  objectTypeToAdd: ObjectType;
  addElement: (parent: ElementModel | GroundModel, position: Vector3, normal?: Vector3) => string;

  pastePoint: Vector3;
  pasteNormal: Vector3 | undefined;
  elementsToPaste: ElementModel[];
  copyElementById: (id: string) => void;
  removeElementById: (id: string, cut: boolean) => void; // set cut to false for deletion
  pasteElementsToPoint: () => ElementModel[];
  pasteElementsByKey: () => ElementModel[];
  countElementsByType: (type: ObjectType) => number;
  removeElementsByType: (type: ObjectType) => void;
  countAllChildElementsByType: (parentId: string, type: ObjectType) => number;
  countAllChildSolarPanels: (parentId: string) => number; // special case as a rack may have many solar panels
  removeAllChildElementsByType: (parentId: string, type: ObjectType) => void;

  dailyLightSensorData: DatumEntry[];
  setDailyLightSensorData: (data: DatumEntry[]) => void;
  yearlyLightSensorData: DatumEntry[];
  setYearlyLightSensorData: (data: DatumEntry[]) => void;
  sensorLabels: string[];
  setSensorLabels: (labels: string[]) => void;

  dailyPvYield: DatumEntry[];
  setDailyPvYield: (data: DatumEntry[]) => void;
  yearlyPvYield: DatumEntry[];
  setYearlyPvYield: (data: DatumEntry[]) => void;
  solarPanelLabels: string[];
  setSolarPanelLabels: (labels: string[]) => void;

  sunlightDirection: Vector3;
  setSunlightDirection: (vector: Vector3) => void;

  cameraDirection: Vector3;
  getCameraDirection: () => Vector3;

  heliodonRadius: number;
  setHeliodonRadius: (radius: number) => void;

  selectedElementAngle: number;
  selectedElementHeight: number;

  buildingWallID: string | null;
  deletedWallID: string | null;
  getInitialWallsID: (parentID: string) => string[];

  orthographicChanged: boolean;
  simulationInProgress: boolean;
  locale: Locale;
  localFileName: string;
  savedCameraPosition: Vector3;
  savedPanCenter: Vector3;
  enableFineGrid: boolean;
  setEnableFineGrid: (b: boolean) => void;

  // the following is to fix the bug that when ctrl+o is pressed, the file dialog gets fired up multiple times
  localFileDialogRequested: boolean;
}

export const useStore = create<CommonStoreState>(
  devtools(
    persist(
      (set, get) => {
        const immerSet: CommonStoreState['set'] = (fn) => set(produce(fn));
        const defaultWorldModel = new DefaultWorldModel();
        const defaultElements = defaultWorldModel.getElements();
        const defaultViewState = new DefaultViewState();

        return {
          set: (fn) => {
            try {
              immerSet(fn);
            } catch (e) {
              console.log(e);
            }
          },
          world: defaultWorldModel,
          elements: defaultElements,
          viewState: defaultViewState,
          notes: [],
          user: {} as User,
          language: 'en',
          cloudFile: undefined,
          exportContent() {
            const state = get();
            return {
              docid: short.generate(),
              timestamp: new Date().getTime(),
              owner: state.user.displayName,
              email: state.user.email,
              world: state.world,
              elements: state.elements,
              view: state.viewState,
              notes: state.notes,
            };
          },
          clearContent() {
            immerSet((state: CommonStoreState) => {
              state.elements = [];
            });
          },
          undoManager: new UndoManager(),
          addUndoable(undable: Undoable) {
            immerSet((state: CommonStoreState) => {
              state.undoManager.add(undable);
            });
          },

          yearlyLightSensorData: [],
          setYearlyLightSensorData(data) {
            immerSet((state: CommonStoreState) => {
              state.yearlyLightSensorData = [...data];
            });
          },
          dailyLightSensorData: [],
          setDailyLightSensorData(data) {
            immerSet((state: CommonStoreState) => {
              state.dailyLightSensorData = [...data];
            });
          },
          sensorLabels: [],
          setSensorLabels(labels) {
            immerSet((state: CommonStoreState) => {
              state.sensorLabels = [...labels];
            });
          },

          yearlyPvYield: [],
          setYearlyPvYield(data) {
            immerSet((state: CommonStoreState) => {
              state.yearlyPvYield = [...data];
            });
          },
          dailyPvYield: [],
          setDailyPvYield(data) {
            immerSet((state: CommonStoreState) => {
              state.dailyPvYield = [...data];
            });
          },
          solarPanelLabels: [],
          setSolarPanelLabels(labels) {
            immerSet((state: CommonStoreState) => {
              state.solarPanelLabels = [...labels];
            });
          },

          grid: false,
          aabb: new Box3(),
          animateSun: false,
          enableOrbitController: true,
          clickObjectType: null,
          contextMenuObjectType: null,
          moveHandleType: null,
          resizeHandleType: null,
          rotateHandleType: null,
          resizeAnchor: new Vector3(),
          showCloudFilePanel: false,
          showAccountSettingsPanel: false,

          selectedElement: null,
          getSelectedElement() {
            const elements = get().elements;
            for (const e of elements) {
              if (e.selected) {
                return e;
              }
              if (e.type === ObjectType.Wall) {
                const wall = e as WallModel;
                for (const w of wall.windows) {
                  if (w.selected) {
                    return w;
                  }
                }
              }
            }
            return null;
          },
          getResizeHandlePosition(e: ElementModel, type: ResizeHandleType) {
            const { cx, cy, cz, lx, ly, rotation } = e;
            const p = new Vector3();
            const v = new Vector2();
            switch (type) {
              case ResizeHandleType.LowerLeftTop:
                v.set(-lx / 2, -ly / 2);
                break;
              case ResizeHandleType.LowerRightTop:
                v.set(lx / 2, -ly / 2);
                break;
              case ResizeHandleType.UpperLeftTop:
                v.set(-lx / 2, ly / 2);
                break;
              case ResizeHandleType.UpperRightTop:
                v.set(lx / 2, ly / 2);
                break;
            }
            v.rotateAround(new Vector2(0, 0), rotation[2]);
            p.set(cx + v.x, cy + v.y, cz);
            return p;
          },
          getElementById(id: string) {
            const elements = get().elements;
            for (const e of elements) {
              if (e.id === id) {
                return e;
              }
              if (e.type === ObjectType.Wall) {
                for (const w of (e as WallModel).windows) {
                  if (w.id === id) {
                    return w;
                  }
                }
              }
            }
            return null;
          },
          selectNone() {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                e.selected = false;
                if (e.type === ObjectType.Wall) {
                  const wall = e as WallModel;
                  for (const w of wall.windows) {
                    w.selected = false;
                  }
                }
              }
              state.selectedElement = null;
            });
          },
          selectMe(id, e, action) {
            if (e.intersections.length > 0) {
              if (e.intersections[0].object === e.eventObject) {
                immerSet((state) => {
                  for (const elem of state.elements) {
                    if (elem.id === id) {
                      elem.selected = true;
                      if (elem.type === ObjectType.Wall) {
                        const wall = elem as WallModel;
                        for (const w of wall.windows) {
                          w.selected = false;
                        }
                      }
                      state.selectedElementHeight = elem.lz;
                    } else {
                      elem.selected = false;
                      if (elem.type === ObjectType.Wall) {
                        const wall = elem as WallModel;
                        for (const w of wall.windows) {
                          w.selected = w.id === id;
                        }
                      }
                    }
                  }
                  if (action) {
                    state.moveHandleType = null;
                    state.resizeHandleType = null;
                    state.rotateHandleType = null;
                    state.enableOrbitController = false;
                    switch (action) {
                      case ActionType.Move:
                        state.moveHandleType = e.eventObject.name as MoveHandleType;
                        break;
                      case ActionType.Resize:
                        state.resizeHandleType = e.eventObject.name as ResizeHandleType;
                        break;
                      case ActionType.Rotate:
                        state.rotateHandleType = e.eventObject.name as RotateHandleType;
                        break;
                      case ActionType.Select:
                        state.selectedElementAngle = e.object.parent?.rotation.z ?? 0;
                        state.enableOrbitController = true;
                        break;
                      default:
                        state.enableOrbitController = true;
                    }
                  }
                });
              }
            }
          },
          updateElementById(id, newProps) {
            let element: ElementModel | null = null;
            immerSet((state: CommonStoreState) => {
              for (let [i, e] of state.elements.entries()) {
                if (e.id === id) {
                  state.elements[i] = { ...e, ...newProps };
                  state.selectedElementHeight = newProps.lz ?? 0;
                  element = state.elements[i];
                  break;
                }
                if (e.type === ObjectType.Wall) {
                  const wall = e as WallModel;
                  for (const [wi, we] of wall.windows.entries()) {
                    if (we.id === id) {
                      wall.windows[wi] = { ...we, ...newProps };
                    }
                  }
                }
              }
            });
            return element;
          },
          setElementPosition(id, x, y, z?) {
            immerSet((state: CommonStoreState) => {
              for (let [i, e] of state.elements.entries()) {
                if (e.id === id) {
                  state.elements[i].cx = x;
                  state.elements[i].cy = y;
                  if (z) {
                    state.elements[i].cz = z;
                  }
                  break;
                }
              }
            });
          },
          setElementRotation(id, x, y, z) {
            immerSet((state: CommonStoreState) => {
              for (let [i, e] of state.elements.entries()) {
                if (e.id === id || e.parentId === id) {
                  const elem = state.elements[i];
                  elem.rotation[0] = x;
                  elem.rotation[1] = y;
                  elem.rotation[2] = z;
                }
              }
              state.selectedElementAngle = z;
            });
          },
          setElementNormal(id, x, y, z) {
            immerSet((state: CommonStoreState) => {
              for (let [i, e] of state.elements.entries()) {
                if (e.id === id || e.parentId === id) {
                  const elem = state.elements[i];
                  elem.normal[0] = x;
                  elem.normal[1] = y;
                  elem.normal[2] = z;
                }
              }
            });
          },
          setElementSize(id, lx, ly, lz?) {
            immerSet((state: CommonStoreState) => {
              for (let [i, e] of state.elements.entries()) {
                if (e.id === id) {
                  state.elements[i].lx = lx;
                  state.elements[i].ly = ly;
                  if (lz) {
                    state.elements[i].lz = lz;
                    state.selectedElementHeight = lz;
                  }
                  break;
                } else if (e.type === ObjectType.Wall) {
                  for (const w of (e as WallModel).windows) {
                    if (w.id === id) {
                      w.lx = lx;
                      w.ly = ly;
                      if (lz) {
                        w.lz = lz;
                      }
                    }
                  }
                }
              }
            });
          },

          objectTypeToAdd: ObjectType.None,
          addElement(parent: ElementModel | GroundModel, position, normal) {
            let id = '';
            immerSet((state: CommonStoreState) => {
              const m = position;
              switch (state.objectTypeToAdd) {
                case ObjectType.Human:
                  const human = ElementModelFactory.makeHuman(m.x, m.y, m.z);
                  id = human.id;
                  state.elements.push(human);
                  break;
                case ObjectType.Tree:
                  const tree = ElementModelFactory.makeTree(m.x, m.y, m.z);
                  id = tree.id;
                  state.elements.push(tree);
                  break;
                case ObjectType.Sensor:
                  const sensorParentModel = parent as ElementModel;
                  const sensorRelativeCoordinates = Util.relativeCoordinates(m.x, m.y, m.z, sensorParentModel);
                  const sensor = ElementModelFactory.makeSensor(
                    sensorParentModel,
                    sensorRelativeCoordinates.x,
                    sensorRelativeCoordinates.y,
                    sensorRelativeCoordinates.z,
                    normal,
                    parent.rotation,
                  );
                  id = sensor.id;
                  state.elements.push(sensor);
                  break;
                case ObjectType.SolarPanel:
                  const solarPanelParentModel = parent as ElementModel;
                  const solarPanelRelativeCoordinates = Util.relativeCoordinates(m.x, m.y, m.z, solarPanelParentModel);
                  const solarPanel = ElementModelFactory.makeSolarPanel(
                    solarPanelParentModel,
                    state.getPvModule('SPR-X21-335-BLK'),
                    solarPanelRelativeCoordinates.x,
                    solarPanelRelativeCoordinates.y,
                    solarPanelRelativeCoordinates.z,
                    normal,
                    parent.rotation,
                  );
                  id = solarPanel.id;
                  state.elements.push(solarPanel);
                  break;
                case ObjectType.Foundation:
                  const foundation = ElementModelFactory.makeFoundation(m.x, m.y);
                  id = foundation.id;
                  state.elements.push(foundation);
                  break;
                case ObjectType.Cuboid:
                  const cuboid = ElementModelFactory.makeCuboid(m.x, m.y);
                  id = cuboid.id;
                  state.elements.push(cuboid);
                  break;
                case ObjectType.Wall:
                  const wallParentModel = parent as ElementModel;
                  const relativePos = Util.wallRelativePosition(new Vector3(m.x, m.y), wallParentModel);
                  const wall = ElementModelFactory.makeWall(
                    wallParentModel,
                    relativePos.x,
                    relativePos.y,
                    relativePos.z,
                    normal,
                    parent.rotation,
                  );
                  state.elements.push(wall);
                  id = wall.id;
                  break;
              }
            });
            return id;
          },

          elementsToPaste: [],
          pastePoint: new Vector3(),
          pasteNormal: undefined,
          copyElementById(id) {
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.id === id) {
                  state.elementsToPaste = [e];
                  break;
                }
              }
            });
          },
          removeElementById(id: string, cut: boolean) {
            immerSet((state: CommonStoreState) => {
              for (const elem of state.elements) {
                if (elem.id === id) {
                  if (cut) {
                    state.elementsToPaste = [elem];
                  }
                  elem.selected = false;
                  if (elem.type === ObjectType.Wall) {
                    const currentWall = elem as WallModel;
                    let leftWallId = '';
                    let rightWallId = '';
                    if (currentWall.leftJoints.length > 0) {
                      leftWallId = state.getElementById(currentWall.leftJoints[0].id)?.id ?? '';
                    }
                    if (currentWall.rightJoints.length > 0) {
                      rightWallId = state.getElementById(currentWall.rightJoints[0].id)?.id ?? '';
                    }
                    for (const w of state.elements) {
                      if (w.id === leftWallId) {
                        (w as WallModel).rightOffset = 0;
                        (w as WallModel).rightJoints = [];
                      } else if (w.id === rightWallId) {
                        (w as WallModel).leftOffset = 0;
                        (w as WallModel).leftJoints = [];
                      }
                    }
                    state.deletedWallID = elem.id;
                  }
                  break;
                }
              }
              if (cut) {
                for (const e of state.elements) {
                  if (e.parentId === id) {
                    state.elementsToPaste.push(e);
                  }
                }
              }
              state.elements = state.elements.filter((e) => {
                if (e.type === ObjectType.Wall) {
                  const wall = e as WallModel;
                  wall.windows = wall.windows.filter((w) => w.id !== id);
                }
                return !(e.id === id || e.parentId === id);
              });
              state.selectedElement = null;
            });
          },
          removeElementsByType(type: ObjectType) {
            immerSet((state: CommonStoreState) => {
              state.elements = state.elements.filter((x) => x.type !== type);
            });
          },
          countElementsByType(type: ObjectType) {
            let count = 0;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type) {
                  count++;
                }
              }
            });
            return count;
          },

          removeAllChildElementsByType(parentId: string, type: ObjectType) {
            immerSet((state: CommonStoreState) => {
              state.elements = state.elements.filter((x) => x.type !== type || x.parentId !== parentId);
            });
          },
          countAllChildElementsByType(parentId: string, type: ObjectType) {
            let count = 0;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === type && e.parentId === parentId) {
                  count++;
                }
              }
            });
            return count;
          },
          countAllChildSolarPanels(parentId: string) {
            let count = 0;
            immerSet((state: CommonStoreState) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.SolarPanel && e.parentId === parentId) {
                  const sp = e as SolarPanelModel;
                  const pvModel = state.getPvModule(sp.pvModelName);
                  let nx, ny;
                  if (sp.orientation === Orientation.portrait) {
                    nx = Math.max(1, Math.round(sp.lx / pvModel.width));
                    ny = Math.max(1, Math.round(sp.ly / pvModel.length));
                  } else {
                    nx = Math.max(1, Math.round(sp.lx / pvModel.length));
                    ny = Math.max(1, Math.round(sp.ly / pvModel.width));
                  }
                  count += nx * ny;
                }
              }
            });
            return count;
          },

          pasteElementsToPoint() {
            const pastedElements: ElementModel[] = [];
            immerSet((state: CommonStoreState) => {
              if (state.elementsToPaste.length > 0) {
                let m = state.pastePoint;
                const newParent = state.getSelectedElement();
                const oldParent = state.getElementById(state.elementsToPaste[0].parentId);
                if (newParent) {
                  // if parent is ground, it has no type definition but we use it to check its type
                  if (oldParent && oldParent.type) {
                    state.elementsToPaste[0].parentId = newParent.id;
                    m = Util.relativeCoordinates(m.x, m.y, m.z, newParent);
                  }
                }
                const e = ElementModelCloner.clone(newParent, state.elementsToPaste[0], m.x, m.y, m.z);
                if (e) {
                  if (state.pasteNormal) {
                    e.normal = state.pasteNormal.toArray();
                  }
                  state.elements.push(e);
                  pastedElements.push(e);
                }
                if (state.elementsToPaste.length > 1) {
                  // paste children, too
                  for (let i = 1; i < state.elementsToPaste.length; i++) {
                    // TODO
                  }
                }
              }
            });
            return pastedElements;
          },

          pasteElementsByKey() {
            const pastedElements: ElementModel[] = [];
            immerSet((state: CommonStoreState) => {
              if (state.elementsToPaste.length > 0) {
                const elem = state.elementsToPaste[0];
                const parent = state.getElementById(elem.parentId);
                const e = ElementModelCloner.clone(parent, elem, elem.cx, elem.cy, elem.cz);
                if (e) {
                  switch (e.type) {
                    case ObjectType.Human:
                      e.cx += 1;
                      state.elements.push(e);
                      state.elementsToPaste = [e];
                      break;
                    case ObjectType.Tree:
                      e.cx += e.lx;
                      state.elements.push(e);
                      state.elementsToPaste = [e];
                      break;
                    case ObjectType.SolarPanel:
                      if (e.parentId) {
                        const parent = state.getElementById(e.parentId);
                        if (parent) {
                          e.cx += e.lx / parent.lx;
                        }
                        if (e.cx < 0.5) {
                          state.elements.push(e);
                          state.elementsToPaste = [e];
                        }
                      }
                      break;
                    case ObjectType.Sensor:
                      if (e.parentId) {
                        const parent = state.getElementById(e.parentId);
                        if (parent) {
                          e.cx += e.lx / parent.lx;
                        }
                        if (e.cx < 0.5) {
                          state.elements.push(e);
                          state.elementsToPaste = [e];
                        }
                      }
                      break;
                  }
                  pastedElements.push(e);
                }
                if (state.elementsToPaste.length > 1) {
                  // paste children, too
                  for (let i = 1; i < state.elementsToPaste.length; i++) {
                    // TODO
                  }
                }
              }
            });
            return pastedElements;
          },

          pvModules: {},
          loadPvModules() {
            const pvModels: PvModel[] = [];
            Papa.parse(pvmodules, {
              download: true,
              complete: function (results) {
                for (const row of results.data) {
                  if (Array.isArray(row) && row.length > 1) {
                    const pv = {
                      name: row[0].trim(),
                      brand: row[1].trim(),
                      cellType: row[2].trim(),
                      efficiency: parseFloat(row[3].trim()),
                      length: parseFloat(row[4].trim()),
                      nominalLength: parseFloat(row[5].trim()),
                      width: parseFloat(row[6].trim()),
                      nominalWidth: parseFloat(row[7].trim()),
                      thickness: parseFloat(row[8].trim()),
                      m: parseFloat(row[9].trim()),
                      n: parseFloat(row[10].trim()),
                      pmax: parseFloat(row[11].trim()),
                      vmpp: parseFloat(row[12].trim()),
                      impp: parseFloat(row[13].trim()),
                      voc: parseFloat(row[14].trim()),
                      isc: parseFloat(row[15].trim()),
                      pmaxTC: parseFloat(row[16].trim()),
                      noct: parseFloat(row[17].trim()),
                      weight: parseFloat(row[18].trim()),
                      color: row[19].trim(),
                      shadeTolerance: row[20].trim(),
                      price: parseFloat(row[21].trim()),
                    } as PvModel;
                    pvModels.push(pv);
                  }
                }
                immerSet((state: CommonStoreState) => {
                  for (const model of pvModels) {
                    state.pvModules[model.name] = model;
                  }
                });
              },
            });
          },
          getPvModule(name: string) {
            return get().pvModules[name];
          },

          weatherData: {},
          loadWeatherData() {
            const data: WeatherModel[] = [];
            Papa.parse(weather, {
              download: true,
              complete: function (results) {
                for (const row of results.data) {
                  if (Array.isArray(row) && row.length > 1) {
                    const lows: number[] = [];
                    const highs: number[] = [];
                    const sun: number[] = [];
                    for (let i = 5; i < 29; i++) {
                      if ((i - 5) % 2 === 0) {
                        lows.push(parseFloat(row[i].trim()));
                      } else {
                        highs.push(parseFloat(row[i].trim()));
                      }
                    }
                    for (let i = 29; i < 41; i++) {
                      sun.push(parseFloat(row[i].trim()));
                    }
                    const wm = {
                      city: row[0].trim(),
                      country: row[1].trim(),
                      longitude: parseFloat(row[2].trim()),
                      latitude: parseFloat(row[3].trim()),
                      elevation: parseFloat(row[4].trim()),
                      lowestTemperatures: lows,
                      highestTemperatures: highs,
                      sunshineHours: sun,
                    } as WeatherModel;
                    data.push(wm);
                  }
                }
                immerSet((state: CommonStoreState) => {
                  for (const row of data) {
                    state.weatherData[row.city + ', ' + row.country] = row;
                  }
                });
              },
            });
          },
          getWeather(location: string) {
            return get().weatherData[location];
          },
          getClosestCity(lat: number, lng: number) {
            let min: number = Number.MAX_VALUE;
            let city = null;
            let distance: number;
            const wd = get().weatherData;
            for (const name in wd) {
              if (wd.hasOwnProperty(name)) {
                distance = Util.getDistance(lng, lat, wd[name].longitude, wd[name].latitude);
                if (distance < min) {
                  min = distance;
                  city = name;
                }
              }
            }
            return city;
          },

          sunlightDirection: new Vector3(0, 2, 2),
          setSunlightDirection(vector: Vector3) {
            immerSet((state: CommonStoreState) => {
              state.sunlightDirection = vector.clone();
            });
          },

          cameraDirection: new Vector3(),
          getCameraDirection() {
            return get().cameraDirection;
          },

          heliodonRadius: 10,
          setHeliodonRadius(radius: number) {
            immerSet((state: CommonStoreState) => {
              state.heliodonRadius = radius;
            });
          },

          selectedElementAngle: 0,
          selectedElementHeight: 0,

          buildingWallID: null,
          deletedWallID: null,
          getInitialWallsID(parentID: string) {
            const state = get();
            const wallsID: string[] = [];
            for (const e of state.elements) {
              if (e.type === ObjectType.Wall && e.parentId === parentID) {
                wallsID.push(e.id);
              }
            }
            return wallsID;
          },

          orthographicChanged: false,
          simulationInProgress: false,
          locale: enUS,
          localFileName: 'aladdin.ala',
          localFileDialogRequested: false,
          savedCameraPosition: new Vector3(0, -5, 0),
          savedPanCenter: new Vector3(),

          enableFineGrid: false,
          setEnableFineGrid(b: boolean) {
            immerSet((state: CommonStoreState) => {
              state.enableFineGrid = b;
            });
          },
        };
      },
      {
        name: 'aladdin-storage',
        whitelist: [
          'language',
          'cloudFile',
          'world',
          'elements',
          'viewState',
          'notes',
          'user',
          'weatherData',
          'sensorLabels',
          'solarPanelLabels',
          'dailyLightSensorData',
          'yearlyLightSensorData',
        ],
      },
    ),
  ),
);
