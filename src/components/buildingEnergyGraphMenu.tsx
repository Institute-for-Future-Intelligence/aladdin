/*
 * @Copyright 2023-2024. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { BarsOutlined } from '@ant-design/icons';
import { Popover } from 'antd';
import i18n from '../i18n/i18n';
import { AntdCheckboxMenuItem, AntdSliderMenuItem } from './contextMenu/menuItems';
import { useLanguage } from '../hooks';

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

const BuildingEnergyGraphMenu = React.memo(
  ({
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
    const lang = useLanguage();
    const [hover, setHover] = useState<boolean>(false);

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

    return (
      <Popover
        content={
          <div style={{ width: '200px' }}>
            <AntdSliderMenuItem min={0} max={10} value={lineWidth * 2} onChange={onChangeLineWidth}>
              {i18n.t('menu.graph.LineWidth', lang) + ':'}
            </AntdSliderMenuItem>
            <AntdSliderMenuItem min={2} max={12} value={symbolSize * 5} onChange={onChangeSymbolSize}>
              {i18n.t('menu.graph.SymbolSize', lang) + ':'}
            </AntdSliderMenuItem>
            <AntdSliderMenuItem min={0} max={20} value={barCategoryGap} onChange={onChangeBarCategoryGap}>
              {i18n.t('menu.graph.BarCategoryGap', lang) + ':'}
            </AntdSliderMenuItem>
            <AntdCheckboxMenuItem checked={horizontalGrid} onClick={onShowHorizontalGridLines}>
              {i18n.t('menu.graph.ShowHorizontalGridLines', lang)}
            </AntdCheckboxMenuItem>
            <AntdCheckboxMenuItem checked={verticalGrid} onClick={onShowVerticalGridLines}>
              {i18n.t('menu.graph.ShowHorizontalGridLines', lang)}
            </AntdCheckboxMenuItem>
          </div>
        }
      >
        <BarsOutlined
          style={{
            position: 'absolute',
            fontSize: '30px',
            top: '4px',
            right: '30px',
            transition: '0.5s',
            color: hover ? 'darkgray' : 'lightblue',
            cursor: 'pointer',
          }}
          onMouseOver={() => {
            setHover(true);
          }}
          onMouseOut={() => {
            setHover(false);
          }}
        />
      </Popover>
    );
  },
);

export default BuildingEnergyGraphMenu;
