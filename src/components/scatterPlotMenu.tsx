/*
 * @Copyright 2023-2024. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { MoreOutlined } from '@ant-design/icons';
import { Popover } from 'antd';
import i18n from '../i18n/i18n';
import { useLanguage } from 'src/hooks';
import { CheckboxMenuItem, SliderMenuItem } from './contextMenu/menuItems';

export interface ScatterPlotMenuProps {
  horizontalGrid: boolean;
  verticalGrid: boolean;
  symbolSize: number;
  changeHorizontalGrid?: (visible: boolean) => void;
  changeVerticalGrid?: (visible: boolean) => void;
  changeSymbolSize?: (count: number) => void;
}

const ScatterPlotMenu = ({
  horizontalGrid,
  verticalGrid,
  symbolSize,
  changeHorizontalGrid,
  changeVerticalGrid,
  changeSymbolSize,
}: ScatterPlotMenuProps) => {
  const lang = useLanguage();
  const [hover, setHover] = useState<boolean>(false);

  const onShowHorizontalGridLines = () => {
    changeHorizontalGrid?.(!horizontalGrid);
  };

  const onShowVerticalGridLines = () => {
    changeVerticalGrid?.(!verticalGrid);
  };

  const onChangeSymbolSize = (size: number) => {
    changeSymbolSize?.(size);
  };

  return (
    <Popover
      content={
        <div style={{ width: '200px' }}>
          <SliderMenuItem min={1} max={8} value={symbolSize} onChange={onChangeSymbolSize}>
            {i18n.t('menu.graph.SymbolSize', lang) + ':'}
          </SliderMenuItem>
          <CheckboxMenuItem checked={horizontalGrid} onClick={onShowHorizontalGridLines}>
            {i18n.t('menu.graph.ShowHorizontalGridLines', lang)}
          </CheckboxMenuItem>
          <CheckboxMenuItem checked={verticalGrid} onClick={onShowVerticalGridLines}>
            {i18n.t('menu.graph.ShowHorizontalGridLines', lang)}
          </CheckboxMenuItem>
        </div>
      }
    >
      <MoreOutlined
        style={{
          position: 'absolute',
          fontSize: '20px',
          top: '10px',
          right: '10px',
          transition: '0.5s',
          color: hover ? 'black' : 'darkgray',
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
};

export default ScatterPlotMenu;
