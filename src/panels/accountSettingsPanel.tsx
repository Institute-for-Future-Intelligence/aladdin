/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import { Button, Col, Modal, Row, Select, Switch } from 'antd';
import { showSuccess } from '../helpers';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { SchoolID } from '../types';
import { ClassID } from '../types';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import LikesPanel from './likesPanel';
import PublishedModelsPanel from './publishedModelsPanel';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hooks';

const { confirm } = Modal;
const { Option } = Select;

const Container = styled.div`
  position: fixed;
  top: 80px;
  right: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 1000;
`;

const ColumnWrapper = styled.div`
  background-color: #f8f8f8;
  position: absolute;
  right: 0;
  top: 0;
  width: 450px;
  height: 380px;
  min-width: 400px;
  max-width: 800px;
  min-height: 200px;
  max-height: 600px;
  padding-bottom: 10px;
  border: 2px solid gainsboro;
  border-radius: 10px 10px 10px 10px;
  display: flex;
  flex-direction: column;
  text-align: left;
  overflow-x: hidden;
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
`;

const AccountSettingsPanel = React.memo(
  ({ openCloudFile }: { openCloudFile: (userid: string, title: string) => void }) => {
    const setCommonStore = useStore(Selector.set);
    const setPrimitiveStore = usePrimitiveStore(Selector.setPrimitiveStore);
    const user = useStore(Selector.user);
    const userCount = usePrimitiveStore(Selector.userCount);
    const showLikesPanel = usePrimitiveStore(Selector.showLikesPanel);
    const showPublishedModelsPanel = usePrimitiveStore(Selector.showPublishedModelsPanel);

    // nodeRef is to suppress ReactDOM.findDOMNode() deprecation warning. See:
    // https://github.com/react-grid-layout/react-draggable/blob/v4.4.2/lib/DraggableCore.js#L159-L171
    const nodeRef = React.useRef(null);

    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const schoolIdRef = useRef<SchoolID>(user.schoolID ?? SchoolID.UNKNOWN);
    const classIdRef = useRef<ClassID>(user.classID ?? ClassID.UNKNOWN);
    const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : 640;
    const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : 600;
    const [curPosition, setCurPosition] = useState({ x: 0, y: 0 });
    const lang = useLanguage();

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
      usePrimitiveStore.getState().set((state) => {
        state.showAccountSettingsPanel = false;
      });
    };

    const superuser = user && user.email && user.email.endsWith('intofuture.org');
    const signFile = false;

    const { t } = useTranslation();

    return (
      <>
        {showLikesPanel && <LikesPanel likesArray={user.likes ?? []} openCloudFile={openCloudFile} />}
        {showPublishedModelsPanel && (
          <PublishedModelsPanel publishedModels={user.published ?? []} openCloudFile={openCloudFile} />
        )}
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
                <span>
                  {t('accountSettingsPanel.MyAccountSettings', lang) +
                    (user.anonymous ? ' (' + t('word.Anonymous', lang) + ')' : '')}
                </span>
                <span
                  style={{ cursor: 'pointer' }}
                  onMouseDown={() => {
                    closePanel();
                  }}
                  onTouchStart={() => {
                    closePanel();
                  }}
                >
                  {t('word.Close', lang)}
                </span>
              </Header>

              <Row gutter={20} style={{ paddingTop: '20px', paddingLeft: '20px', direction: 'ltr' }}>
                <Col
                  span={6}
                  onClick={() => {
                    if (user.uid) {
                      navigator.clipboard
                        .writeText(user.uid)
                        .then(() => showSuccess(t('accountSettingsPanel.IDInClipBoard', lang)));
                    }
                  }}
                >
                  <Button
                    title={t('accountSettingsPanel.ClickToCopyMyID', lang)}
                    style={{ cursor: 'copy', borderRadius: '8px' }}
                  >
                    {t('accountSettingsPanel.MyID', lang)}
                  </Button>
                </Col>
                <Col style={{ paddingTop: '8px' }} span={18}>
                  {user.uid}
                </Col>
              </Row>

              {signFile && (
                <Row gutter={20} style={{ paddingTop: '20px', paddingLeft: '20px', direction: 'ltr' }}>
                  <Col style={{ paddingTop: '8px' }} span={6}>
                    <Switch
                      checked={user.signFile}
                      onChange={(checked) => {
                        if (checked) {
                          confirm({
                            title: t('accountSettingsPanel.DoYouReallyWantToShowYourNameInYourFiles', lang),
                            icon: <ExclamationCircleOutlined />,
                            content: t('accountSettingsPanel.SignFileDisclaimer', lang),
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
                        usePrimitiveStore.getState().set((state) => {
                          state.saveAccountSettingsFlag = true;
                        });
                      }}
                    />
                  </Col>
                  <Col span={18}>{t('accountSettingsPanel.StoreMyNameInMyFilesWhenSaving', lang)}</Col>
                </Row>
              )}

              <Row gutter={20} style={{ paddingTop: '20px', paddingLeft: '20px', direction: 'ltr' }}>
                <Col style={{ paddingTop: '8px' }} span={6}>
                  {t('accountSettingsPanel.SchoolID', lang)}
                </Col>
                <Col span={18}>
                  <Select
                    style={{ width: '90%' }}
                    value={schoolIdRef.current}
                    onChange={(value) => {
                      schoolIdRef.current = value;
                      setCommonStore((state) => {
                        state.user.schoolID = value;
                      });
                      usePrimitiveStore.getState().set((state) => {
                        state.saveAccountSettingsFlag = true;
                      });
                    }}
                  >
                    <Option key={SchoolID.UNKNOWN} value={SchoolID.UNKNOWN}>
                      {SchoolID.UNKNOWN}
                    </Option>
                    <Option key={SchoolID.SCHOOL1} value={SchoolID.SCHOOL1}>
                      {SchoolID.SCHOOL1}
                    </Option>
                    <Option key={SchoolID.SCHOOL2} value={SchoolID.SCHOOL2}>
                      {SchoolID.SCHOOL2}
                    </Option>
                    <Option key={SchoolID.SCHOOL3} value={SchoolID.SCHOOL3}>
                      {SchoolID.SCHOOL3}
                    </Option>
                    <Option key={SchoolID.SCHOOL4} value={SchoolID.SCHOOL4}>
                      {SchoolID.SCHOOL4}
                    </Option>
                    <Option key={SchoolID.SCHOOL5} value={SchoolID.SCHOOL5}>
                      {SchoolID.SCHOOL5}
                    </Option>
                    <Option key={SchoolID.SCHOOL6} value={SchoolID.SCHOOL6}>
                      {SchoolID.SCHOOL6}
                    </Option>
                    <Option key={SchoolID.SCHOOL7} value={SchoolID.SCHOOL7}>
                      {SchoolID.SCHOOL7}
                    </Option>
                    <Option key={SchoolID.SCHOOL8} value={SchoolID.SCHOOL8}>
                      {SchoolID.SCHOOL8}
                    </Option>
                    <Option key={SchoolID.SCHOOL9} value={SchoolID.SCHOOL9}>
                      {SchoolID.SCHOOL9}
                    </Option>
                  </Select>
                </Col>
              </Row>

              <Row gutter={20} style={{ paddingTop: '20px', paddingLeft: '20px', direction: 'ltr' }}>
                <Col style={{ paddingTop: '8px' }} span={6}>
                  {t('accountSettingsPanel.ClassID', lang)}
                </Col>
                <Col span={18}>
                  <Select
                    style={{ width: '90%' }}
                    value={classIdRef.current}
                    onChange={(value) => {
                      classIdRef.current = value;
                      setCommonStore((state) => {
                        state.user.classID = value;
                      });
                      usePrimitiveStore.getState().set((state) => {
                        state.saveAccountSettingsFlag = true;
                      });
                    }}
                  >
                    <Option key={ClassID.UNKNOWN} value={ClassID.UNKNOWN}>
                      {ClassID.UNKNOWN}
                    </Option>
                    <Option key={ClassID.CLASS1} value={ClassID.CLASS1}>
                      {ClassID.CLASS1}
                    </Option>
                    <Option key={ClassID.CLASS2} value={ClassID.CLASS2}>
                      {ClassID.CLASS2}
                    </Option>
                    <Option key={ClassID.CLASS3} value={ClassID.CLASS3}>
                      {ClassID.CLASS3}
                    </Option>
                    <Option key={ClassID.CLASS4} value={ClassID.CLASS4}>
                      {ClassID.CLASS4}
                    </Option>
                    <Option key={ClassID.CLASS5} value={ClassID.CLASS5}>
                      {ClassID.CLASS5}
                    </Option>
                    <Option key={ClassID.CLASS6} value={ClassID.CLASS6}>
                      {ClassID.CLASS6}
                    </Option>
                    <Option key={ClassID.CLASS7} value={ClassID.CLASS7}>
                      {ClassID.CLASS7}
                    </Option>
                    <Option key={ClassID.CLASS8} value={ClassID.CLASS8}>
                      {ClassID.CLASS8}
                    </Option>
                    <Option key={ClassID.CLASS9} value={ClassID.CLASS9}>
                      {ClassID.CLASS9}
                    </Option>
                  </Select>
                </Col>
              </Row>

              <Row gutter={6} style={{ paddingTop: '20px', paddingLeft: '20px', direction: 'ltr' }}>
                <Col span={6}>{t('accountSettingsPanel.AllPublished', lang)}</Col>
                <Col span={18}>
                  <span
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setPrimitiveStore('showPublishedModelsPanel', true);
                    }}
                  >
                    {user.published?.length ?? 0}
                  </span>
                </Col>
              </Row>

              <Row gutter={6} style={{ paddingTop: '20px', paddingLeft: '20px', direction: 'ltr' }}>
                <Col span={6}>{t('accountSettingsPanel.PublishedUnderAliases', lang)}</Col>
                <Col span={18}>
                  <span style={{ fontSize: '10px' }}>
                    {user.aliases?.map((value, index) => {
                      if (!user.aliases) return null;
                      return value + (index < user.aliases.length - 1 ? ', ' : '');
                    })}
                  </span>
                </Col>
              </Row>

              <Row gutter={6} style={{ paddingTop: '20px', paddingLeft: '20px', direction: 'ltr' }}>
                <Col span={6}>{t('accountSettingsPanel.Likes', lang)}</Col>
                <Col span={18}>
                  <span
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setPrimitiveStore('showLikesPanel', true);
                    }}
                  >
                    {user.likes?.length ?? 0}
                  </span>
                </Col>
              </Row>

              {superuser && (
                <Row gutter={6} style={{ paddingTop: '20px', paddingLeft: '20px', direction: 'ltr' }}>
                  <Col span={6}>{t('accountSettingsPanel.UserCount', lang)}</Col>
                  <Col span={18}>{userCount}</Col>
                </Row>
              )}
            </ColumnWrapper>
          </Container>
        </ReactDraggable>
      </>
    );
  },
);

export default AccountSettingsPanel;
