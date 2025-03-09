/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { Select } from 'antd';
import React from 'react';
import { LineStyle } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { useLanguage } from '../../../../hooks';

const { Option } = Select;

const LineStyleSelect = React.memo(
  ({ style, setStyle }: { style: LineStyle; setStyle: (value: LineStyle) => void }) => {
    const lang = useLanguage();

    return (
      <Select style={{ width: '200px' }} value={style} onChange={(value) => setStyle(value)}>
        <Option key={LineStyle.Solid} value={LineStyle.Solid}>
          <div
            style={{
              display: 'inline-block',
              verticalAlign: 'middle',
              marginRight: '12px',
              width: '48px',
              height: '1px',
              border: '1px solid dimGray',
            }}
          >
            {' '}
          </div>
          {i18n.t('polygonMenu.SolidLine', lang)}
        </Option>

        <Option key={LineStyle.Dashed} value={LineStyle.Dashed}>
          <div
            style={{
              display: 'inline-block',
              verticalAlign: 'middle',
              marginRight: '12px',
              width: '48px',
              height: '1px',
              border: '1px dashed dimGray',
            }}
          >
            {' '}
          </div>
          {i18n.t('polygonMenu.DashedLine', lang)}
        </Option>

        <Option key={LineStyle.Dotted} value={LineStyle.Dotted}>
          <div
            style={{
              display: 'inline-block',
              verticalAlign: 'middle',
              marginRight: '12px',
              width: '48px',
              height: '1px',
              border: '1px dotted dimGray',
            }}
          >
            {' '}
          </div>
          {i18n.t('polygonMenu.DottedLine', lang)}
        </Option>
      </Select>
    );
  },
);

export default LineStyleSelect;
