/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import styled from 'styled-components';
import { Button, Checkbox, Collapse, Input, List, Popover, Radio } from 'antd';
import i18n from '../i18n/i18n';
import {
  BgColorsOutlined,
  CameraOutlined,
  CloseOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
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
  updateHiddenParameters,
} from '../cloudProjectUtil';
import { loadCloudFile } from '../cloudFileUtil';

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

  const lang = useMemo(() => {
    return { lng: language };
  }, [language]);

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
      state.curateDesignToProjectFlag = !state.curateDesignToProjectFlag;
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
      ProjectUtil.getVariables(projectInfo.type, projectInfo.hiddenParameters ?? []),
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
          const unitCost = design.unitCost !== undefined ? design.unitCost : economicsParams.operationalCostPerUnit;
          const sellingPrice =
            design.sellingPrice !== undefined ? design.sellingPrice : economicsParams.electricitySellingPrice;
          const d = {} as DatumEntry;
          if (!projectInfo.hiddenParameters?.includes('rowWidth')) d['rowWidth'] = design.rowsPerRack;
          if (!projectInfo.hiddenParameters?.includes('tiltAngle')) d['tiltAngle'] = Util.toDegrees(design.tiltAngle);
          if (!projectInfo.hiddenParameters?.includes('interRowSpacing')) d['interRowSpacing'] = design.interRowSpacing;
          if (!projectInfo.hiddenParameters?.includes('orientation'))
            d['orientation'] = design.orientation === Orientation.landscape ? 0 : 1;
          if (!projectInfo.hiddenParameters?.includes('poleHeight')) d['poleHeight'] = design.poleHeight;
          if (!projectInfo.hiddenParameters?.includes('unitCost')) d['unitCost'] = unitCost;
          if (!projectInfo.hiddenParameters?.includes('sellingPrice')) d['sellingPrice'] = sellingPrice;
          if (!projectInfo.hiddenParameters?.includes('panelCount')) d['panelCount'] = design.panelCount;
          if (!projectInfo.hiddenParameters?.includes('yield')) d['yield'] = design.yearlyYield * 0.001;
          if (!projectInfo.hiddenParameters?.includes('profit'))
            d['profit'] = (design.yearlyYield * sellingPrice - design.panelCount * unitCost * 365) * 0.001;
          d['group'] = projectInfo.dataColoring === DataColoring.INDIVIDUALS ? design.title : 'default';
          d['selected'] = selectedDesign === design;
          d['hovered'] = hoveredDesign === design;
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

  const minima: number[] = useMemo(() => {
    if (projectInfo.type === DesignProblem.SOLAR_PANEL_ARRAY && solarPanelArrayLayoutConstraints) {
      const array: number[] = [];
      if (!projectInfo.hiddenParameters?.includes('rowWidth'))
        array.push(solarPanelArrayLayoutConstraints.minimumRowsPerRack);
      if (!projectInfo.hiddenParameters?.includes('tiltAngle'))
        array.push(Util.toDegrees(solarPanelArrayLayoutConstraints.minimumTiltAngle));
      if (!projectInfo.hiddenParameters?.includes('interRowSpacing'))
        array.push(solarPanelArrayLayoutConstraints.minimumInterRowSpacing);
      if (!projectInfo.hiddenParameters?.includes('orientation')) array.push(0);
      if (!projectInfo.hiddenParameters?.includes('poleHeight')) array.push(0);
      if (!projectInfo.hiddenParameters?.includes('unitCost')) array.push(0.1);
      if (!projectInfo.hiddenParameters?.includes('sellingPrice')) array.push(0.1);
      if (!projectInfo.hiddenParameters?.includes('panelCount')) array.push(0);
      if (!projectInfo.hiddenParameters?.includes('yield')) array.push(0); // electricity output in MWh
      if (!projectInfo.hiddenParameters?.includes('profit')) array.push(-10); // profit in $1,000
      return array;
    }
    return [];
  }, [solarPanelArrayLayoutConstraints, projectInfo.type, projectInfo.hiddenParameters, updateHiddenFlag]);

  const maxima: number[] = useMemo(() => {
    if (projectInfo.type === DesignProblem.SOLAR_PANEL_ARRAY && solarPanelArrayLayoutConstraints) {
      const array: number[] = [];
      if (!projectInfo.hiddenParameters?.includes('rowWidth'))
        array.push(solarPanelArrayLayoutConstraints.maximumRowsPerRack);
      if (!projectInfo.hiddenParameters?.includes('tiltAngle'))
        array.push(Util.toDegrees(solarPanelArrayLayoutConstraints.maximumTiltAngle));
      if (!projectInfo.hiddenParameters?.includes('interRowSpacing'))
        array.push(solarPanelArrayLayoutConstraints.maximumInterRowSpacing);
      if (!projectInfo.hiddenParameters?.includes('orientation')) array.push(1);
      if (!projectInfo.hiddenParameters?.includes('poleHeight')) array.push(5);
      if (!projectInfo.hiddenParameters?.includes('unitCost')) array.push(1);
      if (!projectInfo.hiddenParameters?.includes('sellingPrice')) array.push(0.5);
      if (!projectInfo.hiddenParameters?.includes('panelCount')) array.push(300);
      if (!projectInfo.hiddenParameters?.includes('yield')) array.push(100); // electricity output in MWh
      if (!projectInfo.hiddenParameters?.includes('profit')) array.push(10); // profit in $1,000
      return array;
    }
    return [];
  }, [solarPanelArrayLayoutConstraints, projectInfo.type, projectInfo.hiddenParameters, updateHiddenFlag]);

  const rowWidthSelectionRef = useRef<boolean>(!projectInfo.hiddenParameters?.includes('rowWidth'));
  const tiltAngleSelectionRef = useRef<boolean>(!projectInfo.hiddenParameters?.includes('tiltAngle'));
  const rowSpacingSelectionRef = useRef<boolean>(!projectInfo.hiddenParameters?.includes('interRowSpacing'));
  const orientationSelectionRef = useRef<boolean>(!projectInfo.hiddenParameters?.includes('orientation'));
  const poleHeightSelectionRef = useRef<boolean>(!projectInfo.hiddenParameters?.includes('poleHeight'));
  const unitCostSelectionRef = useRef<boolean>(!projectInfo.hiddenParameters?.includes('unitCost'));
  const sellingPriceSelectionRef = useRef<boolean>(!projectInfo.hiddenParameters?.includes('sellingPrice'));
  const panelCountSelectionRef = useRef<boolean>(!projectInfo.hiddenParameters?.includes('panelCount'));
  const yieldSelectionRef = useRef<boolean>(!projectInfo.hiddenParameters?.includes('yield'));
  const profitSelectionRef = useRef<boolean>(!projectInfo.hiddenParameters?.includes('profit'));

  useEffect(() => {
    rowWidthSelectionRef.current = !projectInfo.hiddenParameters?.includes('rowWidth');
    tiltAngleSelectionRef.current = !projectInfo.hiddenParameters?.includes('tiltAngle');
    rowSpacingSelectionRef.current = !projectInfo.hiddenParameters?.includes('interRowSpacing');
    orientationSelectionRef.current = !projectInfo.hiddenParameters?.includes('orientation');
    poleHeightSelectionRef.current = !projectInfo.hiddenParameters?.includes('poleHeight');
    unitCostSelectionRef.current = !projectInfo.hiddenParameters?.includes('unitCost');
    sellingPriceSelectionRef.current = !projectInfo.hiddenParameters?.includes('sellingPrice');
    panelCountSelectionRef.current = !projectInfo.hiddenParameters?.includes('panelCount');
    yieldSelectionRef.current = !projectInfo.hiddenParameters?.includes('yield');
    profitSelectionRef.current = !projectInfo.hiddenParameters?.includes('profit');
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

  const selectParameter = (selected: boolean, parameter: string) => {
    if (user.uid && projectInfo.owner === user.uid && projectInfo.title) {
      parameterSelectionChangedRef.current = true;
      updateHiddenParameters(user.uid, projectInfo.title, parameter, !selected).then(() => {
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
      });
    }
  };

  const isProjectDesign = useMemo(() => {
    if (cloudFile && projectInfo.designs) {
      for (const design of projectInfo.designs) {
        if (cloudFile === design.title) {
          return true;
        }
      }
    }
    return false;
  }, [cloudFile, projectInfo.designs]);

  return (
    <Container>
      <ColumnWrapper>
        <Header>
          <span>
            {i18n.t('projectPanel.Project', lang) +
              ': ' +
              projectInfo.title +
              (projectInfo.owner === user.uid
                ? ''
                : ' (' + i18n.t('word.Owner', lang) + ': ' + projectInfo.owner?.substring(0, 4) + '***)')}
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
                  {user.uid === projectInfo.owner && (
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
                            <SortDescendingOutlined
                              style={{ fontSize: '24px', color: 'gray' }}
                              title={i18n.t('projectPanel.SortDesignsBySelectedProperty', lang)}
                            />
                          ) : (
                            <SortAscendingOutlined
                              style={{ fontSize: '24px', color: 'gray' }}
                              title={i18n.t('projectPanel.SortDesignsBySelectedProperty', lang)}
                            />
                          )}
                        </Button>
                      )}
                      {isProjectDesign && selectedDesign && (
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
                  if (user.uid && projectInfo.owner === user.uid && projectInfo.title) {
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
        {projectInfo.designs && (
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
              dataSource={projectInfo.designs}
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
                        loadCloudFile(projectInfo.owner, design.title, true, true);
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
                {projectInfo.type === DesignProblem.SOLAR_PANEL_ARRAY && (
                  <Popover
                    onVisibleChange={(visible) => {
                      if (parameterSelectionChangedRef.current) {
                        if (!visible) {
                          usePrimitiveStore.setState((state) => {
                            state.updateProjectsFlag = !state.updateProjectsFlag;
                          });
                        }
                        parameterSelectionChangedRef.current = false;
                      }
                    }}
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
                <Popover
                  content={
                    <div>
                      <label style={{ fontWeight: 'bold' }}>{i18n.t('projectPanel.ChooseDataColoring', lang)}</label>
                      <hr />
                      <Radio.Group
                        onChange={(e) => {
                          dataColoringSelectionRef.current = e.target.value;
                          if (user.uid && projectInfo.owner === user.uid && projectInfo.title) {
                            updateDataColoring(user.uid, projectInfo.title, dataColoringSelectionRef.current).then(
                              () => {
                                setCommonStore((state) => {
                                  state.projectInfo.dataColoring = dataColoringSelectionRef.current;
                                });
                                usePrimitiveStore.setState((state) => {
                                  state.updateProjectsFlag = !state.updateProjectsFlag;
                                });
                                setUpdateFlag(!updateFlag);
                              },
                            );
                          }
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
                  }
                >
                  <Button style={{ border: 'none', paddingRight: 0, background: 'white' }} onClick={() => {}}>
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
