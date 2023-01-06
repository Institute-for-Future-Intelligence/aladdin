/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import { ObjectType } from '../types';
import { FoundationModel } from '../models/FoundationModel';
import { Util } from '../Util';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';

export enum CheckStatus {
  NO_BUILDING = 3,
  AT_LEAST_ONE_BAD_NO_GOOD = 2,
  AT_LEAST_ONE_BAD_AT_LEAST_ONE_GOOD = 1,
  OK = 0,
}

export const useBuildingCheck = () => {
  const elements = useStore(Selector.elements);
  const countElementsByType = useStore(Selector.countElementsByType);
  const getChildrenOfType = useStore(Selector.getChildrenOfType);

  const foundationCount = countElementsByType(ObjectType.Foundation);
  if (foundationCount === 0) return CheckStatus.NO_BUILDING;
  let atLeastOneGood = false;
  let atLeastOneBad = false;
  for (const e of elements) {
    if (e.type === ObjectType.Foundation) {
      const f = e as FoundationModel;
      const walls = getChildrenOfType(ObjectType.Wall, f.id);
      if (walls.length > 0) {
        if (Util.isCompleteBuilding(f, elements)) {
          atLeastOneGood = true;
        } else {
          atLeastOneBad = true;
        }
      }
    }
  }
  if (atLeastOneBad && !atLeastOneGood) return CheckStatus.AT_LEAST_ONE_BAD_NO_GOOD;
  if (atLeastOneBad && atLeastOneGood) return CheckStatus.AT_LEAST_ONE_BAD_AT_LEAST_ONE_GOOD;

  return CheckStatus.OK;
};
