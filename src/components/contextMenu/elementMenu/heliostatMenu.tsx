/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Checkbox, Input, InputNumber, Menu } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from '../../../i18n/i18n';
import { HeliostatModel } from '../../../models/HeliostatModel';
import HeliostatWidthInput from './heliostatWidthInput';
import HeliostatLengthInput from './heliostatLengthInput';
import HeliostatPoleHeightInput from './heliostatPoleHeightInput';
import HeliostatReflectanceInput from './heliostatReflectorReflectanceInput';
import HeliostatDrawSunBeamSelection from './heliostatDrawSunBeamSelection';
import HeliostatTowerSelection from './heliostatTowerSelection';
import { ObjectType } from '../../../types';
import { useLabel, useLabelHeight, useLabelShow, useLabelSize, useLabelText } from './menuHooks';
import SubMenu from 'antd/lib/menu/SubMenu';

export const HeliostatMenu = React.memo(() => {
  const language = useStore(Selector.language);
  const setApplyCount = useStore(Selector.setApplyCount);

  const heliostat = useStore((state) =>
    state.elements.find((e) => e.selected && e.type === ObjectType.Heliostat),
  ) as HeliostatModel;

  const [widthDialogVisible, setWidthDialogVisible] = useState(false);
  const [lengthDialogVisible, setLengthDialogVisible] = useState(false);
  const [poleHeightDialogVisible, setPoleHeightDialogVisible] = useState(false);
  const [reflectanceDialogVisible, setReflectanceDialogVisible] = useState(false);
  const [sunBeamDialogVisible, setSunBeamDialogVisible] = useState(false);
  const [towerDialogVisible, setTowerDialogVisible] = useState(false);

  const { labelText, setLabelText } = useLabel(heliostat);
  const showLabel = useLabelShow(heliostat);
  const updateLabelText = useLabelText(heliostat, labelText);
  const setLabelSize = useLabelSize(heliostat);
  const setLabelHeight = useLabelHeight(heliostat);

  if (!heliostat) return null;

  const lang = { lng: language };
  const editable = !heliostat?.locked;

  return (
    <Menu.ItemGroup>
      <Copy keyName={'heliostat-copy'} paddingLeft={'36px'} />
      {editable && <Cut keyName={'heliostat-cut'} paddingLeft={'36px'} />}
      <Lock keyName={'heliostat-lock'} />
      {heliostat && editable && (
        <>
          {/* select tower */}
          {towerDialogVisible && <HeliostatTowerSelection setDialogVisible={setTowerDialogVisible} />}
          <Menu.Item
            key={'heliostat-tower'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setTowerDialogVisible(true);
            }}
          >
            {i18n.t('heliostatMenu.SelectTowerToReflectSunlightTo', lang)} ...
          </Menu.Item>

          {/* heliostat length */}
          {lengthDialogVisible && <HeliostatLengthInput setDialogVisible={setLengthDialogVisible} />}
          <Menu.Item
            key={'heliostat-length'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setLengthDialogVisible(true);
            }}
          >
            {i18n.t('word.Length', lang)} ...
          </Menu.Item>

          {/* heliostat width */}
          {widthDialogVisible && <HeliostatWidthInput setDialogVisible={setWidthDialogVisible} />}
          <Menu.Item
            key={'heliostat-width'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setWidthDialogVisible(true);
            }}
          >
            {i18n.t('word.Width', lang)} ...
          </Menu.Item>

          {/* extra pole height in addition to the half of the aperture size */}
          {poleHeightDialogVisible && <HeliostatPoleHeightInput setDialogVisible={setPoleHeightDialogVisible} />}
          <Menu.Item
            key={'heliostat-pole-height'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setPoleHeightDialogVisible(true);
            }}
          >
            {i18n.t('solarCollectorMenu.ExtraPoleHeight', lang)} ...
          </Menu.Item>

          {/* reflectance */}
          {reflectanceDialogVisible && <HeliostatReflectanceInput setDialogVisible={setReflectanceDialogVisible} />}
          <Menu.Item
            key={'heliostat-reflectance'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setReflectanceDialogVisible(true);
            }}
          >
            {i18n.t('concentratedSolarPowerCollectorMenu.ReflectorReflectance', lang)} ...
          </Menu.Item>

          {/* draw sun beam or not */}
          {sunBeamDialogVisible && <HeliostatDrawSunBeamSelection setDialogVisible={setSunBeamDialogVisible} />}
          <Menu.Item
            key={'heliostat-draw-sun-beam'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setSunBeamDialogVisible(true);
            }}
          >
            {i18n.t('solarCollectorMenu.DrawSunBeam', lang)} ...
          </Menu.Item>

          <SubMenu key={'heliostat-label'} title={i18n.t('labelSubMenu.Label', lang)} style={{ paddingLeft: '24px' }}>
            {/* show label or not */}
            <Menu.Item key={'heliostat-show-label'}>
              <Checkbox checked={!!heliostat?.showLabel} onChange={showLabel}>
                {i18n.t('labelSubMenu.KeepShowingLabel', lang)}
              </Checkbox>
            </Menu.Item>

            {/*have to wrap the text field with a Menu so that it can stay open when the user types in it */}
            <Menu>
              {/* label text */}
              <Menu.Item key={'heliostat-label-text'} style={{ paddingLeft: '36px' }}>
                <Input
                  addonBefore={i18n.t('labelSubMenu.Label', lang) + ':'}
                  value={labelText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabelText(e.target.value)}
                  onPressEnter={updateLabelText}
                  onBlur={updateLabelText}
                />
              </Menu.Item>
              {/* the label's height relative to the center */}
              <Menu.Item style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }} key={'heliostat-label-height'}>
                <InputNumber
                  addonBefore={i18n.t('labelSubMenu.LabelHeight', lang) + ':'}
                  min={0.2}
                  max={5}
                  step={0.1}
                  precision={1}
                  value={heliostat.labelHeight ?? 0.2}
                  onChange={(value) => setLabelHeight(value)}
                />
              </Menu.Item>
              {/* the label's size */}
              <Menu.Item style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }} key={'heliostat-label-size'}>
                <InputNumber
                  addonBefore={i18n.t('labelSubMenu.LabelSize', lang) + ':'}
                  min={0.2}
                  max={2}
                  step={0.1}
                  precision={1}
                  value={heliostat.labelSize ?? 0.2}
                  onChange={(value) => setLabelSize(value)}
                />
              </Menu.Item>
            </Menu>
          </SubMenu>
        </>
      )}
    </Menu.ItemGroup>
  );
});
