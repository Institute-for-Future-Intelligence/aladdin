/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { Space } from 'antd';
import { ObjectType } from 'src/types';
import { ContextMenuItem, Copy, Cut, Lock } from '../../menuItems';
import i18n from 'src/i18n/i18n';
import { BillboardFlipCheckbox } from './billboardMenuItems';
import { FlowerModel } from 'src/models/FlowerModel';
import FlowerSelection from './flowerSelection';
import { useLanguage } from 'src/hooks';
import { useContextMenuElement } from '../menuHooks';

const FlowerMenu = () => {
  const lang = useLanguage();
  const flower = useContextMenuElement(ObjectType.Flower) as FlowerModel;
  if (!flower) return null;

  const editable = !flower.locked;

  return (
    <>
      <Copy />
      {editable && <Cut />}

      <Lock selectedElement={flower} />

      {editable && <BillboardFlipCheckbox billboardModel={flower} />}

      {editable && (
        <ContextMenuItem stayAfterClick>
          <Space style={{ width: '60px' }}>{i18n.t('flowerMenu.Type', lang)}: </Space>
          <FlowerSelection flower={flower} />
        </ContextMenuItem>
      )}
    </>
  );
};

export default FlowerMenu;
