/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import { Dropdown } from 'antd';
import { ReactComponent as MenuSVG } from '../assets/menu.svg';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import i18n from '../i18n/i18n';
import type { MenuProps } from 'antd';
import { CheckboxMenuItem, SliderMenuItem } from './contextMenu/menuItems';

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

  const items: MenuProps['items'] = [
    {
      key: 'graph-line-width-slider',
      label: (
        <SliderMenuItem min={0} max={10} value={lineWidth * 2} onChange={onChangeLineWidth}>
          {i18n.t('menu.graph.LineWidth', lang) + ':'}
        </SliderMenuItem>
      ),
    },
    {
      key: 'graph-symbol-size',
      label: (
        <SliderMenuItem min={2} max={12} value={symbolSize * 5} onChange={onChangeSymbolSize}>
          {i18n.t('menu.graph.SymbolSize', lang) + ':'}
        </SliderMenuItem>
      ),
    },
    {
      key: 'graph-bar-category-gap',
      label: (
        <SliderMenuItem min={0} max={20} value={barCategoryGap} onChange={onChangeBarCategoryGap}>
          {i18n.t('menu.graph.BarCategoryGap', lang) + ':'}
        </SliderMenuItem>
      ),
    },
    {
      key: 'show-horizontal-grid-lines-checkbox',
      label: (
        <CheckboxMenuItem checked={horizontalGrid} onClick={onShowHorizontalGridLines}>
          {i18n.t('menu.graph.ShowHorizontalGridLines', lang)}
        </CheckboxMenuItem>
      ),
    },
    {
      key: 'show-vertical-grid-lines-checkbox',
      label: (
        <CheckboxMenuItem checked={verticalGrid} onClick={onShowVerticalGridLines}>
          {i18n.t('menu.graph.ShowHorizontalGridLines', lang)}
        </CheckboxMenuItem>
      ),
    },
  ];

  return (
    <Dropdown menu={{ items }} placement="bottomRight">
      <StyledMenuSVG style={{ right: '25px' }} onClick={(e) => e.stopPropagation()} />
    </Dropdown>
  );
};

export default BuildingEnergyGraphMenu;
