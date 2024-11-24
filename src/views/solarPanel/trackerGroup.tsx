/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { TrackerType } from 'src/types';
import { SurfaceType } from './solarPanel';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { Group, Vector3 } from 'three';
import { useStore } from 'src/stores/common';
import * as Selector from '../../stores/selector';
import { getSunDirection } from 'src/analysis/sunTools';
import { HALF_PI } from 'src/constants';
import { tempEuler, tempQuaternion_0 } from 'src/helpers';
import { SolarPanelUtil } from './SolarPanelUtil';
import { FOUNDATION_GROUP_NAME } from '../foundation/foundation';
import { CUBOID_WRAPPER_NAME } from '../cuboid';

interface TrackerGroupProps {
  tiltAngle: number;
  trackerType: TrackerType;
  surfaceType: SurfaceType;
  children: React.ReactNode;
}

export interface TrackerGroupRefProps {
  reset: () => void;
  update: (trackerType: TrackerType, parentRotationZ: number) => void;
}

const TrackerGroup = React.memo(
  forwardRef<TrackerGroupRefProps, TrackerGroupProps>(
    ({ tiltAngle, trackerType, surfaceType, children }: TrackerGroupProps, ref) => {
      const groupRef = useRef<Group>(null!);

      const date = useStore(Selector.world.date);
      const latitude = useStore(Selector.world.latitude);
      const sunDirectionRef = useRef(new Vector3());
      const sunDirection = useMemo(() => {
        const d = getSunDirection(new Date(date), latitude);
        sunDirectionRef.current.copy(d);
        return d;
      }, [date, latitude]);

      const resetTracker = () => {
        if (!groupRef.current) return;
        groupRef.current.rotation.set(0, 0, 0);
      };

      const udpateTracker = (trackerType: TrackerType, parentRotationZ: number) => {
        if (!groupRef.current) return;
        switch (trackerType) {
          case TrackerType.ALTAZIMUTH_DUAL_AXIS_TRACKER: {
            groupRef.current.rotation.set(
              Math.atan2(Math.hypot(sunDirectionRef.current.x, sunDirectionRef.current.y), sunDirectionRef.current.z),
              0,
              Math.atan2(sunDirectionRef.current.y, sunDirectionRef.current.x) + HALF_PI - parentRotationZ,
              'ZXY',
            );
            break;
          }
          case TrackerType.VERTICAL_SINGLE_AXIS_TRACKER: {
            groupRef.current.rotation.set(
              tiltAngle,
              0,
              Math.atan2(sunDirectionRef.current.y, sunDirectionRef.current.x) + HALF_PI - parentRotationZ,
              'ZXY',
            );
            break;
          }
          case TrackerType.HORIZONTAL_SINGLE_AXIS_TRACKER: {
            const rotatedSunDirection = new Vector3()
              .copy(sunDirectionRef.current)
              .applyEuler(tempEuler.set(0, 0, -parentRotationZ));
            groupRef.current.rotation.set(0, Math.atan2(rotatedSunDirection.x, rotatedSunDirection.z), 0, 'ZXY');
            break;
          }
        }
      };

      useImperativeHandle(
        ref,
        () => {
          return {
            reset() {
              resetTracker();
            },
            update(trackerType: TrackerType, parentRotationZ: number) {
              udpateTracker(trackerType, parentRotationZ);
            },
          };
        },
        [],
      );

      useEffect(() => {
        if (!groupRef.current) return;
        if (trackerType === TrackerType.NO_TRACKER || surfaceType !== SurfaceType.Horizontal) {
          resetTracker();
          return;
        }
        const parentGroup = SolarPanelUtil.findParentGroup(groupRef.current, [
          FOUNDATION_GROUP_NAME,
          CUBOID_WRAPPER_NAME,
        ]);
        if (!parentGroup) return;
        udpateTracker(trackerType, tempEuler.setFromQuaternion(parentGroup.getWorldQuaternion(tempQuaternion_0)).z);
      }, [sunDirection, trackerType, surfaceType]);

      return <group ref={groupRef}>{children}</group>;
    },
  ),
);

export default TrackerGroup;
