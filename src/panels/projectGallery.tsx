/*
 * @Copyright 2023-2025. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import styled from 'styled-components';
import {
  Button,
  Checkbox,
  Col,
  Collapse,
  CollapseProps,
  Input,
  List,
  Modal,
  Popover,
  Radio,
  Row,
  Select,
  Space,
} from 'antd';
import {
  BgColorsOutlined,
  CameraOutlined,
  CarryOutOutlined,
  CheckCircleOutlined,
  CheckCircleFilled,
  CloseOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  DotChartOutlined,
  EditFilled,
  EditOutlined,
  ImportOutlined,
  LinkOutlined,
  SettingOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  FolderOpenOutlined,
  QuestionCircleOutlined,
  CopyOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import ImageLoadFailureIcon from '../assets/image_fail_try_again.png';
import GenaiImage from '../assets/genai.png';
import { DataColoring, DatumEntry, Design, DesignProblem, Orientation } from '../types';
import ParallelCoordinates from '../components/parallelCoordinates';
//@ts-expect-error ignore
import { saveSvgAsPng } from 'save-svg-as-png';
import { showError, showInfo, showSuccess } from '../helpers';
import { Util } from '../Util';
import { ProjectUtil } from './ProjectUtil';
import { HOME_URL } from '../constants';
import {
  removeDesignFromProject,
  updateAIMemory,
  updateDataColoring,
  updateDescription,
  updateDesign,
  updateDesignVisibility,
  updateDotSizeScatterPlot,
  updateHiddenParameters,
  updateThumbnailWidth,
  updateXAxisNameScatterPlot,
  updateYAxisNameScatterPlot,
} from '../cloudProjectUtil';
import { loadCloudFile } from '../cloudFileUtil';
import { CartesianGrid, Dot, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import ScatterPlotMenu from '../components/scatterPlotMenu';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { Filter, FilterType } from '../Filter';
import { useLanguage } from '../hooks';
import { UndoableCheck } from '../undo/UndoableCheck';
import { UndoableChange } from '../undo/UndoableChange';
import { FidgetSpinner } from 'react-loader-spinner';
import GenerateBuildingModal from 'src/components/generateBuildingModal';
import SparkImage from 'src/assets/spark.png';
import { firestore } from 'src/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import i18n from 'src/i18n/i18n';

const { TextArea } = Input;
const { Option } = Select;

const Container = styled.div`
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  height: calc(100% - 30px);
  margin: 0;
  display: flex;
  justify-content: center;
  align-self: center;
  align-content: center;
  align-items: center;
  padding-bottom: 30px;
  opacity: 100%;
  user-select: none;
  tab-index: -1; // set to be not focusable
  z-index: 7; // must be less than other panels
  background: white;
`;

const ColumnWrapper = styled.div`
  background-color: #f8f8f8;
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  border: none;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: hidden;
`;

const Header = styled.div`
  width: 100%;
  height: 24px;
  padding: 10px;
  background-color: #e8e8e8;
  color: #888;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SubHeader = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SolutionSpaceHeader = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 6px;
  padding-bottom: 6px;
  background: white;
`;

const SubContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  background: white;
`;

export interface ProjectGalleryProps {
  relativeWidth: number;
  canvas: HTMLCanvasElement | null;
}

const ProjectGallery = React.memo(({ relativeWidth, canvas }: ProjectGalleryProps) => {
  const setCommonStore = useStore(Selector.set);
  const user = useStore(Selector.user);
  const changed = usePrimitiveStore(Selector.changed);
  const confirmOpeningDesign = usePrimitiveStore(Selector.confirmOpeningDesign);
  const loggable = useStore(Selector.loggable);
  const addUndoable = useStore(Selector.addUndoable);
  const cloudFile = useStore(Selector.cloudFile);
  const projectTitle = useStore(Selector.projectTitle);
  const projectOwner = useStore(Selector.projectOwner);
  const projectDesigns = useStore(Selector.projectDesigns);
  const projectType = useStore(Selector.projectType);
  const projectSelectedProperty = useStore(Selector.projectSelectedProperty);
  const projectDescription = useStore(Selector.projectDescription);
  const projectDataColoring = useStore(Selector.projectDataColoring);
  const projectThumbnailWidth = useStore(Selector.projectThumbnailWidth);
  const hiddenParameters = useStore(Selector.hiddenParameters);
  const sortDescending = useStore(Selector.sortDescending);
  const projectRanges = useStore(Selector.projectRanges);
  const projectFilters = useStore(Selector.projectFilters);
  const xAxisNameScatterPlot = useStore(Selector.xAxisNameScatterPlot);
  const yAxisNameScatterPlot = useStore(Selector.yAxisNameScatterPlot);
  const dotSizeScatterPlot = useStore(Selector.dotSizeScatterPlot);
  const solarPanelArrayLayoutConstraints = useStore(Selector.solarPanelArrayLayoutConstraints);
  const economicsParams = useStore(Selector.economicsParams);
  const cloudFileBelongToProject = useStore(Selector.cloudFileBelongToProject);
  const closeProject = useStore(Selector.closeProject);
  const generating = usePrimitiveStore(Selector.generating);
  const independentPrompt = useStore(Selector.independentPrompt);

  const [selectedDesign, setSelectedDesign] = useState<Design | undefined>();
  const [hoveredDesign, setHoveredDesign] = useState<Design | undefined>();
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [updateHiddenFlag, setUpdateHiddenFlag] = useState<boolean>(false);
  const [generateBuildingDialogVisible, setGenerateBuildingDialogVisible] = useState(false);

  const descriptionTextAreaEditableRef = useRef<boolean>(false);
  const descriptionRef = useRef<string | null>(projectDescription ?? null);
  const descriptionChangedRef = useRef<boolean>(false);
  const descriptionExpandedRef = useRef<boolean>(false);
  const dataColoringSelectionRef = useRef<DataColoring>(projectDataColoring ?? DataColoring.ALL);
  const parameterSelectionChangedRef = useRef<boolean>(false);
  const projectDesignsRef = useRef<Design[]>(projectDesigns ?? []); // store sorted designs
  const thumbnailSizeRef = useRef<number>(projectThumbnailWidth ?? 200);
  const xAxisRef = useRef<string>(
    xAxisNameScatterPlot ?? projectType === DesignProblem.BUILDING_DESIGN ? 'floorArea' : 'rowWidth',
  );
  const yAxisRef = useRef<string>(yAxisNameScatterPlot ?? 'rowWidth');
  const dotSizeRef = useRef<number>(dotSizeScatterPlot ?? 5);
  const scatterChartHorizontalLinesRef = useRef<boolean>(true);
  const scatterChartVerticalLinesRef = useRef<boolean>(true);
  const timePassed = useRef(0);

  const [pop, setPop] = useState(false);

  useEffect(() => {
    xAxisRef.current = xAxisNameScatterPlot ?? projectType === DesignProblem.BUILDING_DESIGN ? 'floorArea' : 'rowWidth';
  }, [xAxisNameScatterPlot, projectType]);

  useEffect(() => {
    yAxisRef.current = yAxisNameScatterPlot ?? projectType === DesignProblem.BUILDING_DESIGN ? 'floorArea' : 'rowWidth';
  }, [yAxisNameScatterPlot, projectType]);

  useEffect(() => {
    dotSizeRef.current = dotSizeScatterPlot ?? 5;
  }, [dotSizeScatterPlot]);

  useEffect(() => {
    thumbnailSizeRef.current = projectThumbnailWidth ?? 200;
  }, [projectThumbnailWidth]);

  const { t } = useTranslation();

  const lang = useLanguage();

  const isOwner = user.uid === projectOwner;

  useEffect(() => {
    projectDesignsRef.current = [];
    if (projectDesigns) {
      for (const design of projectDesigns) {
        projectDesignsRef.current.push(design);
      }
      const p = projectSelectedProperty;
      if (p) {
        const prefix = sortDescending ? 1 : -1;
        projectDesignsRef.current.sort((a, b) => {
          if (p) {
            // first handle special cases
            if (p === 'rowWidth' && 'rowsPerRack' in a && 'rowsPerRack' in b) {
              return prefix * (a['rowsPerRack'] - b['rowsPerRack']);
            }
            if (p === 'orientation') {
              return prefix * ((a[p] === 'Landscape' ? 0 : 1) - (b[p] === 'Landscape' ? 0 : 1));
            }
            if (p === 'totalYearlyYield' && 'yearlyYield' in a && 'yearlyYield' in b) {
              return prefix * (a['yearlyYield'] - b['yearlyYield']);
            }
            if (p === 'meanYearlyYield' && 'yearlyYield' in a && 'yearlyYield' in b) {
              return prefix * (a['yearlyYield'] / a['panelCount'] - b['yearlyYield'] / b['panelCount']);
            }
            if (p === 'totalYearlyCost') {
              return prefix * (Util.calculateCost(a) - Util.calculateCost(b));
            }
            if (p === 'yearlyProfit') {
              return prefix * (Util.calculateProfit(a) - Util.calculateProfit(b));
            }
            if (p in a && p in b) {
              return prefix * (a[p] - b[p]);
            }
            return 0;
          }
          return 0;
        });
      }
      setUpdateFlag(!updateFlag);
    }
  }, [projectDesigns, sortDescending, projectSelectedProperty]);

  useEffect(() => {
    setSelectedDesign(undefined);
    if (projectDesigns) {
      for (const design of projectDesigns) {
        if (design.title === cloudFile) {
          setSelectedDesign(design);
          break;
        }
      }
    }
  }, [cloudFile, projectDesigns]);

  useEffect(() => {
    const handleResize = () => {
      setUpdateFlag(!updateFlag);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateFlag]);

  const setAIMemory = (b: boolean) => {
    useStore.getState().set((state) => {
      state.projectState.independentPrompt = !b;
    });
  };

  const curateCurrentDesign = () => {
    usePrimitiveStore.getState().set((state) => {
      state.curateDesignToProjectFlag = true;
    });
    if (loggable) {
      setCommonStore((state) => {
        state.actionInfo = {
          name: 'Curate Current Design',
          timestamp: new Date().getTime(),
        };
      });
    }
  };

  const removeSelectedDesign = () => {
    if (user.uid && projectTitle && selectedDesign) {
      removeDesignFromProject(user.uid, projectTitle, selectedDesign).then(() => {
        // delete the local copy as well
        setCommonStore((state) => {
          if (state.projectState.designs) {
            let index = -1;
            for (const [i, e] of state.projectState.designs.entries()) {
              if (e.title === selectedDesign.title) {
                index = i;
                break;
              }
            }
            if (index >= 0) {
              state.projectState.designs.splice(index, 1);
              if (loggable) {
                state.actionInfo = {
                  name: 'Remove Selected Design',
                  timestamp: new Date().getTime(),
                  details: selectedDesign.title,
                };
              }
            }
          }
        });
      });
    }
  };

  const updateSelectedDesign = (callback?: () => void) => {
    if (canvas && user.uid && projectTitle && cloudFile) {
      updateDesign(user.uid, projectType, projectTitle, projectThumbnailWidth ?? 200, cloudFile, canvas).then(() => {
        if (callback) callback();
        setUpdateFlag(!updateFlag);
        if (loggable) {
          setCommonStore((state) => {
            state.actionInfo = {
              name: 'Update Selected Design',
              timestamp: new Date().getTime(),
              details: { design: cloudFile },
            };
          });
        }
      });
    }
  };

  const totalHeight = window.innerHeight;
  const imageColumns = Math.round(800 / thumbnailSizeRef.current);
  const imageGap = 48 / imageColumns;
  const imageWidth = Math.round((relativeWidth * window.innerWidth) / imageColumns - imageGap);

  const [variables, titles, units, digits, tickIntegers, types] = useMemo(
    () => [
      ProjectUtil.getVariables(projectType, hiddenParameters ?? []),
      ProjectUtil.getTitles(projectType, lang, hiddenParameters ?? []),
      ProjectUtil.getUnits(projectType, lang, hiddenParameters ?? []),
      ProjectUtil.getDigits(projectType, hiddenParameters ?? []),
      ProjectUtil.getTickIntegers(projectType, hiddenParameters ?? []),
      ProjectUtil.getTypes(projectType, hiddenParameters ?? []),
    ],
    [projectType, hiddenParameters, updateHiddenFlag, lang],
  );

  const data: DatumEntry[] = useMemo(() => {
    const data: DatumEntry[] = [];
    if (projectDesigns) {
      if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) {
        for (const design of projectDesigns) {
          const d = {} as DatumEntry;
          if (!hiddenParameters?.includes('rowWidth')) d['rowWidth'] = design.rowsPerRack;
          if (!hiddenParameters?.includes('tiltAngle')) d['tiltAngle'] = Util.toDegrees(design.tiltAngle);
          if (!hiddenParameters?.includes('interRowSpacing')) d['interRowSpacing'] = design.interRowSpacing;
          if (!hiddenParameters?.includes('latitude')) d['latitude'] = design.latitude ?? 42;
          if (!hiddenParameters?.includes('orientation'))
            d['orientation'] = design.orientation === Orientation.landscape ? 0 : 1;
          if (!hiddenParameters?.includes('poleHeight')) d['poleHeight'] = design.poleHeight;
          if (!hiddenParameters?.includes('unitCost')) d['unitCost'] = design.unitCost;
          if (!hiddenParameters?.includes('sellingPrice')) d['sellingPrice'] = design.sellingPrice;
          if (!hiddenParameters?.includes('')) d['totalYearlyCost'] = Util.calculateCost(design);
          if (!hiddenParameters?.includes('totalYearlyYield')) d['totalYearlyYield'] = design.yearlyYield * 0.001;
          if (!hiddenParameters?.includes('meanYearlyYield'))
            d['meanYearlyYield'] = design.yearlyYield / design.panelCount;
          if (!hiddenParameters?.includes('yearlyProfit')) d['yearlyProfit'] = Util.calculateProfit(design);
          d['group'] = projectDataColoring === DataColoring.INDIVIDUALS ? design.title : 'default';
          d['selected'] = selectedDesign === design;
          d['hovered'] = hoveredDesign === design;
          d['invisible'] = design.invisible;
          d['excluded'] = false;
          if (projectFilters) {
            for (const f of projectFilters) {
              if (f.type === FilterType.Between && f.upperBound !== undefined && f.lowerBound !== undefined) {
                const v = d[f.variable];
                if (typeof v === 'number') {
                  if (v > f.upperBound || v < f.lowerBound) {
                    d['excluded'] = true;
                    break;
                  }
                }
              }
            }
          }
          data.push(d);
        }
      } else if (projectType === DesignProblem.BUILDING_DESIGN) {
        for (const design of projectDesigns) {
          const d = {} as DatumEntry;
          if (!hiddenParameters?.includes('floorArea')) d['floorArea'] = design.floorArea;
          if (!hiddenParameters?.includes('volume')) d['volume'] = design.volume;
          if (!hiddenParameters?.includes('surfaceArea')) d['surfaceArea'] = design.surfaceArea;
          if (!hiddenParameters?.includes('windowToWallRatio')) d['windowToWallRatio'] = design.windowToWallRatio;
          if (!hiddenParameters?.includes('height')) d['height'] = design.height;
          if (!hiddenParameters?.includes('buildingOrientation')) d['buildingOrientation'] = design.buildingOrientation;
          if (!hiddenParameters?.includes('heating')) d['heating'] = design.heating;
          if (!hiddenParameters?.includes('cooling')) d['cooling'] = design.cooling;
          if (!hiddenParameters?.includes('solar')) d['solar'] = design.solar;
          if (!hiddenParameters?.includes('net')) d['net'] = design.net;
          d['group'] = projectDataColoring === DataColoring.INDIVIDUALS ? design.title : 'default';
          d['selected'] = selectedDesign === design;
          d['hovered'] = hoveredDesign === design;
          d['invisible'] = design.invisible;
          d['excluded'] = false;
          if (projectFilters) {
            for (const f of projectFilters) {
              if (f.type === FilterType.Between && f.upperBound !== undefined && f.lowerBound !== undefined) {
                const v = d[f.variable];
                if (typeof v === 'number') {
                  if (v > f.upperBound || v < f.lowerBound) {
                    d['excluded'] = true;
                    break;
                  }
                }
              }
            }
          }
          data.push(d);
        }
      }
    }
    return data;
  }, [
    projectDesigns,
    projectType,
    hoveredDesign,
    selectedDesign,
    economicsParams,
    hiddenParameters,
    projectDataColoring,
    projectFilters,
    updateHiddenFlag,
  ]);

  // must place this within useEffect to avoid "Cannot update a component while rendering a different component"
  // https://stackoverflow.com/questions/62336340/cannot-update-a-component-while-rendering-a-different-component-warning
  useEffect(() => {
    setCommonStore((state) => {
      if (state.projectState.designs) {
        for (const [i, design] of state.projectState.designs.entries()) {
          design.excluded = data[i].excluded;
        }
      }
    });
  }, [data]);

  const getMin = (variable: string, defaultValue: number) => {
    let min = defaultValue;
    if (projectRanges) {
      for (const r of projectRanges) {
        if (r.variable === variable) {
          min = r.minimum ?? defaultValue;
          break;
        }
      }
    }
    return min;
  };

  const getMax = (variable: string, defaultValue: number) => {
    let max = defaultValue;
    if (projectRanges) {
      for (const r of projectRanges) {
        if (r.variable === variable) {
          max = r.maximum ?? defaultValue;
          break;
        }
      }
    }
    return max;
  };

  const minima: number[] = useMemo(() => {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY && solarPanelArrayLayoutConstraints) {
      const array: number[] = [];
      if (!hiddenParameters?.includes('rowWidth'))
        array.push(getMin('rowWidth', solarPanelArrayLayoutConstraints.minimumRowsPerRack));
      if (!hiddenParameters?.includes('tiltAngle'))
        array.push(getMin('tiltAngle', Util.toDegrees(solarPanelArrayLayoutConstraints.minimumTiltAngle)));
      if (!hiddenParameters?.includes('interRowSpacing'))
        array.push(getMin('interRowSpacing', solarPanelArrayLayoutConstraints.minimumInterRowSpacing));
      if (!hiddenParameters?.includes('latitude')) array.push(getMin('latitude', -90));
      if (!hiddenParameters?.includes('orientation')) array.push(0);
      if (!hiddenParameters?.includes('poleHeight')) array.push(getMin('poleHeight', 0));
      if (!hiddenParameters?.includes('unitCost')) array.push(getMin('unitCost', 0.1));
      if (!hiddenParameters?.includes('sellingPrice')) array.push(getMin('sellingPrice', 0.1));
      if (!hiddenParameters?.includes('totalYearlyCost')) array.push(getMin('totalYearlyCost', 0));
      if (!hiddenParameters?.includes('totalYearlyYield')) array.push(getMin('totalYearlyYield', 0)); // electricity output in MWh
      if (!hiddenParameters?.includes('meanYearlyYield')) array.push(getMin('meanYearlyYield', 0)); // electricity output in kWh
      if (!hiddenParameters?.includes('yearlyProfit')) array.push(getMin('yearlyProfit', -10)); // profit in $1,000
      return array;
    } else if (projectType === DesignProblem.BUILDING_DESIGN) {
      const array: number[] = [];
      if (!hiddenParameters?.includes('floorArea')) array.push(getMin('floorArea', 0));
      if (!hiddenParameters?.includes('volume')) array.push(getMin('volume', 0));
      if (!hiddenParameters?.includes('surfaceArea')) array.push(getMin('surfaceArea', 0));
      if (!hiddenParameters?.includes('windowToWallRatio')) array.push(getMin('windowToWallRatio', 0));
      if (!hiddenParameters?.includes('height')) array.push(getMin('height', 0));
      if (!hiddenParameters?.includes('buildingOrientation')) array.push(getMin('buildingOrientation', -180));
      if (!hiddenParameters?.includes('heating')) array.push(getMin('heating', 0));
      if (!hiddenParameters?.includes('cooling')) array.push(getMin('cooling', 0));
      if (!hiddenParameters?.includes('solar')) array.push(getMin('solar', 0));
      if (!hiddenParameters?.includes('net')) array.push(getMin('net', 0));
      return array;
    }
    return [];
  }, [solarPanelArrayLayoutConstraints, projectType, projectRanges, hiddenParameters, updateHiddenFlag]);

  const maxima: number[] = useMemo(() => {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY && solarPanelArrayLayoutConstraints) {
      const array: number[] = [];
      if (!hiddenParameters?.includes('rowWidth'))
        array.push(getMax('rowWidth', solarPanelArrayLayoutConstraints.maximumRowsPerRack));
      if (!hiddenParameters?.includes('tiltAngle'))
        array.push(getMax('tiltAngle', Util.toDegrees(solarPanelArrayLayoutConstraints.maximumTiltAngle)));
      if (!hiddenParameters?.includes('interRowSpacing'))
        array.push(getMax('interRowSpacing', solarPanelArrayLayoutConstraints.maximumInterRowSpacing));
      if (!hiddenParameters?.includes('latitude')) array.push(getMax('latitude', 90));
      if (!hiddenParameters?.includes('orientation')) array.push(1);
      if (!hiddenParameters?.includes('poleHeight')) array.push(getMax('poleHeight', 5));
      if (!hiddenParameters?.includes('unitCost')) array.push(getMax('unitCost', 1));
      if (!hiddenParameters?.includes('sellingPrice')) array.push(getMax('sellingPrice', 0.5));
      if (!hiddenParameters?.includes('totalYearlyCost')) array.push(getMax('totalYearlyCost', 100));
      if (!hiddenParameters?.includes('totalYearlyYield')) array.push(getMax('totalYearlyYield', 100)); // electricity output in MWh
      if (!hiddenParameters?.includes('meanYearlyYield')) array.push(getMax('meanYearlyYield', 1000)); // electricity output in kWh
      if (!hiddenParameters?.includes('yearlyProfit')) array.push(getMax('yearlyProfit', 10)); // profit in $1,000
      return array;
    } else if (projectType === DesignProblem.BUILDING_DESIGN) {
      const array: number[] = [];
      // todo: genAI range max
      if (!hiddenParameters?.includes('floorArea')) array.push(getMax('floorArea', 500));
      if (!hiddenParameters?.includes('volume')) array.push(getMax('volume', 2000));
      if (!hiddenParameters?.includes('surfaceArea')) array.push(getMax('surfaceArea', 800));
      if (!hiddenParameters?.includes('windowToWallRatio')) array.push(getMax('windowToWallRatio', 1));
      if (!hiddenParameters?.includes('height')) array.push(getMax('height', 20));
      if (!hiddenParameters?.includes('buildingOrientation')) array.push(getMax('buildingOrientation', 180));
      if (!hiddenParameters?.includes('heating')) array.push(getMax('heating', 100000));
      if (!hiddenParameters?.includes('cooling')) array.push(getMax('cooling', 100000));
      if (!hiddenParameters?.includes('solar')) array.push(getMax('solar', 100000));
      if (!hiddenParameters?.includes('net')) array.push(getMax('net', 100000));
      return array;
    }
    return [];
  }, [solarPanelArrayLayoutConstraints, projectType, projectRanges, hiddenParameters, updateHiddenFlag]);

  const getFilterLowerBound = (variable: string, defaultValue: number) => {
    let lowerBound = defaultValue;
    if (projectFilters) {
      for (const f of projectFilters) {
        if (f.variable === variable) {
          lowerBound = f.lowerBound ?? defaultValue;
          break;
        }
      }
    }
    return lowerBound;
  };

  const getFilterUpperBound = (variable: string, defaultValue: number) => {
    let upperBound = defaultValue;
    if (projectFilters) {
      for (const f of projectFilters) {
        if (f.variable === variable) {
          upperBound = f.upperBound ?? defaultValue;
          break;
        }
      }
    }
    return upperBound;
  };

  const createFilter = (variable: string, defaultUpperBound: number, defaultLowerBound: number) => {
    return {
      variable,
      type: FilterType.Between,
      upperBound: getFilterUpperBound(variable, defaultUpperBound),
      lowerBound: getFilterLowerBound(variable, defaultLowerBound),
    } as Filter;
  };

  const filters: Filter[] = useMemo(() => {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) {
      const array: Filter[] = [];
      if (!hiddenParameters?.includes('rowWidth'))
        array.push(
          createFilter(
            'rowWidth',
            solarPanelArrayLayoutConstraints.maximumRowsPerRack,
            solarPanelArrayLayoutConstraints.minimumRowsPerRack,
          ),
        );
      if (!hiddenParameters?.includes('tiltAngle'))
        array.push(
          createFilter(
            'tiltAngle',
            Util.toDegrees(solarPanelArrayLayoutConstraints.maximumTiltAngle),
            Util.toDegrees(solarPanelArrayLayoutConstraints.minimumTiltAngle),
          ),
        );
      if (!hiddenParameters?.includes('interRowSpacing'))
        array.push(
          createFilter(
            'interRowSpacing',
            solarPanelArrayLayoutConstraints.maximumInterRowSpacing,
            solarPanelArrayLayoutConstraints.minimumInterRowSpacing,
          ),
        );
      if (!hiddenParameters?.includes('latitude')) array.push(createFilter('latitude', 90, -90));
      if (!hiddenParameters?.includes('orientation')) array.push(createFilter('orientation', 1, 0));
      if (!hiddenParameters?.includes('poleHeight')) array.push(createFilter('poleHeight', 5, 0));
      if (!hiddenParameters?.includes('unitCost')) array.push(createFilter('unitCost', 1, 0.1));
      if (!hiddenParameters?.includes('sellingPrice')) array.push(createFilter('sellingPrice', 0.5, 0.1));
      if (!hiddenParameters?.includes('totalYearlyCost')) array.push(createFilter('totalYearlyCost', 100, 0));
      if (!hiddenParameters?.includes('totalYearlyYield')) array.push(createFilter('totalYearlyYield', 100, 0));
      if (!hiddenParameters?.includes('meanYearlyYield')) array.push(createFilter('meanYearlyYield', 1000, 0));
      if (!hiddenParameters?.includes('yearlyProfit')) array.push(createFilter('yearlyProfit', 10, -10));
      return array;
    } else if (projectType === DesignProblem.BUILDING_DESIGN) {
      // todo: genAI range filter
      const array: Filter[] = [];
      if (!hiddenParameters?.includes('floorArea')) array.push(createFilter('floorArea', 500, 0));
      if (!hiddenParameters?.includes('volume')) array.push(createFilter('volume', 1000, 0));
      if (!hiddenParameters?.includes('surfaceArea')) array.push(createFilter('surfaceArea', 800, 0));
      if (!hiddenParameters?.includes('windowToWallRatio')) array.push(createFilter('windowToWallRatio', 1, 0));
      if (!hiddenParameters?.includes('height')) array.push(createFilter('height', 15, 0));
      if (!hiddenParameters?.includes('buildingOrientation'))
        array.push(createFilter('buildingOrientation', 180, -180));
      if (!hiddenParameters?.includes('heating')) array.push(createFilter('heating', 100000, 0));
      if (!hiddenParameters?.includes('cooling')) array.push(createFilter('cooling', 100000, 0));
      if (!hiddenParameters?.includes('solar')) array.push(createFilter('solar', 100000, 0));
      if (!hiddenParameters?.includes('net')) array.push(createFilter('net', 100000, 0));
      return array;
    }
    return [];
  }, [updateHiddenFlag, projectFilters, hiddenParameters, projectType]);

  const steps: number[] = useMemo(() => {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY && solarPanelArrayLayoutConstraints) {
      const array: number[] = [];
      if (!hiddenParameters?.includes('rowWidth')) array.push(1);
      if (!hiddenParameters?.includes('tiltAngle')) array.push(0.1);
      if (!hiddenParameters?.includes('interRowSpacing')) array.push(0.1);
      if (!hiddenParameters?.includes('latitude')) array.push(0.1);
      if (!hiddenParameters?.includes('orientation')) array.push(1);
      if (!hiddenParameters?.includes('poleHeight')) array.push(0.1);
      if (!hiddenParameters?.includes('unitCost')) array.push(0.01);
      if (!hiddenParameters?.includes('sellingPrice')) array.push(0.01);
      if (!hiddenParameters?.includes('totalYearlyCost')) array.push(0.1); // cost in $1,000
      if (!hiddenParameters?.includes('totalYearlyYield')) array.push(1); // electricity output in MWh
      if (!hiddenParameters?.includes('meanYearlyYield')) array.push(1); // electricity output in kWh
      if (!hiddenParameters?.includes('yearlyProfit')) array.push(0.1); // profit in $1,000
      return array;
    } else if (projectType === DesignProblem.BUILDING_DESIGN) {
      const array: number[] = [];
      if (!hiddenParameters?.includes('floorArea')) array.push(1);
      if (!hiddenParameters?.includes('volume')) array.push(1);
      if (!hiddenParameters?.includes('surfaceArea')) array.push(1);
      if (!hiddenParameters?.includes('windowToWallRatio')) array.push(0.1);
      if (!hiddenParameters?.includes('height')) array.push(1);
      if (!hiddenParameters?.includes('buildingOrientation')) array.push(1);
      if (!hiddenParameters?.includes('heating')) array.push(100);
      if (!hiddenParameters?.includes('cooling')) array.push(100);
      if (!hiddenParameters?.includes('solar')) array.push(100);
      if (!hiddenParameters?.includes('net')) array.push(100);
      return array;
    }
    return [];
  }, [projectType, hiddenParameters, updateHiddenFlag]);

  const floorAreaRef = useRef<boolean>(!hiddenParameters?.includes('floorArea'));
  const volumeRef = useRef<boolean>(!hiddenParameters?.includes('volume'));
  const surfaceAreaRef = useRef<boolean>(!hiddenParameters?.includes('surfaceArea'));
  const windowToWallRatioRef = useRef<boolean>(!hiddenParameters?.includes('windowToWallRatio'));
  const heightRef = useRef<boolean>(!hiddenParameters?.includes('height'));
  const buildingOrientationRef = useRef<boolean>(!hiddenParameters?.includes('buildingOrientation'));
  const heatingRef = useRef<boolean>(!hiddenParameters?.includes('heating'));
  const coolingRef = useRef<boolean>(!hiddenParameters?.includes('cooling'));
  const solarRef = useRef<boolean>(!hiddenParameters?.includes('solar'));
  const netRef = useRef<boolean>(!hiddenParameters?.includes('net'));

  const rowWidthSelectionRef = useRef<boolean>(!hiddenParameters?.includes('rowWidth'));
  const tiltAngleSelectionRef = useRef<boolean>(!hiddenParameters?.includes('tiltAngle'));
  const rowSpacingSelectionRef = useRef<boolean>(!hiddenParameters?.includes('interRowSpacing'));
  const latitudeSelectionRef = useRef<boolean>(!hiddenParameters?.includes('latitude'));
  const orientationSelectionRef = useRef<boolean>(!hiddenParameters?.includes('orientation'));
  const poleHeightSelectionRef = useRef<boolean>(!hiddenParameters?.includes('poleHeight'));
  const unitCostSelectionRef = useRef<boolean>(!hiddenParameters?.includes('unitCost'));
  const sellingPriceSelectionRef = useRef<boolean>(!hiddenParameters?.includes('sellingPrice'));
  const costSelectionRef = useRef<boolean>(!hiddenParameters?.includes('totalYearlyCost'));
  const totalYieldSelectionRef = useRef<boolean>(!hiddenParameters?.includes('totalYearlyYield'));
  const meanYieldSelectionRef = useRef<boolean>(!hiddenParameters?.includes('meanYearlyYield'));
  const profitSelectionRef = useRef<boolean>(!hiddenParameters?.includes('yearlyProfit'));

  useEffect(() => {
    floorAreaRef.current = !hiddenParameters?.includes('floorArea');
    volumeRef.current = !hiddenParameters?.includes('volume');
    surfaceAreaRef.current = !hiddenParameters?.includes('surfaceArea');
    windowToWallRatioRef.current = !hiddenParameters?.includes('windowToWallRatio');
    heightRef.current = !hiddenParameters?.includes('height');
    buildingOrientationRef.current = !hiddenParameters?.includes('buildingOrientation');
    heatingRef.current = !hiddenParameters?.includes('heating');
    coolingRef.current = !hiddenParameters?.includes('cooling');
    solarRef.current = !hiddenParameters?.includes('solar');
    netRef.current = !hiddenParameters?.includes('net');

    rowWidthSelectionRef.current = !hiddenParameters?.includes('rowWidth');
    tiltAngleSelectionRef.current = !hiddenParameters?.includes('tiltAngle');
    rowSpacingSelectionRef.current = !hiddenParameters?.includes('interRowSpacing');
    latitudeSelectionRef.current = !hiddenParameters?.includes('latitude');
    orientationSelectionRef.current = !hiddenParameters?.includes('orientation');
    poleHeightSelectionRef.current = !hiddenParameters?.includes('poleHeight');
    unitCostSelectionRef.current = !hiddenParameters?.includes('unitCost');
    sellingPriceSelectionRef.current = !hiddenParameters?.includes('sellingPrice');
    costSelectionRef.current = !hiddenParameters?.includes('totalYearlyCost');
    totalYieldSelectionRef.current = !hiddenParameters?.includes('totalYearlyYield');
    meanYieldSelectionRef.current = !hiddenParameters?.includes('meanYearlyYield');
    profitSelectionRef.current = !hiddenParameters?.includes('yearlyProfit');
    setUpdateFlag(!updateFlag);
  }, [hiddenParameters]);

  useEffect(() => {
    descriptionRef.current = projectDescription;
  }, [projectDescription]);

  const hover = (i: number) => {
    if (projectDesigns) {
      if (i >= 0 && i < projectDesigns.length) {
        setHoveredDesign(projectDesigns[i]);
      } else {
        setHoveredDesign(undefined);
      }
    }
  };

  // toggle design visibility

  const localToggleDesignVisibility = (title: string) => {
    setCommonStore((state) => {
      if (state.projectState.designs) {
        for (const d of state.projectState.designs) {
          if (d.title === title) {
            d.invisible = !d.invisible;
            break;
          }
        }
      }
    });
  };

  const toggleDesignVisibilitySync = (design: Design) => {
    if (isOwner) {
      if (user.uid && projectTitle) {
        updateDesignVisibility(user.uid, projectTitle, design).then(() => {
          localToggleDesignVisibility(design.title);
        });
      }
    } else {
      localToggleDesignVisibility(design.title);
    }
  };

  const toggleDesignVisibility = (design: Design) => {
    const undoableSelect = {
      name: 'Select Design Visibility',
      timestamp: Date.now(),
      checked: !!design.invisible,
      property: design.title,
      undo: () => {
        toggleDesignVisibilitySync(design);
      },
      redo: () => {
        toggleDesignVisibilitySync(design);
      },
    } as UndoableCheck;
    addUndoable(undoableSelect);
    toggleDesignVisibilitySync(design);
  };

  // select parameter

  const selectParameterSync = (selected: boolean, parameter: string) => {
    parameterSelectionChangedRef.current = true;
    if (isOwner) {
      if (user.uid && projectTitle) {
        updateHiddenParameters(user.uid, projectTitle, parameter, !selected).then(() => {
          ProjectUtil.localSelectParameter(selected, parameter);
        });
      }
    } else {
      ProjectUtil.localSelectParameter(selected, parameter);
    }
  };

  const selectParameter = (selected: boolean, parameter: string) => {
    const undoableSelect = {
      name: 'Select Parameter',
      timestamp: Date.now(),
      checked: selected,
      property: parameter,
      undo: () => {
        selectParameterSync(!selected, parameter);
      },
      redo: () => {
        selectParameterSync(selected, parameter);
      },
    } as UndoableCheck;
    addUndoable(undoableSelect);
    selectParameterSync(selected, parameter);
  };

  // select data coloring

  const localSelectDataColoring = () => {
    setCommonStore((state) => {
      state.projectState.dataColoring = dataColoringSelectionRef.current;
    });
    usePrimitiveStore.getState().set((state) => {
      state.updateProjectsFlag = true;
    });
    setUpdateFlag(!updateFlag);
  };

  const selectDataColoringSync = (value: DataColoring) => {
    dataColoringSelectionRef.current = value;
    if (isOwner) {
      if (user.uid && projectTitle) {
        updateDataColoring(user.uid, projectTitle, dataColoringSelectionRef.current).then(() => {
          localSelectDataColoring();
        });
      }
    } else {
      localSelectDataColoring();
    }
  };

  const selectDataColoring = (value: DataColoring) => {
    const undoableChange = {
      name: 'Select Data Coloring',
      timestamp: Date.now(),
      oldValue: projectDataColoring,
      newValue: value,
      undo: () => {
        selectDataColoringSync(projectDataColoring);
      },
      redo: () => {
        selectDataColoringSync(value);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    selectDataColoringSync(value);
  };

  const createChooseSolutionSpaceContent = () => {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) {
      return (
        <div>
          <Checkbox
            style={{ width: '100%' }}
            onChange={(e) => {
              rowWidthSelectionRef.current = e.target.checked;
              selectParameter(rowWidthSelectionRef.current, 'rowWidth');
              setUpdateHiddenFlag(!updateHiddenFlag);
            }}
            checked={rowWidthSelectionRef.current}
          >
            <span style={{ fontSize: '12px' }}>{t('polygonMenu.SolarPanelArrayRowWidth', lang)}</span>
          </Checkbox>
          <br />
          <Checkbox
            style={{ width: '100%' }}
            onChange={(e) => {
              tiltAngleSelectionRef.current = e.target.checked;
              selectParameter(tiltAngleSelectionRef.current, 'tiltAngle');
              setUpdateHiddenFlag(!updateHiddenFlag);
            }}
            checked={tiltAngleSelectionRef.current}
          >
            <span style={{ fontSize: '12px' }}>{t('polygonMenu.SolarPanelArrayTiltAngle', lang)}</span>
          </Checkbox>
          <br />
          <Checkbox
            style={{ width: '100%' }}
            onChange={(e) => {
              rowSpacingSelectionRef.current = e.target.checked;
              selectParameter(rowSpacingSelectionRef.current, 'interRowSpacing');
              setUpdateHiddenFlag(!updateHiddenFlag);
            }}
            checked={rowSpacingSelectionRef.current}
          >
            <span style={{ fontSize: '12px' }}>{t('polygonMenu.SolarPanelArrayRowSpacing', lang)}</span>
          </Checkbox>
          <br />
          <Checkbox
            style={{ width: '100%' }}
            onChange={(e) => {
              latitudeSelectionRef.current = e.target.checked;
              selectParameter(latitudeSelectionRef.current, 'latitude');
              setUpdateHiddenFlag(!updateHiddenFlag);
            }}
            checked={latitudeSelectionRef.current}
          >
            <span style={{ fontSize: '12px' }}>{t('word.Latitude', lang)}</span>
          </Checkbox>
          <br />
          <Checkbox
            style={{ width: '100%' }}
            onChange={(e) => {
              orientationSelectionRef.current = e.target.checked;
              selectParameter(orientationSelectionRef.current, 'orientation');
              setUpdateHiddenFlag(!updateHiddenFlag);
            }}
            checked={orientationSelectionRef.current}
          >
            <span style={{ fontSize: '12px' }}>{t('polygonMenu.SolarPanelArrayOrientation', lang)}</span>
          </Checkbox>
          <br />
          <Checkbox
            style={{ width: '100%' }}
            onChange={(e) => {
              poleHeightSelectionRef.current = e.target.checked;
              selectParameter(poleHeightSelectionRef.current, 'poleHeight');
              setUpdateHiddenFlag(!updateHiddenFlag);
            }}
            checked={poleHeightSelectionRef.current}
          >
            <span style={{ fontSize: '12px' }}>{t('polygonMenu.SolarPanelArrayPoleHeight', lang)}</span>
          </Checkbox>
          <br />
          <Checkbox
            style={{ width: '100%' }}
            onChange={(e) => {
              unitCostSelectionRef.current = e.target.checked;
              selectParameter(unitCostSelectionRef.current, 'unitCost');
              setUpdateHiddenFlag(!updateHiddenFlag);
            }}
            checked={unitCostSelectionRef.current}
          >
            <span style={{ fontSize: '12px' }}>{t('economicsPanel.UnitCost', lang)}</span>
          </Checkbox>
          <br />
          <Checkbox
            style={{ width: '100%' }}
            onChange={(e) => {
              sellingPriceSelectionRef.current = e.target.checked;
              selectParameter(sellingPriceSelectionRef.current, 'sellingPrice');
              setUpdateHiddenFlag(!updateHiddenFlag);
            }}
            checked={sellingPriceSelectionRef.current}
          >
            <span style={{ fontSize: '12px' }}>{t('economicsPanel.SellingPrice', lang)}</span>
          </Checkbox>
          <br />
          <Checkbox
            style={{ width: '100%' }}
            onChange={(e) => {
              costSelectionRef.current = e.target.checked;
              selectParameter(costSelectionRef.current, 'totalYearlyCost');
              setUpdateHiddenFlag(!updateHiddenFlag);
            }}
            checked={costSelectionRef.current}
          >
            <span style={{ fontSize: '12px' }}>{t('polygonMenu.SolarPanelArrayTotalYearlyCost', lang)}</span>
          </Checkbox>
          <br />
          <Checkbox
            style={{ width: '100%' }}
            onChange={(e) => {
              totalYieldSelectionRef.current = e.target.checked;
              selectParameter(totalYieldSelectionRef.current, 'totalYearlyYield');
              setUpdateHiddenFlag(!updateHiddenFlag);
            }}
            checked={totalYieldSelectionRef.current}
          >
            <span style={{ fontSize: '12px' }}>{t('polygonMenu.SolarPanelArrayTotalYearlyYield', lang)}</span>
          </Checkbox>
          <br />
          <Checkbox
            style={{ width: '100%' }}
            onChange={(e) => {
              meanYieldSelectionRef.current = e.target.checked;
              selectParameter(meanYieldSelectionRef.current, 'meanYearlyYield');
              setUpdateHiddenFlag(!updateHiddenFlag);
            }}
            checked={meanYieldSelectionRef.current}
          >
            <span style={{ fontSize: '12px' }}>{t('polygonMenu.SolarPanelArrayMeanYearlyYield', lang)}</span>
          </Checkbox>
          <br />
          <Checkbox
            style={{ width: '100%' }}
            onChange={(e) => {
              profitSelectionRef.current = e.target.checked;
              selectParameter(profitSelectionRef.current, 'yearlyProfit');
              setUpdateHiddenFlag(!updateHiddenFlag);
            }}
            checked={profitSelectionRef.current}
          >
            <span style={{ fontSize: '12px' }}>{t('polygonMenu.SolarPanelArrayYearlyProfit', lang)}</span>
          </Checkbox>
        </div>
      );
    }
    if (projectType === DesignProblem.BUILDING_DESIGN) {
      return (
        <div>
          <Checkbox
            style={{ width: '100%' }}
            onChange={(e) => {
              floorAreaRef.current = e.target.checked;
              selectParameter(floorAreaRef.current, 'floorArea');
              setUpdateHiddenFlag(!updateHiddenFlag);
            }}
            checked={floorAreaRef.current}
          >
            <span style={{ fontSize: '12px' }}>{t('solutionSpace.FloorArea', lang)}</span>
          </Checkbox>
          <br />

          <Checkbox
            style={{ width: '100%' }}
            onChange={(e) => {
              volumeRef.current = e.target.checked;
              selectParameter(volumeRef.current, 'volume');
              setUpdateHiddenFlag(!updateHiddenFlag);
            }}
            checked={volumeRef.current}
          >
            <span style={{ fontSize: '12px' }}>{t('solutionSpace.Volume', lang)}</span>
          </Checkbox>
          <br />

          <Checkbox
            style={{ width: '100%' }}
            onChange={(e) => {
              surfaceAreaRef.current = e.target.checked;
              selectParameter(surfaceAreaRef.current, 'surfaceArea');
              setUpdateHiddenFlag(!updateHiddenFlag);
            }}
            checked={surfaceAreaRef.current}
          >
            <span style={{ fontSize: '12px' }}>{t('solutionSpace.SurfaceArea', lang)}</span>
          </Checkbox>
          <br />

          <Checkbox
            style={{ width: '100%' }}
            onChange={(e) => {
              windowToWallRatioRef.current = e.target.checked;
              selectParameter(windowToWallRatioRef.current, 'windowToWallRatio');
              setUpdateHiddenFlag(!updateHiddenFlag);
            }}
            checked={windowToWallRatioRef.current}
          >
            <span style={{ fontSize: '12px' }}>{t('solutionSpace.WindowToWallRatio', lang)}</span>
          </Checkbox>
          <br />

          <Checkbox
            style={{ width: '100%' }}
            onChange={(e) => {
              heightRef.current = e.target.checked;
              selectParameter(heightRef.current, 'height');
              setUpdateHiddenFlag(!updateHiddenFlag);
            }}
            checked={heightRef.current}
          >
            <span style={{ fontSize: '12px' }}>{t('word.Height', lang)}</span>
          </Checkbox>
          <br />

          <Checkbox
            style={{ width: '100%' }}
            onChange={(e) => {
              buildingOrientationRef.current = e.target.checked;
              selectParameter(buildingOrientationRef.current, 'buildingOrientation');
              setUpdateHiddenFlag(!updateHiddenFlag);
            }}
            checked={buildingOrientationRef.current}
          >
            <span style={{ fontSize: '12px' }}>{t('solutionSpace.BuildingOrientation', lang)}</span>
          </Checkbox>
          <br />

          <Checkbox
            style={{ width: '100%' }}
            onChange={(e) => {
              heatingRef.current = e.target.checked;
              selectParameter(heatingRef.current, 'heating');
              setUpdateHiddenFlag(!updateHiddenFlag);
            }}
            checked={heatingRef.current}
          >
            <span style={{ fontSize: '12px' }}>{t('solutionSpace.Heating', lang)}</span>
          </Checkbox>
          <br />

          <Checkbox
            style={{ width: '100%' }}
            onChange={(e) => {
              coolingRef.current = e.target.checked;
              selectParameter(coolingRef.current, 'cooling');
              setUpdateHiddenFlag(!updateHiddenFlag);
            }}
            checked={coolingRef.current}
          >
            <span style={{ fontSize: '12px' }}>{t('solutionSpace.Cooling', lang)}</span>
          </Checkbox>
          <br />

          <Checkbox
            style={{ width: '100%' }}
            onChange={(e) => {
              solarRef.current = e.target.checked;
              selectParameter(solarRef.current, 'solar');
              setUpdateHiddenFlag(!updateHiddenFlag);
            }}
            checked={solarRef.current}
          >
            <span style={{ fontSize: '12px' }}>{t('solutionSpace.Solar', lang)}</span>
          </Checkbox>
          <br />

          <Checkbox
            style={{ width: '100%' }}
            onChange={(e) => {
              netRef.current = e.target.checked;
              selectParameter(netRef.current, 'net');
              setUpdateHiddenFlag(!updateHiddenFlag);
            }}
            checked={netRef.current}
          >
            <span style={{ fontSize: '12px' }}>{t('solutionSpace.Net', lang)}</span>
          </Checkbox>
          <br />
        </div>
      );
    }
  };

  const createAxisOptions = () => {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) {
      return (
        <>
          <Option key={'rowWidth'} value={'rowWidth'}>
            <span style={{ fontSize: '12px' }}>{t('polygonMenu.SolarPanelArrayRowWidth', lang)}</span>
          </Option>
          <Option key={'tiltAngle'} value={'tiltAngle'}>
            <span style={{ fontSize: '12px' }}>{t('polygonMenu.SolarPanelArrayTiltAngle', lang)}</span>
          </Option>
          <Option key={'interRowSpacing'} value={'interRowSpacing'}>
            <span style={{ fontSize: '12px' }}>{t('polygonMenu.SolarPanelArrayRowSpacing', lang)}</span>
          </Option>
          <Option key={'latitude'} value={'latitude'}>
            <span style={{ fontSize: '12px' }}>{t('word.Latitude', lang)}</span>
          </Option>
          <Option key={'orientation'} value={'orientation'}>
            <span style={{ fontSize: '12px' }}>{t('polygonMenu.SolarPanelArrayOrientation', lang)}</span>
          </Option>
          <Option key={'poleHeight'} value={'poleHeight'}>
            <span style={{ fontSize: '12px' }}>{t('polygonMenu.SolarPanelArrayPoleHeight', lang)}</span>
          </Option>
          <Option key={'unitCost'} value={'unitCost'}>
            <span style={{ fontSize: '12px' }}>{t('economicsPanel.UnitCost', lang)}</span>
          </Option>
          <Option key={'sellingPrice'} value={'sellingPrice'}>
            <span style={{ fontSize: '12px' }}>{t('economicsPanel.SellingPrice', lang)}</span>
          </Option>
          <Option key={'totalYearlyCost'} value={'totalYearlyCost'}>
            <span style={{ fontSize: '12px' }}>{t('polygonMenu.SolarPanelArrayTotalYearlyCost', lang)}</span>
          </Option>
          <Option key={'totalYearlyYield'} value={'totalYearlyYield'}>
            <span style={{ fontSize: '12px' }}>{t('polygonMenu.SolarPanelArrayTotalYearlyYield', lang)}</span>
          </Option>
          <Option key={'meanYearlyYield'} value={'meanYearlyYield'}>
            <span style={{ fontSize: '12px' }}>{t('polygonMenu.SolarPanelArrayMeanYearlyYield', lang)}</span>
          </Option>
          <Option key={'yearlyProfit'} value={'yearlyProfit'}>
            <span style={{ fontSize: '12px' }}>{t('polygonMenu.SolarPanelArrayYearlyProfit', lang)}</span>
          </Option>
        </>
      );
    }
    if (projectType === DesignProblem.BUILDING_DESIGN) {
      return (
        <>
          <Option key={'floorArea'} value={'floorArea'}>
            <span style={{ fontSize: '12px' }}>{t('solutionSpace.FloorArea', lang)}</span>
          </Option>
          <Option key={'volume'} value={'volume'}>
            <span style={{ fontSize: '12px' }}>{t('solutionSpace.Volume', lang)}</span>
          </Option>
          <Option key={'surfaceArea'} value={'surfaceArea'}>
            <span style={{ fontSize: '12px' }}>{t('solutionSpace.SurfaceArea', lang)}</span>
          </Option>
          <Option key={'windowToWallRatio'} value={'windowToWallRatio'}>
            <span style={{ fontSize: '12px' }}>{t('solutionSpace.WindowToWallRatio', lang)}</span>
          </Option>
          <Option key={'height'} value={'height'}>
            <span style={{ fontSize: '12px' }}>{t('word.Height', lang)}</span>
          </Option>
          <Option key={'buildingOrientation'} value={'buildingOrientation'}>
            <span style={{ fontSize: '12px' }}>{t('solutionSpace.BuildingOrientation', lang)}</span>
          </Option>
          <Option key={'heating'} value={'heating'}>
            <span style={{ fontSize: '12px' }}>{t('solutionSpace.Heating', lang)}</span>
          </Option>
          <Option key={'cooling'} value={'cooling'}>
            <span style={{ fontSize: '12px' }}>{t('solutionSpace.Cooling', lang)}</span>
          </Option>
          <Option key={'solar'} value={'solar'}>
            <span style={{ fontSize: '12px' }}>{t('solutionSpace.Solar', lang)}</span>
          </Option>
          <Option key={'net'} value={'net'}>
            <span style={{ fontSize: '12px' }}>{t('solutionSpace.Net', lang)}</span>
          </Option>
        </>
      );
    }
  };

  const scatterData = useMemo(() => {
    const data: { x: number; y: number }[] = [];
    if (projectDesigns) {
      if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) {
        for (const design of projectDesigns) {
          if (design.invisible || design === selectedDesign) continue;
          const d = {} as { x: number; y: number };
          ProjectUtil.setScatterData(xAxisRef.current, 'x', d, design);
          ProjectUtil.setScatterData(yAxisRef.current, 'y', d, design);
          data.push(d);
        }
      } else if (projectType === DesignProblem.BUILDING_DESIGN) {
        for (const design of projectDesigns) {
          if (design.invisible || design === selectedDesign) continue;
          const d = {} as { x: number; y: number };
          ProjectUtil.setScatterData(xAxisRef.current, 'x', d, design);
          ProjectUtil.setScatterData(yAxisRef.current, 'y', d, design);
          data.push(d);
        }
      }
    }
    return data;
  }, [xAxisRef.current, yAxisRef.current, projectDesigns, projectType, selectedDesign]);

  const selectedData = useMemo(() => {
    const data: { x: number; y: number }[] = [];
    if (projectDesigns) {
      if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) {
        for (const design of projectDesigns) {
          if (design !== selectedDesign) continue;
          const d = {} as { x: number; y: number };
          ProjectUtil.setScatterData(xAxisRef.current, 'x', d, design);
          ProjectUtil.setScatterData(yAxisRef.current, 'y', d, design);
          data.push(d);
        }
      } else if (projectType === DesignProblem.BUILDING_DESIGN) {
        for (const design of projectDesigns) {
          if (design !== selectedDesign) continue;
          const d = {} as { x: number; y: number };
          ProjectUtil.setScatterData(xAxisRef.current, 'x', d, design);
          ProjectUtil.setScatterData(yAxisRef.current, 'y', d, design);
          data.push(d);
        }
      }
    }
    return data;
  }, [xAxisRef.current, yAxisRef.current, projectDesigns, projectType, selectedDesign]);

  const getBound = (axisName: string) => {
    const bound: { min: number; max: number } = { min: 0, max: 1 };
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY && solarPanelArrayLayoutConstraints) {
      switch (axisName) {
        case 'rowWidth':
          bound.min = getMin('rowWidth', solarPanelArrayLayoutConstraints.minimumRowsPerRack);
          bound.max = getMax('rowWidth', solarPanelArrayLayoutConstraints.maximumRowsPerRack);
          break;
        case 'tiltAngle':
          bound.min = getMin('tiltAngle', Util.toDegrees(solarPanelArrayLayoutConstraints.minimumTiltAngle));
          bound.max = getMax('tiltAngle', Util.toDegrees(solarPanelArrayLayoutConstraints.maximumTiltAngle));
          break;
        case 'interRowSpacing':
          bound.min = getMin('interRowSpacing', solarPanelArrayLayoutConstraints.minimumInterRowSpacing);
          bound.max = getMax('interRowSpacing', solarPanelArrayLayoutConstraints.maximumInterRowSpacing);
          break;
        case 'latitude':
          bound.min = getMin('latitude', -90);
          bound.max = getMax('latitude', 90);
          break;
        case 'orientation':
          bound.min = 0;
          bound.max = 1;
          break;
        case 'poleHeight':
          bound.min = getMin('poleHeight', 0);
          bound.max = getMax('poleHeight', 5);
          break;
        case 'unitCost':
          bound.min = getMin('unitCost', 0.1);
          bound.max = getMax('unitCost', 1);
          break;
        case 'sellingPrice':
          bound.min = getMin('sellingPrice', 0.1);
          bound.max = getMax('sellingPrice', 0.5);
          break;
        case 'totalYearlyCost':
          bound.min = getMin('totalYearlyCost', 0);
          bound.max = getMax('totalYearlyCost', 100);
          break;
        case 'totalYearlyYield':
          bound.min = getMin('totalYearlyYield', 0);
          bound.max = getMax('totalYearlyYield', 100);
          break;
        case 'meanYearlyYield':
          bound.min = getMin('meanYearlyYield', 0);
          bound.max = getMax('meanYearlyYield', 1000);
          break;
        case 'yearlyProfit':
          bound.min = getMin('yearlyProfit', -10);
          bound.max = getMax('yearlyProfit', 10);
          break;
      }
    } else if (projectType === DesignProblem.BUILDING_DESIGN) {
      // todo: genAI range scatter plot
      switch (axisName) {
        case 'floorArea':
          bound.min = getMin('floorArea', 0);
          bound.max = getMax('floorArea', 500);
          break;
        case 'volume':
          bound.min = getMin('volume', 0);
          bound.max = getMax('volume', 2000);
          break;
        case 'surfaceArea':
          bound.min = getMin('surfaceArea', 0);
          bound.max = getMax('surfaceArea', 800);
          break;
        case 'windowToWallRatio':
          bound.min = getMin('windowToWallRatio', 0);
          bound.max = getMax('windowToWallRatio', 1);
          break;
        case 'height':
          bound.min = getMin('height', 0);
          bound.max = getMax('height', 20);
          break;
        case 'buildingOrientation':
          bound.min = getMin('buildingOrientation', -180);
          bound.max = getMax('buildingOrientation', 180);
          break;
      }
    }

    return bound;
  };

  const xMinMax = useMemo(() => {
    return getBound(xAxisRef.current);
  }, [xAxisRef.current, projectRanges]);

  const yMinMax = useMemo(() => {
    return getBound(yAxisRef.current);
  }, [yAxisRef.current, projectRanges]);

  const xUnit = useMemo(() => {
    return ProjectUtil.getUnit(xAxisRef.current, lang);
  }, [xAxisRef.current, lang]);

  const yUnit = useMemo(() => {
    return ProjectUtil.getUnit(yAxisRef.current, lang);
  }, [yAxisRef.current, lang]);

  const changeXAxis = (newValue: string) => {
    const oldValue = xAxisRef.current;
    const undoableChange = {
      name: 'Change X Axis',
      timestamp: Date.now(),
      oldValue,
      newValue,
      undo: () => {
        selectXAxis(oldValue);
      },
      redo: () => {
        selectXAxis(newValue);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    selectXAxis(newValue);
  };

  const selectXAxis = (value: string) => {
    xAxisRef.current = value;
    if (isOwner && user.uid && projectTitle) {
      updateXAxisNameScatterPlot(user.uid, projectTitle, value).then(() => {
        //ignore
      });
    }
    setUpdateFlag(!updateFlag);
  };

  const changeYAxis = (newValue: string) => {
    const oldValue = yAxisRef.current;
    const undoableChange = {
      name: 'Change Y Axis',
      timestamp: Date.now(),
      oldValue,
      newValue,
      undo: () => {
        selectYAxis(oldValue);
      },
      redo: () => {
        selectYAxis(newValue);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    selectYAxis(newValue);
  };

  const selectYAxis = (value: string) => {
    yAxisRef.current = value;
    if (isOwner && user.uid && projectTitle) {
      updateYAxisNameScatterPlot(user.uid, projectTitle, value).then(() => {
        //ignore
      });
    }
    setUpdateFlag(!updateFlag);
  };

  const createScatterPlotContent = () => {
    return (
      <div style={{ width: '280px' }}>
        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col span={8} style={{ paddingTop: '5px' }}>
            <span style={{ fontSize: '12px' }}>{t('projectPanel.SelectXAxis', lang)}: </span>
          </Col>
          <Col span={16}>
            <Select style={{ width: '100%' }} value={xAxisRef.current} onChange={(value) => changeXAxis(value)}>
              {createAxisOptions()}
            </Select>
          </Col>
        </Row>
        <Row gutter={6} style={{ paddingBottom: '8px' }}>
          <Col span={8} style={{ paddingTop: '5px' }}>
            <span style={{ fontSize: '12px' }}>{t('projectPanel.SelectYAxis', lang)}: </span>
          </Col>
          <Col span={16}>
            <Select style={{ width: '100%' }} value={yAxisRef.current} onChange={(value) => changeYAxis(value)}>
              {createAxisOptions()}
            </Select>
          </Col>
        </Row>
        <Row style={{ paddingBottom: '8px' }}>
          <div>
            <ScatterChart
              id={'scatter-chart'}
              width={280}
              height={240}
              margin={{
                top: 0,
                right: 0,
                bottom: -10,
                left: -10,
              }}
            >
              <CartesianGrid
                strokeWidth="1"
                stroke={'gray'}
                horizontal={scatterChartHorizontalLinesRef.current}
                vertical={scatterChartVerticalLinesRef.current}
              />
              <XAxis
                dataKey="x"
                fontSize={10}
                type="number"
                domain={[xMinMax.min, xMinMax.max]}
                name="x"
                unit={xUnit}
                strokeWidth={1}
                stroke={'gray'}
                tickFormatter={(value, index) => {
                  if (
                    xAxisRef.current === 'yearlyProfit' ||
                    xAxisRef.current === 'unitCost' ||
                    xAxisRef.current === 'sellingPrice'
                  )
                    return '$' + value;
                  return value;
                }}
              />
              <YAxis
                dataKey="y"
                fontSize={10}
                type="number"
                domain={[yMinMax.min, yMinMax.max]}
                name="y"
                unit={yUnit}
                strokeWidth={1}
                stroke={'gray'}
                tickFormatter={(value, index) => {
                  if (
                    yAxisRef.current === 'yearlyProfit' ||
                    yAxisRef.current === 'unitCost' ||
                    yAxisRef.current === 'sellingPrice'
                  )
                    return '$' + value;
                  return value;
                }}
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value: number) => value.toFixed(2)} />
              <Scatter
                name="All"
                data={scatterData}
                fill="#8884d8"
                shape={<Dot fill="#8884d8" r={dotSizeRef.current} />}
              />
              {selectedDesign && <Scatter name="Selected" data={selectedData} fill="red" shape={'star'} />}
            </ScatterChart>
            <ScatterPlotMenu
              symbolSize={dotSizeRef.current}
              horizontalGrid={scatterChartHorizontalLinesRef.current}
              verticalGrid={scatterChartVerticalLinesRef.current}
              changeHorizontalGrid={(checked) => {
                scatterChartHorizontalLinesRef.current = checked;
                setUpdateFlag(!updateFlag);
              }}
              changeVerticalGrid={(checked) => {
                scatterChartVerticalLinesRef.current = checked;
                setUpdateFlag(!updateFlag);
              }}
              changeSymbolSize={(value) => {
                dotSizeRef.current = value;
                if (isOwner) {
                  if (user.uid && projectTitle) {
                    updateDotSizeScatterPlot(user.uid, projectTitle, value).then(() => {
                      //ignore
                    });
                  }
                }
                setUpdateFlag(!updateFlag);
              }}
            />
          </div>
        </Row>
        <Row>
          <span style={{ width: '100%', textAlign: 'center' }}>
            <CameraOutlined
              style={{ fontSize: '18px', color: 'gray', paddingRight: '8px' }}
              title={t('projectPanel.ScatterPlotScreenshot', lang)}
              onClick={() => {
                const d = document.getElementById('scatter-chart');
                if (d) {
                  saveSvgAsPng(d, 'scatter-chart-' + projectTitle + '.png').then(() => {
                    showInfo(t('message.ScreenshotSaved', lang));
                    if (loggable) {
                      setCommonStore((state) => {
                        state.actionInfo = {
                          name: 'Scatter chart screenshot',
                          timestamp: new Date().getTime(),
                          details: { image: 'scatter-chart-' + projectTitle + '.png' },
                        };
                      });
                    }
                  });
                }
              }}
            />
          </span>
        </Row>
      </div>
    );
  };

  const createChooseDataColoringContent = () => {
    return (
      <div>
        <Radio.Group
          onChange={(e) => {
            selectDataColoring(e.target.value);
          }}
          value={projectDataColoring ?? DataColoring.ALL}
        >
          <Radio style={{ fontSize: '12px', width: '100%' }} value={DataColoring.ALL}>
            {t('projectPanel.SameColorForAllDesigns', lang)}
          </Radio>
          <br />
          <Radio style={{ fontSize: '12px', width: '100%' }} value={DataColoring.INDIVIDUALS}>
            {t('projectPanel.OneColorForEachDesign', lang)}
          </Radio>
        </Radio.Group>
      </div>
    );
  };

  const createProjectSettingsContent = () => {
    return (
      <div style={{ width: '250px' }} onClick={(e) => e.stopPropagation()}>
        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col span={14} style={{ paddingTop: '5px' }}>
            <span>{t('projectPanel.AIMemory', lang)}: </span>
          </Col>
          <Col span={10}>
            <Select
              style={{ width: '100%' }}
              value={!independentPrompt}
              onChange={async (value: boolean) => {
                const oldValue = !independentPrompt;
                const newValue = value;
                if (newValue === oldValue) return;
                const undoableChange = {
                  name: 'Select AI Memory',
                  timestamp: Date.now(),
                  oldValue: oldValue,
                  newValue: newValue,
                  undo: () => {
                    setAIMemory(undoableChange.oldValue as boolean);
                  },
                  redo: () => {
                    setAIMemory(undoableChange.newValue as boolean);
                  },
                } as UndoableChange;
                useStore.getState().addUndoable(undoableChange);
                if (isOwner && user.uid && projectTitle) {
                  await updateAIMemory(user.uid, projectTitle, newValue);
                }
                setAIMemory(newValue);
              }}
            >
              <Option key={'Yes'} value={true}>
                {t('word.Yes', lang)}
              </Option>
              <Option key={'No'} value={false}>
                {t('word.No', lang)}
              </Option>
            </Select>
          </Col>
        </Row>
        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col span={14} style={{ paddingTop: '5px' }}>
            <span style={{ fontSize: '12px' }}>{t('projectPanel.ThumbnailImageSize', lang)}: </span>
          </Col>
          <Col span={10}>
            <Select
              style={{ width: '100%' }}
              value={thumbnailSizeRef.current}
              onChange={(value) => {
                thumbnailSizeRef.current = value;
                if (isOwner) {
                  if (user.uid && projectTitle) {
                    updateThumbnailWidth(user.uid, projectTitle, value).then(() => {
                      setCommonStore((state) => {
                        state.projectState.thumbnailWidth = thumbnailSizeRef.current;
                      });
                    });
                  }
                } else {
                  setCommonStore((state) => {
                    state.projectState.thumbnailWidth = thumbnailSizeRef.current;
                  });
                }
                setUpdateFlag(!updateFlag);
              }}
            >
              <Option key={'small-thumbnail'} value={100}>
                <span style={{ fontSize: '12px' }}>{t('word.Small', lang)}</span>
              </Option>
              <Option key={'medium-thumbnail'} value={125}>
                <span style={{ fontSize: '12px' }}>{t('word.Medium', lang)}</span>
              </Option>
              <Option key={'large-thumbnail'} value={200}>
                <span style={{ fontSize: '12px' }}>{t('word.Large', lang)}</span>
              </Option>
            </Select>
          </Col>
        </Row>
      </div>
    );
  };

  const descriptionItems: CollapseProps['items'] = [
    {
      key: '1',
      label: (
        <SubHeader>
          <span>
            {t('projectPanel.ProjectDescription', lang) +
              ' | ' +
              t('projectPanel.ProjectType', lang) +
              ': ' +
              projectType}
          </span>
          <span>
            {isOwner && (
              <>
                {descriptionExpandedRef.current && (
                  <Button
                    style={{ border: 'none', padding: '4px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      descriptionTextAreaEditableRef.current = !descriptionTextAreaEditableRef.current;
                      setUpdateFlag(!updateFlag);
                    }}
                  >
                    {descriptionTextAreaEditableRef.current ? (
                      <EditFilled
                        style={{ fontSize: '24px', color: 'gray' }}
                        title={t('projectPanel.MakeDescriptionNonEditable', lang)}
                      />
                    ) : (
                      <EditOutlined
                        style={{ fontSize: '24px', color: 'gray' }}
                        title={t('projectPanel.MakeDescriptionEditable', lang)}
                      />
                    )}
                  </Button>
                )}

                {projectType === DesignProblem.BUILDING_DESIGN && (
                  <>
                    {generating ? (
                      <span
                        title={t('message.GeneratingBuilding', lang)}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <FidgetSpinner width={24} height={24} />
                      </span>
                    ) : (
                      <Button
                        disabled={false}
                        style={{ border: 'none', padding: '4px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setGenerateBuildingDialogVisible(true);
                        }}
                      >
                        <img src={GenaiImage} alt={'spark'} title={t('projectPanel.GenerateBuilding', lang)} />
                      </Button>
                    )}
                  </>
                )}

                {projectType !== DesignProblem.BUILDING_DESIGN && (
                  <Button
                    style={{ border: 'none', padding: '4px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      curateCurrentDesign();
                    }}
                  >
                    <ImportOutlined
                      style={{ fontSize: '24px', color: 'gray' }}
                      title={t('projectPanel.CurateCurrentDesign', lang)}
                    />
                  </Button>
                )}
                {selectedDesign && selectedDesign.title === cloudFile && (
                  <Button
                    style={{ border: 'none', padding: '4px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateSelectedDesign();
                    }}
                  >
                    <CloudUploadOutlined
                      style={{ fontSize: '24px', color: 'gray' }}
                      title={t('projectPanel.UpdateSelectedDesign', lang)}
                    />
                  </Button>
                )}
                {selectedDesign && (
                  <Button
                    style={{ border: 'none', padding: '4px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSelectedDesign();
                      setSelectedDesign(undefined);
                    }}
                  >
                    <DeleteOutlined
                      style={{ fontSize: '24px', color: 'gray' }}
                      title={t('projectPanel.RemoveSelectedDesign', lang)}
                    />
                  </Button>
                )}
                {selectedDesign && (
                  <Button
                    style={{ border: 'none', padding: '4px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (projectTitle) {
                        let url =
                          HOME_URL + '?client=web&userid=' + user.uid + '&project=' + encodeURIComponent(projectTitle);
                        if (selectedDesign) {
                          url += '&title=' + encodeURIComponent(selectedDesign.title);
                        }
                        navigator.clipboard
                          .writeText(url)
                          .then(() => showSuccess(t('projectListPanel.ProjectLinkGeneratedInClipBoard', lang) + '.'));
                        if (loggable) {
                          setCommonStore((state) => {
                            state.actionInfo = {
                              name: 'Generate Project Link',
                              timestamp: new Date().getTime(),
                              details: url,
                            };
                          });
                        }
                      }
                    }}
                  >
                    <LinkOutlined
                      style={{ fontSize: '24px', color: 'gray' }}
                      title={t('projectListPanel.GenerateProjectLink', lang)}
                    />
                  </Button>
                )}
              </>
            )}
            {projectDesigns && projectDesigns.length > 1 && projectSelectedProperty && (
              <Button
                style={{ border: 'none', padding: '4px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setCommonStore((state) => {
                    state.projectState.sortDescending = !state.projectState.sortDescending;
                    if (loggable) {
                      state.actionInfo = {
                        name: 'Sort Design',
                        timestamp: new Date().getTime(),
                        details: { descending: !state.projectState.sortDescending },
                      };
                    }
                  });
                }}
              >
                {sortDescending ? (
                  <SortAscendingOutlined
                    style={{ fontSize: '24px', color: 'gray' }}
                    title={t('projectPanel.ClickToFlipSortingOrder', lang)}
                  />
                ) : (
                  <SortDescendingOutlined
                    style={{ fontSize: '24px', color: 'gray' }}
                    title={t('projectPanel.ClickToFlipSortingOrder', lang)}
                  />
                )}
              </Button>
            )}
            <Popover
              title={<div onClick={(e) => e.stopPropagation()}>{t('projectPanel.ProjectSettings', lang)}</div>}
              content={createProjectSettingsContent}
            >
              <Button style={{ border: 'none', padding: '4px' }} onClick={(e) => e.stopPropagation()}>
                <SettingOutlined style={{ fontSize: '24px', color: 'gray' }} />
              </Button>
            </Popover>
          </span>
        </SubHeader>
      ),
      children: (
        <TextArea
          title={
            descriptionTextAreaEditableRef.current
              ? undefined
              : t('projectPanel.DoubleClickToMakeDescriptionEditable', lang)
          }
          readOnly={!descriptionTextAreaEditableRef.current}
          value={descriptionRef.current ?? undefined}
          onDoubleClick={() => {
            descriptionTextAreaEditableRef.current = !descriptionTextAreaEditableRef.current;
            setUpdateFlag(!updateFlag);
          }}
          onChange={(e) => {
            descriptionRef.current = e.target.value;
            descriptionChangedRef.current = true;
            setCommonStore((state) => {
              state.projectState.description = e.target.value;
            });
            setUpdateFlag(!updateFlag);
          }}
          onBlur={() => {
            descriptionTextAreaEditableRef.current = false;
            if (descriptionChangedRef.current) {
              if (user.uid && isOwner && projectTitle) {
                updateDescription(user.uid, projectTitle, descriptionRef.current).then(() => {
                  descriptionChangedRef.current = false;
                  setUpdateFlag(!updateFlag);
                });
              }
            }
          }}
          style={{
            paddingLeft: '10px',
            textAlign: 'left',
            resize: descriptionTextAreaEditableRef.current ? 'vertical' : 'none',
            border: descriptionTextAreaEditableRef.current ? '1px solid gray' : 'none',
          }}
        />
      ),
    },
  ];

  const openDesign = (design: Design) => {
    setSelectedDesign(design);
    if (projectOwner) {
      loadCloudFile(projectOwner, design.title, true, true).then(() => {
        if (loggable) {
          setCommonStore((state) => {
            state.actionInfo = {
              name: 'Open Design',
              timestamp: new Date().getTime(),
              details: design.title,
            };
          });
        }
      });
    }
  };

  const confirmToOpenDesign = (design: Design) => {
    if (changed && confirmOpeningDesign) {
      if (cloudFileBelongToProject()) {
        // reverse OK and Cancel functions because we want to default to Cancel
        const modal = Modal.confirm({
          title: t('message.DoYouWantToUpdateDesign', lang),
          icon: <QuestionCircleOutlined />,
          footer: (
            <Space direction={'horizontal'} style={{ marginTop: '10px', width: '100%', justifyContent: 'end' }}>
              <Button
                key="Yes"
                onClick={() => {
                  updateSelectedDesign(() => {
                    openDesign(design);
                    modal.destroy();
                  });
                }}
              >
                {t('word.Yes', lang)}
              </Button>
              <Button
                key="NoAndDoNotShowAgain"
                onClick={() => {
                  openDesign(design);
                  usePrimitiveStore.getState().set((state) => {
                    state.confirmOpeningDesign = false;
                  });
                  modal.destroy();
                }}
              >
                {t('word.NoAndDoNotAskAgain', lang)}
              </Button>
              <Button
                key="No"
                type="primary"
                onClick={() => {
                  openDesign(design);
                  modal.destroy();
                }}
              >
                {t('word.No', lang)}
              </Button>
            </Space>
          ),
        });
      } else {
        // don't reverse OK and Cancel functions because we want to default to OK
        Modal.confirm({
          title: t('message.DoYouWantToSaveChanges', lang),
          icon: <QuestionCircleOutlined />,
          onOk: () => {
            if (cloudFile) {
              usePrimitiveStore.getState().setSaveCloudFileFlag(true);
            } else {
              // no cloud file has been created
              setCommonStore((state) => {
                state.showCloudFileTitleDialogFlag = !state.showCloudFileTitleDialogFlag;
                state.showCloudFileTitleDialog = true;
              });
            }
          },
          onCancel: () => {
            openDesign(design);
          },
          okText: t('word.Yes', lang),
          cancelText: t('word.No', lang),
        });
      }
    } else {
      openDesign(design);
    }
  };

  const onImageClick = (event: any, design: Design) => {
    const target = event.target as HTMLImageElement;
    if (target.src === ImageLoadFailureIcon) {
      target.src = design.thumbnailUrl;
    }
    setSelectedDesign(design !== selectedDesign ? design : undefined);
    if (loggable) {
      setCommonStore((state) => {
        state.actionInfo = {
          name: design !== selectedDesign ? 'Select Design' : 'Deselect Design',
          timestamp: new Date().getTime(),
          details: design?.title,
        };
      });
    }
  };

  const onImageDoubleClick = (event: any, design: Design) => {
    const target = event.target as HTMLImageElement;
    if (target.src === ImageLoadFailureIcon) {
      target.src = design.thumbnailUrl;
    }
    confirmToOpenDesign(design);
  };

  const updateDesignModelChanged = async (userid: string, projectTitle: string, designTitle: string) => {
    const lang = { lng: useStore.getState().language };
    usePrimitiveStore.getState().set((state) => {
      state.waiting = true;
    });

    usePrimitiveStore.getState().setChanged(false);
    try {
      const projectDocRef = doc(firestore, 'users', userid, 'projects', projectTitle);
      const documentSnapshot = await getDoc(projectDocRef);
      if (documentSnapshot.exists()) {
        const data_1 = documentSnapshot.data();
        if (data_1) {
          const updatedDesigns: Design[] = [];
          updatedDesigns.push(...data_1.designs);
          for (const [i, d] of updatedDesigns.entries()) {
            if (d.title === designTitle) {
              d.modelChanged = true;
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
              break;
            }
          }
        }
      }
    } catch (error) {
      showError(i18n.t('message.CannotFetchProjectData', lang) + ': ' + error);
    }
  };

  const elements = useStore(Selector.elements);
  useEffect(() => {
    if (usePrimitiveStore.getState().skipChange && usePrimitiveStore.getState().modelChanged) {
      usePrimitiveStore.getState().set((state) => {
        state.modelChanged = false;
      });
    }
    if (!usePrimitiveStore.getState().skipChange && !usePrimitiveStore.getState().modelChanged) {
      usePrimitiveStore.getState().set((state) => {
        state.modelChanged = true;
      });
    }
  }, [elements]);

  useEffect(() => {
    const onPointUp = () => {
      if (usePrimitiveStore.getState().modelChanged) {
        const userid = useStore.getState().user.uid;
        const projectTitle = useStore.getState().projectState.title;
        const designTitle = useStore.getState().cloudFile;

        if (!designTitle || !userid || !projectTitle) {
          return;
        }

        if (userid !== useStore.getState().projectState.owner) {
          return;
        }

        if (selectedDesign) {
          if (selectedDesign.modelChanged) return;
          updateDesignModelChanged(userid, projectTitle, designTitle);
          setSelectedDesign({ ...selectedDesign, modelChanged: false });
        }
        usePrimitiveStore.getState().set((state) => {
          state.modelChanged = false;
        });
      }
    };
    window.addEventListener('pointerup', onPointUp);
    return () => window.removeEventListener('pointerup', onPointUp);
  }, [selectedDesign]);

  return (
    <Container
      onContextMenu={(e) => {
        e.stopPropagation();
      }}
    >
      <ColumnWrapper>
        <Header>
          <span>
            {(isOwner ? t('projectPanel.Project', lang) : t('projectPanel.ProjectByOtherPeople', lang)) +
              ': ' +
              projectTitle +
              (isOwner ? '' : ' (' + t('word.Owner', lang) + ': ' + projectOwner?.substring(0, 4) + '***)') +
              ' (' +
              projectDesignsRef.current.length +
              ')'}
          </span>
          <span
            style={{ cursor: 'pointer' }}
            onMouseDown={() => {
              closeProject();
              setSelectedDesign(undefined);
            }}
            onTouchStart={() => {
              closeProject();
              setSelectedDesign(undefined);
            }}
          >
            <CloseOutlined title={t('word.Close', lang)} />
          </span>
        </Header>
        <Collapse
          items={descriptionItems}
          style={{ backgroundColor: 'white', border: 'none' }}
          onChange={(e) => {
            descriptionExpandedRef.current = e.length > 0;
            setUpdateFlag(!updateFlag);
          }}
        />
        {projectDesignsRef.current.length > 0 && (
          <SubContainer>
            <List
              style={{
                width: '100%',
                height: totalHeight / 2 - (descriptionExpandedRef.current ? 160 : 80),
                paddingLeft: '4px',
                paddingRight: '4px',
                overflowX: 'hidden',
                overflowY: 'auto',
              }}
              grid={{ column: imageColumns, gutter: [2, 12] }}
              dataSource={projectDesignsRef.current}
              renderItem={(design) => {
                const lastSpaceIndex = design.title.lastIndexOf(' ');
                const labelDisplayLength = projectThumbnailWidth === 100 ? 8 : projectThumbnailWidth === 125 ? 12 : 30;
                return (
                  <List.Item
                    style={{ marginBottom: '-28px' }}
                    onMouseOver={() => {
                      setHoveredDesign(design);
                    }}
                    onMouseLeave={() => {
                      setHoveredDesign(undefined);
                    }}
                  >
                    <img
                      loading={'eager'}
                      width={imageWidth + 'px'}
                      height={'auto'}
                      onError={(event: any) => {
                        (event.target as HTMLImageElement).src = ImageLoadFailureIcon;
                      }}
                      onLoad={(event) => {
                        setCommonStore((state) => {
                          state.projectImages.set(design.title, event.target as HTMLImageElement);
                        });
                        usePrimitiveStore.getState().set((state) => {
                          state.projectImagesUpdateFlag = !state.projectImagesUpdateFlag;
                        });
                      }}
                      alt={design.title}
                      title={
                        (design.timestamp
                          ? t('word.LastUpdate', lang) +
                            ': ' +
                            dayjs(new Date(design.timestamp)).format('MM-DD-YYYY hh:mm A') +
                            '\n'
                          : '') +
                        (selectedDesign === design
                          ? t('projectPanel.SingleClickToDeselectDoubleClickToOpen', lang)
                          : t('projectPanel.SingleClickToSelectDoubleClickToOpen', lang))
                      }
                      src={
                        design.thumbnail?.startsWith('data:image/png;base64') ? design.thumbnail : ImageLoadFailureIcon
                      }
                      style={{
                        transition: '.5s ease',
                        opacity: design.excluded ? 0.25 : hoveredDesign === design ? 0.5 : 1,
                        padding: '1px',
                        cursor: 'pointer',
                        borderRadius: selectedDesign === design ? '0' : '10px',
                        border: selectedDesign === design ? '2px solid red' : 'none',
                      }}
                      onClick={(event) => {
                        const delay = 300;
                        if (event.detail === 1) {
                          setTimeout(() => {
                            if (Date.now() - timePassed.current >= delay) {
                              onImageClick(event, design);
                            }
                          }, delay);
                        }
                        if (event.detail === 2) {
                          timePassed.current = Date.now();
                          onImageDoubleClick(event, design);
                        }
                      }}
                    />
                    <Popover
                      trigger={'click'}
                      onOpenChange={(open: boolean) => {
                        if (projectType === DesignProblem.BUILDING_DESIGN) {
                          setPop(open);
                        }
                      }}
                      content={
                        projectType === DesignProblem.BUILDING_DESIGN && (
                          <Space direction="vertical" style={{ width: '600px' }}>
                            <Space style={{ fontWeight: 'bold' }}>
                              {design.title
                                ? design.title.length > labelDisplayLength
                                  ? design.title.substring(0, Math.min(labelDisplayLength, lastSpaceIndex)) +
                                    '...' +
                                    design.title.substring(lastSpaceIndex)
                                  : design.title
                                : 'Unknown'}
                            </Space>

                            <div>
                              <span style={{ display: 'inline', fontWeight: 'bold' }}>
                                {t('projectPanel.UserPrompt', lang)}:{' '}
                              </span>
                              <span style={{ display: 'inline' }}>
                                {design.prompt}
                                <CopyOutlined
                                  style={{ paddingLeft: '10px', cursor: 'copy' }}
                                  title={t('projectPanel.CopyPrompt', lang)}
                                  onClick={() => {
                                    if (design?.prompt) {
                                      navigator.clipboard.writeText(design.prompt).then(() => {
                                        showInfo(t('projectPanel.PromptInClipBoard', lang));
                                      });
                                    }
                                  }}
                                />
                              </span>
                            </div>
                            {design?.data && (
                              <div>
                                <span style={{ display: 'inline', fontWeight: 'bold' }}>
                                  {t('projectPanel.AIReasoning', lang)}:{' '}
                                </span>
                                {
                                  <span style={{ display: 'inline' }}>
                                    {JSON.parse(design.data).thinking}
                                    <CopyOutlined
                                      style={{ paddingLeft: '10px', cursor: 'copy' }}
                                      title={t('projectPanel.CopyReasoning', lang)}
                                      onClick={() => {
                                        const thinking = JSON.parse(design.data).thinking;
                                        if (thinking) {
                                          navigator.clipboard.writeText(thinking).then(() => {
                                            showInfo(t('projectPanel.ReasoningInClipBoard', lang));
                                          });
                                        }
                                      }}
                                    />
                                  </span>
                                }
                              </div>
                            )}
                          </Space>
                        )
                      }
                    >
                      <Space
                        style={{
                          position: 'relative', // I have no idea why this one has to be relative
                          width: '100%',
                          bottom: '46px',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            top: '12px',
                            left: '10px',
                            textAlign: 'left',
                            color: 'white',
                            fontSize: '8px',
                            fontWeight: design.title === cloudFile ? 'bold' : 'normal',
                          }}
                        >
                          {projectType === DesignProblem.BUILDING_DESIGN && (
                            <img
                              src={SparkImage}
                              alt={'spark'}
                              title={t('projectPanel.GeneratedByAI', lang)}
                              height={18}
                              style={{ paddingBottom: '4px' }}
                            />
                          )}
                          <span
                            style={{ cursor: 'pointer', fontSize: '10px', paddingLeft: '4px' }}
                            title={
                              projectType === DesignProblem.BUILDING_DESIGN
                                ? t(pop ? 'projectPanel.ClickToClosePopup' : 'projectPanel.ClickForMoreInfo', lang)
                                : undefined
                            }
                          >
                            {design.title
                              ? design.title.length > labelDisplayLength
                                ? design.title.substring(0, Math.min(labelDisplayLength, lastSpaceIndex)) +
                                  '...' +
                                  design.title.substring(lastSpaceIndex)
                                : design.title
                              : 'Unknown'}
                          </span>
                        </div>
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-28px',
                            right: '10px',
                            textAlign: 'right',
                            color: 'white',
                          }}
                        >
                          {/* todo: genAI - model  */}
                          {design.modelChanged && (
                            <SyncOutlined
                              style={{ paddingRight: '4px', fontSize: '16px' }}
                              title={t('projectPanel.NeedToRedoSimulation', lang)}
                            />
                          )}
                          {design.title === cloudFile && (
                            <FolderOpenOutlined style={{ paddingRight: '4px', fontSize: '16px' }} />
                          )}
                          {design.invisible ? (
                            <CheckCircleOutlined
                              onClick={() => {
                                toggleDesignVisibility(design);
                              }}
                              style={{ fontSize: '16px' }}
                              title={t('projectPanel.DesignNotShownInSolutionSpaceClickToShow', lang)}
                            />
                          ) : (
                            <CheckCircleFilled
                              onClick={() => {
                                toggleDesignVisibility(design);
                              }}
                              style={{ fontSize: '16px' }}
                              title={t('projectPanel.DesignShownInSolutionSpaceClickToHide', lang)}
                            />
                          )}
                        </div>
                      </Space>
                    </Popover>
                  </List.Item>
                );
              }}
            />
            <SolutionSpaceHeader>
              <span style={{ paddingLeft: '20px' }}>{t('projectPanel.SolutionSpace', lang)}</span>
              <span>
                {(projectType === DesignProblem.SOLAR_PANEL_ARRAY || projectType === DesignProblem.BUILDING_DESIGN) && (
                  <Popover
                    title={t('projectPanel.ChooseSolutionSpace', lang)}
                    onOpenChange={(visible) => {
                      if (parameterSelectionChangedRef.current) {
                        if (!visible) {
                          usePrimitiveStore.getState().set((state) => {
                            state.updateProjectsFlag = true;
                          });
                        }
                        parameterSelectionChangedRef.current = false;
                      }
                    }}
                    content={createChooseSolutionSpaceContent()}
                  >
                    <Button style={{ border: 'none', paddingRight: 0, background: 'white' }}>
                      <CarryOutOutlined style={{ fontSize: '24px', color: 'gray' }} />
                    </Button>
                  </Popover>
                )}
                <Popover title={t('projectPanel.ChooseDataColoring', lang)} content={createChooseDataColoringContent()}>
                  <Button style={{ border: 'none', paddingRight: 0, background: 'white' }}>
                    <BgColorsOutlined style={{ fontSize: '24px', color: 'gray' }} />
                  </Button>
                </Popover>
                <Popover title={t('projectPanel.GenerateScatterPlot', lang)} content={createScatterPlotContent()}>
                  <Button style={{ border: 'none', paddingRight: 0, background: 'white' }}>
                    <DotChartOutlined style={{ fontSize: '24px', color: 'gray' }} />
                  </Button>
                </Popover>
                <Button
                  style={{ border: 'none', paddingRight: '20px', background: 'white' }}
                  onClick={() => {
                    const d = document.getElementById('design-space');
                    if (d) {
                      saveSvgAsPng(d, 'design-space-' + projectTitle + '.png').then(() => {
                        showInfo(t('message.ScreenshotSaved', lang));
                        if (loggable) {
                          setCommonStore((state) => {
                            state.actionInfo = {
                              name: 'Solution space screenshot',
                              timestamp: new Date().getTime(),
                              details: { image: 'design-space-' + projectTitle + '.png' },
                            };
                          });
                        }
                      });
                    }
                  }}
                >
                  <CameraOutlined
                    style={{ fontSize: '24px', color: 'gray' }}
                    title={t('projectPanel.SolutionSpaceScreenshot', lang)}
                  />
                </Button>
              </span>
            </SolutionSpaceHeader>
            <ParallelCoordinates
              id={'design-space'}
              width={relativeWidth * window.innerWidth}
              height={totalHeight / 2 - 120}
              data={data}
              types={types}
              minima={minima}
              maxima={maxima}
              filters={filters}
              steps={steps}
              variables={variables}
              titles={titles}
              units={units}
              digits={digits}
              tickIntegers={tickIntegers}
              hover={hover}
              hoveredIndex={projectDesigns && hoveredDesign ? projectDesigns.indexOf(hoveredDesign) : -1}
              selectedIndex={projectDesigns && selectedDesign ? projectDesigns.indexOf(selectedDesign) : -1}
            />
          </SubContainer>
        )}
        <GenerateBuildingModal
          setDialogVisible={setGenerateBuildingDialogVisible}
          isDialogVisible={() => generateBuildingDialogVisible}
        />
      </ColumnWrapper>
    </Container>
  );
});

export default ProjectGallery;
