/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { Select } from 'antd';
import React from 'react';
import { LineWidth } from '../../../../types';

const { Option } = Select;

const LineWidthSelect = React.memo(
  ({ width, setWidth, uiWidth }: { width: LineWidth; setWidth: (value: LineWidth) => void; uiWidth?: number }) => {
    return (
      <Select style={{ width: (uiWidth ?? 200) + 'px' }} value={width} onChange={(value) => setWidth(value)}>
        <Option key={LineWidth.One} value={LineWidth.One}>
          <div
            style={{
              display: 'inline-block',
              verticalAlign: 'middle',
              marginRight: '24px',
              width: '100%',
              height: '1px',
              border: '1px solid dimGray',
            }}
          />
        </Option>

        <Option key={LineWidth.Two} value={LineWidth.Two}>
          <div
            style={{
              display: 'inline-block',
              verticalAlign: 'middle',
              marginRight: '24px',
              width: '100%',
              height: '1px',
              border: '2px solid dimGray',
            }}
          />
        </Option>

        <Option key={LineWidth.Three} value={LineWidth.Three}>
          <div
            style={{
              display: 'inline-block',
              verticalAlign: 'middle',
              marginRight: '24px',
              width: '100%',
              height: '1px',
              border: '3px solid dimGray',
            }}
          />
        </Option>

        <Option key={LineWidth.Four} value={LineWidth.Four}>
          <div
            style={{
              display: 'inline-block',
              verticalAlign: 'middle',
              marginRight: '24px',
              width: '100%',
              height: '1px',
              border: '4px solid dimGray',
            }}
          />
        </Option>

        <Option key={LineWidth.Five} value={LineWidth.Five}>
          <div
            style={{
              display: 'inline-block',
              verticalAlign: 'middle',
              marginRight: '24px',
              width: '100%',
              height: '1px',
              border: '5px solid dimGray',
            }}
          />
        </Option>
      </Select>
    );
  },
);

export default LineWidthSelect;
