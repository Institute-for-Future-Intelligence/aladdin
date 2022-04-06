/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect } from 'react';
import { useStore } from '../../stores/common';
import {
  GableRoofModel,
  GambrelRoofModel,
  HipRoofModel,
  PyramidRoofModel,
  RoofModel,
  RoofType,
} from '../../models/RoofModel';
import * as Selector from '../../stores/selector';
import PyramidRoof from './pyramidRoof';
import GableRoof from './gableRoof';
import HipRoof from './hipRoof';
import GambrelRoof from './GambrelRoof';

const Roof = (props: RoofModel) => {
  const { id, wallsId, roofType } = props;

  const removeElementById = useStore(Selector.removeElementById);

  useEffect(() => {
    if (wallsId.length === 0) {
      removeElementById(id, false);
    }
  }, [wallsId]);

  const renderRoof = () => {
    switch (roofType) {
      case RoofType.Pyramid:
        return <PyramidRoof {...(props as PyramidRoofModel)} />;
      case RoofType.Gable:
        return <GableRoof {...(props as GableRoofModel)} />;
      case RoofType.Hip:
        return <HipRoof {...(props as HipRoofModel)} />;
      case RoofType.Gambrel:
        return <GambrelRoof {...(props as GambrelRoofModel)} />;
      default:
        return null;
    }
  };

  return renderRoof();
};

export default Roof;
