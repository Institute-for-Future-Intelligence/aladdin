/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import {Spin} from 'antd';
import styled from 'styled-components';

export default styled(Spin)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.5);
  z-index: 9999;
`;
