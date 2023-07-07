/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import styled from 'styled-components';
import { Collapse, Descriptions, Button, List } from 'antd';
import i18n from '../i18n/i18n';
import { CloseOutlined, DeleteOutlined, ImportOutlined } from '@ant-design/icons';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import ImageLoadFailureIcon from '../assets/image_load_failure.png';
import { Design } from '../types';

const Container = styled.div`
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  display: flex;
  justify-content: center;
  align-self: center;
  alignment: center;
  align-content: center;
  align-items: center;
  padding: 0;
  opacity: 100%;
  user-select: none;
  tab-index: -1; // set to be not focusable
  z-index: 7; // must be less than other panels
  background: whitesmoke;
`;

const ColumnWrapper = styled.div`
  background-color: #f8f8f8;
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  border: 2px solid gainsboro;
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

  svg.icon {
    height: 16px;
    width: 16px;
    padding: 8px;
    fill: #666;
  }
`;

export interface ProjectGalleryProps {
  openCloudFile?: (userid: string, title: string, popState?: boolean) => void;
  author?: string; // if undefined, the user is the owner of models
}

const ProjectGallery = ({ openCloudFile, author }: ProjectGalleryProps) => {
  const setCommonStore = useStore(Selector.set);
  const user = useStore(Selector.user);
  const language = useStore(Selector.language);
  const projectTitle = useStore(Selector.projectTitle);
  const projectDescription = useStore(Selector.projectDescription);
  const projectDesigns = useStore(Selector.projectDesigns);
  const projectType = useStore(Selector.projectType);

  const [selectedDesign, setSelectedDesign] = useState<Design | undefined>();

  const lang = { lng: language };

  const closeProject = () => {
    setCommonStore((state) => {
      state.projectView = false;
    });
    setSelectedDesign(undefined);
  };

  const curateCurrentDesign = () => {
    usePrimitiveStore.setState((state) => {
      state.designTitle = 'house 3';
      state.curateDesignToProjectFlag = !state.curateDesignToProjectFlag;
    });
  };

  return (
    <Container>
      <ColumnWrapper>
        <Header className="handle">
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
        <Collapse>
          <Collapse.Panel
            key={'1'}
            header={
              i18n.t('projectPanel.ProjectDescription', lang) +
              ' | ' +
              i18n.t('projectPanel.ProjectType', lang) +
              ': ' +
              projectType
            }
          >
            <Descriptions style={{ paddingLeft: '10px', textAlign: 'left' }}>
              <Descriptions.Item>{projectDescription}</Descriptions.Item>
            </Descriptions>
          </Collapse.Panel>
        </Collapse>
        <div style={{ marginTop: '10px', marginBottom: '10px' }}>
          <Button style={{ marginRight: '10px' }} onClick={curateCurrentDesign}>
            <ImportOutlined title={i18n.t('projectPanel.CurateCurrentDesign', lang)} />
            {i18n.t('projectPanel.CurateCurrentDesign', lang)}
          </Button>
          <Button>
            <DeleteOutlined title={i18n.t('projectPanel.RemoveSelectedDesign', lang)} />
            {i18n.t('projectPanel.RemoveSelectedDesign', lang)}
          </Button>
        </div>
        {projectDesigns && (
          <List
            style={{ width: '100%' }}
            grid={{ column: 3, gutter: 4 }}
            dataSource={projectDesigns}
            renderItem={(design) => (
              <List.Item>
                <img
                  width={'200px'}
                  height={'auto'}
                  onError={(event: any) => {
                    (event.target as HTMLImageElement).src = ImageLoadFailureIcon;
                  }}
                  alt={design.title}
                  title={design.title}
                  src={design.thumbnailUrl}
                  style={{
                    cursor: 'pointer',
                    borderRadius: selectedDesign === design ? '0' : '10px',
                    border: selectedDesign === design ? '2px solid red' : 'none',
                    marginLeft: '4px',
                    marginRight: '4px',
                  }}
                  onClick={() => {
                    setSelectedDesign(design);
                    if (user.uid && openCloudFile) {
                      openCloudFile(user.uid, design.title, true);
                    }
                  }}
                />
                {/* the following div is needed to wrap the image and text */}
                <div>
                  <span
                    style={{
                      position: 'relative',
                      left: '-90px',
                      bottom: '24px',
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
                  </span>
                </div>
              </List.Item>
            )}
          />
        )}
      </ColumnWrapper>
    </Container>
  );
};

export default React.memo(ProjectGallery);
