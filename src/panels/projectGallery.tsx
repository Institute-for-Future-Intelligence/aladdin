/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import styled from 'styled-components';
import { Collapse, Button, Input, List, Popover, Checkbox } from 'antd';
import i18n from '../i18n/i18n';
import {
  LineChartOutlined,
  CameraOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditFilled,
  EditOutlined,
  ImportOutlined,
  LinkOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import ImageLoadFailureIcon from '../assets/image_fail_try_again.png';
import { DatumEntry, Design, DesignProblem, Orientation } from '../types';
import ParallelCoordinates from '../components/parallelCoordinates';
//@ts-ignore
import { saveSvgAsPng } from 'save-svg-as-png';
import { copyTextToClipboard, showInfo, showSuccess } from '../helpers';
import { Util } from '../Util';
import { ProjectUtil } from './ProjectUtil';
import { HOME_URL } from '../constants';

const { TextArea } = Input;

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
  alignment: center;
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
  images: Map<string, HTMLImageElement>;
  openCloudFile?: (userid: string, title: string, popState?: boolean) => void;
  deleteDesign?: (userid: string, projectTitle: string, design: Design) => void;
  updateProjectDescription?: (userid: string, projectTitle: string, description: string | null) => void;
  updateProjectParameters?: (userid: string, projectTitle: string, hiddenParameter: string, add: boolean) => void;
  updateProjectDesign?: (
    userid: string,
    projectType: string,
    projectTitle: string,
    designTitle: string,
    canvas: HTMLCanvasElement | null,
  ) => void;
}

const ProjectGallery = ({
  relativeWidth,
  canvas,
  images,
  openCloudFile,
  deleteDesign,
  updateProjectDescription,
  updateProjectParameters,
  updateProjectDesign,
}: ProjectGalleryProps) => {
  const setCommonStore = useStore(Selector.set);
  const user = useStore(Selector.user);
  const language = useStore(Selector.language);
  const cloudFile = useStore(Selector.cloudFile);
  const projectOwner = useStore(Selector.projectOwner);
  const projectTitle = useStore(Selector.projectTitle);
  const projectDescription = useStore(Selector.projectDescription);
  const projectDesigns = useStore(Selector.projectDesigns);
  const projectHiddenParameters = useStore(Selector.projectHiddenParameters);
  const projectType = useStore(Selector.projectType);
  const solarPanelArrayLayoutConstraints = useStore(Selector.solarPanelArrayLayoutConstraints);
  const economicsParams = useStore(Selector.economicsParams);

  const [selectedDesign, setSelectedDesign] = useState<Design | undefined>();
  const [hoveredDesign, setHoveredDesign] = useState<Design | undefined>();
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [updateHiddenFlag, setUpdateHiddenFlag] = useState<boolean>(false);

  const descriptionTextAreaEditableRef = useRef<boolean>(false);
  const descriptionRef = useRef<string | null>(projectDescription);
  const descriptionChangedRef = useRef<boolean>(false);
  const descriptionExpandedRef = useRef<boolean>(false);

  const lang = useMemo(() => {
    return { lng: language };
  }, [language]);

  useEffect(() => {
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

  const closeProject = () => {
    setCommonStore((state) => {
      state.projectView = false;
      state.projectTitle = null;
      state.projectDescription = null;
      state.projectOwner = null;
    });
    setSelectedDesign(undefined);
    // clear the cached images for the previously open project
    images?.clear();
    usePrimitiveStore.setState((state) => {
      state.projectImagesUpdateFlag = !state.projectImagesUpdateFlag;
    });
  };

  const curateCurrentDesign = () => {
    usePrimitiveStore.setState((state) => {
      state.curateDesignToProjectFlag = !state.curateDesignToProjectFlag;
    });
  };

  const removeSelectedDesign = () => {
    if (user.uid && projectTitle && deleteDesign && selectedDesign) {
      deleteDesign(user.uid, projectTitle, selectedDesign);
      setCommonStore((state) => {
        if (state.projectDesigns) {
          let index = -1;
          for (const [i, e] of state.projectDesigns.entries()) {
            if (e.title === selectedDesign.title) {
              index = i;
              break;
            }
          }
          if (index >= 0) {
            state.projectDesigns?.splice(index, 1);
          }
        }
      });
    }
  };

  const totalHeight = window.innerHeight;
  const imageWidth = Math.round((relativeWidth * window.innerWidth) / 4 - 12);

  const variables: string[] = useMemo(
    () => ProjectUtil.getVariables(projectType, projectHiddenParameters),
    [projectType, projectHiddenParameters, updateHiddenFlag],
  );
  const titles: string[] = useMemo(
    () => ProjectUtil.getTitles(projectType, lang, projectHiddenParameters),
    [projectType, lang, projectHiddenParameters, updateHiddenFlag],
  );
  const units: string[] = useMemo(
    () => ProjectUtil.getUnits(projectType, lang, projectHiddenParameters),
    [projectType, lang, projectHiddenParameters, updateHiddenFlag],
  );
  const digits: number[] = useMemo(
    () => ProjectUtil.getDigits(projectType, projectHiddenParameters),
    [projectType, projectHiddenParameters, updateHiddenFlag],
  );
  const types: string[] = useMemo(
    () => ProjectUtil.getTypes(projectType, projectHiddenParameters),
    [projectType, projectHiddenParameters, updateHiddenFlag],
  );

  const data: DatumEntry[] = useMemo(() => {
    const data: DatumEntry[] = [];
    if (projectDesigns) {
      if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) {
        for (const design of projectDesigns) {
          const unitCost = design.unitCost !== undefined ? design.unitCost : economicsParams.operationalCostPerUnit;
          const sellingPrice =
            design.sellingPrice !== undefined ? design.sellingPrice : economicsParams.electricitySellingPrice;
          const d = {} as DatumEntry;
          if (!projectHiddenParameters.includes('rowWidth')) d['rowWidth'] = design.rowsPerRack;
          if (!projectHiddenParameters.includes('tiltAngle')) d['tiltAngle'] = Util.toDegrees(design.tiltAngle);
          if (!projectHiddenParameters.includes('interRowSpacing')) d['interRowSpacing'] = design.interRowSpacing;
          if (!projectHiddenParameters.includes('orientation'))
            d['orientation'] = design.orientation === Orientation.landscape ? 0 : 1;
          if (!projectHiddenParameters.includes('poleHeight')) d['poleHeight'] = design.poleHeight;
          if (!projectHiddenParameters.includes('unitCost')) d['unitCost'] = unitCost;
          if (!projectHiddenParameters.includes('sellingPrice')) d['sellingPrice'] = sellingPrice;
          if (!projectHiddenParameters.includes('panelCount')) d['panelCount'] = design.panelCount;
          if (!projectHiddenParameters.includes('yield')) d['yield'] = design.yearlyYield * 0.001;
          if (!projectHiddenParameters.includes('profit'))
            d['profit'] = (design.yearlyYield * sellingPrice - design.panelCount * unitCost * 365) * 0.001;
          d['group'] = 'default';
          d['selected'] = selectedDesign === design;
          d['hovered'] = hoveredDesign === design;
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
    projectHiddenParameters,
    updateHiddenFlag,
  ]);

  const minima: number[] = useMemo(() => {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY && solarPanelArrayLayoutConstraints) {
      const array: number[] = [];
      if (!projectHiddenParameters.includes('rowWidth'))
        array.push(solarPanelArrayLayoutConstraints.minimumRowsPerRack);
      if (!projectHiddenParameters.includes('tiltAngle'))
        array.push(Util.toDegrees(solarPanelArrayLayoutConstraints.minimumTiltAngle));
      if (!projectHiddenParameters.includes('interRowSpacing'))
        array.push(solarPanelArrayLayoutConstraints.minimumInterRowSpacing);
      if (!projectHiddenParameters.includes('orientation')) array.push(0);
      if (!projectHiddenParameters.includes('poleHeight')) array.push(0);
      if (!projectHiddenParameters.includes('unitCost')) array.push(0.1);
      if (!projectHiddenParameters.includes('sellingPrice')) array.push(0.1);
      if (!projectHiddenParameters.includes('panelCount')) array.push(0);
      if (!projectHiddenParameters.includes('yield')) array.push(0); // electricity output in MWh
      if (!projectHiddenParameters.includes('profit')) array.push(-10); // profit in $1,000
      return array;
    }
    return [];
  }, [solarPanelArrayLayoutConstraints, projectType, projectHiddenParameters, updateHiddenFlag]);

  const maxima: number[] = useMemo(() => {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY && solarPanelArrayLayoutConstraints) {
      const array: number[] = [];
      if (!projectHiddenParameters.includes('rowWidth'))
        array.push(solarPanelArrayLayoutConstraints.maximumRowsPerRack);
      if (!projectHiddenParameters.includes('tiltAngle'))
        array.push(Util.toDegrees(solarPanelArrayLayoutConstraints.maximumTiltAngle));
      if (!projectHiddenParameters.includes('interRowSpacing'))
        array.push(solarPanelArrayLayoutConstraints.maximumInterRowSpacing);
      if (!projectHiddenParameters.includes('orientation')) array.push(1);
      if (!projectHiddenParameters.includes('poleHeight')) array.push(5);
      if (!projectHiddenParameters.includes('unitCost')) array.push(1);
      if (!projectHiddenParameters.includes('sellingPrice')) array.push(0.5);
      if (!projectHiddenParameters.includes('panelCount')) array.push(300);
      if (!projectHiddenParameters.includes('yield')) array.push(100); // electricity output in MWh
      if (!projectHiddenParameters.includes('profit')) array.push(10); // profit in $1,000
      return array;
    }
    return [];
  }, [solarPanelArrayLayoutConstraints, projectType, projectHiddenParameters, updateHiddenFlag]);

  const rowWidthSelectionRef = useRef<boolean>(!projectHiddenParameters.includes('rowWidth'));
  const tiltAngleSelectionRef = useRef<boolean>(!projectHiddenParameters.includes('tiltAngle'));
  const rowSpacingSelectionRef = useRef<boolean>(!projectHiddenParameters.includes('interRowSpacing'));
  const orientationSelectionRef = useRef<boolean>(!projectHiddenParameters.includes('orientation'));
  const poleHeightSelectionRef = useRef<boolean>(!projectHiddenParameters.includes('poleHeight'));
  const unitCostSelectionRef = useRef<boolean>(!projectHiddenParameters.includes('unitCost'));
  const sellingPriceSelectionRef = useRef<boolean>(!projectHiddenParameters.includes('sellingPrice'));
  const panelCountSelectionRef = useRef<boolean>(!projectHiddenParameters.includes('panelCount'));
  const yieldSelectionRef = useRef<boolean>(!projectHiddenParameters.includes('yield'));
  const profitSelectionRef = useRef<boolean>(!projectHiddenParameters.includes('profit'));

  useEffect(() => {
    rowWidthSelectionRef.current = !projectHiddenParameters.includes('rowWidth');
    tiltAngleSelectionRef.current = !projectHiddenParameters.includes('tiltAngle');
    rowSpacingSelectionRef.current = !projectHiddenParameters.includes('interRowSpacing');
    orientationSelectionRef.current = !projectHiddenParameters.includes('orientation');
    poleHeightSelectionRef.current = !projectHiddenParameters.includes('poleHeight');
    unitCostSelectionRef.current = !projectHiddenParameters.includes('unitCost');
    sellingPriceSelectionRef.current = !projectHiddenParameters.includes('sellingPrice');
    panelCountSelectionRef.current = !projectHiddenParameters.includes('panelCount');
    yieldSelectionRef.current = !projectHiddenParameters.includes('yield');
    profitSelectionRef.current = !projectHiddenParameters.includes('profit');
    setUpdateFlag(!updateFlag);
  }, [projectHiddenParameters]);

  useEffect(() => {
    descriptionRef.current = projectDescription;
  }, [projectDescription]);

  const hover = (i: number) => {
    if (projectDesigns) {
      if (i >= 0 && i < projectDesigns.length) {
        setHoveredDesign(projectDesigns[i]);
      }
    }
  };

  const selectParameter = (selected: boolean, parameter: string) => {
    if (updateProjectParameters) {
      if (user.uid && projectOwner === user.uid && projectTitle) {
        updateProjectParameters(user.uid, projectTitle, parameter, !selected);
      }
    }
    setCommonStore((state) => {
      if (selected) {
        if (state.projectHiddenParameters.includes(parameter)) {
          state.projectHiddenParameters.splice(state.projectHiddenParameters.indexOf(parameter), 1);
        }
      } else {
        if (!state.projectHiddenParameters.includes(parameter)) {
          state.projectHiddenParameters.push(parameter);
        }
      }
    });
  };

  const isProjectDesign = useMemo(() => {
    if (cloudFile && projectDesigns) {
      for (const design of projectDesigns) {
        if (cloudFile === design.title) {
          return true;
        }
      }
    }
    return false;
  }, [cloudFile, projectDesigns]);

  return (
    <Container>
      <ColumnWrapper>
        <Header>
          <span>
            {i18n.t('projectPanel.Project', lang) +
              ': ' +
              projectTitle +
              (projectOwner === user.uid
                ? ''
                : ' (' + i18n.t('word.Owner', lang) + ': ' + projectOwner?.substring(0, 4) + '***)')}
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
                    projectType}
                </span>
                <span>
                  {user.uid === projectOwner && (
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
                      {isProjectDesign && (
                        <Button
                          style={{ border: 'none', padding: '4px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canvas && updateProjectDesign && user.uid && projectTitle && cloudFile) {
                              updateProjectDesign(user.uid, projectType, projectTitle, cloudFile, canvas);
                            }
                          }}
                        >
                          <UploadOutlined
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
                            if (projectTitle) {
                              let url =
                                HOME_URL +
                                '?client=web&userid=' +
                                user.uid +
                                '&project=' +
                                encodeURIComponent(projectTitle);
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
                  state.projectDescription = e.target.value;
                });
                setUpdateFlag(!updateFlag);
              }}
              onBlur={() => {
                descriptionTextAreaEditableRef.current = false;
                if (descriptionChangedRef.current) {
                  if (updateProjectDescription) {
                    if (user.uid && projectOwner === user.uid && projectTitle) {
                      updateProjectDescription(user.uid, projectTitle, descriptionRef.current);
                    }
                  }
                  descriptionChangedRef.current = false;
                }
                setUpdateFlag(!updateFlag);
              }}
              style={{
                paddingLeft: '10px',
                textAlign: 'left',
                resize: descriptionTextAreaEditableRef.current ? 'vertical' : 'none',
              }}
            />
          </Collapse.Panel>
        </Collapse>
        {projectDesigns && (
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
              dataSource={projectDesigns}
              renderItem={(design) => (
                <List.Item
                  style={{ marginBottom: '-6px' }}
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
                      images.set(design.title, event.target as HTMLImageElement);
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
                      if (projectOwner && openCloudFile) {
                        openCloudFile(projectOwner, design.title, true);
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
                </List.Item>
              )}
            />
            <SolutionSpaceHeader>
              <span style={{ paddingLeft: '20px' }}>{i18n.t('projectPanel.DistributionInSolutionSpace', lang)}</span>
              <span>
                {projectType === DesignProblem.SOLAR_PANEL_ARRAY && (
                  <Popover
                    content={
                      <div>
                        <label style={{ fontWeight: 'bold' }}>{i18n.t('projectPanel.ChooseSolutionSpace', lang)}</label>
                        <hr />
                        <Checkbox
                          onChange={(e) => {
                            rowWidthSelectionRef.current = e.target.checked;
                            selectParameter(rowWidthSelectionRef.current, 'rowWidth');
                            setUpdateHiddenFlag(!updateHiddenFlag);
                          }}
                          checked={rowWidthSelectionRef.current}
                        >
                          <span style={{ fontSize: '12px' }}>
                            {i18n.t('polygonMenu.SolarPanelArrayRowWidth', lang)}
                          </span>
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
                          <span style={{ fontSize: '12px' }}>
                            {i18n.t('polygonMenu.SolarPanelArrayTiltAngle', lang)}
                          </span>
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
                          <span style={{ fontSize: '12px' }}>
                            {i18n.t('polygonMenu.SolarPanelArrayRowSpacing', lang)}
                          </span>
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
                          <span style={{ fontSize: '12px' }}>
                            {i18n.t('polygonMenu.SolarPanelArrayOrientation', lang)}
                          </span>
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
                          <span style={{ fontSize: '12px' }}>
                            {i18n.t('polygonMenu.SolarPanelArrayPoleHeight', lang)}
                          </span>
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
                          <span style={{ fontSize: '12px' }}>
                            {i18n.t('polygonMenu.SolarPanelArrayPanelCount', lang)}
                          </span>
                        </Checkbox>
                        <br />
                        <Checkbox
                          onChange={(e) => {
                            yieldSelectionRef.current = e.target.checked;
                            selectParameter(yieldSelectionRef.current, 'yield');
                            setUpdateHiddenFlag(!updateHiddenFlag);
                          }}
                          checked={yieldSelectionRef.current}
                        >
                          <span style={{ fontSize: '12px' }}>{i18n.t('polygonMenu.SolarPanelArrayYield', lang)}</span>
                        </Checkbox>
                        <br />
                        <Checkbox
                          onChange={(e) => {
                            profitSelectionRef.current = e.target.checked;
                            selectParameter(profitSelectionRef.current, 'profit');
                            setUpdateHiddenFlag(!updateHiddenFlag);
                          }}
                          checked={profitSelectionRef.current}
                        >
                          <span style={{ fontSize: '12px' }}>{i18n.t('polygonMenu.SolarPanelArrayProfit', lang)}</span>
                        </Checkbox>
                      </div>
                    }
                  >
                    <Button style={{ border: 'none', paddingRight: 0, background: 'white' }} onClick={() => {}}>
                      <LineChartOutlined style={{ fontSize: '24px', color: 'gray' }} />
                    </Button>
                  </Popover>
                )}
                <Button
                  style={{ border: 'none', paddingRight: '20px', background: 'white' }}
                  onClick={() => {
                    const d = document.getElementById('design-space');
                    if (d) {
                      saveSvgAsPng(d, 'design-space-' + projectTitle + '.png').then(() => {
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
              variables={variables}
              titles={titles}
              units={units}
              digits={digits}
              hover={hover}
              hoveredIndex={projectDesigns && hoveredDesign ? projectDesigns.indexOf(hoveredDesign) : -1}
            />
          </SubContainer>
        )}
      </ColumnWrapper>
    </Container>
  );
};

export default React.memo(ProjectGallery);
