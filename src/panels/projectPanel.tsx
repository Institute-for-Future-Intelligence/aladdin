/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import styled from 'styled-components';
import { Space } from 'antd';
import i18n from '../i18n/i18n';
import { CloseOutlined } from '@ant-design/icons';

const Container = styled.div`
  position: relative;
  top: 0;
  left: 0;
  width: 50%;
  height: calc(100vh - 72px);
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
  height: 100%
  border: 2px solid gainsboro;
  display: flex;
  flex-direction: column;
  overflow-x: auto;
  overflow-y: hidden;
`;

const Header = styled.div`
  border-radius: 10px 10px 0 0;
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

const ProjectPanel = () => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const projectTitle = useStore(Selector.projectTitle);

  const lang = { lng: language };

  const closeProject = () => {
    setCommonStore((state) => {
      state.viewState.projectView = false;
    });
  };

  return (
    <Container>
      <ColumnWrapper>
        <Header className="handle">
          <span>{i18n.t('projectPanel.Project', lang) + ': ' + projectTitle} </span>
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
        <Space>Project</Space>
      </ColumnWrapper>
    </Container>
  );
};

export default React.memo(ProjectPanel);
