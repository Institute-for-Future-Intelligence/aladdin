/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import styled from 'styled-components';
import { Collapse, Descriptions, Button, List } from 'antd';
import i18n from '../i18n/i18n';
import { CameraOutlined, CloseOutlined, DeleteOutlined, ImportOutlined } from '@ant-design/icons';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import ImageLoadFailureIcon from '../assets/image_fail_try_again.png';
import { DatumEntry, Design, DesignProblem, Orientation } from '../types';
import ParallelCoordinates from '../components/parallelCoordinates';
//@ts-ignore
import { saveSvgAsPng } from 'save-svg-as-png';
import { showInfo } from '../helpers';
import { Util } from '../Util';

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
  author?: string; // if undefined, the user is the owner of models
}

const ProjectGallery = ({ relativeWidth, openCloudFile, deleteDesign, author }: ProjectGalleryProps) => {
  const setCommonStore = useStore(Selector.set);
  const user = useStore(Selector.user);
  const language = useStore(Selector.language);
  const projectTitle = useStore(Selector.projectTitle);
  const projectDescription = useStore(Selector.projectDescription);
  const projectDesigns = useStore(Selector.projectDesigns);
  const projectType = useStore(Selector.projectType);
  const solarPanelArrayLayoutConstraints = useStore(Selector.solarPanelArrayLayoutConstraints);

  const [selectedDesign, setSelectedDesign] = useState<Design | undefined>();
  const [hoveredDesign, setHoveredDesign] = useState<Design | undefined>();
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);

  const lang = { lng: language };

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

  const variables: string[] =
    projectType === DesignProblem.SOLAR_PANEL_ARRAY
      ? ['RowWidth', 'TiltAngle', 'InterRowSpacing', 'Orientation', 'PoleHeight', 'PanelCount', 'DailyYield']
      : [];
  const types: string[] =
    projectType === DesignProblem.SOLAR_PANEL_ARRAY
      ? ['number', 'number', 'number', 'boolean', 'number', 'number', 'number']
      : [];
  const data: DatumEntry[] = useMemo(() => {
    const data: DatumEntry[] = [];
    if (projectDesigns) {
      if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) {
        for (const design of projectDesigns) {
          data.push({
            RowWidth: design.rowsPerRack,
            TiltAngle: Util.toDegrees(design.tiltAngle),
            InterRowSpacing: design.interRowSpacing,
            PoleHeight: design.poleHeight,
            Orientation: design.orientation === Orientation.landscape ? 0 : 1,
            PanelCount: design.panelCount,
            DailyYield: design.dailyYield,
            group: 'default',
            selected: selectedDesign === design,
            hovered: hoveredDesign === design,
          } as DatumEntry);
        }
      }
    }
    return data;
  }, [projectDesigns, projectType, hoveredDesign, selectedDesign]);

  const minima: number[] = useMemo(() => {
    return projectType === DesignProblem.SOLAR_PANEL_ARRAY && solarPanelArrayLayoutConstraints
      ? [
          solarPanelArrayLayoutConstraints.minimumRowsPerRack,
          Util.toDegrees(solarPanelArrayLayoutConstraints.minimumTiltAngle),
          solarPanelArrayLayoutConstraints.minimumInterRowSpacing,
          0,
          0,
          0,
          0,
        ]
      : [1, 0, 1, 0, 0, 0, 0];
  }, [solarPanelArrayLayoutConstraints, projectType]);
  const maxima: number[] = useMemo(() => {
    return projectType === DesignProblem.SOLAR_PANEL_ARRAY && solarPanelArrayLayoutConstraints
      ? [
          solarPanelArrayLayoutConstraints.maximumRowsPerRack,
          Util.toDegrees(solarPanelArrayLayoutConstraints.maximumTiltAngle),
          solarPanelArrayLayoutConstraints.maximumInterRowSpacing,
          1,
          4,
          300,
          500,
        ]
      : [10, 90, 10, 1, 5, 300, 500];
  }, [solarPanelArrayLayoutConstraints, projectType]);

  return (
    <Container>
      <ColumnWrapper>
        <Header>
          <span>{i18n.t('projectPanel.Project', lang) + ': ' + projectTitle}</span>
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
              grid={{ column: 4, gutter: 2 }}
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
                      if (user.uid && openCloudFile) {
                        openCloudFile(user.uid, design.title, true);
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
              <span style={{ paddingLeft: '20px' }}>{i18n.t('projectPanel.DesignSpaceVisualization', lang)}</span>
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
            />
          </SubContainer>
        )}
      </ColumnWrapper>
    </Container>
  );
};

export default React.memo(ProjectGallery);
