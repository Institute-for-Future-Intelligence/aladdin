/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Select } from 'antd';
import { HumanName } from '../../../types';
import JaahImage from '../../../resources/jaah.png';
import JackImage from '../../../resources/jack.png';
import JacobImage from '../../../resources/jacob.png';
import JacquelineImage from '../../../resources/jacqueline.png';
import JadeImage from '../../../resources/jade.png';
import JameliaImage from '../../../resources/jamelia.png';
import JamesImage from '../../../resources/james.png';
import JayaImage from '../../../resources/jaya.png';
import JayeImage from '../../../resources/jaye.png';
import JeanetteImage from '../../../resources/jeanette.png';
import JediImage from '../../../resources/jedi.png';
import JeffImage from '../../../resources/jeff.png';
import JenaImage from '../../../resources/jena.png';
import JenniferImage from '../../../resources/jennifer.png';
import JessImage from '../../../resources/jess.png';
import JettImage from '../../../resources/jett.png';
import JiyaImage from '../../../resources/jiya.png';
import JoanImage from '../../../resources/joan.png';
import JocelynImage from '../../../resources/jocelyn.png';
import JoelImage from '../../../resources/joel.png';
import JoeyImage from '../../../resources/joey.png';
import JoseImage from '../../../resources/jose.png';
import JosephImage from '../../../resources/joseph.png';
import JohnImage from '../../../resources/john.png';
import JuddImage from '../../../resources/judd.png';
import JuliaImage from '../../../resources/julia.png';
import JulioImage from '../../../resources/julio.png';
import JumapiliImage from '../../../resources/jumapili.png';
import JuneImage from '../../../resources/june.png';
import JuroImage from '../../../resources/juro.png';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { HumanModel } from '../../../models/HumanModel';
import { UndoableChange } from '../../../undo/UndoableChange';
import i18n from '../../../i18n/i18n';

const { Option } = Select;

const HumanSelection = () => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const updateHumanNameById = useStore(Selector.updateHumanNameById);
  const addUndoable = useStore(Selector.addUndoable);
  const human = useStore.getState().getSelectedElement() as HumanModel;

  const [updateFlag, setUpdateFlag] = useState(false);
  const lang = { lng: language };

  return (
    <Select
      style={{ width: '140px' }}
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
            setCommonStore((state) => {
              state.actionState.humanName = value;
            });
            setUpdateFlag(!updateFlag);
          }
        }
      }}
    >
      <Option key={HumanName.Jack} value={HumanName.Jack}>
        <img alt={HumanName.Jack} src={JackImage} height={20} style={{ paddingRight: '21px' }} />{' '}
        {i18n.t('people.Jack', lang)}
      </Option>
      <Option key={HumanName.Jacob} value={HumanName.Jacob}>
        <img alt={HumanName.Jacob} src={JacobImage} height={20} style={{ paddingRight: '16px' }} />{' '}
        {i18n.t('people.Jacob', lang)}
      </Option>
      <Option key={HumanName.Jacqueline} value={HumanName.Jacqueline}>
        <img alt={HumanName.Jacqueline} src={JacquelineImage} height={20} style={{ paddingRight: '20px' }} />{' '}
        {i18n.t('people.Jacqueline', lang)}
      </Option>
      <Option key={HumanName.Jaah} value={HumanName.Jaah}>
        <img alt={HumanName.Jaah} src={JaahImage} height={20} style={{ paddingRight: '19px' }} />{' '}
        {i18n.t('people.Jaah', lang)}
      </Option>
      <Option key={HumanName.Jade} value={HumanName.Jade}>
        <img alt={HumanName.Jade} src={JadeImage} height={20} style={{ paddingRight: '20px' }} />{' '}
        {i18n.t('people.Jade', lang)}
      </Option>
      <Option key={HumanName.Jamelia} value={HumanName.Jamelia}>
        <img alt={HumanName.Jamelia} src={JameliaImage} height={20} style={{ paddingRight: '20px' }} />{' '}
        {i18n.t('people.Jamelia', lang)}
      </Option>
      <Option key={HumanName.James} value={HumanName.James}>
        <img alt={HumanName.James} src={JamesImage} height={20} style={{ paddingRight: '21px' }} />{' '}
        {i18n.t('people.James', lang)}
      </Option>
      <Option key={HumanName.Jaya} value={HumanName.Jaya}>
        <img alt={HumanName.Jaya} src={JayaImage} height={20} style={{ paddingRight: '19px' }} />{' '}
        {i18n.t('people.Jaya', lang)}
      </Option>
      <Option key={HumanName.Jaye} value={HumanName.Jaye}>
        <img alt={HumanName.Jaye} src={JayeImage} height={20} style={{ paddingRight: '20px' }} />{' '}
        {i18n.t('people.Jaye', lang)}
      </Option>
      <Option key={HumanName.Jeanette} value={HumanName.Jeanette}>
        <img alt={HumanName.Jeanette} src={JeanetteImage} height={20} style={{ paddingRight: '20px' }} />{' '}
        {i18n.t('people.Jeanette', lang)}
      </Option>
      <Option key={HumanName.Jedi} value={HumanName.Jedi}>
        <img alt={HumanName.Jedi} src={JediImage} height={20} style={{ paddingRight: '20px' }} />{' '}
        {i18n.t('people.Jedi', lang)}
      </Option>
      <Option key={HumanName.Jeff} value={HumanName.Jeff}>
        <img alt={HumanName.Jeff} src={JeffImage} height={20} style={{ paddingRight: '19px' }} />{' '}
        {i18n.t('people.Jeff', lang)}
      </Option>
      <Option key={HumanName.Jena} value={HumanName.Jena}>
        <img alt={HumanName.Jena} src={JenaImage} height={20} style={{ paddingRight: '19px' }} />{' '}
        {i18n.t('people.Jena', lang)}
      </Option>
      <Option key={HumanName.Jennifer} value={HumanName.Jennifer}>
        <img alt={HumanName.Jennifer} src={JenniferImage} height={20} style={{ paddingRight: '21px' }} />{' '}
        {i18n.t('people.Jennifer', lang)}
      </Option>
      <Option key={HumanName.Jess} value={HumanName.Jess}>
        <img alt={HumanName.Jess} src={JessImage} height={20} style={{ paddingRight: '21px' }} />{' '}
        {i18n.t('people.Jess', lang)}
      </Option>
      <Option key={HumanName.Jett} value={HumanName.Jett}>
        <img alt={HumanName.Jett} src={JettImage} height={20} style={{ paddingRight: '21px' }} />{' '}
        {i18n.t('people.Jett', lang)}
      </Option>
      <Option key={HumanName.Jiya} value={HumanName.Jiya}>
        <img alt={HumanName.Jiya} src={JiyaImage} height={20} style={{ paddingRight: '20px' }} />{' '}
        {i18n.t('people.Jiya', lang)}
      </Option>
      <Option key={HumanName.Joan} value={HumanName.Joan}>
        <img alt={HumanName.Joan} src={JoanImage} height={20} style={{ paddingRight: '8px' }} />{' '}
        {i18n.t('people.Joan', lang)}
      </Option>
      <Option key={HumanName.Jocelyn} value={HumanName.Jocelyn}>
        <img alt={HumanName.Jocelyn} src={JocelynImage} height={20} style={{ paddingRight: '23px' }} />{' '}
        {i18n.t('people.Jocelyn', lang)}
      </Option>
      <Option key={HumanName.Joel} value={HumanName.Joel}>
        <img alt={HumanName.Joel} src={JoelImage} height={20} style={{ paddingRight: '7px' }} />{' '}
        {i18n.t('people.Joel', lang)}
      </Option>
      <Option key={HumanName.Joey} value={HumanName.Joey}>
        <img alt={HumanName.Joey} src={JoeyImage} height={20} style={{ paddingRight: '22px' }} />{' '}
        {i18n.t('people.Joey', lang)}
      </Option>
      <Option key={HumanName.John} value={HumanName.John}>
        <img alt={HumanName.John} src={JohnImage} height={20} style={{ paddingRight: '20px' }} />{' '}
        {i18n.t('people.John', lang)}
      </Option>
      <Option key={HumanName.Jose} value={HumanName.Jose}>
        <img alt={HumanName.Jose} src={JoseImage} height={20} style={{ paddingRight: '5px' }} />{' '}
        {i18n.t('people.Jose', lang)}
      </Option>
      <Option key={HumanName.Joseph} value={HumanName.Joseph}>
        <img alt={HumanName.Joseph} src={JosephImage} height={20} style={{ paddingRight: '22px' }} />{' '}
        {i18n.t('people.Joseph', lang)}
      </Option>
      <Option key={HumanName.Judd} value={HumanName.Judd}>
        <img alt={HumanName.Judd} src={JuddImage} height={20} style={{ paddingRight: '21px' }} />{' '}
        {i18n.t('people.Judd', lang)}
      </Option>
      <Option key={HumanName.Julia} value={HumanName.Julia}>
        <img alt={HumanName.Julia} src={JuliaImage} height={20} style={{ paddingRight: '22px' }} />{' '}
        {i18n.t('people.Julia', lang)}
      </Option>
      <Option key={HumanName.Julio} value={HumanName.Julio}>
        <img alt={HumanName.Julio} src={JulioImage} height={20} style={{ paddingRight: '20px' }} />{' '}
        {i18n.t('people.Julio', lang)}
      </Option>
      <Option key={HumanName.Jumapili} value={HumanName.Jumapili}>
        <img alt={HumanName.Jumapili} src={JumapiliImage} height={20} style={{ paddingRight: '16px' }} />{' '}
        {i18n.t('people.Jumapili', lang)}
      </Option>
      <Option key={HumanName.June} value={HumanName.June}>
        <img alt={HumanName.June} src={JuneImage} height={20} style={{ paddingRight: '20px' }} />{' '}
        {i18n.t('people.June', lang)}
      </Option>
      <Option key={HumanName.Juro} value={HumanName.Juro}>
        <img alt={HumanName.Juro} src={JuroImage} height={20} style={{ paddingRight: '20px' }} />{' '}
        {i18n.t('people.Juro', lang)}
      </Option>
    </Select>
  );
};

export default HumanSelection;
