/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import JaahImage from 'src/resources/jaah.png';
import JackImage from 'src/resources/jack.png';
import JacobImage from 'src/resources/jacob.png';
import JacquelineImage from 'src/resources/jacqueline.png';
import JadeImage from 'src/resources/jade.png';
import JameliaImage from 'src/resources/jamelia.png';
import JamesImage from 'src/resources/james.png';
import JaneImage from 'src/resources/jane.png';
import JayaImage from 'src/resources/jaya.png';
import JayeImage from 'src/resources/jaye.png';
import JeanetteImage from 'src/resources/jeanette.png';
import JediImage from 'src/resources/jedi.png';
import JeffImage from 'src/resources/jeff.png';
import JenaImage from 'src/resources/jena.png';
import JenniferImage from 'src/resources/jennifer.png';
import JessImage from 'src/resources/jess.png';
import JettImage from 'src/resources/jett.png';
import JillImage from 'src/resources/jill.png';
import JiyaImage from 'src/resources/jiya.png';
import JoanImage from 'src/resources/joan.png';
import JocelynImage from 'src/resources/jocelyn.png';
import JoelImage from 'src/resources/joel.png';
import JoeyImage from 'src/resources/joey.png';
import JohnImage from 'src/resources/john.png';
import JonathonImage from 'src/resources/jonathon.png';
import JoseImage from 'src/resources/jose.png';
import JosephImage from 'src/resources/joseph.png';
import JoshuaImage from 'src/resources/joshua.png';
import JuddImage from 'src/resources/judd.png';
import JudyImage from 'src/resources/judy.png';
import JuliaImage from 'src/resources/julia.png';
import JulioImage from 'src/resources/julio.png';
import JumapiliImage from 'src/resources/jumapili.png';
import JuneImage from 'src/resources/june.png';
import JuroImage from 'src/resources/juro.png';
import JustinImage from 'src/resources/justin.png';

import React, { useState } from 'react';
import { Select } from 'antd';
import { HumanName, ObjectType } from '../../../../types';
import { CommonStoreState, useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { HumanModel } from '../../../../models/HumanModel';
import { UndoableChange } from '../../../../undo/UndoableChange';
import i18n from '../../../../i18n/i18n';
import { HumanData } from '../../../../HumanData';
import { useLanguage } from '../../../../hooks';

const { Option } = Select;

const style = {
  display: 'flex',
  justifyContent: 'start',
  alignItems: 'center',
};

const HumanSelection = React.memo(({ human, disabled }: { human: HumanModel; disabled?: boolean }) => {
  const setCommonStore = useStore(Selector.set);
  const addUndoable = useStore(Selector.addUndoable);

  const [updateFlag, setUpdateFlag] = useState(false);
  const lang = useLanguage();

  const updateHumanNameById = (id: string, name: HumanName) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Human && e.id === id) {
          const human = e as HumanModel;
          human.name = name;
          human.lx = HumanData.fetchWidth(name);
          human.lz = HumanData.fetchHeight(name);
          break;
        }
      }
    });
  };

  return (
    <Select
      disabled={disabled}
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
        <span style={style}>
          <img alt={HumanName.Jack} src={JackImage} height={20} style={{ paddingRight: '21px' }} />{' '}
          {i18n.t('people.Jack', lang)}
        </span>
      </Option>
      <Option key={HumanName.Jacob} value={HumanName.Jacob}>
        <span style={style}>
          <img alt={HumanName.Jacob} src={JacobImage} height={20} style={{ paddingRight: '16px' }} />{' '}
          {i18n.t('people.Jacob', lang)}
        </span>
      </Option>
      <Option key={HumanName.Jacqueline} value={HumanName.Jacqueline}>
        <span style={style}>
          <img alt={HumanName.Jacqueline} src={JacquelineImage} height={20} style={{ paddingRight: '20px' }} />{' '}
          {i18n.t('people.Jacqueline', lang)}
        </span>
      </Option>
      <Option key={HumanName.Jaah} value={HumanName.Jaah}>
        <span style={style}>
          <img alt={HumanName.Jaah} src={JaahImage} height={20} style={{ paddingRight: '19px' }} />{' '}
          {i18n.t('people.Jaah', lang)}
        </span>
      </Option>
      <Option key={HumanName.Jade} value={HumanName.Jade}>
        <span style={style}>
          <img alt={HumanName.Jade} src={JadeImage} height={20} style={{ paddingRight: '20px' }} />{' '}
          {i18n.t('people.Jade', lang)}
        </span>
      </Option>
      <Option key={HumanName.Jamelia} value={HumanName.Jamelia}>
        <span style={style}>
          <img alt={HumanName.Jamelia} src={JameliaImage} height={20} style={{ paddingRight: '20px' }} />{' '}
          {i18n.t('people.Jamelia', lang)}
        </span>
      </Option>
      <Option key={HumanName.James} value={HumanName.James}>
        <span style={style}>
          <img alt={HumanName.James} src={JamesImage} height={20} style={{ paddingRight: '21px' }} />{' '}
          {i18n.t('people.James', lang)}
        </span>
      </Option>
      <Option key={HumanName.Jane} value={HumanName.Jane}>
        <span style={style}>
          <img alt={HumanName.Jane} src={JaneImage} height={20} style={{ paddingRight: '21px' }} />{' '}
          {i18n.t('people.Jane', lang)}
        </span>
      </Option>
      <Option key={HumanName.Jaya} value={HumanName.Jaya}>
        <span style={style}>
          <img alt={HumanName.Jaya} src={JayaImage} height={20} style={{ paddingRight: '19px' }} />{' '}
          {i18n.t('people.Jaya', lang)}
        </span>
      </Option>
      <Option key={HumanName.Jaye} value={HumanName.Jaye}>
        <span style={style}>
          <img alt={HumanName.Jaye} src={JayeImage} height={20} style={{ paddingRight: '20px' }} />{' '}
          {i18n.t('people.Jaye', lang)}
        </span>
      </Option>
      <Option key={HumanName.Jeanette} value={HumanName.Jeanette}>
        <span style={style}>
          <img alt={HumanName.Jeanette} src={JeanetteImage} height={20} style={{ paddingRight: '20px' }} />{' '}
          {i18n.t('people.Jeanette', lang)}
        </span>
      </Option>
      <Option key={HumanName.Jedi} value={HumanName.Jedi}>
        <span style={style}>
          <img alt={HumanName.Jedi} src={JediImage} height={20} style={{ paddingRight: '20px' }} />{' '}
          {i18n.t('people.Jedi', lang)}
        </span>
      </Option>
      <Option key={HumanName.Jeff} value={HumanName.Jeff}>
        <span style={style}>
          <img alt={HumanName.Jeff} src={JeffImage} height={20} style={{ paddingRight: '19px' }} />{' '}
          {i18n.t('people.Jeff', lang)}
        </span>
      </Option>
      <Option key={HumanName.Jena} value={HumanName.Jena}>
        <span style={style}>
          <img alt={HumanName.Jena} src={JenaImage} height={20} style={{ paddingRight: '19px' }} />{' '}
          {i18n.t('people.Jena', lang)}
        </span>
      </Option>
      <Option key={HumanName.Jennifer} value={HumanName.Jennifer}>
        <span style={style}>
          <img alt={HumanName.Jennifer} src={JenniferImage} height={20} style={{ paddingRight: '21px' }} />{' '}
          {i18n.t('people.Jennifer', lang)}
        </span>
      </Option>
      <Option key={HumanName.Jess} value={HumanName.Jess}>
        <span style={style}>
          <img alt={HumanName.Jess} src={JessImage} height={20} style={{ paddingRight: '21px' }} />{' '}
          {i18n.t('people.Jess', lang)}
        </span>
      </Option>
      <Option key={HumanName.Jett} value={HumanName.Jett}>
        <span style={style}>
          <img alt={HumanName.Jett} src={JettImage} height={20} style={{ paddingRight: '21px' }} />{' '}
          {i18n.t('people.Jett', lang)}
        </span>
      </Option>
      <Option key={HumanName.Jill} value={HumanName.Jill}>
        <span style={style}>
          <img alt={HumanName.Jill} src={JillImage} height={20} style={{ paddingRight: '20px' }} />{' '}
          {i18n.t('people.Jill', lang)}
        </span>
      </Option>
      <Option key={HumanName.Jiya} value={HumanName.Jiya}>
        <span style={style}>
          <img alt={HumanName.Jiya} src={JiyaImage} height={20} style={{ paddingRight: '20px' }} />{' '}
          {i18n.t('people.Jiya', lang)}
        </span>
      </Option>
      <Option key={HumanName.Joan} value={HumanName.Joan}>
        <span style={style}>
          <img alt={HumanName.Joan} src={JoanImage} height={20} style={{ paddingRight: '8px' }} />{' '}
          {i18n.t('people.Joan', lang)}
        </span>
      </Option>
      <Option key={HumanName.Jocelyn} value={HumanName.Jocelyn}>
        <span style={style}>
          <img alt={HumanName.Jocelyn} src={JocelynImage} height={20} style={{ paddingRight: '23px' }} />{' '}
          {i18n.t('people.Jocelyn', lang)}
        </span>
      </Option>
      <Option key={HumanName.Joel} value={HumanName.Joel}>
        <span style={style}>
          <img alt={HumanName.Joel} src={JoelImage} height={20} style={{ paddingRight: '7px' }} />{' '}
          {i18n.t('people.Joel', lang)}
        </span>
      </Option>
      <Option key={HumanName.Joey} value={HumanName.Joey}>
        <span style={style}>
          <img alt={HumanName.Joey} src={JoeyImage} height={20} style={{ paddingRight: '22px' }} />{' '}
          {i18n.t('people.Joey', lang)}
        </span>
      </Option>
      <Option key={HumanName.John} value={HumanName.John}>
        <span style={style}>
          <img alt={HumanName.John} src={JohnImage} height={20} style={{ paddingRight: '20px' }} />{' '}
          {i18n.t('people.John', lang)}
        </span>
      </Option>
      <Option key={HumanName.Jonathon} value={HumanName.Jonathon}>
        <span style={style}>
          <img alt={HumanName.Jonathon} src={JonathonImage} height={20} style={{ paddingRight: '20px' }} />{' '}
          {i18n.t('people.Jonathon', lang)}
        </span>
      </Option>
      <Option key={HumanName.Jose} value={HumanName.Jose}>
        <span style={style}>
          <img alt={HumanName.Jose} src={JoseImage} height={20} style={{ paddingRight: '5px' }} />{' '}
          {i18n.t('people.Jose', lang)}
        </span>
      </Option>
      <Option key={HumanName.Joseph} value={HumanName.Joseph}>
        <span style={style}>
          <img alt={HumanName.Joseph} src={JosephImage} height={20} style={{ paddingRight: '22px' }} />{' '}
          {i18n.t('people.Joseph', lang)}
        </span>
      </Option>
      <Option key={HumanName.Joshua} value={HumanName.Joshua}>
        <span style={style}>
          <img alt={HumanName.Joshua} src={JoshuaImage} height={20} style={{ paddingRight: '22px' }} />{' '}
          {i18n.t('people.Joshua', lang)}
        </span>
      </Option>
      <Option key={HumanName.Judd} value={HumanName.Judd}>
        <span style={style}>
          <img alt={HumanName.Judd} src={JuddImage} height={20} style={{ paddingRight: '21px' }} />{' '}
          {i18n.t('people.Judd', lang)}
        </span>
      </Option>
      <Option key={HumanName.Judy} value={HumanName.Judy}>
        <span style={style}>
          <img alt={HumanName.Judy} src={JudyImage} height={20} style={{ paddingRight: '21px' }} />{' '}
          {i18n.t('people.Judy', lang)}
        </span>
      </Option>
      <Option key={HumanName.Julia} value={HumanName.Julia}>
        <span style={style}>
          <img alt={HumanName.Julia} src={JuliaImage} height={20} style={{ paddingRight: '22px' }} />{' '}
          {i18n.t('people.Julia', lang)}
        </span>
      </Option>
      <Option key={HumanName.Julio} value={HumanName.Julio}>
        <span style={style}>
          <img alt={HumanName.Julio} src={JulioImage} height={20} style={{ paddingRight: '20px' }} />{' '}
          {i18n.t('people.Julio', lang)}
        </span>
      </Option>
      <Option key={HumanName.Jumapili} value={HumanName.Jumapili}>
        <span style={style}>
          <img alt={HumanName.Jumapili} src={JumapiliImage} height={20} style={{ paddingRight: '16px' }} />{' '}
          {i18n.t('people.Jumapili', lang)}
        </span>
      </Option>
      <Option key={HumanName.June} value={HumanName.June}>
        <span style={style}>
          <img alt={HumanName.June} src={JuneImage} height={20} style={{ paddingRight: '20px' }} />{' '}
          {i18n.t('people.June', lang)}
        </span>
      </Option>
      <Option key={HumanName.Juro} value={HumanName.Juro}>
        <span style={style}>
          <img alt={HumanName.Juro} src={JuroImage} height={20} style={{ paddingRight: '20px' }} />{' '}
          {i18n.t('people.Juro', lang)}
        </span>
      </Option>
      <Option key={HumanName.Justin} value={HumanName.Justin}>
        <span style={style}>
          <img alt={HumanName.Justin} src={JustinImage} height={20} style={{ paddingRight: '20px' }} />{' '}
          {i18n.t('people.Justin', lang)}
        </span>
      </Option>
    </Select>
  );
});

export default HumanSelection;
