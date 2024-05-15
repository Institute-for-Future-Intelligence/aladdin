/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { Util } from '../Util';
import React, { useEffect, useMemo } from 'react';
import { computeDeclinationAngle, computeHourAngle, computeSunLocation } from '../analysis/sunTools';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import Heliodon from './heliodon';

const HeliodonWrapper = React.memo(() => {
  const heliodon = useStore(Selector.viewState.heliodon);
  const heliodonRadius = useStore(Selector.sceneRadius);
  const worldLatitude = useStore(Selector.world.latitude);
  const dateString = useStore(Selector.world.date);
  const setSunlightDirection = useStore(Selector.setSunlightDirection);

  const date = useMemo(() => new Date(dateString), [dateString]);

  const [hourAngle, declinationAngle] = useMemo(() => [computeHourAngle(date), computeDeclinationAngle(date)], [date]);

  useEffect(() => {
    setSunlightDirection(
      computeSunLocation(heliodonRadius, hourAngle, declinationAngle, Util.toRadians(worldLatitude)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldLatitude, hourAngle, declinationAngle, heliodonRadius]);

  return (
    <>
      {heliodon && (
        <Heliodon
          date={new Date(dateString)}
          hourAngle={hourAngle}
          declinationAngle={declinationAngle}
          worldLatitude={worldLatitude}
        />
      )}
    </>
  );
});

export default HeliodonWrapper;
