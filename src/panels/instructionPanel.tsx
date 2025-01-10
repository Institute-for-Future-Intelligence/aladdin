/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { useStore } from '../stores/common';
import styled from 'styled-components';
import i18n from '../i18n/i18n';
import * as Selector from '../stores/selector';
import { Util } from '../Util';
import { CloseOutlined } from '@ant-design/icons';
import { Undoable } from '../undo/Undoable';
import { useLanguage } from '../hooks';

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
  pointer-events: none;
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

const InstructionPanel = React.memo(() => {
  const setCommonStore = useStore(Selector.set);
  const addUndoable = useStore(Selector.addUndoable);
  const sunlightDirection = useStore(Selector.sunlightDirection);
  const orthographic = useStore(Selector.viewState.orthographic) ?? false;
  const navigation = useStore(Selector.viewState.navigationView) ?? false;
  const lang = useLanguage();
  const color = sunlightDirection.y > 0 ? 'navajowhite' : 'antiquewhite';

  const isMac = Util.isMac();

  const setNavigationView = (selected: boolean) => {
    setCommonStore((state) => {
      state.viewState.navigationView = selected;
      state.viewState.enableRotate = !selected;
    });
  };

  return (
    <Container>
      <ColumnWrapper style={{ color: color, fontSize: navigation ? '10px' : '9px' }}>
        {navigation && (
          <span
            style={{
              fontSize: '12px',
              paddingLeft: '6px',
              paddingRight: '6px',
              paddingTop: '2px',
              paddingBottom: '2px',
              marginBottom: '6px',
              background: 'tomato',
              border: '1px solid',
              pointerEvents: 'auto',
            }}
          >
            <b>{i18n.t('instructionPanel.NavigationMode', lang)}</b>
            <CloseOutlined
              style={{ paddingLeft: '6px', cursor: 'pointer' }}
              onClick={() => {
                const undoableAction = {
                  name: 'Close Navigation Mode',
                  timestamp: Date.now(),
                  undo: () => {
                    setNavigationView(true);
                  },
                  redo: () => {
                    setNavigationView(false);
                  },
                } as Undoable;
                addUndoable(undoableAction);
                setNavigationView(false);
              }}
            />
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
});

export default InstructionPanel;
