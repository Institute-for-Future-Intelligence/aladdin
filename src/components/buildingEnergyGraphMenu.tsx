/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import { Menu, Dropdown, Checkbox, Slider } from 'antd';
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

export interface BuildingEnergyGraphMenuProps {
  horizontalGrid: boolean;
  verticalGrid: boolean;
  lineWidth: number;
  symbolSize: number;
  barCategoryGap: number;
  changeHorizontalGrid?: (visible: boolean) => void;
  changeVerticalGrid?: (visible: boolean) => void;
  changeLineWidth?: (width: number) => void;
  changeSymbolSize?: (count: number) => void;
  changeBarCategoryGap?: (gap: number) => void;
}

const BuildingEnergyGraphMenu = ({
  horizontalGrid,
  verticalGrid,
  lineWidth,
  symbolSize,
  barCategoryGap,
  changeHorizontalGrid,
  changeVerticalGrid,
  changeLineWidth,
  changeSymbolSize,
  changeBarCategoryGap,
}: BuildingEnergyGraphMenuProps) => {
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

  const onChangeLineWidth = (value: number) => {
    changeLineWidth?.(value / 2);
  };

  const onChangeSymbolSize = (size: number) => {
    changeSymbolSize?.(size / 5);
  };

  const onChangeBarCategoryGap = (gap: number) => {
    changeBarCategoryGap?.(gap);
  };

  const menu = (
    <Menu>
      <Menu.Item>
        {i18n.t('menu.graph.LineWidth', lang) + ':'}
        <Slider min={0} max={10} tooltipVisible={false} defaultValue={lineWidth * 2} onChange={onChangeLineWidth} />
      </Menu.Item>
      <Menu.Item>
        {i18n.t('menu.graph.SymbolSize', lang) + ':'}
        <Slider min={2} max={12} tooltipVisible={false} defaultValue={symbolSize * 5} onChange={onChangeSymbolSize} />
      </Menu.Item>
      <Menu.Item>
        {i18n.t('menu.graph.BarCategoryGap', lang) + ':'}
        <Slider
          min={0}
          max={20}
          tooltipVisible={false}
          defaultValue={barCategoryGap}
          onChange={onChangeBarCategoryGap}
        />
      </Menu.Item>
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
      <Dropdown overlay={menu} placement="bottomRight" visible={visible} onVisibleChange={handleVisibleChange}>
        <StyledMenuSVG
          style={{ right: '25px' }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        />
      </Dropdown>
    </>
  );
};

export default BuildingEnergyGraphMenu;
