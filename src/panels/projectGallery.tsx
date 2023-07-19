/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import styled from 'styled-components';
import { Collapse, Descriptions, Button, List, Popover, Checkbox } from 'antd';
import i18n from '../i18n/i18n';
import {
  BarChartOutlined,
  CameraOutlined,
  CloseOutlined,
  DeleteOutlined,
  ImportOutlined,
  LinkOutlined,
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

const DesignSpaceHeader = styled.div`
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
  openCloudFile?: (userid: string, title: string, popState?: boolean) => void;
  deleteDesign?: (userid: string, projectTitle: string, design: Design) => void;
}

const ProjectGallery = ({ relativeWidth, openCloudFile, deleteDesign }: ProjectGalleryProps) => {
  const setCommonStore = useStore(Selector.set);
  const user = useStore(Selector.user);
  const language = useStore(Selector.language);
  const cloudFile = useStore(Selector.cloudFile);
  const projectOwner = useStore(Selector.projectOwner);
  const projectTitle = useStore(Selector.projectTitle);
  const projectDescription = useStore(Selector.projectDescription);
  const projectDesigns = useStore(Selector.projectDesigns);
  const projectType = useStore(Selector.projectType);
  const solarPanelArrayLayoutConstraints = useStore(Selector.solarPanelArrayLayoutConstraints);
  const economicsParams = useStore(Selector.economicsParams);

  const [selectedDesign, setSelectedDesign] = useState<Design | undefined>();
  const [hoveredDesign, setHoveredDesign] = useState<Design | undefined>();
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [updateVisibleMapFlag, setUpdateVisibleMapFlag] = useState<boolean>(false);

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

  const allVariables: string[] = useMemo(() => ProjectUtil.getVariables(projectType), [projectType]);
  const visibleMap: Map<string, boolean> = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const v of allVariables) {
      map.set(v, true);
    }
    return map;
  }, [allVariables]);

  const variables: string[] = useMemo(
    () => ProjectUtil.getVariables(projectType, visibleMap),
    [projectType, visibleMap, updateVisibleMapFlag],
  );
  const titles: string[] = useMemo(
    () => ProjectUtil.getTitles(projectType, lang, visibleMap),
    [projectType, lang, visibleMap, updateVisibleMapFlag],
  );
  const units: string[] = useMemo(
    () => ProjectUtil.getUnits(projectType, lang, visibleMap),
    [projectType, lang, visibleMap, updateVisibleMapFlag],
  );
  const digits: number[] = useMemo(
    () => ProjectUtil.getDigits(projectType, visibleMap),
    [projectType, visibleMap, updateVisibleMapFlag],
  );
  const types: string[] = useMemo(
    () => ProjectUtil.getTypes(projectType, visibleMap),
    [projectType, visibleMap, updateVisibleMapFlag],
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
          if (visibleMap.get('rowWidth')) d['rowWidth'] = design.rowsPerRack;
          if (visibleMap.get('tiltAngle')) d['tiltAngle'] = Util.toDegrees(design.tiltAngle);
          if (visibleMap.get('interRowSpacing')) d['interRowSpacing'] = design.interRowSpacing;
          if (visibleMap.get('orientation')) d['orientation'] = design.orientation === Orientation.landscape ? 0 : 1;
          if (visibleMap.get('unitCost')) d['unitCost'] = unitCost;
          if (visibleMap.get('sellingPrice')) d['sellingPrice'] = sellingPrice;
          if (visibleMap.get('panelCount')) d['panelCount'] = design.panelCount;
          if (visibleMap.get('yield')) d['yield'] = design.yearlyYield * 0.001;
          if (visibleMap.get('profit'))
            d['profit'] = (design.yearlyYield * sellingPrice - design.panelCount * unitCost * 365) * 0.001;
          d['group'] = 'default';
          d['selected'] = selectedDesign === design;
          d['hovered'] = hoveredDesign === design;
          data.push(d);
        }
      }
    }
    return data;
  }, [projectDesigns, projectType, hoveredDesign, selectedDesign, economicsParams, visibleMap, updateVisibleMapFlag]);

  const minima: number[] = useMemo(() => {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY && solarPanelArrayLayoutConstraints) {
      const array: number[] = [];
      if (!visibleMap || visibleMap.get('rowWidth')) array.push(solarPanelArrayLayoutConstraints.minimumRowsPerRack);
      if (!visibleMap || visibleMap.get('tiltAngle'))
        array.push(Util.toDegrees(solarPanelArrayLayoutConstraints.minimumTiltAngle));
      if (!visibleMap || visibleMap.get('interRowSpacing'))
        array.push(solarPanelArrayLayoutConstraints.minimumInterRowSpacing);
      if (!visibleMap || visibleMap.get('orientation')) array.push(0);
      if (!visibleMap || visibleMap.get('unitCost')) array.push(0.1);
      if (!visibleMap || visibleMap.get('sellingPrice')) array.push(0.1);
      if (!visibleMap || visibleMap.get('panelCount')) array.push(0);
      if (!visibleMap || visibleMap.get('yield')) array.push(0); // electricity output in MWh
      if (!visibleMap || visibleMap.get('profit')) array.push(-10); // profit in $1,000
      return array;
    }
    return [1, 0, 1, 0, 0, 0, 0, -10];
  }, [solarPanelArrayLayoutConstraints, projectType, visibleMap, updateVisibleMapFlag]);

  const maxima: number[] = useMemo(() => {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY && solarPanelArrayLayoutConstraints) {
      const array: number[] = [];
      if (!visibleMap || visibleMap.get('rowWidth')) array.push(solarPanelArrayLayoutConstraints.maximumRowsPerRack);
      if (!visibleMap || visibleMap.get('tiltAngle'))
        array.push(Util.toDegrees(solarPanelArrayLayoutConstraints.maximumTiltAngle));
      if (!visibleMap || visibleMap.get('interRowSpacing'))
        array.push(solarPanelArrayLayoutConstraints.maximumInterRowSpacing);
      if (!visibleMap || visibleMap.get('orientation')) array.push(1);
      if (!visibleMap || visibleMap.get('unitCost')) array.push(1);
      if (!visibleMap || visibleMap.get('sellingPrice')) array.push(0.5);
      if (!visibleMap || visibleMap.get('panelCount')) array.push(300);
      if (!visibleMap || visibleMap.get('yield')) array.push(100); // electricity output in MWh
      if (!visibleMap || visibleMap.get('profit')) array.push(10); // profit in $1,000
      return array;
    }
    return [10, 90, 10, 1, 5, 300, 100, 10];
  }, [solarPanelArrayLayoutConstraints, projectType, visibleMap, updateVisibleMapFlag]);

  const rowWidthSelectionRef = useRef<boolean>(!!visibleMap.get('rowWidth'));
  const tiltAngleSelectionRef = useRef<boolean>(!!visibleMap.get('tiltAngle'));
  const rowSpacingSelectionRef = useRef<boolean>(!!visibleMap.get('interRowSpacing'));
  const orientationSelectionRef = useRef<boolean>(!!visibleMap.get('orientation'));
  const unitCostSelectionRef = useRef<boolean>(!!visibleMap.get('unitCost'));
  const sellingPriceSelectionRef = useRef<boolean>(!!visibleMap.get('sellingPrice'));
  const panelCountSelectionRef = useRef<boolean>(!!visibleMap.get('panelCount'));
  const yieldSelectionRef = useRef<boolean>(!!visibleMap.get('yield'));
  const profitSelectionRef = useRef<boolean>(!!visibleMap.get('profit'));

  const hover = (i: number) => {
    if (projectDesigns) {
      if (i >= 0 && i < projectDesigns.length) {
        setHoveredDesign(projectDesigns[i]);
      }
    }
  };

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
        <Collapse style={{ backgroundColor: 'white', border: 'none' }}>
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
                              url += '&title=' + selectedDesign.title;
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
                    </>
                  )}
                </span>
              </SubHeader>
            }
          >
            <Descriptions style={{ paddingLeft: '10px', textAlign: 'left' }}>
              <Descriptions.Item>{projectDescription}</Descriptions.Item>
            </Descriptions>
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
                    loading={'lazy'}
                    width={imageWidth + 'px'}
                    height={'auto'}
                    onError={(event: any) => {
                      (event.target as HTMLImageElement).src = ImageLoadFailureIcon;
                    }}
                    alt={design.title}
                    title={
                      selectedDesign === design
                        ? i18n.t('projectPanel.SingleClickToDeselectDoubleClickToOpen', lang)
                        : i18n.t('projectPanel.SingleClickToSelectDoubleClickToOpen', lang)
                    }
                    src={design.thumbnailUrl}
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
            <DesignSpaceHeader>
              <span style={{ paddingLeft: '20px' }}>{i18n.t('projectPanel.DistributionInSolutionSpace', lang)}</span>
              <span>
                {projectType === DesignProblem.SOLAR_PANEL_ARRAY && (
                  <Popover
                    content={
                      <div>
                        <Checkbox
                          onChange={(e) => {
                            rowWidthSelectionRef.current = e.target.checked;
                            visibleMap.set('rowWidth', rowWidthSelectionRef.current);
                            setUpdateVisibleMapFlag(!updateVisibleMapFlag);
                          }}
                          checked={rowWidthSelectionRef.current}
                        >
                          {i18n.t('polygonMenu.SolarPanelArrayRowWidth', lang)}
                        </Checkbox>
                        <br />
                        <Checkbox
                          onChange={(e) => {
                            tiltAngleSelectionRef.current = e.target.checked;
                            visibleMap.set('tiltAngle', tiltAngleSelectionRef.current);
                            setUpdateVisibleMapFlag(!updateVisibleMapFlag);
                          }}
                          checked={tiltAngleSelectionRef.current}
                        >
                          {i18n.t('polygonMenu.SolarPanelArrayTiltAngle', lang)}
                        </Checkbox>
                        <br />
                        <Checkbox
                          onChange={(e) => {
                            rowSpacingSelectionRef.current = e.target.checked;
                            visibleMap.set('interRowSpacing', rowSpacingSelectionRef.current);
                            setUpdateVisibleMapFlag(!updateVisibleMapFlag);
                          }}
                          checked={rowSpacingSelectionRef.current}
                        >
                          {i18n.t('polygonMenu.SolarPanelArrayRowSpacing', lang)}
                        </Checkbox>
                        <br />
                        <Checkbox
                          onChange={(e) => {
                            orientationSelectionRef.current = e.target.checked;
                            visibleMap.set('orientation', orientationSelectionRef.current);
                            setUpdateVisibleMapFlag(!updateVisibleMapFlag);
                          }}
                          checked={orientationSelectionRef.current}
                        >
                          {i18n.t('polygonMenu.SolarPanelArrayOrientation', lang)}
                        </Checkbox>
                        <br />
                        <Checkbox
                          onChange={(e) => {
                            unitCostSelectionRef.current = e.target.checked;
                            visibleMap.set('unitCost', unitCostSelectionRef.current);
                            setUpdateVisibleMapFlag(!updateVisibleMapFlag);
                          }}
                          checked={unitCostSelectionRef.current}
                        >
                          {i18n.t('economicsPanel.UnitCost', lang)}
                        </Checkbox>
                        <br />
                        <Checkbox
                          onChange={(e) => {
                            sellingPriceSelectionRef.current = e.target.checked;
                            visibleMap.set('sellingPrice', sellingPriceSelectionRef.current);
                            setUpdateVisibleMapFlag(!updateVisibleMapFlag);
                          }}
                          checked={sellingPriceSelectionRef.current}
                        >
                          {i18n.t('economicsPanel.SellingPrice', lang)}
                        </Checkbox>
                        <br />
                        <Checkbox
                          onChange={(e) => {
                            panelCountSelectionRef.current = e.target.checked;
                            visibleMap.set('panelCount', panelCountSelectionRef.current);
                            setUpdateVisibleMapFlag(!updateVisibleMapFlag);
                          }}
                          checked={panelCountSelectionRef.current}
                        >
                          {i18n.t('polygonMenu.SolarPanelArrayPanelCount', lang)}
                        </Checkbox>
                        <br />
                        <Checkbox
                          onChange={(e) => {
                            yieldSelectionRef.current = e.target.checked;
                            visibleMap.set('yield', yieldSelectionRef.current);
                            setUpdateVisibleMapFlag(!updateVisibleMapFlag);
                          }}
                          checked={yieldSelectionRef.current}
                        >
                          {i18n.t('polygonMenu.SolarPanelArrayYield', lang)}
                        </Checkbox>
                        <br />
                        <Checkbox
                          onChange={(e) => {
                            profitSelectionRef.current = e.target.checked;
                            visibleMap.set('profit', profitSelectionRef.current);
                            setUpdateVisibleMapFlag(!updateVisibleMapFlag);
                          }}
                          checked={profitSelectionRef.current}
                        >
                          {i18n.t('polygonMenu.SolarPanelArrayProfit', lang)}
                        </Checkbox>
                      </div>
                    }
                  >
                    <Button style={{ border: 'none', paddingRight: 0, background: 'white' }} onClick={() => {}}>
                      <BarChartOutlined
                        style={{ fontSize: '24px', color: 'gray' }}
                        title={i18n.t('projectPanel.CustomizeDesignSpace', lang)}
                      />
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
                    title={i18n.t('projectPanel.DesignSpaceScreenshot', lang)}
                  />
                </Button>
              </span>
            </DesignSpaceHeader>
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
