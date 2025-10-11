/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { Space } from 'antd';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { ContextMenuItem, Copy, Cut, Lock } from '../../menuItems';
import i18n from 'src/i18n/i18n';
import { BillboardFlipCheckbox, HumanMoveViewItem, HumanObserverCheckbox } from './billboardMenuItems';
import { HumanModel } from 'src/models/HumanModel';
import HumanSelection from './humanSelection';
import { useLanguage } from 'src/hooks';
import { useContextMenuElement } from '../menuHooks';

const HumanMenu = () => {
  const lang = useLanguage();
  const human = useContextMenuElement(ObjectType.Human) as HumanModel;
  if (!human) return null;

  const editable = !human.locked;
  const orthographic = useStore.getState().viewState.orthographic ?? false;

  return (
    <>
      <Copy />
      {editable && <Cut />}
      <Lock selectedElement={human} />

      {editable && <BillboardFlipCheckbox billboardModel={human} />}

      {!orthographic && <HumanMoveViewItem human={human} />}

      {editable && (
        <>
          <HumanObserverCheckbox human={human} />

          <ContextMenuItem stayAfterClick>
            <Space style={{ width: '120px' }}>{i18n.t('peopleMenu.ChangePerson', lang)}: </Space>
            <HumanSelection human={human} />
          </ContextMenuItem>
        </>
      )}
    </>
  );
};

export default HumanMenu;
