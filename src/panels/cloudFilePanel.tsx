/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import ReactDraggable, { DraggableBounds, DraggableData, DraggableEvent, DraggableEventHandler } from 'react-draggable';
import { Input, Modal, Space, Table, Typography } from 'antd';
import { CopyOutlined, QuestionCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { HOME_URL, REGEX_ALLOWABLE_IN_NAME, Z_INDEX_FRONT_PANEL } from '../constants';
import { showSuccess } from '../helpers';
import Draggable from 'react-draggable';
import RenameImage from '../assets/rename.png';
import DeleteImage from '../assets/delete.png';
import LinkImage from '../assets/create_link.png';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hooks';
import dayjs from 'dayjs';

const { Column } = Table;

const Container = styled.div`
  position: fixed;
  top: 80px;
  right: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 14;
`;

const ColumnWrapper = styled.div`
  background-color: #f8f8f8;
  position: absolute;
  right: 0;
  top: 0;
  width: 680px;
  height: 550px;
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
  overflow-y: hidden;
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

export interface CloudFilePanelProps {
  cloudFileArray: object[];
  openCloudFile: (title: string) => void;
  deleteCloudFile: (title: string) => void;
  renameCloudFile: (oldTitle: string, newTitle: string) => void;
}

const CloudFilePanel = React.memo(
  ({ cloudFileArray, openCloudFile, deleteCloudFile, renameCloudFile }: CloudFilePanelProps) => {
    const setCommonStore = useStore(Selector.set);
    const user = useStore(Selector.user);
    const selectedFloatingWindow = useStore(Selector.selectedFloatingWindow);

    const [curPosition, setCurPosition] = useState({ x: 0, y: 0 });
    const [renameDialogVisible, setRenameDialogVisible] = useState(false);
    const [dragEnabled, setDragEnabled] = useState<boolean>(false);
    const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
    const [updateFlag, setUpdateFlag] = useState<boolean>(false);

    // make an editable copy because the file array is not mutable
    const filesRef = useRef<object[]>([...cloudFileArray]);
    const oldTitleRef = useRef<string>();
    const newTitleRef = useRef<string>();

    // nodeRef is to suppress ReactDOM.findDOMNode() deprecation warning. See:
    // https://github.com/react-grid-layout/react-draggable/blob/v4.4.2/lib/DraggableCore.js#L159-L171
    const nodeRef = React.useRef(null);
    const dragRef = useRef<HTMLDivElement | null>(null);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : 680;
    const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : 600;

    const { Search } = Input;
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

    useEffect(() => {
      if (cloudFileArray) {
        filesRef.current = [...cloudFileArray];
        setUpdateFlag(!updateFlag);
      }
    }, [cloudFileArray]);

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
        state.showCloudFilePanel = false;
      });
    };

    const deleteFile = (title: string) => {
      Modal.confirm({
        title: t('cloudFilePanel.DoYouReallyWantToDelete', lang) + ' "' + title + '"?',
        content: (
          <span style={{ color: 'red', fontWeight: 'bold' }}>
            <WarningOutlined style={{ marginRight: '6px' }} />
            {t('word.Warning', lang) + ': ' + t('message.ThisCannotBeUndone', lang)}
          </span>
        ),
        icon: <QuestionCircleOutlined />,
        onOk: () => {
          deleteCloudFile(title);
          // change the address field of the browser when the cloud file is currently open
          const params = new URLSearchParams(window.location.search);
          if (params.get('title') === title && params.get('userid') === user.uid) {
            window.history.pushState({}, document.title, HOME_URL);
          }
        },
      });
    };

    const renameFile = () => {
      if (oldTitleRef.current && newTitleRef.current) {
        renameCloudFile(oldTitleRef.current, newTitleRef.current);
        newTitleRef.current = undefined;
      }
      setRenameDialogVisible(false);
    };

    const onStart = (event: DraggableEvent, uiData: DraggableData) => {
      if (dragRef.current) {
        const { clientWidth, clientHeight } = window.document.documentElement;
        const targetRect = dragRef.current.getBoundingClientRect();
        setBounds({
          left: -targetRect.left + uiData.x,
          right: clientWidth - (targetRect.right - uiData.x),
          top: -targetRect.top + uiData.y,
          bottom: clientHeight - (targetRect?.bottom - uiData.y),
        });
      }
    };

    const { t } = useTranslation();

    return (
      <>
        <Modal
          title={
            <div
              style={{ width: '100%', cursor: 'move' }}
              onMouseOver={() => setDragEnabled(true)}
              onMouseOut={() => setDragEnabled(false)}
            >
              {t('word.Rename', lang)}
            </div>
          }
          open={renameDialogVisible}
          onOk={renameFile}
          onCancel={() => {
            setRenameDialogVisible(false);
            newTitleRef.current = undefined;
          }}
          modalRender={(modal) => (
            <Draggable disabled={!dragEnabled} bounds={bounds} onStart={(event, uiData) => onStart(event, uiData)}>
              <div ref={dragRef}>{modal}</div>
            </Draggable>
          )}
        >
          <Space direction={'vertical'} style={{ width: '100%' }}>
            <Input
              placeholder="Title"
              value={newTitleRef.current ? newTitleRef.current : oldTitleRef.current}
              onPressEnter={renameFile}
              onKeyDown={(e) => {
                if (!REGEX_ALLOWABLE_IN_NAME.test(e.key)) {
                  e.preventDefault();
                  return false;
                }
              }}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                newTitleRef.current = e.target.value;
                setUpdateFlag(!updateFlag);
              }}
            />
            <span style={{ fontSize: '11px', color: 'red' }}>
              <WarningOutlined style={{ marginRight: '4px' }} />
              {t('word.Caution', lang) +
                ': ' +
                t('cloudFilePanel.IfSharedOrPublishedRenamingFileBreaksExistingLinks', lang)}
              .
            </span>
          </Space>
        </Modal>
        <ReactDraggable
          nodeRef={nodeRef}
          handle={'.handle'}
          bounds={'parent'}
          axis="both"
          position={curPosition}
          onDrag={onDrag}
          onStop={onDragEnd}
          onMouseDown={() => {
            setCommonStore((state) => {
              state.selectedFloatingWindow = 'cloudFilePanel';
            });
          }}
        >
          <Container
            ref={nodeRef}
            style={{ zIndex: selectedFloatingWindow === 'cloudFilePanel' ? Z_INDEX_FRONT_PANEL : 14 }}
          >
            <ColumnWrapper ref={wrapperRef}>
              <Header className="handle" style={{ direction: 'ltr' }}>
                <span>{t('cloudFilePanel.MyCloudFiles', lang) + ' (' + filesRef.current.length + ')'}</span>
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
              <span style={{ direction: 'ltr' }}>
                <Search
                  style={{ width: '50%', paddingTop: '8px', paddingBottom: '8px' }}
                  title={t('cloudFilePanel.SearchByTitle', lang)}
                  allowClear
                  size={'small'}
                  enterButton
                  onSearch={(s) => {
                    if (!cloudFileArray) return;
                    // must create a new array for ant table to update (don't just set length to 0)
                    filesRef.current = [];
                    for (const f of cloudFileArray) {
                      if ((f as any)['key']?.toLowerCase().includes(s.toLowerCase())) {
                        filesRef.current.push(f);
                      }
                    }
                    setUpdateFlag(!updateFlag);
                  }}
                />
              </span>
              <Table
                size={'small'}
                style={{ width: '100%', direction: 'ltr' }}
                dataSource={filesRef.current}
                scroll={{ y: 390 }}
                pagination={{
                  defaultPageSize: 10,
                  showSizeChanger: true,
                  position: ['bottomCenter'],
                  pageSizeOptions: ['10', '20', '50'],
                }}
              >
                <Column
                  title={`${t('word.Title', lang)}`}
                  dataIndex="key"
                  key="key"
                  width={'56%'}
                  sortDirections={['ascend', 'descend', 'ascend']}
                  sorter={(a: any, b: any) => {
                    return a['key'].localeCompare(b['key']);
                  }}
                  render={(key) => {
                    return (
                      <Typography.Text style={{ fontSize: '12px', cursor: 'pointer' }} title={t('word.Open', lang)}>
                        {key}
                      </Typography.Text>
                    );
                  }}
                  onCell={(data, index) => {
                    return {
                      onClick: () => {
                        const selection = window.getSelection();
                        if (selection && selection.toString().length > 0) return;
                        // only proceed when no text is selected
                        openCloudFile(data.key);
                      },
                    };
                  }}
                />
                <Column
                  title={`${t('word.Time', lang)}`}
                  dataIndex="timestamp"
                  key="timestamp"
                  width={'25%'}
                  defaultSortOrder={'descend'}
                  sortDirections={['ascend', 'descend', 'ascend']}
                  sorter={(a: any, b: any) => {
                    return a['timestamp'] - b['timestamp'];
                  }}
                  render={(timestamp) => {
                    return (
                      <Typography.Text style={{ fontSize: '12px' }}>
                        {dayjs(new Date(timestamp)).format('MM/DD/YYYY hh:mm A')}
                      </Typography.Text>
                    );
                  }}
                />
                <Column
                  width={'19%'}
                  title={`${t('word.Action', lang)}`}
                  key="action"
                  render={(record: any) => (
                    <Space size="middle">
                      <img
                        title={t('word.Delete', lang)}
                        alt={'Delete'}
                        src={DeleteImage}
                        onClick={() => {
                          deleteFile(record.key);
                        }}
                        height={16}
                        width={16}
                        style={{
                          cursor: 'pointer',
                          verticalAlign: 'middle',
                        }}
                      />
                      <img
                        title={t('word.Rename', lang)}
                        alt={'Rename'}
                        src={RenameImage}
                        onClick={() => {
                          oldTitleRef.current = record.key;
                          setRenameDialogVisible(true);
                        }}
                        height={16}
                        width={16}
                        style={{
                          cursor: 'pointer',
                          verticalAlign: 'middle',
                        }}
                      />
                      <CopyOutlined
                        title={t('cloudFilePanel.CopyTitle', lang)}
                        alt={'Copy Title'}
                        onClick={() => {
                          navigator.clipboard
                            .writeText(record.key)
                            .then(() => showSuccess(t('cloudFilePanel.TitleCopiedToClipBoard', lang) + '.'));
                        }}
                        height={16}
                        width={16}
                        style={{
                          cursor: 'pointer',
                          verticalAlign: 'middle',
                        }}
                      />
                      <img
                        title={t('cloudFilePanel.GenerateLink', lang)}
                        alt={'Link'}
                        src={LinkImage}
                        onClick={() => {
                          const url =
                            HOME_URL +
                            '?client=web&userid=' +
                            record.userid +
                            '&title=' +
                            encodeURIComponent(record.key);
                          navigator.clipboard
                            .writeText(url)
                            .then(() => showSuccess(t('cloudFilePanel.LinkGeneratedInClipBoard', lang) + '.'));
                        }}
                        height={16}
                        width={16}
                        style={{
                          cursor: 'pointer',
                          verticalAlign: 'middle',
                        }}
                      />
                    </Space>
                  )}
                />
              </Table>
            </ColumnWrapper>
          </Container>
        </ReactDraggable>
      </>
    );
  },
);

export default CloudFilePanel;
