/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Checkbox, Input, InputNumber, Menu } from 'antd';
import { FresnelReflectorModel } from '../../../models/FresnelReflectorModel';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from '../../../i18n/i18n';
import FresnelReflectorLengthInput from './fresnelReflectorLengthInput';
import FresnelReflectorWidthInput from './fresnelReflectorWidthInput';
import FresnelReflectorPoleHeightInput from './fresnelReflectorPoleHeightInput';
import FresnelReflectorModuleLengthInput from './fresnelReflectorModuleLengthInput';
import FresnelReflectorReflectanceInput from './fresnelReflectorReflectanceInput';
import FresnelReflectorAbsorberSelection from './fresnelReflectorAbsorberSelection';
import FresnelReflectorDrawSunBeamSelection from './fresnelReflectorDrawSunBeamSelection';
import { ObjectType } from '../../../types';
import {
  useLabel,
  useLabelColor,
  useLabelFontSize,
  useLabelHeight,
  useLabelShow,
  useLabelSize,
  useLabelText,
  useSelectedElement,
} from './menuHooks';
import SubMenu from 'antd/lib/menu/SubMenu';

export const FresnelReflectorMenu = React.memo(() => {
  const language = useStore(Selector.language);
  const setApplyCount = useStore(Selector.setApplyCount);

  const fresnelReflector = useSelectedElement(ObjectType.FresnelReflector) as FresnelReflectorModel | undefined;

  const [moduleLengthDialogVisible, setModuleLengthDialogVisible] = useState(false);
  const [widthDialogVisible, setWidthDialogVisible] = useState(false);
  const [lengthDialogVisible, setLengthDialogVisible] = useState(false);
  const [poleHeightDialogVisible, setPoleHeightDialogVisible] = useState(false);
  const [reflectanceDialogVisible, setReflectanceDialogVisible] = useState(false);
  const [receiverDialogVisible, setReceiverDialogVisible] = useState(false);
  const [sunBeamDialogVisible, setSunBeamDialogVisible] = useState(false);

  const { labelText, setLabelText } = useLabel(fresnelReflector);
  const showLabel = useLabelShow(fresnelReflector);
  const updateLabelText = useLabelText(fresnelReflector, labelText);
  const setLabelSize = useLabelSize(fresnelReflector);
  const setLabelFontSize = useLabelFontSize(fresnelReflector);
  const setLabelColor = useLabelColor(fresnelReflector);
  const setLabelHeight = useLabelHeight(fresnelReflector);

  if (!fresnelReflector) return null;

  const lang = { lng: language };
  const editable = !fresnelReflector?.locked;

  return (
    <Menu.ItemGroup>
      {/* <Copy keyName={'fresnel-reflector-copy'} paddingLeft={'36px'} />
      {editable && <Cut keyName={'fresnel-reflector-cut'} paddingLeft={'36px'} />}
      <Lock keyName={'fresnel-reflector-lock'} /> */}
      {fresnelReflector && editable && (
        <>
          {/* receiver */}
          {receiverDialogVisible && <FresnelReflectorAbsorberSelection setDialogVisible={setReceiverDialogVisible} />}
          <Menu.Item
            key={'fresnel-reflector-receiver'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setReceiverDialogVisible(true);
            }}
          >
            {i18n.t('fresnelReflectorMenu.SelectAbsorberToReflectSunlightTo', lang)} ...
          </Menu.Item>

          {/* reflector length */}
          {lengthDialogVisible && <FresnelReflectorLengthInput setDialogVisible={setLengthDialogVisible} />}
          <Menu.Item
            key={'fresnel-reflector-length'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setLengthDialogVisible(true);
            }}
          >
            {i18n.t('word.Length', lang)} ...
          </Menu.Item>

          {/* reflector width */}
          {widthDialogVisible && <FresnelReflectorWidthInput setDialogVisible={setWidthDialogVisible} />}
          <Menu.Item
            key={'fresnel-reflector-width'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setWidthDialogVisible(true);
            }}
          >
            {i18n.t('word.Width', lang)} ...
          </Menu.Item>

          {/* module length */}
          {moduleLengthDialogVisible && (
            <FresnelReflectorModuleLengthInput setDialogVisible={setModuleLengthDialogVisible} />
          )}
          <Menu.Item
            key={'fresnel-reflector-module-length'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setModuleLengthDialogVisible(true);
            }}
          >
            {i18n.t('fresnelReflectorMenu.ModuleLength', lang)} ...
          </Menu.Item>

          {/* extra pole height in addition to the half of the aperture width */}
          {poleHeightDialogVisible && <FresnelReflectorPoleHeightInput setDialogVisible={setPoleHeightDialogVisible} />}
          <Menu.Item
            key={'fresnel-reflector-pole-height'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setPoleHeightDialogVisible(true);
            }}
          >
            {i18n.t('solarCollectorMenu.ExtraPoleHeight', lang)} ...
          </Menu.Item>

          {/* reflectance */}
          {reflectanceDialogVisible && (
            <FresnelReflectorReflectanceInput setDialogVisible={setReflectanceDialogVisible} />
          )}
          <Menu.Item
            key={'fresnel-reflector-reflectance'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setReflectanceDialogVisible(true);
            }}
          >
            {i18n.t('concentratedSolarPowerCollectorMenu.ReflectorReflectance', lang)} ...
          </Menu.Item>

          {/* draw sun beam or not */}
          {sunBeamDialogVisible && <FresnelReflectorDrawSunBeamSelection setDialogVisible={setSunBeamDialogVisible} />}
          <Menu.Item
            key={'fresnel-reflector-draw-sun-beam'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setSunBeamDialogVisible(true);
            }}
          >
            {i18n.t('solarCollectorMenu.DrawSunBeam', lang)} ...
          </Menu.Item>

          <SubMenu
            key={'fresnel-reflector-label'}
            title={i18n.t('labelSubMenu.Label', lang)}
            style={{ paddingLeft: '24px' }}
          >
            {/* show label or not */}
            <Menu.Item key={'fresnel-reflector-show-label'}>
              <Checkbox checked={!!fresnelReflector?.showLabel} onChange={showLabel}>
                {i18n.t('labelSubMenu.KeepShowingLabel', lang)}
              </Checkbox>
            </Menu.Item>

            {/*have to wrap the text field with a Menu so that it can stay open when the user types in it */}
            <Menu>
              {/* label text */}
              <Menu.Item key={'fresnel-reflector-label-text'} style={{ height: '36px', paddingLeft: '36px' }}>
                <Input
                  addonBefore={i18n.t('labelSubMenu.Label', lang) + ':'}
                  value={labelText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabelText(e.target.value)}
                  onPressEnter={updateLabelText}
                  onBlur={updateLabelText}
                />
              </Menu.Item>
              {/* the label's height relative to the dish center */}
              <Menu.Item
                style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }}
                key={'fresnel-reflector-label-height'}
              >
                <InputNumber
                  addonBefore={i18n.t('labelSubMenu.LabelHeight', lang) + ':'}
                  min={0.2}
                  max={5}
                  step={0.1}
                  precision={1}
                  value={fresnelReflector.labelHeight ?? 0.2}
                  onChange={(value) => setLabelHeight(value!)}
                />
              </Menu.Item>
              {/* the label's font size */}
              <Menu.Item
                style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }}
                key={'fresnel-reflector-label-font-size'}
              >
                <InputNumber
                  addonBefore={i18n.t('labelSubMenu.LabelFontSize', lang) + ':'}
                  min={10}
                  max={100}
                  step={1}
                  precision={0}
                  value={fresnelReflector.labelFontSize ?? 20}
                  onChange={(value) => setLabelFontSize(value!)}
                />
              </Menu.Item>
              {/* the label's size */}
              <Menu.Item
                style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }}
                key={'fresnel-reflector-label-size'}
              >
                <InputNumber
                  addonBefore={i18n.t('labelSubMenu.LabelSize', lang) + ':'}
                  min={0.2}
                  max={5}
                  step={0.1}
                  precision={1}
                  value={fresnelReflector.labelSize ?? 0.2}
                  onChange={(value) => setLabelSize(value!)}
                />
              </Menu.Item>
              {/* the label's color */}
              <Menu.Item
                style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }}
                key={'fresnel-reflector-label-color'}
              >
                <Input
                  addonBefore={i18n.t('labelSubMenu.LabelColor', lang) + ':'}
                  value={fresnelReflector.labelColor ?? '#ffffff'}
                  onChange={(e) => setLabelColor(e.target.value)}
                />
              </Menu.Item>
            </Menu>
          </SubMenu>
        </>
      )}
    </Menu.ItemGroup>
  );
});
