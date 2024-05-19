/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { BarsOutlined } from '@ant-design/icons';
import { Popover } from 'antd';
import i18n from '../i18n/i18n';
import { useLanguage } from 'src/hooks';
import { CheckboxMenuItem, SliderMenuItem } from './contextMenu/menuItems';

export interface LineGraphMenuProps {
  horizontalGrid: boolean;
  verticalGrid: boolean;
  lineCount: number;
  lineWidth: number;
  symbolSize: number;
  changeHorizontalGrid?: (visible: boolean) => void;
  changeVerticalGrid?: (visible: boolean) => void;
  changeLineWidth?: (width: number) => void;
  changeSymbolSize?: (count: number) => void;
}

const LineGraphMenu = React.memo(
  ({
    horizontalGrid,
    verticalGrid,
    lineCount,
    lineWidth,
    symbolSize,
    changeHorizontalGrid,
    changeVerticalGrid,
    changeLineWidth,
    changeSymbolSize,
  }: LineGraphMenuProps) => {
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

    return (
      <Popover
        content={
          <div style={{ width: '200px' }}>
            <SliderMenuItem min={0} max={10} value={lineWidth * 2} onChange={onChangeLineWidth}>
              {i18n.t('menu.graph.LineWidth', lang) + ':'}
            </SliderMenuItem>
            <SliderMenuItem min={2} max={12} value={symbolSize * 5} onChange={onChangeSymbolSize}>
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

export default LineGraphMenu;
