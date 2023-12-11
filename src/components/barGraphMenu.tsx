/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import styled from 'styled-components';
import { Dropdown } from 'antd';
import { ReactComponent as MenuSVG } from '../assets/menu.svg';
import i18n from '../i18n/i18n';
import type { MenuProps } from 'antd';
import { CheckboxMenuItem } from './contextMenu/menuItems';
import { useLanguage } from 'src/views/hooks';

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
  const lang = useLanguage();

  const onShowHorizontalGridLines = () => {
    changeHorizontalGrid?.(!horizontalGrid);
  };

  const onShowVerticalGridLines = () => {
    changeVerticalGrid?.(!verticalGrid);
  };

  const items: MenuProps['items'] = [
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
      <StyledMenuSVG style={{ right: '32px' }} onClick={(e) => e.stopPropagation()} />
    </Dropdown>
  );
};

export default BarGraphMenu;
