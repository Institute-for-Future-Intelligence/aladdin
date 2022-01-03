/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDay, faCloudSunRain, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { Space } from 'antd';
import { computeOutsideTemperature, getOutsideTemperatureAtMinute } from '../analysis/heatTools';
import dayjs from 'dayjs';
import { Util } from '../Util';
import i18n from '../i18n/i18n';

const Container = styled.div`
  position: absolute;
  top: 75px;
  left: 0;
  margin: 0;
  display: flex;
  justify-content: center;
  align-self: center;
  alignment: center;
  align-content: center;
  align-items: center;
  padding: 0;
  opacity: 100%;
  user-select: none;
  z-index: 8; // must be less than other panels
`;

const ColumnWrapper = styled.div`
  position: absolute;
  top: 0;
  left: calc(100vw / 2 - 100vw / 4);
  align-self: center;
  alignment: center;
  align-content: center;
  align-items: center;
  margin: 0;
  width: calc(100vw / 2);
  display: flex;
  font-size: 12px;
  flex-direction: column;
  opacity: 100%;
`;

export interface SiteInfoPanelProps {
  city: string | null;
}

const SiteInfoPanel = ({ city }: SiteInfoPanelProps) => {
  const language = useStore(Selector.language);
  const dateString = useStore(Selector.world.date);
  const address = useStore(Selector.world.address);
  const latitude = useStore(Selector.world.latitude);
  const longitude = useStore(Selector.world.longitude);
  const weatherData = useStore(Selector.weatherData);
  const sunlightDirection = useStore(Selector.sunlightDirection);

  const [dailyTemperatures, setDailyTemperatures] = useState({ low: 0, high: 20 });
  const [currentTemperature, setCurrentTemperature] = useState<number>(10);
  const now = new Date(dateString);
  const daytime = sunlightDirection.y > 0;
  const lang = { lng: language };

  useEffect(() => {
    if (city) {
      const weather = weatherData[city];
      if (weather) {
        const t = computeOutsideTemperature(now, weather.lowestTemperatures, weather.highestTemperatures);
        setDailyTemperatures(t);
        const c = getOutsideTemperatureAtMinute(t.high, t.low, Util.minutesIntoDay(now));
        setCurrentTemperature(c);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, dateString]);

  const color = daytime ? 'navajowhite' : 'antiquewhite';

  return (
    <Container>
      <ColumnWrapper>
        <Space direction={'horizontal'} style={{ color: color, fontSize: '10px' }}>
          <FontAwesomeIcon
            title={i18n.t('word.Location', lang)}
            icon={faMapMarkerAlt}
            size={'3x'}
            color={color}
            style={{ paddingLeft: '10px' }}
          />
          {(address ?? '') +
            ' (' +
            Math.abs(latitude).toFixed(2) +
            '° ' +
            (latitude > 0 ? 'N' : 'S') +
            ', ' +
            Math.abs(longitude).toFixed(2) +
            '° ' +
            (longitude > 0 ? 'E' : 'W') +
            ')'}
          <FontAwesomeIcon
            title={i18n.t('word.Date', lang)}
            icon={faCalendarDay}
            size={'3x'}
            color={color}
            style={{ paddingLeft: '10px' }}
          />
          {dayjs(now).format('MM/DD hh:mm a')}
          <FontAwesomeIcon
            title={i18n.t('word.Weather', lang)}
            icon={faCloudSunRain}
            size={'3x'}
            color={color}
            style={{ paddingLeft: '10px' }}
          />
          {dailyTemperatures
            ? currentTemperature.toFixed(1) +
              '°C (' +
              i18n.t('siteInfoPanel.Low', lang) +
              ':' +
              dailyTemperatures.low.toFixed(1) +
              '°C, ' +
              i18n.t('siteInfoPanel.High', lang) +
              ': ' +
              dailyTemperatures.high.toFixed(1) +
              '°C)'
            : ''}
        </Space>
      </ColumnWrapper>
    </Container>
  );
};

export default React.memo(SiteInfoPanel);
