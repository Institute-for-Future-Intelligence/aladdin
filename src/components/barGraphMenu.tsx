/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import { Menu, Dropdown, Checkbox } from 'antd';
import { ReactComponent as MenuSVG } from '../assets/menu.svg';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import i18n from '../i18n/i18n';

const StyledMenuSVG = styled(MenuSVG)`
  position: absolute;
  top: 4px;
  right: 30px;
  height: 30px;
  width: 30px;
  transition: 0.5s;
  fill: lightblue;

  &:hover {
    fill: darkgray;
  }
`;

export interface BarGraphMenuProps {
  horizontalGrid: boolean;
  verticalGrid: boolean;
  changeHorizontalGrid?: (visible: boolean) => void;
  changeVerticalGrid?: (visible: boolean) => void;
}

const BarGraphMenu = ({
  horizontalGrid,
  verticalGrid,
  changeHorizontalGrid,
  changeVerticalGrid,
}: BarGraphMenuProps) => {
  const language = useStore(Selector.language);
  const lang = { lng: language };

  const [visible, setVisible] = useState(false);

  const handleVisibleChange = (v: boolean) => {
    setVisible(v);
  };

  const onShowHorizontalGridLines = () => {
    changeHorizontalGrid?.(!horizontalGrid);
  };

  const onShowVerticalGridLines = () => {
    changeVerticalGrid?.(!verticalGrid);
  };

  const menu = (
    <Menu>
      <Menu.Item>
        <Checkbox checked={horizontalGrid} onClick={onShowHorizontalGridLines}>
          {i18n.t('menu.graph.ShowHorizontalGridLines', lang)}
        </Checkbox>
      </Menu.Item>
      <Menu.Item>
        <Checkbox checked={verticalGrid} onClick={onShowVerticalGridLines}>
          {i18n.t('menu.graph.ShowVerticalGridLines', lang)}
        </Checkbox>
      </Menu.Item>
    </Menu>
  );

  return (
    <>
      {/* <Dropdown overlay={menu} placement="bottomRight" open={visible} onOpenChange={handleVisibleChange}>
        <StyledMenuSVG
          style={{ right: '32px' }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        />
      </Dropdown> */}
    </>
  );
};

export default BarGraphMenu;
