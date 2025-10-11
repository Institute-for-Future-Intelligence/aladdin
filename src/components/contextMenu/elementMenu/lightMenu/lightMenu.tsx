/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { Copy, Cut, Lock } from '../../menuItems';
import { LightModel } from 'src/models/LightModel';
import { LightColorSubmenu, LightDistanceInput, LightInsideCheckbox, LightIntensityInput } from './lightMenuItems';
import { useLanguage } from 'src/hooks';
import { useContextMenuElement } from '../menuHooks';

const LightMenu = () => {
  const lang = useLanguage();
  const light = useContextMenuElement(ObjectType.Light) as LightModel;

  if (!light) return null;

  const editable = !light.locked;
  const parent = light.parentId ? useStore.getState().getParent(light) : undefined;

  return (
    <>
      <Copy />
      {editable && <Cut />}

      <Lock selectedElement={light} />

      {editable && parent && (parent.type === ObjectType.Roof || parent.type === ObjectType.Wall) && (
        <LightInsideCheckbox light={light} />
      )}

      {editable && (
        <>
          <LightIntensityInput light={light} />
          <LightDistanceInput light={light} />
          <LightColorSubmenu light={light} />
        </>
      )}
    </>
  );
};

export default LightMenu;
