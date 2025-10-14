/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { BarsOutlined } from '@ant-design/icons';
import { Popover } from 'antd';
import i18n from '../i18n/i18n';
import { AntdCheckboxMenuItem } from './contextMenu/menuItems';
import { useLanguage } from 'src/hooks';

export interface BarGraphMenuProps {
  horizontalGrid: boolean;
  verticalGrid: boolean;
  changeHorizontalGrid?: (visible: boolean) => void;
  changeVerticalGrid?: (visible: boolean) => void;
}

const BarGraphMenu = React.memo(
  ({ horizontalGrid, verticalGrid, changeHorizontalGrid, changeVerticalGrid }: BarGraphMenuProps) => {
    const lang = useLanguage();
    const [hover, setHover] = useState<boolean>(false);

    const onShowHorizontalGridLines = () => {
      changeHorizontalGrid?.(!horizontalGrid);
    };

    const onShowVerticalGridLines = () => {
      changeVerticalGrid?.(!verticalGrid);
    };

    return (
      <Popover
        content={
          <div style={{ width: '200px' }}>
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

export default BarGraphMenu;
