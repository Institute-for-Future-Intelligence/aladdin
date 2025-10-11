/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { DoorModel, DoorType } from 'src/models/DoorModel';
import { DoorTexture, ObjectType } from 'src/types';
import { Copy, Cut, DialogItem, Lock } from '../../menuItems';
import { DoorFilledCheckbox, DoorFramedCheckbox, DoorInteriorCheckbox, DoorTypeSubmenu } from './doorMenuItems';
import i18n from 'src/i18n/i18n';
import DoorWidthInput from './doorWidthInput';
import DoorHeightInput from './doorHeightInput';
import DoorOpacityInput from './doorOpacityInput';
import DoorUValueInput from './doorUValueInput';
import DoorHeatCapacityInput from './doorHeatCapacityInput';
import DoorTextureSelection from './doorTextureSelection';
import DoorColorSelection from './doorColorSelection';
import DoorFrameColorSelection from './doorFrameColorSelection';
import DoorPermeabilityInput from './doorPermeabilityInput';
import { useLanguage } from 'src/hooks';
import { useContextMenuElement } from '../menuHooks';

const DoorMenu = () => {
  const lang = useLanguage();
  const door = useContextMenuElement(ObjectType.Door) as DoorModel;

  if (!door) return null;

  const editable = !door.locked;

  return (
    <>
      <Copy />

      {editable && <Cut />}

      <Lock selectedElement={door} />

      {editable && (
        <>
          {/* door-filled */}
          <DoorFilledCheckbox door={door} />

          {/* door-interior */}
          <DoorInteriorCheckbox door={door} />

          {door.doorType === DoorType.Default && (
            <>
              {/* door-framed */}
              <DoorFramedCheckbox door={door} />
            </>
          )}

          {/* door-type-submenu */}
          <DoorTypeSubmenu door={door} />

          {/* door-width */}
          <DialogItem Dialog={DoorWidthInput}>{i18n.t('word.Width', lang)} ...</DialogItem>

          {/* door-height */}
          <DialogItem Dialog={DoorHeightInput}>{i18n.t('word.Height', lang)} ...</DialogItem>

          {door.filled && (
            <>
              {/* door-u-value */}
              <DialogItem Dialog={DoorUValueInput}>{i18n.t('word.UValue', lang)} ...</DialogItem>

              {/* door-air-permeability */}
              <DialogItem Dialog={DoorPermeabilityInput}>{i18n.t('word.AirPermeability', lang)} ...</DialogItem>

              {/* door-heat-capacity */}
              <DialogItem Dialog={DoorHeatCapacityInput}>{i18n.t('word.VolumetricHeatCapacity', lang)} ...</DialogItem>

              {/* door-texture */}
              <DialogItem Dialog={DoorTextureSelection}>{i18n.t('word.Texture', lang)} ...</DialogItem>

              {/* door-color */}
              <DialogItem Dialog={DoorColorSelection}>{i18n.t('word.Color', lang)} ...</DialogItem>

              {/* door-frame-color */}
              <DialogItem Dialog={DoorFrameColorSelection}>{i18n.t('doorMenu.FrameColor', lang)} ...</DialogItem>

              {(door.textureType === DoorTexture.Default || door.textureType === DoorTexture.NoTexture) && (
                <>
                  {/* door-opacity */}
                  <DialogItem Dialog={DoorOpacityInput}>{i18n.t('wallMenu.Opacity', lang)} ...</DialogItem>
                </>
              )}
            </>
          )}
        </>
      )}
    </>
  );
};

export default DoorMenu;
