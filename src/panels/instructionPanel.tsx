/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { useStore } from '../stores/common';
import styled from 'styled-components';
import i18n from '../i18n/i18n';
import * as Selector from '../stores/selector';
import { Util } from '../Util';

const Container = styled.div`
  position: absolute;
  top: 80px;
  left: 10px;
  margin: auto;
  display: flex;
  justify-content: left;
  align-self: flex-start;
  align-content: flex-start;
  align-items: start;
  padding: 16px;
  opacity: 100%;
  user-select: none;
  tab-index: -1; // set to be not focusable
  z-index: 7; // must be less than other panels
`;

const ColumnWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  align-self: flex-start;
  align-content: flex-start;
  align-items: flex-start;
  margin: auto;
  width: 310px;
  padding-bottom: 10px;
  display: flex;
  font-size: 12px;
  flex-direction: column;
  opacity: 100%;
`;

const InstructionPanel = () => {
  const language = useStore(Selector.language);
  const sunlightDirection = useStore(Selector.sunlightDirection);
  const orthographic = useStore(Selector.viewState.orthographic) ?? false;
  const navigation = useStore(Selector.viewState.navigationView) ?? false;
  const lang = { lng: language };
  const color = sunlightDirection.y > 0 ? 'navajowhite' : 'antiquewhite';

  const isMac = Util.isMac();

  return (
    <Container>
      <ColumnWrapper style={{ color: color, fontSize: '9px' }}>
        {navigation && (
          <span style={{ fontSize: '12px' }}>
            <b>{i18n.t('instructionPanel.NavigationMode', lang)}</b>
            <hr />
          </span>
        )}
        <span>
          <b>{i18n.t(navigation ? 'instructionPanel.DisableNavigation' : 'instructionPanel.EnableNavigation', lang)}</b>
          : {i18n.t('word.Press', lang)} {isMac ? '⌘' : 'Ctrl'}+U
        </span>
        {navigation && (
          <>
            <span>
              <b>{i18n.t('instructionPanel.MoveForwardBack', lang)}</b>:{' '}
              {i18n.t('instructionPanel.MoveForwardBackInstruction', lang)}
            </span>
            <span>
              <b>{i18n.t('instructionPanel.MoveLeftRight', lang)}</b>:{' '}
              {i18n.t('instructionPanel.MoveLeftRightInstruction', lang)}
            </span>
            <span>
              <b>{i18n.t('instructionPanel.MoveUpDown', lang)}</b>:{' '}
              {i18n.t('instructionPanel.MoveUpDownInstruction', lang)}
            </span>
            <span>
              <b>{i18n.t('instructionPanel.Turn', lang)}</b>: {i18n.t('instructionPanel.TurnInstruction', lang)}
            </span>
          </>
        )}
        {!orthographic && !navigation && (
          <span>
            <b>{i18n.t('instructionPanel.Rotate', lang)}</b>: {i18n.t('instructionPanel.DragMouse', lang)}
          </span>
        )}
        {!navigation && (
          <>
            <span>
              <b>{i18n.t('instructionPanel.Zoom', lang)}</b>:{' '}
              {i18n.t(isMac ? 'instructionPanel.MouseWheelOrKeysMac' : 'instructionPanel.MouseWheelOrKeys', lang)}
            </span>
            <span>
              <b>{i18n.t('instructionPanel.Pan', lang)}</b>:{' '}
              {i18n.t(isMac ? 'instructionPanel.HoldMetaDragMouse' : 'instructionPanel.HoldCtrlDragMouse', lang)}
            </span>
            <span>
              <b>{i18n.t(orthographic ? 'instructionPanel.Exit2DMode' : 'instructionPanel.Enter2DMode', lang)}</b>:{' '}
              {i18n.t('word.Press', lang)} {isMac ? '⌘' : 'Ctrl'}+B
            </span>
          </>
        )}
      </ColumnWrapper>
    </Container>
  );
};

export default React.memo(InstructionPanel);
