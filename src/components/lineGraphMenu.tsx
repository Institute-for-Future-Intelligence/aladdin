/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import styled from 'styled-components';
import { Dropdown } from 'antd';
import { ReactComponent as MenuSVG } from '../assets/menu.svg';
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

const LineGraphMenu = ({
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
      <StyledMenuSVG style={{ right: lineCount > 1 ? '25px' : '32px' }} onClick={(e) => e.stopPropagation()} />
    </Dropdown>
  );
};

export default LineGraphMenu;
