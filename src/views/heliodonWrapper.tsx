/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { Util } from '../Util';
import React, { useEffect, useState } from 'react';
import { computeDeclinationAngle, computeHourAngle, computeSunLocation } from '../analysis/sunTools';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import Heliodon from './heliodon';

const HeliodonWrapper = () => {
  const heliodon = useStore(Selector.viewState.showHeliodonAfterBoundingBox);
  const heliodonRadius = useStore(Selector.sceneRadius);
  const worldLatitude = useStore(Selector.world.latitude);
  const dateString = useStore(Selector.world.date);
  const setSunlightDirection = useStore(Selector.setSunlightDirection);

  const [hourAngle, setHourAngle] = useState<number>(0);
  const [declinationAngle, setDeclinationAngle] = useState<number>(0);

  useEffect(() => {
    const date = new Date(dateString);
    setHourAngle(computeHourAngle(date));
    setDeclinationAngle(computeDeclinationAngle(date));
  }, [dateString]);

  useEffect(() => {
    setSunlightDirection(
      computeSunLocation(heliodonRadius, hourAngle, declinationAngle, Util.toRadians(worldLatitude)),
    );
  }, [worldLatitude, hourAngle, declinationAngle, heliodonRadius]);

  return (
    <React.Fragment>
      {heliodon && <Heliodon hourAngle={hourAngle} declinationAngle={declinationAngle} worldLatitude={worldLatitude} />}
    </React.Fragment>
  );
};

export default React.memo(HeliodonWrapper);
