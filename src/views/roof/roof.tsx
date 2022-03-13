/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../stores/common';
import { GableRoofModel, HipRoofModel, PyramidRoofModel, RoofModel, RoofType } from '../../models/RoofModel';
import { Extrude, Sphere } from '@react-three/drei';
import { Shape, Vector3 } from 'three';
import * as Selector from '../../stores/selector';
import { ActionType, ObjectType } from '../../types';
import PyramidRoof from './pyramidRoof';
import GableRoof from './gableRoof';
import HipRoof from './hipRoof';

const Roof = ({ ...props }: RoofModel) => {
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
    }
    return null;
  };

  // return renderRoof();
  // return <PyramidRoof {...(props as PyramidRoofModel)} />;
  // return <GableRoof {...(props as GableRoofModel)} />;
  return <HipRoof {...(props as HipRoofModel)} />;
};

export default Roof;
