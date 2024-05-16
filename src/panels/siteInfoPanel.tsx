/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import styled from 'styled-components';
import { Space } from 'antd';
import { computeOutsideTemperature, getOutsideTemperatureAtMinute } from '../analysis/heatTools';
import dayjs from 'dayjs';
import { Util } from '../Util';
import i18n from '../i18n/i18n';
import { computeSunriseAndSunsetInMinutes } from '../analysis/sunTools';
import LocationImage from '../assets/location.png';
import DateImage from '../assets/date.png';
import ThermometerImage from '../assets/thermometer.png';
import { useLanguage } from '../views/hooks';

const Container = styled.div`
  position: absolute;
  top: 75px;
  left: 0;
  margin: 0;
  display: flex;
  justify-content: center;
  align-self: center;
  align-content: center;
  align-items: center;
  padding: 0;
  opacity: 100%;
  user-select: none;
  tab-index: -1; // set to be not focusable
  z-index: 7; // must be less than other panels
`;

interface ColumnWrapperProps {
  $projectView: boolean;
}

const ColumnWrapper = styled.div<ColumnWrapperProps>`
  position: absolute;
  top: 0;
  left: ${(p) => (p.$projectView ? 'calc(100vw / 2)' : 'calc(100vw / 4)')};
  align-self: center;
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

const SiteInfoPanel = React.memo(({ city }: SiteInfoPanelProps) => {
  const dateString = useStore(Selector.world.date);
  const address = useStore(Selector.world.address);
  const latitude = useStore(Selector.world.latitude);
  const longitude = useStore(Selector.world.longitude);
  const diurnalTemperatureModel = useStore(Selector.world.diurnalTemperatureModel);
  const weatherData = useStore(Selector.weatherData);
  const sunlightDirection = useStore(Selector.sunlightDirection);
  const highestTemperatureTimeInMinutes = useStore(Selector.world.highestTemperatureTimeInMinutes) ?? 900;
  const projectView = useStore(Selector.projectView);

  const [dailyTemperatures, setDailyTemperatures] = useState({ low: 0, high: 20 });
  const [currentTemperature, setCurrentTemperature] = useState<number>(10);
  const now = new Date(dateString);
  const daytime = sunlightDirection.y > 0;
  const lang = useLanguage();

  useEffect(() => {
    if (city) {
      const weather = weatherData[city];
      if (weather) {
        const t = computeOutsideTemperature(now, weather.lowestTemperatures, weather.highestTemperatures);
        setDailyTemperatures(t);
        const c = getOutsideTemperatureAtMinute(
          t.high,
          t.low,
          diurnalTemperatureModel,
          highestTemperatureTimeInMinutes,
          sunMinutes,
          Util.minutesIntoDay(now),
        );
        setCurrentTemperature(c);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, dateString]);

  const sunMinutes = useMemo(() => {
    return computeSunriseAndSunsetInMinutes(now, latitude);
  }, [dateString, latitude]);

  const color = daytime ? 'navajowhite' : 'antiquewhite';
  const filter = daytime
    ? 'invert(85%) sepia(45%) saturate(335%) hue-rotate(329deg) brightness(100%) contrast(101%)'
    : 'invert(95%) sepia(7%) saturate(1598%) hue-rotate(312deg) brightness(106%) contrast(96%)';

  return (
    <Container>
      <ColumnWrapper $projectView={projectView}>
        <Space direction={'horizontal'} style={{ color: color, fontSize: '10px' }}>
          <img
            title={i18n.t('word.Location', lang)}
            alt={'Location'}
            src={LocationImage}
            height={20}
            width={20}
            style={{
              filter: filter,
              cursor: 'pointer',
              verticalAlign: 'middle',
            }}
          />
          {(address ?? '') +
            ' (' +
            Math.abs(latitude).toFixed(2) +
            '°' +
            (latitude > 0 ? 'N' : 'S') +
            ', ' +
            Math.abs(longitude).toFixed(2) +
            '°' +
            (longitude > 0 ? 'E' : 'W') +
            ')'}
          <img
            title={i18n.t('word.Date', lang)}
            alt={'Date'}
            src={DateImage}
            height={20}
            width={20}
            style={{
              filter: filter,
              cursor: 'pointer',
              verticalAlign: 'middle',
            }}
          />
          {dayjs(now).format('MM/DD hh:mm A')}
          <img
            title={i18n.t('word.Temperature', lang)}
            alt={'Temperature'}
            src={ThermometerImage}
            height={20}
            width={20}
            style={{
              filter: filter,
              cursor: 'pointer',
              verticalAlign: 'middle',
            }}
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
});

export default SiteInfoPanel;
