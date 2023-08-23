/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import styled from 'styled-components';
import { Button, Checkbox, Col, Collapse, Input, List, Popover, Radio, Row, Select } from 'antd';
import i18n from '../i18n/i18n';
import {
  BgColorsOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  CheckCircleFilled,
  CloseOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  DotChartOutlined,
  EditFilled,
  EditOutlined,
  ImportOutlined,
  LineChartOutlined,
  LinkOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from '@ant-design/icons';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import ImageLoadFailureIcon from '../assets/image_fail_try_again.png';
import { DataColoring, DatumEntry, Design, DesignProblem, Orientation } from '../types';
import ParallelCoordinates from '../components/parallelCoordinates';
//@ts-ignore
import { saveSvgAsPng } from 'save-svg-as-png';
import { copyTextToClipboard, showInfo, showSuccess } from '../helpers';
import { Util } from '../Util';
import { ProjectUtil } from './ProjectUtil';
import { HOME_URL } from '../constants';
import {
  removeDesignFromProject,
  updateDataColoring,
  updateDescription,
  updateDesign,
  updateDesignVisibility,
  updateHiddenParameters,
  updateXAxisNameScatteredPlot,
  updateYAxisNameScatteredPlot,
} from '../cloudProjectUtil';
import { loadCloudFile } from '../cloudFileUtil';
import { CartesianGrid, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';

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
  const projectInfo = useStore(Selector.projectInfo);
  const solarPanelArrayLayoutConstraints = useStore(Selector.solarPanelArrayLayoutConstraints);
  const economicsParams = useStore(Selector.economicsParams);

  const [selectedDesign, setSelectedDesign] = useState<Design | undefined>();
  const [hoveredDesign, setHoveredDesign] = useState<Design | undefined>();
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [updateHiddenFlag, setUpdateHiddenFlag] = useState<boolean>(false);

  const descriptionTextAreaEditableRef = useRef<boolean>(false);
  const descriptionRef = useRef<string | null>(projectInfo.description ?? null);
  const descriptionChangedRef = useRef<boolean>(false);
  const descriptionExpandedRef = useRef<boolean>(false);
  const dataColoringSelectionRef = useRef<DataColoring>(projectInfo.dataColoring ?? DataColoring.ALL);
  const parameterSelectionChangedRef = useRef<boolean>(false);
  const projectDesigns = useRef<Design[]>(projectInfo.designs ?? []); // store sorted designs
  const xAxisRef = useRef<string>(projectInfo.xAxisNameScatteredPlot ?? 'rowWidth');
  const yAxisRef = useRef<string>(projectInfo.yAxisNameScatteredPlot ?? 'rowWidth');

  useEffect(() => {
    xAxisRef.current = projectInfo.xAxisNameScatteredPlot ?? 'rowWidth';
  }, [projectInfo.xAxisNameScatteredPlot]);

  useEffect(() => {
    yAxisRef.current = projectInfo.yAxisNameScatteredPlot ?? 'rowWidth';
  }, [projectInfo.yAxisNameScatteredPlot]);

  const lang = useMemo(() => {
    return { lng: language };
  }, [language]);

  const isOwner = user.uid === projectInfo.owner;

  useEffect(() => {
    projectDesigns.current = [];
    if (projectInfo.designs) {
      for (const design of projectInfo.designs) {
        projectDesigns.current.push(design);
      }
      const p = projectInfo.selectedProperty;
      if (p) {
        const prefix = projectInfo.sortDescending ? 1 : -1;
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
  }, [projectInfo.designs, projectInfo.sortDescending, projectInfo.selectedProperty]);

  useEffect(() => {
    if (projectInfo.designs) {
      for (const design of projectInfo.designs) {
        if (design.title === cloudFile) {
          setSelectedDesign(design);
          break;
        }
      }
    }
  }, [cloudFile, projectInfo.designs]);

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
      state.projectInfo.title = null;
      state.projectInfo.description = null;
      state.projectInfo.owner = null;
      // clear the cached images for the previously open project
      state.projectImages.clear();
    });
    setSelectedDesign(undefined);
    usePrimitiveStore.setState((state) => {
      state.projectImagesUpdateFlag = !state.projectImagesUpdateFlag;
    });
  };

  const curateCurrentDesign = () => {
    usePrimitiveStore.setState((state) => {
      state.curateDesignToProjectFlag = true;
    });
  };

  const removeSelectedDesign = () => {
    if (user.uid && projectInfo.title && selectedDesign) {
      removeDesignFromProject(user.uid, projectInfo.title, selectedDesign).then(() => {
        // delete the local copy as well
        setCommonStore((state) => {
          if (state.projectInfo.designs) {
            let index = -1;
            for (const [i, e] of state.projectInfo.designs.entries()) {
              if (e.title === selectedDesign.title) {
                index = i;
                break;
              }
            }
            if (index >= 0) {
              state.projectInfo.designs.splice(index, 1);
            }
          }
        });
      });
    }
  };

  const totalHeight = window.innerHeight;
  const imageWidth = Math.round((relativeWidth * window.innerWidth) / 4 - 12);

  const [variables, titles, units, digits, tickIntegers, types] = useMemo(
    () => [
      ProjectUtil.getVariables(projectInfo.type, projectInfo.hiddenParameters ?? []),
      ProjectUtil.getTitles(projectInfo.type, lang, projectInfo.hiddenParameters ?? []),
      ProjectUtil.getUnits(projectInfo.type, lang, projectInfo.hiddenParameters ?? []),
      ProjectUtil.getDigits(projectInfo.type, projectInfo.hiddenParameters ?? []),
      ProjectUtil.getTickIntegers(projectInfo.type, projectInfo.hiddenParameters ?? []),
      ProjectUtil.getTypes(projectInfo.type, projectInfo.hiddenParameters ?? []),
    ],
    [projectInfo.type, projectInfo.hiddenParameters, updateHiddenFlag, lang],
  );

  const data: DatumEntry[] = useMemo(() => {
    const data: DatumEntry[] = [];
    if (projectInfo.designs) {
      if (projectInfo.type === DesignProblem.SOLAR_PANEL_ARRAY) {
        for (const design of projectInfo.designs) {
          const d = {} as DatumEntry;
          if (!projectInfo.hiddenParameters?.includes('rowWidth')) d['rowWidth'] = design.rowsPerRack;
          if (!projectInfo.hiddenParameters?.includes('tiltAngle')) d['tiltAngle'] = Util.toDegrees(design.tiltAngle);
          if (!projectInfo.hiddenParameters?.includes('interRowSpacing')) d['interRowSpacing'] = design.interRowSpacing;
          if (!projectInfo.hiddenParameters?.includes('orientation'))
            d['orientation'] = design.orientation === Orientation.landscape ? 0 : 1;
          if (!projectInfo.hiddenParameters?.includes('poleHeight')) d['poleHeight'] = design.poleHeight;
          if (!projectInfo.hiddenParameters?.includes('unitCost')) d['unitCost'] = design.unitCost;
          if (!projectInfo.hiddenParameters?.includes('sellingPrice')) d['sellingPrice'] = design.sellingPrice;
          if (!projectInfo.hiddenParameters?.includes('panelCount')) d['panelCount'] = design.panelCount;
          if (!projectInfo.hiddenParameters?.includes('totalYearlyYield'))
            d['totalYearlyYield'] = design.yearlyYield * 0.001;
          if (!projectInfo.hiddenParameters?.includes('meanYearlyYield'))
            d['meanYearlyYield'] = design.yearlyYield / design.panelCount;
          if (!projectInfo.hiddenParameters?.includes('yearlyProfit')) d['yearlyProfit'] = Util.calculateProfit(design);
          d['group'] = projectInfo.dataColoring === DataColoring.INDIVIDUALS ? design.title : 'default';
          d['selected'] = selectedDesign === design;
          d['hovered'] = hoveredDesign === design;
          d['invisible'] = design.invisible;
          data.push(d);
        }
      }
    }
    return data;
  }, [
    projectInfo.designs,
    projectInfo.type,
    hoveredDesign,
    selectedDesign,
    economicsParams,
    projectInfo.hiddenParameters,
    projectInfo.dataColoring,
    updateHiddenFlag,
  ]);

  const getMin = (variable: string, defaultValue: number) => {
    let min = defaultValue;
    if (projectInfo.ranges) {
      for (const r of projectInfo.ranges) {
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
    if (projectInfo.ranges) {
      for (const r of projectInfo.ranges) {
        if (r.variable === variable) {
          max = r.maximum ?? defaultValue;
          break;
        }
      }
    }
    return max;
  };

  const minima: number[] = useMemo(() => {
    if (projectInfo.type === DesignProblem.SOLAR_PANEL_ARRAY && solarPanelArrayLayoutConstraints) {
      const array: number[] = [];
      if (!projectInfo.hiddenParameters?.includes('rowWidth'))
        array.push(getMin('rowWidth', solarPanelArrayLayoutConstraints.minimumRowsPerRack));
      if (!projectInfo.hiddenParameters?.includes('tiltAngle'))
        array.push(getMin('tiltAngle', Util.toDegrees(solarPanelArrayLayoutConstraints.minimumTiltAngle)));
      if (!projectInfo.hiddenParameters?.includes('interRowSpacing'))
        array.push(getMin('interRowSpacing', solarPanelArrayLayoutConstraints.minimumInterRowSpacing));
      if (!projectInfo.hiddenParameters?.includes('orientation')) array.push(0);
      if (!projectInfo.hiddenParameters?.includes('poleHeight')) array.push(getMin('poleHeight', 0));
      if (!projectInfo.hiddenParameters?.includes('unitCost')) array.push(getMin('unitCost', 0.1));
      if (!projectInfo.hiddenParameters?.includes('sellingPrice')) array.push(getMin('sellingPrice', 0.1));
      if (!projectInfo.hiddenParameters?.includes('panelCount')) array.push(getMin('panelCount', 0));
      if (!projectInfo.hiddenParameters?.includes('totalYearlyYield')) array.push(getMin('totalYearlyYield', 0)); // electricity output in MWh
      if (!projectInfo.hiddenParameters?.includes('meanYearlyYield')) array.push(getMin('meanYearlyYield', 0)); // electricity output in kWh
      if (!projectInfo.hiddenParameters?.includes('yearlyProfit')) array.push(getMin('yearlyProfit', -10)); // profit in $1,000
      return array;
    }
    return [];
  }, [
    solarPanelArrayLayoutConstraints,
    projectInfo.type,
    projectInfo.ranges,
    projectInfo.hiddenParameters,
    updateHiddenFlag,
  ]);

  const maxima: number[] = useMemo(() => {
    if (projectInfo.type === DesignProblem.SOLAR_PANEL_ARRAY && solarPanelArrayLayoutConstraints) {
      const array: number[] = [];
      if (!projectInfo.hiddenParameters?.includes('rowWidth'))
        array.push(getMax('rowWidth', solarPanelArrayLayoutConstraints.maximumRowsPerRack));
      if (!projectInfo.hiddenParameters?.includes('tiltAngle'))
        array.push(getMax('tiltAngle', Util.toDegrees(solarPanelArrayLayoutConstraints.maximumTiltAngle)));
      if (!projectInfo.hiddenParameters?.includes('interRowSpacing'))
        array.push(getMax('interRowSpacing', solarPanelArrayLayoutConstraints.maximumInterRowSpacing));
      if (!projectInfo.hiddenParameters?.includes('orientation')) array.push(1);
      if (!projectInfo.hiddenParameters?.includes('poleHeight')) array.push(getMax('poleHeight', 5));
      if (!projectInfo.hiddenParameters?.includes('unitCost')) array.push(getMax('unitCost', 1));
      if (!projectInfo.hiddenParameters?.includes('sellingPrice')) array.push(getMax('sellingPrice', 0.5));
      if (!projectInfo.hiddenParameters?.includes('panelCount')) array.push(getMax('panelCount', 300));
      if (!projectInfo.hiddenParameters?.includes('totalYearlyYield')) array.push(getMax('totalYearlyYield', 100)); // electricity output in MWh
      if (!projectInfo.hiddenParameters?.includes('meanYearlyYield')) array.push(getMax('meanYearlyYield', 1000)); // electricity output in kWh
      if (!projectInfo.hiddenParameters?.includes('yearlyProfit')) array.push(getMax('yearlyProfit', 10)); // profit in $1,000
      return array;
    }
    return [];
  }, [
    solarPanelArrayLayoutConstraints,
    projectInfo.type,
    projectInfo.ranges,
    projectInfo.hiddenParameters,
    updateHiddenFlag,
  ]);

  const steps: number[] = useMemo(() => {
    if (projectInfo.type === DesignProblem.SOLAR_PANEL_ARRAY && solarPanelArrayLayoutConstraints) {
      const array: number[] = [];
      if (!projectInfo.hiddenParameters?.includes('rowWidth')) array.push(1);
      if (!projectInfo.hiddenParameters?.includes('tiltAngle')) array.push(0.1);
      if (!projectInfo.hiddenParameters?.includes('interRowSpacing')) array.push(0.1);
      if (!projectInfo.hiddenParameters?.includes('orientation')) array.push(1);
      if (!projectInfo.hiddenParameters?.includes('poleHeight')) array.push(0.1);
      if (!projectInfo.hiddenParameters?.includes('unitCost')) array.push(0.01);
      if (!projectInfo.hiddenParameters?.includes('sellingPrice')) array.push(0.01);
      if (!projectInfo.hiddenParameters?.includes('panelCount')) array.push(1);
      if (!projectInfo.hiddenParameters?.includes('totalYearlyYield')) array.push(1); // electricity output in MWh
      if (!projectInfo.hiddenParameters?.includes('meanYearlyYield')) array.push(1); // electricity output in kWh
      if (!projectInfo.hiddenParameters?.includes('yearlyProfit')) array.push(0.1); // profit in $1,000
      return array;
    }
    return [];
  }, [projectInfo.type, projectInfo.hiddenParameters, updateHiddenFlag]);

  const rowWidthSelectionRef = useRef<boolean>(!projectInfo.hiddenParameters?.includes('rowWidth'));
  const tiltAngleSelectionRef = useRef<boolean>(!projectInfo.hiddenParameters?.includes('tiltAngle'));
  const rowSpacingSelectionRef = useRef<boolean>(!projectInfo.hiddenParameters?.includes('interRowSpacing'));
  const orientationSelectionRef = useRef<boolean>(!projectInfo.hiddenParameters?.includes('orientation'));
  const poleHeightSelectionRef = useRef<boolean>(!projectInfo.hiddenParameters?.includes('poleHeight'));
  const unitCostSelectionRef = useRef<boolean>(!projectInfo.hiddenParameters?.includes('unitCost'));
  const sellingPriceSelectionRef = useRef<boolean>(!projectInfo.hiddenParameters?.includes('sellingPrice'));
  const panelCountSelectionRef = useRef<boolean>(!projectInfo.hiddenParameters?.includes('panelCount'));
  const totalYieldSelectionRef = useRef<boolean>(!projectInfo.hiddenParameters?.includes('totalYearlyYield'));
  const meanYieldSelectionRef = useRef<boolean>(!projectInfo.hiddenParameters?.includes('meanYearlyYield'));
  const profitSelectionRef = useRef<boolean>(!projectInfo.hiddenParameters?.includes('yearlyProfit'));

  useEffect(() => {
    rowWidthSelectionRef.current = !projectInfo.hiddenParameters?.includes('rowWidth');
    tiltAngleSelectionRef.current = !projectInfo.hiddenParameters?.includes('tiltAngle');
    rowSpacingSelectionRef.current = !projectInfo.hiddenParameters?.includes('interRowSpacing');
    orientationSelectionRef.current = !projectInfo.hiddenParameters?.includes('orientation');
    poleHeightSelectionRef.current = !projectInfo.hiddenParameters?.includes('poleHeight');
    unitCostSelectionRef.current = !projectInfo.hiddenParameters?.includes('unitCost');
    sellingPriceSelectionRef.current = !projectInfo.hiddenParameters?.includes('sellingPrice');
    panelCountSelectionRef.current = !projectInfo.hiddenParameters?.includes('panelCount');
    totalYieldSelectionRef.current = !projectInfo.hiddenParameters?.includes('totalYearlyYield');
    meanYieldSelectionRef.current = !projectInfo.hiddenParameters?.includes('meanYearlyYield');
    profitSelectionRef.current = !projectInfo.hiddenParameters?.includes('yearlyProfit');
    setUpdateFlag(!updateFlag);
  }, [projectInfo.hiddenParameters]);

  useEffect(() => {
    descriptionRef.current = projectInfo.description;
  }, [projectInfo.description]);

  const hover = (i: number) => {
    if (projectInfo.designs) {
      if (i >= 0 && i < projectInfo.designs.length) {
        setHoveredDesign(projectInfo.designs[i]);
      }
    }
  };

  const localToggleDesignVisibility = (title: string) => {
    setCommonStore((state) => {
      if (state.projectInfo.designs) {
        for (const d of state.projectInfo.designs) {
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
      if (user.uid && projectInfo.title) {
        updateDesignVisibility(user.uid, projectInfo.title, design);
      }
    }
  };

  const localSelectParameter = (selected: boolean, parameter: string) => {
    setCommonStore((state) => {
      if (state.projectInfo.hiddenParameters) {
        if (selected) {
          if (state.projectInfo.hiddenParameters.includes(parameter)) {
            state.projectInfo.hiddenParameters.splice(state.projectInfo.hiddenParameters.indexOf(parameter), 1);
          }
        } else {
          if (!state.projectInfo.hiddenParameters.includes(parameter)) {
            state.projectInfo.hiddenParameters.push(parameter);
          }
        }
      }
    });
  };

  const selectParameter = (selected: boolean, parameter: string) => {
    parameterSelectionChangedRef.current = true;
    if (isOwner) {
      if (user.uid && projectInfo.title) {
        updateHiddenParameters(user.uid, projectInfo.title, parameter, !selected).then(() => {
          localSelectParameter(selected, parameter);
        });
      }
    } else {
      localSelectParameter(selected, parameter);
    }
  };

  const localSelectDataColoring = () => {
    setCommonStore((state) => {
      state.projectInfo.dataColoring = dataColoringSelectionRef.current;
    });
    usePrimitiveStore.setState((state) => {
      state.updateProjectsFlag = true;
    });
    setUpdateFlag(!updateFlag);
  };

  const selectDataColoring = (value: DataColoring) => {
    dataColoringSelectionRef.current = value;
    if (isOwner) {
      if (user.uid && projectInfo.title) {
        updateDataColoring(user.uid, projectInfo.title, dataColoringSelectionRef.current).then(() => {
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
          onChange={(e) => {
            rowWidthSelectionRef.current = e.target.checked;
            selectParameter(rowWidthSelectionRef.current, 'rowWidth');
            setUpdateHiddenFlag(!updateHiddenFlag);
          }}
          checked={rowWidthSelectionRef.current}
        >
          <span style={{ fontSize: '12px' }}>{i18n.t('polygonMenu.SolarPanelArrayRowWidth', lang)}</span>
        </Checkbox>
        <br />
        <Checkbox
          onChange={(e) => {
            tiltAngleSelectionRef.current = e.target.checked;
            selectParameter(tiltAngleSelectionRef.current, 'tiltAngle');
            setUpdateHiddenFlag(!updateHiddenFlag);
          }}
          checked={tiltAngleSelectionRef.current}
        >
          <span style={{ fontSize: '12px' }}>{i18n.t('polygonMenu.SolarPanelArrayTiltAngle', lang)}</span>
        </Checkbox>
        <br />
        <Checkbox
          onChange={(e) => {
            rowSpacingSelectionRef.current = e.target.checked;
            selectParameter(rowSpacingSelectionRef.current, 'interRowSpacing');
            setUpdateHiddenFlag(!updateHiddenFlag);
          }}
          checked={rowSpacingSelectionRef.current}
        >
          <span style={{ fontSize: '12px' }}>{i18n.t('polygonMenu.SolarPanelArrayRowSpacing', lang)}</span>
        </Checkbox>
        <br />
        <Checkbox
          onChange={(e) => {
            orientationSelectionRef.current = e.target.checked;
            selectParameter(orientationSelectionRef.current, 'orientation');
            setUpdateHiddenFlag(!updateHiddenFlag);
          }}
          checked={orientationSelectionRef.current}
        >
          <span style={{ fontSize: '12px' }}>{i18n.t('polygonMenu.SolarPanelArrayOrientation', lang)}</span>
        </Checkbox>
        <br />
        <Checkbox
          onChange={(e) => {
            poleHeightSelectionRef.current = e.target.checked;
            selectParameter(poleHeightSelectionRef.current, 'poleHeight');
            setUpdateHiddenFlag(!updateHiddenFlag);
          }}
          checked={poleHeightSelectionRef.current}
        >
          <span style={{ fontSize: '12px' }}>{i18n.t('polygonMenu.SolarPanelArrayPoleHeight', lang)}</span>
        </Checkbox>
        <br />
        <Checkbox
          onChange={(e) => {
            unitCostSelectionRef.current = e.target.checked;
            selectParameter(unitCostSelectionRef.current, 'unitCost');
            setUpdateHiddenFlag(!updateHiddenFlag);
          }}
          checked={unitCostSelectionRef.current}
        >
          <span style={{ fontSize: '12px' }}>{i18n.t('economicsPanel.UnitCost', lang)}</span>
        </Checkbox>
        <br />
        <Checkbox
          onChange={(e) => {
            sellingPriceSelectionRef.current = e.target.checked;
            selectParameter(sellingPriceSelectionRef.current, 'sellingPrice');
            setUpdateHiddenFlag(!updateHiddenFlag);
          }}
          checked={sellingPriceSelectionRef.current}
        >
          <span style={{ fontSize: '12px' }}>{i18n.t('economicsPanel.SellingPrice', lang)}</span>
        </Checkbox>
        <br />
        <Checkbox
          onChange={(e) => {
            panelCountSelectionRef.current = e.target.checked;
            selectParameter(panelCountSelectionRef.current, 'panelCount');
            setUpdateHiddenFlag(!updateHiddenFlag);
          }}
          checked={panelCountSelectionRef.current}
        >
          <span style={{ fontSize: '12px' }}>{i18n.t('polygonMenu.SolarPanelArrayPanelCount', lang)}</span>
        </Checkbox>
        <br />
        <Checkbox
          onChange={(e) => {
            totalYieldSelectionRef.current = e.target.checked;
            selectParameter(totalYieldSelectionRef.current, 'totalYearlyYield');
            setUpdateHiddenFlag(!updateHiddenFlag);
          }}
          checked={totalYieldSelectionRef.current}
        >
          <span style={{ fontSize: '12px' }}>{i18n.t('polygonMenu.SolarPanelArrayTotalYearlyYield', lang)}</span>
        </Checkbox>
        <br />
        <Checkbox
          onChange={(e) => {
            meanYieldSelectionRef.current = e.target.checked;
            selectParameter(meanYieldSelectionRef.current, 'meanYearlyYield');
            setUpdateHiddenFlag(!updateHiddenFlag);
          }}
          checked={meanYieldSelectionRef.current}
        >
          <span style={{ fontSize: '12px' }}>{i18n.t('polygonMenu.SolarPanelArrayMeanYearlyYield', lang)}</span>
        </Checkbox>
        <br />
        <Checkbox
          onChange={(e) => {
            profitSelectionRef.current = e.target.checked;
            selectParameter(profitSelectionRef.current, 'yearlyProfit');
            setUpdateHiddenFlag(!updateHiddenFlag);
          }}
          checked={profitSelectionRef.current}
        >
          <span style={{ fontSize: '12px' }}>{i18n.t('polygonMenu.SolarPanelArrayYearlyProfit', lang)}</span>
        </Checkbox>
      </div>
    );
  };

  const createAxisOptions = () => {
    return (
      <>
        <Option key={'rowWidth'} value={'rowWidth'}>
          <span style={{ fontSize: '12px' }}>{i18n.t('polygonMenu.SolarPanelArrayRowWidth', lang)}</span>
        </Option>
        <Option key={'tiltAngle'} value={'tiltAngle'}>
          <span style={{ fontSize: '12px' }}>{i18n.t('polygonMenu.SolarPanelArrayTiltAngle', lang)}</span>
        </Option>
        <Option key={'interRowSpacing'} value={'interRowSpacing'}>
          <span style={{ fontSize: '12px' }}>{i18n.t('polygonMenu.SolarPanelArrayRowSpacing', lang)}</span>
        </Option>
        <Option key={'orientation'} value={'orientation'}>
          <span style={{ fontSize: '12px' }}>{i18n.t('polygonMenu.SolarPanelArrayOrientation', lang)}</span>
        </Option>
        <Option key={'poleHeight'} value={'poleHeight'}>
          <span style={{ fontSize: '12px' }}>{i18n.t('polygonMenu.SolarPanelArrayPoleHeight', lang)}</span>
        </Option>
        <Option key={'unitCost'} value={'unitCost'}>
          <span style={{ fontSize: '12px' }}>{i18n.t('economicsPanel.UnitCost', lang)}</span>
        </Option>
        <Option key={'sellingPrice'} value={'sellingPrice'}>
          <span style={{ fontSize: '12px' }}>{i18n.t('economicsPanel.SellingPrice', lang)}</span>
        </Option>
        <Option key={'panelCount'} value={'panelCount'}>
          <span style={{ fontSize: '12px' }}>{i18n.t('polygonMenu.SolarPanelArrayPanelCount', lang)}</span>
        </Option>
        <Option key={'totalYearlyYield'} value={'totalYearlyYield'}>
          <span style={{ fontSize: '12px' }}>{i18n.t('polygonMenu.SolarPanelArrayTotalYearlyYield', lang)}</span>
        </Option>
        <Option key={'meanYearlyYield'} value={'meanYearlyYield'}>
          <span style={{ fontSize: '12px' }}>{i18n.t('polygonMenu.SolarPanelArrayMeanYearlyYield', lang)}</span>
        </Option>
        <Option key={'yearlProfit'} value={'yearlyProfit'}>
          <span style={{ fontSize: '12px' }}>{i18n.t('polygonMenu.SolarPanelArrayYearlyProfit', lang)}</span>
        </Option>
      </>
    );
  };

  const scatterData = useMemo(() => {
    const data: { x: number; y: number }[] = [];
    if (projectInfo.designs) {
      if (projectInfo.type === DesignProblem.SOLAR_PANEL_ARRAY) {
        for (const design of projectInfo.designs) {
          if (design.invisible || design === selectedDesign) continue;
          const d = {} as { x: number; y: number };
          ProjectUtil.setScatterData(xAxisRef.current, 'x', d, design);
          ProjectUtil.setScatterData(yAxisRef.current, 'y', d, design);
          data.push(d);
        }
      }
    }
    return data;
  }, [xAxisRef.current, yAxisRef.current, projectInfo.designs, projectInfo.type, selectedDesign]);

  const selectedData = useMemo(() => {
    const data: { x: number; y: number }[] = [];
    if (projectInfo.designs) {
      if (projectInfo.type === DesignProblem.SOLAR_PANEL_ARRAY) {
        for (const design of projectInfo.designs) {
          if (design !== selectedDesign) continue;
          const d = {} as { x: number; y: number };
          ProjectUtil.setScatterData(xAxisRef.current, 'x', d, design);
          ProjectUtil.setScatterData(yAxisRef.current, 'y', d, design);
          data.push(d);
        }
      }
    }
    return data;
  }, [xAxisRef.current, yAxisRef.current, projectInfo.designs, projectInfo.type, selectedDesign]);

  const getBound = (axisName: string) => {
    const bound: { min: number; max: number } = { min: 0, max: 1 };
    if (projectInfo.type === DesignProblem.SOLAR_PANEL_ARRAY && solarPanelArrayLayoutConstraints) {
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
        case 'panelCount':
          bound.min = getMin('panelCount', 0);
          bound.max = getMax('panelCount', 300);
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
  }, [xAxisRef.current, projectInfo.ranges]);

  const yMinMax = useMemo(() => {
    return getBound(yAxisRef.current);
  }, [yAxisRef.current, projectInfo.ranges]);

  const xUnit = useMemo(() => {
    return ProjectUtil.getUnit(xAxisRef.current, lang);
  }, [xAxisRef.current, lang]);

  const yUnit = useMemo(() => {
    return ProjectUtil.getUnit(yAxisRef.current, lang);
  }, [yAxisRef.current, lang]);

  const createScatteredPlotContent = () => {
    return (
      <div style={{ width: '280px' }}>
        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col span={8} style={{ paddingTop: '5px' }}>
            <span style={{ fontSize: '12px' }}>{i18n.t('projectPanel.SelectXAxis', lang)}: </span>
          </Col>
          <Col span={16}>
            <Select
              style={{ width: '100%' }}
              value={xAxisRef.current}
              onChange={(value) => {
                xAxisRef.current = value;
                if (user.uid && projectInfo.title) {
                  updateXAxisNameScatteredPlot(user.uid, projectInfo.title, value).then(() => {
                    //ignore
                  });
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
            <span style={{ fontSize: '12px' }}>{i18n.t('projectPanel.SelectYAxis', lang)}: </span>
          </Col>
          <Col span={16}>
            <Select
              style={{ width: '100%' }}
              value={yAxisRef.current}
              onChange={(value) => {
                yAxisRef.current = value;
                if (user.uid && projectInfo.title) {
                  updateYAxisNameScatteredPlot(user.uid, projectInfo.title, value).then(() => {
                    //ignore
                  });
                }
                setUpdateFlag(!updateFlag);
              }}
            >
              {createAxisOptions()}
            </Select>
          </Col>
        </Row>
        <Row style={{ paddingBottom: '8px' }}>
          <ScatterChart
            width={280}
            height={240}
            margin={{
              top: 0,
              right: 0,
              bottom: -10,
              left: -10,
            }}
          >
            <CartesianGrid strokeWidth="1" stroke={'gray'} />
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
            <Scatter name="All" data={scatterData} fill="#8884d8" />
            {selectedDesign && <Scatter name="Selected" data={selectedData} fill="red" shape={'star'} />}
          </ScatterChart>
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
          value={projectInfo.dataColoring ?? DataColoring.ALL}
        >
          <Radio style={{ fontSize: '12px' }} value={DataColoring.ALL}>
            {i18n.t('projectPanel.SameColorForAllDesigns', lang)}
          </Radio>
          <br />
          <Radio style={{ fontSize: '12px' }} value={DataColoring.INDIVIDUALS}>
            {i18n.t('projectPanel.OneColorForEachDesign', lang)}
          </Radio>
        </Radio.Group>
      </div>
    );
  };

  return (
    <Container>
      <ColumnWrapper>
        <Header>
          <span>
            {(isOwner ? i18n.t('projectPanel.Project', lang) : i18n.t('projectPanel.ProjectByOtherPeople', lang)) +
              ': ' +
              projectInfo.title +
              (isOwner ? '' : ' (' + i18n.t('word.Owner', lang) + ': ' + projectInfo.owner?.substring(0, 4) + '***)')}
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
            <CloseOutlined title={i18n.t('word.Close', lang)} />
          </span>
        </Header>
        <Collapse
          style={{ backgroundColor: 'white', border: 'none' }}
          onChange={(e) => {
            descriptionExpandedRef.current = e.length > 0;
            setUpdateFlag(!updateFlag);
          }}
        >
          <Collapse.Panel
            style={{ backgroundColor: 'white', border: 'none' }}
            key={'1'}
            header={
              <SubHeader>
                <span>
                  {i18n.t('projectPanel.ProjectDescription', lang) +
                    ' | ' +
                    i18n.t('projectPanel.ProjectType', lang) +
                    ': ' +
                    projectInfo.type}
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
                              title={i18n.t('projectPanel.MakeDescriptionNonEditable', lang)}
                            />
                          ) : (
                            <EditOutlined
                              style={{ fontSize: '24px', color: 'gray' }}
                              title={i18n.t('projectPanel.MakeDescriptionEditable', lang)}
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
                          title={i18n.t('projectPanel.CurateCurrentDesign', lang)}
                        />
                      </Button>
                      {selectedDesign && selectedDesign.title === cloudFile && (
                        <Button
                          style={{ border: 'none', padding: '4px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canvas && user.uid && projectInfo.title && cloudFile) {
                              updateDesign(user.uid, projectInfo.type, projectInfo.title, cloudFile, canvas).then(
                                () => {
                                  setUpdateFlag(!updateFlag);
                                },
                              );
                            }
                          }}
                        >
                          <CloudUploadOutlined
                            style={{ fontSize: '24px', color: 'gray' }}
                            title={i18n.t('projectPanel.UpdateSelectedDesign', lang)}
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
                            title={i18n.t('projectPanel.RemoveSelectedDesign', lang)}
                          />
                        </Button>
                      )}
                      {selectedDesign && (
                        <Button
                          style={{ border: 'none', padding: '4px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (projectInfo.title) {
                              let url =
                                HOME_URL +
                                '?client=web&userid=' +
                                user.uid +
                                '&project=' +
                                encodeURIComponent(projectInfo.title);
                              if (selectedDesign) {
                                url += '&title=' + encodeURIComponent(selectedDesign.title);
                              }
                              copyTextToClipboard(url);
                              showSuccess(i18n.t('projectListPanel.ProjectLinkGeneratedInClipBoard', lang) + '.');
                            }
                          }}
                        >
                          <LinkOutlined
                            style={{ fontSize: '24px', color: 'gray' }}
                            title={i18n.t('projectListPanel.GenerateProjectLink', lang)}
                          />
                        </Button>
                      )}
                    </>
                  )}
                  {projectInfo.designs && projectInfo.designs.length > 1 && projectInfo.selectedProperty && (
                    <Button
                      style={{ border: 'none', padding: '4px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCommonStore((state) => {
                          state.projectInfo.sortDescending = !state.projectInfo.sortDescending;
                        });
                      }}
                    >
                      {projectInfo.sortDescending ? (
                        <SortAscendingOutlined
                          style={{ fontSize: '24px', color: 'gray' }}
                          title={i18n.t('projectPanel.ClickToFlipSortingOrder', lang)}
                        />
                      ) : (
                        <SortDescendingOutlined
                          style={{ fontSize: '24px', color: 'gray' }}
                          title={i18n.t('projectPanel.ClickToFlipSortingOrder', lang)}
                        />
                      )}
                    </Button>
                  )}
                </span>
              </SubHeader>
            }
          >
            <TextArea
              title={
                descriptionTextAreaEditableRef.current
                  ? undefined
                  : i18n.t('projectPanel.DoubleClickToMakeDescriptionEditable', lang)
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
                  state.projectInfo.description = e.target.value;
                });
                setUpdateFlag(!updateFlag);
              }}
              onBlur={() => {
                descriptionTextAreaEditableRef.current = false;
                if (descriptionChangedRef.current) {
                  if (user.uid && isOwner && projectInfo.title) {
                    updateDescription(user.uid, projectInfo.title, descriptionRef.current).then(() => {
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
          </Collapse.Panel>
        </Collapse>
        {projectDesigns.current.length > 0 && (
          <SubContainer>
            <List
              style={{
                width: '100%',
                height: totalHeight / 2 - 80,
                paddingLeft: '4px',
                paddingRight: '4px',
                overflowX: 'hidden',
                overflowY: 'auto',
              }}
              grid={{ column: 4, gutter: 1 }}
              dataSource={projectDesigns.current}
              renderItem={(design) => (
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
                      usePrimitiveStore.setState((state) => {
                        state.projectImagesUpdateFlag = !state.projectImagesUpdateFlag;
                      });
                    }}
                    alt={design.title}
                    title={
                      selectedDesign === design
                        ? i18n.t('projectPanel.SingleClickToDeselectDoubleClickToOpen', lang)
                        : i18n.t('projectPanel.SingleClickToSelectDoubleClickToOpen', lang)
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
                      if (projectInfo.owner) {
                        loadCloudFile(projectInfo.owner, design.title, true, true).then(() => {
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
                    onContextMenu={(event) => {
                      event.stopPropagation();
                    }}
                  />
                  <div
                    style={{
                      position: 'relative',
                      left: '8px',
                      textAlign: 'left',
                      bottom: '18px',
                      color: 'white',
                      fontSize: '8px',
                      fontWeight: 'bold',
                    }}
                  >
                    {design.title
                      ? design.title.length > 30
                        ? design.title.substring(0, 30) + '...'
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
                    {design.invisible ? (
                      <CheckCircleOutlined
                        onClick={() => {
                          toggleDesignVisibility(design);
                        }}
                        style={{ fontSize: '16px' }}
                        title={i18n.t('projectPanel.DesignNotShownInSolutionSpaceClickToShow', lang)}
                      />
                    ) : (
                      <CheckCircleFilled
                        onClick={() => {
                          toggleDesignVisibility(design);
                        }}
                        style={{ fontSize: '16px' }}
                        title={i18n.t('projectPanel.DesignShownInSolutionSpaceClickToHide', lang)}
                      />
                    )}
                  </div>
                </List.Item>
              )}
            />
            <SolutionSpaceHeader>
              <span style={{ paddingLeft: '20px' }}>{i18n.t('projectPanel.DistributionInSolutionSpace', lang)}</span>
              <span>
                {projectInfo.type === DesignProblem.SOLAR_PANEL_ARRAY && (
                  <Popover
                    title={i18n.t('projectPanel.ChooseSolutionSpace', lang)}
                    onVisibleChange={(visible) => {
                      if (parameterSelectionChangedRef.current) {
                        if (!visible) {
                          usePrimitiveStore.setState((state) => {
                            state.updateProjectsFlag = true;
                          });
                        }
                        parameterSelectionChangedRef.current = false;
                      }
                    }}
                    content={createChooseSolutionSolutionContent()}
                  >
                    <Button style={{ border: 'none', paddingRight: 0, background: 'white' }}>
                      <LineChartOutlined style={{ fontSize: '24px', color: 'gray' }} />
                    </Button>
                  </Popover>
                )}
                <Popover
                  title={i18n.t('projectPanel.GenerateScatteredPlot', lang)}
                  content={createScatteredPlotContent()}
                >
                  <Button style={{ border: 'none', paddingRight: 0, background: 'white' }}>
                    <DotChartOutlined style={{ fontSize: '24px', color: 'gray' }} />
                  </Button>
                </Popover>
                <Popover
                  title={i18n.t('projectPanel.ChooseDataColoring', lang)}
                  content={createChooseDataColoringContent()}
                >
                  <Button style={{ border: 'none', paddingRight: 0, background: 'white' }}>
                    <BgColorsOutlined style={{ fontSize: '24px', color: 'gray' }} />
                  </Button>
                </Popover>
                <Button
                  style={{ border: 'none', paddingRight: '20px', background: 'white' }}
                  onClick={() => {
                    const d = document.getElementById('design-space');
                    if (d) {
                      saveSvgAsPng(d, 'design-space-' + projectInfo.title + '.png').then(() => {
                        showInfo(i18n.t('message.ScreenshotSaved', lang));
                      });
                    }
                  }}
                >
                  <CameraOutlined
                    style={{ fontSize: '24px', color: 'gray' }}
                    title={i18n.t('projectPanel.SolutionSpaceScreenshot', lang)}
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
              hoveredIndex={projectInfo.designs && hoveredDesign ? projectInfo.designs.indexOf(hoveredDesign) : -1}
            />
          </SubContainer>
        )}
      </ColumnWrapper>
    </Container>
  );
};

export default React.memo(ProjectGallery);
