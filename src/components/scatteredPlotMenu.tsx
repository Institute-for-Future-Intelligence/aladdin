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
import { useLanguage } from 'src/views/hooks';
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

export interface ScatteredPlotMenuProps {
  horizontalGrid: boolean;
  verticalGrid: boolean;
  symbolSize: number;
  changeHorizontalGrid?: (visible: boolean) => void;
  changeVerticalGrid?: (visible: boolean) => void;
  changeSymbolSize?: (count: number) => void;
}

const ScatteredPlotMenu = ({
  horizontalGrid,
  verticalGrid,
  symbolSize,
  changeHorizontalGrid,
  changeVerticalGrid,
  changeSymbolSize,
}: ScatteredPlotMenuProps) => {
  const lang = useLanguage();

  const onShowHorizontalGridLines = () => {
    changeHorizontalGrid?.(!horizontalGrid);
  };

  const onShowVerticalGridLines = () => {
    changeVerticalGrid?.(!verticalGrid);
  };

  const onChangeSymbolSize = (size: number) => {
    changeSymbolSize?.(size);
  };

  const items: MenuProps['items'] = [
    {
      key: 'graph-symbol-size',
      label: (
        <SliderMenuItem min={1} max={8} value={symbolSize} onChange={onChangeSymbolSize}>
          {i18n.t('menu.graph.SymbolSize', lang) + ':'}
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
      <StyledMenuSVG style={{ top: '120px', right: '16px' }} onClick={(e) => e.stopPropagation()} />
    </Dropdown>
  );
};

export default ScatteredPlotMenu;
