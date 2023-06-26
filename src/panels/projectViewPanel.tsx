/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import styled from 'styled-components';
import { Space } from 'antd';

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

const ProjectViewPanel = () => {
  const language = useStore(Selector.language);

  const lang = { lng: language };

  return (
    <Container>
      <Space>Project</Space>
    </Container>
  );
};

export default React.memo(ProjectViewPanel);
