/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import i18n from '../i18n/i18n';
import { Modal, Space, Switch } from 'antd';
import { copyTextToClipboard, showSuccess } from '../helpers';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { confirm } = Modal;

const Container = styled.div`
  position: fixed;
  top: 80px;
  right: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 98;
`;

const ColumnWrapper = styled.div`
  background-color: #f8f8f8;
  position: absolute;
  right: 0;
  top: 0;
  width: 400px;
  height: 300px;
  min-width: 400px;
  max-width: 800px;
  min-height: 200px;
  max-height: 600px;
  padding-bottom: 10px;
  border: 2px solid gainsboro;
  border-radius: 10px 10px 10px 10px;
  display: flex;
  flex-direction: column;
  overflow-x: auto;
  overflow-y: auto;
  resize: both;
  direction: rtl;
`;

const Header = styled.div`
  border-radius: 10px 10px 0 0;
  width: 100%;
  height: 24px;
  padding: 10px;
  background-color: #e8e8e8;
  color: #888;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;

  svg.icon {
    height: 16px;
    width: 16px;
    padding: 8px;
    fill: #666;
  }
`;

const AccountSettingsPanel = () => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const user = useStore(Selector.user);

  // nodeRef is to suppress ReactDOM.findDOMNode() deprecation warning. See:
  // https://github.com/react-grid-layout/react-draggable/blob/v4.4.2/lib/DraggableCore.js#L159-L171
  const nodeRef = React.useRef(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : 640;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : 600;
  const [curPosition, setCurPosition] = useState({ x: 0, y: 0 });
  const lang = { lng: language };

  // when the window is resized (the code depends on where the panel is originally anchored in the CSS)
  useEffect(() => {
    const handleResize = () => {
      setCurPosition({
        x: Math.max(0, wOffset - window.innerWidth),
        y: Math.min(0, window.innerHeight - hOffset),
      });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDrag: DraggableEventHandler = (e, ui) => {
    setCurPosition({
      x: Math.max(ui.x, wOffset - window.innerWidth),
      y: Math.min(ui.y, window.innerHeight - hOffset),
    });
  };

  const onDragEnd: DraggableEventHandler = (e, ui) => {
    // TODO: Should we save the position?
  };

  const closePanel = () => {
    setCommonStore((state) => {
      state.showAccountSettingsPanel = false;
    });
  };

  return (
    <>
      <ReactDraggable
        nodeRef={nodeRef}
        handle={'.handle'}
        bounds={'parent'}
        axis="both"
        position={curPosition}
        onDrag={onDrag}
        onStop={onDragEnd}
      >
        <Container ref={nodeRef}>
          <ColumnWrapper ref={wrapperRef}>
            <Header className="handle" style={{ direction: 'ltr' }}>
              <span>{i18n.t('accountSettingsPanel.MyAccountSettings', lang)}</span>
              <span
                style={{ cursor: 'pointer' }}
                onMouseDown={() => {
                  closePanel();
                }}
                onTouchStart={() => {
                  closePanel();
                }}
              >
                {i18n.t('word.Close', lang)}
              </span>
            </Header>
            <Space style={{ paddingTop: '20px', paddingLeft: '20px', direction: 'ltr' }}>
              <Space
                style={{
                  width: '50px',
                  cursor: 'copy',
                  background: 'antiquewhite',
                  justifyContent: 'center',
                  border: 'black solid 1px',
                  borderRadius: '8px',
                }}
                onClick={() => {
                  if (user.uid) {
                    copyTextToClipboard(user.uid);
                    showSuccess(i18n.t('accountSettingsPanel.IDInClipBoard', lang));
                  }
                }}
              >
                <label title={i18n.t('accountSettingsPanel.ClickToCopyMyID', lang)}>
                  {i18n.t('accountSettingsPanel.MyID', lang)}
                </label>
              </Space>
              <Space style={{ paddingLeft: '6px' }}>{user.uid}</Space>
            </Space>
            <Space style={{ paddingTop: '10px', paddingLeft: '20px', direction: 'ltr' }}>
              <Space style={{ width: '50px' }}>
                <Switch
                  checked={user.signFile}
                  onChange={(checked) => {
                    if (checked) {
                      confirm({
                        title: i18n.t('accountSettingsPanel.DoYouReallyWantToShowYourNameInYourFiles', lang),
                        icon: <ExclamationCircleOutlined />,
                        content: i18n.t('accountSettingsPanel.SignFileDisclaimer', lang),
                        onOk() {
                          setCommonStore((state) => {
                            state.user.signFile = true;
                          });
                        },
                        onCancel() {
                          setCommonStore((state) => {
                            state.user.signFile = false;
                          });
                        },
                      });
                    } else {
                      setCommonStore((state) => {
                        state.user.signFile = false;
                      });
                    }
                  }}
                />
              </Space>
              <Space style={{ paddingLeft: '6px' }}>
                {i18n.t('accountSettingsPanel.StoreMyNameInMyFilesWhenSaving', lang)}
              </Space>
            </Space>
          </ColumnWrapper>
        </Container>
      </ReactDraggable>
    </>
  );
};

export default React.memo(AccountSettingsPanel);
