/*
 * @Copyright 2023-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import styled from 'styled-components';
import { Button, Checkbox, Col, Collapse, CollapseProps, Input, List, Popover, Radio, Row, Select } from 'antd';
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
} from '@ant-design/icons';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import ImageLoadFailureIcon from '../assets/image_fail_try_again.png';
import { DataColoring, DatumEntry, Design, DesignProblem, Orientation } from '../types';
import ParallelCoordinates from '../components/parallelCoordinates';
//@ts-expect-error ignore
import { saveSvgAsPng } from 'save-svg-as-png';
import { showInfo, showSuccess } from '../helpers';
import { Util } from '../Util';
import { ProjectUtil } from './ProjectUtil';
import { HOME_URL } from '../constants';
import {
  removeDesignFromProject,
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

const ProjectGallery = ({ relativeWidth, canvas }: ProjectGalleryProps) => {
  const setCommonStore = useStore(Selector.set);
  const user = useStore(Selector.user);
  const language = useStore(Selector.language);
  const cloudFile = useStore(Selector.cloudFile);
  const projectState = useStore(Selector.projectState);
  const solarPanelArrayLayoutConstraints = useStore(Selector.solarPanelArrayLayoutConstraints);
  const economicsParams = useStore(Selector.economicsParams);

  const [selectedDesign, setSelectedDesign] = useState<Design | undefined>();
  const [hoveredDesign, setHoveredDesign] = useState<Design | undefined>();
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [updateHiddenFlag, setUpdateHiddenFlag] = useState<boolean>(false);

  const descriptionTextAreaEditableRef = useRef<boolean>(false);
  const descriptionRef = useRef<string | null>(projectState.description ?? null);
  const descriptionChangedRef = useRef<boolean>(false);
  const descriptionExpandedRef = useRef<boolean>(false);
  const dataColoringSelectionRef = useRef<DataColoring>(projectState.dataColoring ?? DataColoring.ALL);
  const parameterSelectionChangedRef = useRef<boolean>(false);
  const projectDesigns = useRef<Design[]>(projectState.designs ?? []); // store sorted designs
  const thumbnailSizeRef = useRef<number>(projectState.thumbnailWidth ?? 200);
  const xAxisRef = useRef<string>(projectState.xAxisNameScatterPlot ?? 'rowWidth');
  const yAxisRef = useRef<string>(projectState.yAxisNameScatterPlot ?? 'rowWidth');
  const dotSizeRef = useRef<number>(projectState.dotSizeScatterPlot ?? 5);
  const scatterChartHorizontalLinesRef = useRef<boolean>(true);
  const scatterChartVerticalLinesRef = useRef<boolean>(true);

  useEffect(() => {
    xAxisRef.current = projectState.xAxisNameScatterPlot ?? 'rowWidth';
  }, [projectState.xAxisNameScatterPlot]);

  useEffect(() => {
    yAxisRef.current = projectState.yAxisNameScatterPlot ?? 'rowWidth';
  }, [projectState.yAxisNameScatterPlot]);

  useEffect(() => {
    dotSizeRef.current = projectState.dotSizeScatterPlot ?? 5;
  }, [projectState.dotSizeScatterPlot]);

  useEffect(() => {
    thumbnailSizeRef.current = projectState.thumbnailWidth ?? 200;
  }, [projectState.thumbnailWidth]);

  const { t } = useTranslation();

  const lang = useMemo(() => {
    return { lng: language };
  }, [language]);

  const isOwner = user.uid === projectState.owner;

  useEffect(() => {
    projectDesigns.current = [];
    if (projectState.designs) {
      for (const design of projectState.designs) {
        projectDesigns.current.push(design);
      }
      const p = projectState.selectedProperty;
      if (p) {
        const prefix = projectState.sortDescending ? 1 : -1;
        projectDesigns.current.sort((a, b) => {
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
  }, [projectState.designs, projectState.sortDescending, projectState.selectedProperty]);

  useEffect(() => {
    setSelectedDesign(undefined);
    if (projectState.designs) {
      for (const design of projectState.designs) {
        if (design.title === cloudFile) {
          setSelectedDesign(design);
          break;
        }
      }
    }
  }, [cloudFile, projectState.designs]);

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

  const closeProject = () => {
    setCommonStore((state) => {
      state.projectView = false;
      state.projectState.title = null;
      state.projectState.description = null;
      state.projectState.owner = null;
      // clear the cached images for the previously open project
      state.projectImages.clear();
    });
    setSelectedDesign(undefined);
    usePrimitiveStore.getState().set((state) => {
      state.projectImagesUpdateFlag = !state.projectImagesUpdateFlag;
    });
  };

  const curateCurrentDesign = () => {
    usePrimitiveStore.getState().set((state) => {
      state.curateDesignToProjectFlag = true;
    });
  };

  const removeSelectedDesign = () => {
    if (user.uid && projectState.title && selectedDesign) {
      removeDesignFromProject(user.uid, projectState.title, selectedDesign).then(() => {
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
            }
          }
        });
      });
    }
  };

  const totalHeight = window.innerHeight;
  const imageColumns = Math.round(800 / thumbnailSizeRef.current);
  const imageGap = 48 / imageColumns;
  const imageWidth = Math.round((relativeWidth * window.innerWidth) / imageColumns - imageGap);

  const [variables, titles, units, digits, tickIntegers, types] = useMemo(
    () => [
      ProjectUtil.getVariables(projectState.type, projectState.hiddenParameters ?? []),
      ProjectUtil.getTitles(projectState.type, lang, projectState.hiddenParameters ?? []),
      ProjectUtil.getUnits(projectState.type, lang, projectState.hiddenParameters ?? []),
      ProjectUtil.getDigits(projectState.type, projectState.hiddenParameters ?? []),
      ProjectUtil.getTickIntegers(projectState.type, projectState.hiddenParameters ?? []),
      ProjectUtil.getTypes(projectState.type, projectState.hiddenParameters ?? []),
    ],
    [projectState.type, projectState.hiddenParameters, updateHiddenFlag, lang],
  );

  const data: DatumEntry[] = useMemo(() => {
    const data: DatumEntry[] = [];
    if (projectState.designs) {
      if (projectState.type === DesignProblem.SOLAR_PANEL_ARRAY) {
        for (const design of projectState.designs) {
          const d = {} as DatumEntry;
          if (!projectState.hiddenParameters?.includes('rowWidth')) d['rowWidth'] = design.rowsPerRack;
          if (!projectState.hiddenParameters?.includes('tiltAngle')) d['tiltAngle'] = Util.toDegrees(design.tiltAngle);
          if (!projectState.hiddenParameters?.includes('interRowSpacing'))
            d['interRowSpacing'] = design.interRowSpacing;
          if (!projectState.hiddenParameters?.includes('latitude')) d['latitude'] = design.latitude ?? 42;
          if (!projectState.hiddenParameters?.includes('orientation'))
            d['orientation'] = design.orientation === Orientation.landscape ? 0 : 1;
          if (!projectState.hiddenParameters?.includes('poleHeight')) d['poleHeight'] = design.poleHeight;
          if (!projectState.hiddenParameters?.includes('unitCost')) d['unitCost'] = design.unitCost;
          if (!projectState.hiddenParameters?.includes('sellingPrice')) d['sellingPrice'] = design.sellingPrice;
          if (!projectState.hiddenParameters?.includes('')) d['totalYearlyCost'] = Util.calculateCost(design);
          if (!projectState.hiddenParameters?.includes('totalYearlyYield'))
            d['totalYearlyYield'] = design.yearlyYield * 0.001;
          if (!projectState.hiddenParameters?.includes('meanYearlyYield'))
            d['meanYearlyYield'] = design.yearlyYield / design.panelCount;
          if (!projectState.hiddenParameters?.includes('yearlyProfit'))
            d['yearlyProfit'] = Util.calculateProfit(design);
          d['group'] = projectState.dataColoring === DataColoring.INDIVIDUALS ? design.title : 'default';
          d['selected'] = selectedDesign === design;
          d['hovered'] = hoveredDesign === design;
          d['invisible'] = design.invisible;
          data.push(d);
        }
      }
    }
    return data;
  }, [
    projectState.designs,
    projectState.type,
    hoveredDesign,
    selectedDesign,
    economicsParams,
    projectState.hiddenParameters,
    projectState.dataColoring,
    updateHiddenFlag,
  ]);

  const getMin = (variable: string, defaultValue: number) => {
    let min = defaultValue;
    if (projectState.ranges) {
      for (const r of projectState.ranges) {
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
    if (projectState.ranges) {
      for (const r of projectState.ranges) {
        if (r.variable === variable) {
          max = r.maximum ?? defaultValue;
          break;
        }
      }
    }
    return max;
  };

  const minima: number[] = useMemo(() => {
    if (projectState.type === DesignProblem.SOLAR_PANEL_ARRAY && solarPanelArrayLayoutConstraints) {
      const array: number[] = [];
      if (!projectState.hiddenParameters?.includes('rowWidth'))
        array.push(getMin('rowWidth', solarPanelArrayLayoutConstraints.minimumRowsPerRack));
      if (!projectState.hiddenParameters?.includes('tiltAngle'))
        array.push(getMin('tiltAngle', Util.toDegrees(solarPanelArrayLayoutConstraints.minimumTiltAngle)));
      if (!projectState.hiddenParameters?.includes('interRowSpacing'))
        array.push(getMin('interRowSpacing', solarPanelArrayLayoutConstraints.minimumInterRowSpacing));
      if (!projectState.hiddenParameters?.includes('latitude')) array.push(getMin('latitude', -90));
      if (!projectState.hiddenParameters?.includes('orientation')) array.push(0);
      if (!projectState.hiddenParameters?.includes('poleHeight')) array.push(getMin('poleHeight', 0));
      if (!projectState.hiddenParameters?.includes('unitCost')) array.push(getMin('unitCost', 0.1));
      if (!projectState.hiddenParameters?.includes('sellingPrice')) array.push(getMin('sellingPrice', 0.1));
      if (!projectState.hiddenParameters?.includes('totalYearlyCost')) array.push(getMin('totalYearlyCost', 0));
      if (!projectState.hiddenParameters?.includes('totalYearlyYield')) array.push(getMin('totalYearlyYield', 0)); // electricity output in MWh
      if (!projectState.hiddenParameters?.includes('meanYearlyYield')) array.push(getMin('meanYearlyYield', 0)); // electricity output in kWh
      if (!projectState.hiddenParameters?.includes('yearlyProfit')) array.push(getMin('yearlyProfit', -10)); // profit in $1,000
      return array;
    }
    return [];
  }, [
    solarPanelArrayLayoutConstraints,
    projectState.type,
    projectState.ranges,
    projectState.hiddenParameters,
    updateHiddenFlag,
  ]);

  const maxima: number[] = useMemo(() => {
    if (projectState.type === DesignProblem.SOLAR_PANEL_ARRAY && solarPanelArrayLayoutConstraints) {
      const array: number[] = [];
      if (!projectState.hiddenParameters?.includes('rowWidth'))
        array.push(getMax('rowWidth', solarPanelArrayLayoutConstraints.maximumRowsPerRack));
      if (!projectState.hiddenParameters?.includes('tiltAngle'))
        array.push(getMax('tiltAngle', Util.toDegrees(solarPanelArrayLayoutConstraints.maximumTiltAngle)));
      if (!projectState.hiddenParameters?.includes('interRowSpacing'))
        array.push(getMax('interRowSpacing', solarPanelArrayLayoutConstraints.maximumInterRowSpacing));
      if (!projectState.hiddenParameters?.includes('latitude')) array.push(getMax('latitude', 90));
      if (!projectState.hiddenParameters?.includes('orientation')) array.push(1);
      if (!projectState.hiddenParameters?.includes('poleHeight')) array.push(getMax('poleHeight', 5));
      if (!projectState.hiddenParameters?.includes('unitCost')) array.push(getMax('unitCost', 1));
      if (!projectState.hiddenParameters?.includes('sellingPrice')) array.push(getMax('sellingPrice', 0.5));
      if (!projectState.hiddenParameters?.includes('totalYearlyCost')) array.push(getMax('totalYearlyCost', 100));
      if (!projectState.hiddenParameters?.includes('totalYearlyYield')) array.push(getMax('totalYearlyYield', 100)); // electricity output in MWh
      if (!projectState.hiddenParameters?.includes('meanYearlyYield')) array.push(getMax('meanYearlyYield', 1000)); // electricity output in kWh
      if (!projectState.hiddenParameters?.includes('yearlyProfit')) array.push(getMax('yearlyProfit', 10)); // profit in $1,000
      return array;
    }
    return [];
  }, [
    solarPanelArrayLayoutConstraints,
    projectState.type,
    projectState.ranges,
    projectState.hiddenParameters,
    updateHiddenFlag,
  ]);

  const steps: number[] = useMemo(() => {
    if (projectState.type === DesignProblem.SOLAR_PANEL_ARRAY && solarPanelArrayLayoutConstraints) {
      const array: number[] = [];
      if (!projectState.hiddenParameters?.includes('rowWidth')) array.push(1);
      if (!projectState.hiddenParameters?.includes('tiltAngle')) array.push(0.1);
      if (!projectState.hiddenParameters?.includes('interRowSpacing')) array.push(0.1);
      if (!projectState.hiddenParameters?.includes('latitude')) array.push(0.1);
      if (!projectState.hiddenParameters?.includes('orientation')) array.push(1);
      if (!projectState.hiddenParameters?.includes('poleHeight')) array.push(0.1);
      if (!projectState.hiddenParameters?.includes('unitCost')) array.push(0.01);
      if (!projectState.hiddenParameters?.includes('sellingPrice')) array.push(0.01);
      if (!projectState.hiddenParameters?.includes('totalYearlyCost')) array.push(0.1); // cost in $1,000
      if (!projectState.hiddenParameters?.includes('totalYearlyYield')) array.push(1); // electricity output in MWh
      if (!projectState.hiddenParameters?.includes('meanYearlyYield')) array.push(1); // electricity output in kWh
      if (!projectState.hiddenParameters?.includes('yearlyProfit')) array.push(0.1); // profit in $1,000
      return array;
    }
    return [];
  }, [projectState.type, projectState.hiddenParameters, updateHiddenFlag]);

  const rowWidthSelectionRef = useRef<boolean>(!projectState.hiddenParameters?.includes('rowWidth'));
  const tiltAngleSelectionRef = useRef<boolean>(!projectState.hiddenParameters?.includes('tiltAngle'));
  const rowSpacingSelectionRef = useRef<boolean>(!projectState.hiddenParameters?.includes('interRowSpacing'));
  const latitudeSelectionRef = useRef<boolean>(!projectState.hiddenParameters?.includes('latitude'));
  const orientationSelectionRef = useRef<boolean>(!projectState.hiddenParameters?.includes('orientation'));
  const poleHeightSelectionRef = useRef<boolean>(!projectState.hiddenParameters?.includes('poleHeight'));
  const unitCostSelectionRef = useRef<boolean>(!projectState.hiddenParameters?.includes('unitCost'));
  const sellingPriceSelectionRef = useRef<boolean>(!projectState.hiddenParameters?.includes('sellingPrice'));
  const costSelectionRef = useRef<boolean>(!projectState.hiddenParameters?.includes('totalYearlyCost'));
  const totalYieldSelectionRef = useRef<boolean>(!projectState.hiddenParameters?.includes('totalYearlyYield'));
  const meanYieldSelectionRef = useRef<boolean>(!projectState.hiddenParameters?.includes('meanYearlyYield'));
  const profitSelectionRef = useRef<boolean>(!projectState.hiddenParameters?.includes('yearlyProfit'));

  useEffect(() => {
    rowWidthSelectionRef.current = !projectState.hiddenParameters?.includes('rowWidth');
    tiltAngleSelectionRef.current = !projectState.hiddenParameters?.includes('tiltAngle');
    rowSpacingSelectionRef.current = !projectState.hiddenParameters?.includes('interRowSpacing');
    latitudeSelectionRef.current = !projectState.hiddenParameters?.includes('latitude');
    orientationSelectionRef.current = !projectState.hiddenParameters?.includes('orientation');
    poleHeightSelectionRef.current = !projectState.hiddenParameters?.includes('poleHeight');
    unitCostSelectionRef.current = !projectState.hiddenParameters?.includes('unitCost');
    sellingPriceSelectionRef.current = !projectState.hiddenParameters?.includes('sellingPrice');
    costSelectionRef.current = !projectState.hiddenParameters?.includes('totalYearlyCost');
    totalYieldSelectionRef.current = !projectState.hiddenParameters?.includes('totalYearlyYield');
    meanYieldSelectionRef.current = !projectState.hiddenParameters?.includes('meanYearlyYield');
    profitSelectionRef.current = !projectState.hiddenParameters?.includes('yearlyProfit');
    setUpdateFlag(!updateFlag);
  }, [projectState.hiddenParameters]);

  useEffect(() => {
    descriptionRef.current = projectState.description;
  }, [projectState.description]);

  const hover = (i: number) => {
    if (projectState.designs) {
      if (i >= 0 && i < projectState.designs.length) {
        setHoveredDesign(projectState.designs[i]);
      } else {
        setHoveredDesign(undefined);
      }
    }
  };

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

  const toggleDesignVisibility = (design: Design) => {
    localToggleDesignVisibility(design.title);
    if (isOwner) {
      if (user.uid && projectState.title) {
        updateDesignVisibility(user.uid, projectState.title, design);
      }
    }
  };

  const localSelectParameter = (selected: boolean, parameter: string) => {
    setCommonStore((state) => {
      if (state.projectState.hiddenParameters) {
        if (selected) {
          if (state.projectState.hiddenParameters.includes(parameter)) {
            state.projectState.hiddenParameters.splice(state.projectState.hiddenParameters.indexOf(parameter), 1);
          }
        } else {
          if (!state.projectState.hiddenParameters.includes(parameter)) {
            state.projectState.hiddenParameters.push(parameter);
          }
        }
      }
    });
  };

  const selectParameter = (selected: boolean, parameter: string) => {
    parameterSelectionChangedRef.current = true;
    if (isOwner) {
      if (user.uid && projectState.title) {
        updateHiddenParameters(user.uid, projectState.title, parameter, !selected).then(() => {
          localSelectParameter(selected, parameter);
        });
      }
    } else {
      localSelectParameter(selected, parameter);
    }
  };

  const localSelectDataColoring = () => {
    setCommonStore((state) => {
      state.projectState.dataColoring = dataColoringSelectionRef.current;
    });
    usePrimitiveStore.getState().set((state) => {
      state.updateProjectsFlag = true;
    });
    setUpdateFlag(!updateFlag);
  };

  const selectDataColoring = (value: DataColoring) => {
    dataColoringSelectionRef.current = value;
    if (isOwner) {
      if (user.uid && projectState.title) {
        updateDataColoring(user.uid, projectState.title, dataColoringSelectionRef.current).then(() => {
          localSelectDataColoring();
        });
      }
    } else {
      localSelectDataColoring();
    }
  };

  const createChooseSolutionSolutionContent = () => {
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
  };

  const createAxisOptions = () => {
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
  };

  const scatterData = useMemo(() => {
    const data: { x: number; y: number }[] = [];
    if (projectState.designs) {
      if (projectState.type === DesignProblem.SOLAR_PANEL_ARRAY) {
        for (const design of projectState.designs) {
          if (design.invisible || design === selectedDesign) continue;
          const d = {} as { x: number; y: number };
          ProjectUtil.setScatterData(xAxisRef.current, 'x', d, design);
          ProjectUtil.setScatterData(yAxisRef.current, 'y', d, design);
          data.push(d);
        }
      }
    }
    return data;
  }, [xAxisRef.current, yAxisRef.current, projectState.designs, projectState.type, selectedDesign]);

  const selectedData = useMemo(() => {
    const data: { x: number; y: number }[] = [];
    if (projectState.designs) {
      if (projectState.type === DesignProblem.SOLAR_PANEL_ARRAY) {
        for (const design of projectState.designs) {
          if (design !== selectedDesign) continue;
          const d = {} as { x: number; y: number };
          ProjectUtil.setScatterData(xAxisRef.current, 'x', d, design);
          ProjectUtil.setScatterData(yAxisRef.current, 'y', d, design);
          data.push(d);
        }
      }
    }
    return data;
  }, [xAxisRef.current, yAxisRef.current, projectState.designs, projectState.type, selectedDesign]);

  const getBound = (axisName: string) => {
    const bound: { min: number; max: number } = { min: 0, max: 1 };
    if (projectState.type === DesignProblem.SOLAR_PANEL_ARRAY && solarPanelArrayLayoutConstraints) {
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
    }
    return bound;
  };

  const xMinMax = useMemo(() => {
    return getBound(xAxisRef.current);
  }, [xAxisRef.current, projectState.ranges]);

  const yMinMax = useMemo(() => {
    return getBound(yAxisRef.current);
  }, [yAxisRef.current, projectState.ranges]);

  const xUnit = useMemo(() => {
    return ProjectUtil.getUnit(xAxisRef.current, lang);
  }, [xAxisRef.current, lang]);

  const yUnit = useMemo(() => {
    return ProjectUtil.getUnit(yAxisRef.current, lang);
  }, [yAxisRef.current, lang]);

  const createScatterPlotContent = () => {
    return (
      <div style={{ width: '280px' }}>
        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col span={8} style={{ paddingTop: '5px' }}>
            <span style={{ fontSize: '12px' }}>{t('projectPanel.SelectXAxis', lang)}: </span>
          </Col>
          <Col span={16}>
            <Select
              style={{ width: '100%' }}
              value={xAxisRef.current}
              onChange={(value) => {
                xAxisRef.current = value;
                if (isOwner) {
                  if (user.uid && projectState.title) {
                    updateXAxisNameScatterPlot(user.uid, projectState.title, value).then(() => {
                      //ignore
                    });
                  }
                }
                setUpdateFlag(!updateFlag);
              }}
            >
              {createAxisOptions()}
            </Select>
          </Col>
        </Row>
        <Row gutter={6} style={{ paddingBottom: '8px' }}>
          <Col span={8} style={{ paddingTop: '5px' }}>
            <span style={{ fontSize: '12px' }}>{t('projectPanel.SelectYAxis', lang)}: </span>
          </Col>
          <Col span={16}>
            <Select
              style={{ width: '100%' }}
              value={yAxisRef.current}
              onChange={(value) => {
                yAxisRef.current = value;
                if (isOwner) {
                  if (user.uid && projectState.title) {
                    updateYAxisNameScatterPlot(user.uid, projectState.title, value).then(() => {
                      //ignore
                    });
                  }
                }
                setUpdateFlag(!updateFlag);
              }}
            >
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
                  if (user.uid && projectState.title) {
                    updateDotSizeScatterPlot(user.uid, projectState.title, value).then(() => {
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
                  saveSvgAsPng(d, 'scatter-chart-' + projectState.title + '.png').then(() => {
                    showInfo(t('message.ScreenshotSaved', lang));
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
          value={projectState.dataColoring ?? DataColoring.ALL}
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
            <span style={{ fontSize: '12px' }}>{t('projectPanel.ThumbnailImageSize', lang)}: </span>
          </Col>
          <Col span={10}>
            <Select
              style={{ width: '100%' }}
              value={thumbnailSizeRef.current}
              onChange={(value) => {
                thumbnailSizeRef.current = value;
                if (isOwner) {
                  if (user.uid && projectState.title) {
                    updateThumbnailWidth(user.uid, projectState.title, value).then(() => {
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
              projectState.type}
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
                {selectedDesign && selectedDesign.title === cloudFile && (
                  <Button
                    style={{ border: 'none', padding: '4px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (canvas && user.uid && projectState.title && cloudFile) {
                        updateDesign(
                          user.uid,
                          projectState.type,
                          projectState.title,
                          projectState.thumbnailWidth ?? 200,
                          cloudFile,
                          canvas,
                        ).then(() => {
                          setUpdateFlag(!updateFlag);
                        });
                      }
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
                      if (projectState.title) {
                        let url =
                          HOME_URL +
                          '?client=web&userid=' +
                          user.uid +
                          '&project=' +
                          encodeURIComponent(projectState.title);
                        if (selectedDesign) {
                          url += '&title=' + encodeURIComponent(selectedDesign.title);
                        }
                        navigator.clipboard
                          .writeText(url)
                          .then(() => showSuccess(t('projectListPanel.ProjectLinkGeneratedInClipBoard', lang) + '.'));
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
            {projectState.designs && projectState.designs.length > 1 && projectState.selectedProperty && (
              <Button
                style={{ border: 'none', padding: '4px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setCommonStore((state) => {
                    state.projectState.sortDescending = !state.projectState.sortDescending;
                  });
                }}
              >
                {projectState.sortDescending ? (
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
          bordered={descriptionTextAreaEditableRef.current}
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
              if (user.uid && isOwner && projectState.title) {
                updateDescription(user.uid, projectState.title, descriptionRef.current).then(() => {
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
          }}
        />
      ),
    },
  ];

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
              projectState.title +
              (isOwner ? '' : ' (' + t('word.Owner', lang) + ': ' + projectState.owner?.substring(0, 4) + '***)') +
              ' (' +
              projectDesigns.current.length +
              ')'}
          </span>
          <span
            style={{ cursor: 'pointer' }}
            onMouseDown={() => {
              closeProject();
            }}
            onTouchStart={() => {
              closeProject();
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
        {projectDesigns.current.length > 0 && (
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
              grid={{ column: imageColumns, gutter: 1 }}
              dataSource={projectDesigns.current}
              renderItem={(design) => {
                const lastSpaceIndex = design.title.lastIndexOf(' ');
                const labelDisplayLength =
                  projectState.thumbnailWidth === 100 ? 8 : projectState.thumbnailWidth === 125 ? 12 : 30;
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
                        opacity: hoveredDesign === design ? 0.5 : 1,
                        padding: '1px',
                        cursor: 'pointer',
                        borderRadius: selectedDesign === design ? '0' : '10px',
                        border: selectedDesign === design ? '2px solid red' : 'none',
                      }}
                      onDoubleClick={(event) => {
                        const target = event.target as HTMLImageElement;
                        if (target.src === ImageLoadFailureIcon) {
                          target.src = design.thumbnailUrl;
                        }
                        setSelectedDesign(design);
                        if (projectState.owner) {
                          loadCloudFile(projectState.owner, design.title, true, true).then(() => {
                            // ignore
                          });
                        }
                      }}
                      onClick={(event) => {
                        const target = event.target as HTMLImageElement;
                        if (target.src === ImageLoadFailureIcon) {
                          target.src = design.thumbnailUrl;
                        }
                        setSelectedDesign(design !== selectedDesign ? design : undefined);
                      }}
                    />
                    <div
                      style={{
                        position: 'relative',
                        left: '10px',
                        textAlign: 'left',
                        bottom: '18px',
                        color: 'white',
                        fontSize: '8px',
                        fontWeight: design.title === cloudFile ? 'bold' : 'normal',
                      }}
                    >
                      {design.title
                        ? design.title.length > labelDisplayLength
                          ? design.title.substring(0, Math.min(labelDisplayLength, lastSpaceIndex)) +
                            '...' +
                            design.title.substring(lastSpaceIndex)
                          : design.title
                        : 'Unknown'}
                    </div>
                    <div
                      style={{
                        position: 'relative',
                        right: '10px',
                        textAlign: 'right',
                        bottom: '36px',
                        color: 'white',
                      }}
                    >
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
                  </List.Item>
                );
              }}
            />
            <SolutionSpaceHeader>
              <span style={{ paddingLeft: '20px' }}>{t('projectPanel.SolutionSpace', lang)}</span>
              <span>
                {projectState.type === DesignProblem.SOLAR_PANEL_ARRAY && (
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
                    content={createChooseSolutionSolutionContent()}
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
                      saveSvgAsPng(d, 'design-space-' + projectState.title + '.png').then(() => {
                        showInfo(t('message.ScreenshotSaved', lang));
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
              steps={steps}
              variables={variables}
              titles={titles}
              units={units}
              digits={digits}
              tickIntegers={tickIntegers}
              hover={hover}
              hoveredIndex={projectState.designs && hoveredDesign ? projectState.designs.indexOf(hoveredDesign) : -1}
              selectedIndex={projectState.designs && selectedDesign ? projectState.designs.indexOf(selectedDesign) : -1}
            />
          </SubContainer>
        )}
      </ColumnWrapper>
    </Container>
  );
};

export default React.memo(ProjectGallery);
