/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Select } from 'antd';
import { HumanName } from '../../../types';
import JaahImage from '../../../resources/jaah.png';
import JackImage from '../../../resources/jack.png';
import JadeImage from '../../../resources/jade.png';
import JaneImage from '../../../resources/jane.png';
import JayeImage from '../../../resources/jaye.png';
import JeanImage from '../../../resources/jean.png';
import JediImage from '../../../resources/jedi.png';
import JeffImage from '../../../resources/jeff.png';
import JenaImage from '../../../resources/jena.png';
import JeniImage from '../../../resources/jeni.png';
import JessImage from '../../../resources/jess.png';
import JettImage from '../../../resources/jett.png';
import JillImage from '../../../resources/jill.png';
import JoanImage from '../../../resources/joan.png';
import JoelImage from '../../../resources/joel.png';
import JoeyImage from '../../../resources/joey.png';
import JohnImage from '../../../resources/john.png';
import JoseImage from '../../../resources/jose.png';
import JuddImage from '../../../resources/judd.png';
import JudyImage from '../../../resources/judy.png';
import JuneImage from '../../../resources/june.png';
import JuroImage from '../../../resources/juro.png';
import XiaoliImage from '../../../resources/xiaoli.png';
import XiaomingImage from '../../../resources/xiaoming.png';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { HumanModel } from '../../../models/HumanModel';
import { UndoableChange } from '../../../undo/UndoableChange';
import i18n from '../../../i18n/i18n';

const { Option } = Select;

const HumanSelection = () => {
  const language = useStore(Selector.language);
  const updateHumanNameById = useStore(Selector.updateHumanNameById);
  const addUndoable = useStore(Selector.addUndoable);
  const human = useStore.getState().getSelectedElement() as HumanModel;

  const [updateFlag, setUpdateFlag] = useState(false);
  const lang = { lng: language };

  return (
    <Select
      style={{ width: '120px' }}
      value={human?.name ?? HumanName.Jack}
      onChange={(value) => {
        if (human) {
          const oldPerson = human.name;
          if (oldPerson !== value) {
            const undoableChange = {
              name: 'Change People',
              timestamp: Date.now(),
              oldValue: oldPerson,
              newValue: value,
              changedElementId: human.id,
              changedElementType: human.type,
              undo: () => {
                updateHumanNameById(undoableChange.changedElementId, undoableChange.oldValue as HumanName);
              },
              redo: () => {
                updateHumanNameById(undoableChange.changedElementId, undoableChange.newValue as HumanName);
              },
            } as UndoableChange;
            addUndoable(undoableChange);
            updateHumanNameById(human.id, value);
            setUpdateFlag(!updateFlag);
          }
        }
      }}
    >
      <Option key={HumanName.Jack} value={HumanName.Jack}>
        <img alt={HumanName.Jack} src={JackImage} height={20} style={{ paddingRight: '8px' }} />{' '}
        {i18n.t('people.Jack', lang)}
      </Option>
      <Option key={HumanName.Jaah} value={HumanName.Jaah}>
        <img alt={HumanName.Jaah} src={JaahImage} height={20} style={{ paddingRight: '8px' }} />{' '}
        {i18n.t('people.Jaah', lang)}
      </Option>
      <Option key={HumanName.Jade} value={HumanName.Jade}>
        <img alt={HumanName.Jade} src={JadeImage} height={20} style={{ paddingRight: '8px' }} />{' '}
        {i18n.t('people.Jade', lang)}
      </Option>
      <Option key={HumanName.Jane} value={HumanName.Jane}>
        <img alt={HumanName.Jane} src={JaneImage} height={20} style={{ paddingRight: '8px' }} />{' '}
        {i18n.t('people.Jane', lang)}
      </Option>
      <Option key={HumanName.Jaye} value={HumanName.Jaye}>
        <img alt={HumanName.Jaye} src={JayeImage} height={20} style={{ paddingRight: '8px' }} />{' '}
        {i18n.t('people.Jaye', lang)}
      </Option>
      <Option key={HumanName.Jean} value={HumanName.Jean}>
        <img alt={HumanName.Jean} src={JeanImage} height={20} style={{ paddingRight: '8px' }} />{' '}
        {i18n.t('people.Jean', lang)}
      </Option>
      <Option key={HumanName.Jedi} value={HumanName.Jedi}>
        <img alt={HumanName.Jedi} src={JediImage} height={20} style={{ paddingRight: '8px' }} />{' '}
        {i18n.t('people.Jedi', lang)}
      </Option>
      <Option key={HumanName.Jeff} value={HumanName.Jeff}>
        <img alt={HumanName.Jeff} src={JeffImage} height={20} style={{ paddingRight: '8px' }} />{' '}
        {i18n.t('people.Jeff', lang)}
      </Option>
      <Option key={HumanName.Jena} value={HumanName.Jena}>
        <img alt={HumanName.Jena} src={JenaImage} height={20} style={{ paddingRight: '8px' }} />{' '}
        {i18n.t('people.Jena', lang)}
      </Option>
      <Option key={HumanName.Jeni} value={HumanName.Jeni}>
        <img alt={HumanName.Jeni} src={JeniImage} height={20} style={{ paddingRight: '4px' }} />{' '}
        {i18n.t('people.Jeni', lang)}
      </Option>
      <Option key={HumanName.Jess} value={HumanName.Jess}>
        <img alt={HumanName.Jess} src={JessImage} height={20} style={{ paddingRight: '4px' }} />{' '}
        {i18n.t('people.Jess', lang)}
      </Option>
      <Option key={HumanName.Jett} value={HumanName.Jett}>
        <img alt={HumanName.Jett} src={JettImage} height={20} style={{ paddingRight: '6px' }} />{' '}
        {i18n.t('people.Jett', lang)}
      </Option>
      <Option key={HumanName.Jill} value={HumanName.Jill}>
        <img alt={HumanName.Jill} src={JillImage} height={20} style={{ paddingRight: '4px' }} />{' '}
        {i18n.t('people.Jill', lang)}
      </Option>
      <Option key={HumanName.Joan} value={HumanName.Joan}>
        <img alt={HumanName.Joan} src={JoanImage} height={20} style={{ paddingRight: '7px' }} />{' '}
        {i18n.t('people.Joan', lang)}
      </Option>
      <Option key={HumanName.Joel} value={HumanName.Joel}>
        <img alt={HumanName.Joel} src={JoelImage} height={20} style={{ paddingRight: '4px' }} />{' '}
        {i18n.t('people.Joel', lang)}
      </Option>
      <Option key={HumanName.Joey} value={HumanName.Joey}>
        <img alt={HumanName.Joey} src={JoeyImage} height={20} style={{ paddingRight: '4px' }} />{' '}
        {i18n.t('people.Joey', lang)}
      </Option>
      <Option key={HumanName.John} value={HumanName.John}>
        <img alt={HumanName.John} src={JohnImage} height={20} style={{ paddingRight: '6px' }} />{' '}
        {i18n.t('people.John', lang)}
      </Option>
      <Option key={HumanName.Jose} value={HumanName.Jose}>
        <img alt={HumanName.Jose} src={JoseImage} height={20} style={{ paddingRight: '0px' }} />{' '}
        {i18n.t('people.Jose', lang)}
      </Option>
      <Option key={HumanName.Judd} value={HumanName.Judd}>
        <img alt={HumanName.Judd} src={JuddImage} height={20} style={{ paddingRight: '8px' }} />{' '}
        {i18n.t('people.Judd', lang)}
      </Option>
      <Option key={HumanName.Judy} value={HumanName.Judy}>
        <img alt={HumanName.Judy} src={JudyImage} height={20} style={{ paddingRight: '8px' }} />{' '}
        {i18n.t('people.Judy', lang)}
      </Option>
      <Option key={HumanName.June} value={HumanName.June}>
        <img alt={HumanName.June} src={JuneImage} height={20} style={{ paddingRight: '8px' }} />{' '}
        {i18n.t('people.June', lang)}
      </Option>
      <Option key={HumanName.Juro} value={HumanName.Juro}>
        <img alt={HumanName.Juro} src={JuroImage} height={20} style={{ paddingRight: '8px' }} />{' '}
        {i18n.t('people.Juro', lang)}
      </Option>
      <Option key={HumanName.Xiaoli} value={HumanName.Xiaoli}>
        <img alt={HumanName.Xiaoli} src={XiaoliImage} height={20} style={{ paddingRight: '8px' }} />{' '}
        {i18n.t('people.Xiaoli', lang)}
      </Option>
      <Option key={HumanName.Xiaoming} value={HumanName.Xiaoming}>
        <img alt={HumanName.Xiaoming} src={XiaomingImage} height={20} style={{ paddingRight: '8px' }} />{' '}
        {i18n.t('people.Xiaoming', lang)}
      </Option>
    </Select>
  );
};

export default HumanSelection;
