/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from '../../../models/ElementModel';
import { useEffect, useState } from 'react';

export const useLabel = (element: ElementModel) => {
  const [labelText, setLabelText] = useState<string>(element?.label ?? '');
  useEffect(() => {
    if (element?.label) {
      setLabelText(element.label);
    }
  }, [element?.id]);
  return { labelText, setLabelText };
};
