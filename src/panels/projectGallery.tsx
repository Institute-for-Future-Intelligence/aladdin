/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import styled from 'styled-components';
import { Collapse, Descriptions, Button, List } from 'antd';
import i18n from '../i18n/i18n';
import { CameraOutlined, CloseOutlined, DeleteOutlined, ImportOutlined, LinkOutlined } from '@ant-design/icons';
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

  const lang = { lng: language };

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

  const variables: string[] = ProjectUtil.getVariables(projectType);
  const titles: string[] = useMemo(() => ProjectUtil.getTitles(projectType, lang), [projectType, lang]);
  const units: string[] = useMemo(() => ProjectUtil.getUnits(projectType, lang), [projectType, lang]);
  const digits: number[] = ProjectUtil.getDigits(projectType);
  const types: string[] = ProjectUtil.getTypes(projectType);

  const data: DatumEntry[] = useMemo(() => {
    const data: DatumEntry[] = [];
    if (projectDesigns) {
      if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) {
        for (const design of projectDesigns) {
          const unitCost = design.unitCost !== undefined ? design.unitCost : economicsParams.operationalCostPerUnit;
          const sellingPrice =
            design.sellingPrice !== undefined ? design.sellingPrice : economicsParams.electricitySellingPrice;
          data.push({
            rowWidth: design.rowsPerRack,
            tiltAngle: Util.toDegrees(design.tiltAngle),
            interRowSpacing: design.interRowSpacing,
            orientation: design.orientation === Orientation.landscape ? 0 : 1,
            unitCost,
            sellingPrice,
            panelCount: design.panelCount,
            yield: design.yearlyYield * 0.001,
            profit: (design.yearlyYield * sellingPrice - design.panelCount * unitCost * 365) * 0.001,
            group: 'default',
            selected: selectedDesign === design,
            hovered: hoveredDesign === design,
          } as DatumEntry);
        }
      }
    }
    return data;
  }, [projectDesigns, projectType, hoveredDesign, selectedDesign, economicsParams]);

  const minima: number[] = useMemo(() => {
    return projectType === DesignProblem.SOLAR_PANEL_ARRAY && solarPanelArrayLayoutConstraints
      ? [
          solarPanelArrayLayoutConstraints.minimumRowsPerRack,
          Util.toDegrees(solarPanelArrayLayoutConstraints.minimumTiltAngle),
          solarPanelArrayLayoutConstraints.minimumInterRowSpacing,
          0, // orientation
          0.1, // unit cost
          0.1, // electricity selling price
          0, // panel count
          0, // electricity output in MWh
          -10, // profit in $1,000
        ]
      : [1, 0, 1, 0, 0, 0, 0, -10];
  }, [solarPanelArrayLayoutConstraints, projectType]);
  const maxima: number[] = useMemo(() => {
    return projectType === DesignProblem.SOLAR_PANEL_ARRAY && solarPanelArrayLayoutConstraints
      ? [
          solarPanelArrayLayoutConstraints.maximumRowsPerRack,
          Util.toDegrees(solarPanelArrayLayoutConstraints.maximumTiltAngle),
          solarPanelArrayLayoutConstraints.maximumInterRowSpacing,
          1, // orientation
          1.0, // unit cost
          0.5, // electricity selling price
          300, // panel count
          100, // electricity output in MWh
          10, // profit in $1,000
        ]
      : [10, 90, 10, 1, 5, 300, 100, 10];
  }, [solarPanelArrayLayoutConstraints, projectType]);

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
