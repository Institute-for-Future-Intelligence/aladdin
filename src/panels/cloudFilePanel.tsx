/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import ReactDraggable, { DraggableBounds, DraggableData, DraggableEvent, DraggableEventHandler } from 'react-draggable';
import { Input, Modal, Space, Table, Typography } from 'antd';
import { QuestionCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { HOME_URL } from '../constants';
import { copyTextToClipboard, showSuccess } from '../helpers';
import i18n from '../i18n/i18n';
import Draggable from 'react-draggable';
import RenameImage from '../assets/rename.png';
import DeleteImage from '../assets/delete.png';
import LinkImage from '../assets/create_link.png';
import { usePrimitiveStore } from '../stores/commonPrimitive';

const { Column } = Table;

const Container = styled.div`
  position: fixed;
  top: 80px;
  right: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 99;
`;

const ColumnWrapper = styled.div`
  background-color: #f8f8f8;
  position: absolute;
  right: 0;
  top: 0;
  width: 640px;
  height: 520px;
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

  svg.icon {
    height: 16px;
    width: 16px;
    padding: 8px;
    fill: #666;
  }
`;

export interface CloudFilePanelProps {
  cloudFileArray: object[];
  openCloudFile: (userid: string, title: string) => void;
  deleteCloudFile: (userid: string, title: string) => void;
  renameCloudFile: (userid: string, oldTitle: string, newTitle: string) => void;
}

const CloudFilePanel = ({ cloudFileArray, openCloudFile, deleteCloudFile, renameCloudFile }: CloudFilePanelProps) => {
  const language = useStore(Selector.language);

  // nodeRef is to suppress ReactDOM.findDOMNode() deprecation warning. See:
  // https://github.com/react-grid-layout/react-draggable/blob/v4.4.2/lib/DraggableCore.js#L159-L171
  const nodeRef = React.useRef(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : 680;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : 600;
  const [curPosition, setCurPosition] = useState({ x: 0, y: 0 });
  const [renameDialogVisible, setRenameDialogVisible] = useState(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const [oldTitle, setOldTitle] = useState<string>();
  const [newTitle, setNewTitle] = useState<string>();
  const [userid, setUserid] = useState<string>();
  const dragRef = useRef<HTMLDivElement | null>(null);
  // make an editable copy because the file array is not mutable
  const filesRef = useRef<object[]>([...cloudFileArray]);
  // set a flag so that we can update when filesRef changes
  const [recountFlag, setRecountFlag] = useState<boolean>(false);

  const { Search } = Input;
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

  useEffect(() => {
    if (cloudFileArray) {
      filesRef.current = [...cloudFileArray];
      setRecountFlag(!recountFlag);
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
    usePrimitiveStore.setState((state) => {
      state.showCloudFilePanel = false;
    });
  };

  const deleteFile = (userid: string, title: string) => {
    Modal.confirm({
      title: i18n.t('cloudFilePanel.DoYouReallyWantToDelete', lang) + ' "' + title + '"?',
      content: (
        <span style={{ color: 'red', fontWeight: 'bold' }}>
          <WarningOutlined style={{ marginRight: '6px' }} />
          {i18n.t('word.Warning', lang) + ': ' + i18n.t('message.ThisCannotBeUndone', lang)}
        </span>
      ),
      icon: <QuestionCircleOutlined />,
      onOk: () => {
        deleteCloudFile(userid, title);
        // change the address field of the browser when the cloud file is currently open
        const params = new URLSearchParams(window.location.search);
        if (params.get('title') === title && params.get('userid') === userid) {
          window.history.pushState({}, document.title, HOME_URL);
        }
      },
    });
  };

  const renameFile = () => {
    if (userid && oldTitle && newTitle) {
      renameCloudFile(userid, oldTitle, newTitle);
      setNewTitle(undefined);
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

  return (
    <>
      <Modal
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('word.Rename', lang)}
          </div>
        }
        visible={renameDialogVisible}
        onOk={renameFile}
        onCancel={() => {
          setRenameDialogVisible(false);
          setNewTitle(undefined);
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
            value={newTitle ? newTitle : oldTitle}
            onPressEnter={renameFile}
            onKeyDown={(e) => {
              const regex = /^[A-Za-z0-9\s]*$/;
              if (!regex.test(e.key)) {
                e.preventDefault();
                return false;
              }
            }}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setNewTitle(e.target.value);
            }}
          />
          <span style={{ fontSize: '11px', color: 'red' }}>
            <WarningOutlined style={{ marginRight: '4px' }} />
            {i18n.t('word.Caution', lang) +
              ': ' +
              i18n.t('cloudFilePanel.IfSharedOrPublishedRenamingFileBreaksExistingLinks', lang)}
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
      >
        <Container ref={nodeRef}>
          <ColumnWrapper ref={wrapperRef}>
            <Header className="handle" style={{ direction: 'ltr' }}>
              <span>{i18n.t('cloudFilePanel.MyCloudFiles', lang) + ' (' + filesRef.current.length + ')'}</span>
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
            <span style={{ direction: 'ltr' }}>
              <Search
                style={{ width: '50%', paddingTop: '8px', paddingBottom: '8px' }}
                title={i18n.t('cloudFilePanel.SearchByTitle', lang)}
                allowClear
                size={'small'}
                enterButton
                onSearch={(s) => {
                  if (!cloudFileArray) return;
                  // must create a new array for ant table to update (don't just set length to 0)
                  filesRef.current = [];
                  for (const f of cloudFileArray) {
                    // @ts-ignore
                    if (f['title']?.toLowerCase().includes(s.toLowerCase())) {
                      filesRef.current.push(f);
                    }
                  }
                  setRecountFlag(!recountFlag);
                }}
              />
            </span>
            <Table
              size={'small'}
              style={{ width: '100%', direction: 'ltr' }}
              dataSource={filesRef.current}
              scroll={{ y: 360 }}
              pagination={{
                defaultPageSize: 10,
                showSizeChanger: true,
                position: ['bottomCenter'],
                pageSizeOptions: ['10', '20', '50'],
              }}
            >
              <Column
                title={i18n.t('word.Title', lang)}
                dataIndex="title"
                key="title"
                width={'58%'}
                sortDirections={['ascend', 'descend', 'ascend']}
                sorter={(a, b) => {
                  // @ts-ignore
                  return a['title'].localeCompare(b['title']);
                }}
                render={(title, record) => {
                  return (
                    <Typography.Text style={{ fontSize: '12px', cursor: 'pointer' }} title={i18n.t('word.Open', lang)}>
                      {title}
                    </Typography.Text>
                  );
                }}
                onCell={(data, index) => {
                  return {
                    onClick: () => {
                      const selection = window.getSelection();
                      if (selection && selection.toString().length > 0) return;
                      // only proceed when no text is selected
                      // @ts-ignore
                      openCloudFile(data.userid, data.title);
                    },
                  };
                }}
              />
              <Column
                title={i18n.t('word.Time', lang)}
                dataIndex="time"
                key="time"
                width={'25%'}
                defaultSortOrder={'descend'}
                sortDirections={['ascend', 'descend', 'ascend']}
                sorter={(a, b) => {
                  // @ts-ignore
                  return a['timestamp'] - b['timestamp'];
                }}
                render={(time, record) => {
                  return <Typography.Text style={{ fontSize: '12px' }}>{time}</Typography.Text>;
                }}
              />
              <Column
                width={'17%'}
                title={i18n.t('word.Action', lang)}
                key="action"
                render={(text, record: any) => (
                  <Space size="middle">
                    <img
                      title={i18n.t('word.Delete', lang)}
                      alt={'Delete'}
                      src={DeleteImage}
                      onClick={() => {
                        deleteFile(record.userid, record.title);
                      }}
                      height={16}
                      width={16}
                      style={{
                        cursor: 'pointer',
                        verticalAlign: 'middle',
                      }}
                    />
                    <img
                      title={i18n.t('word.Rename', lang)}
                      alt={'Rename'}
                      src={RenameImage}
                      onClick={() => {
                        setOldTitle(record.title);
                        setUserid(record.userid);
                        setRenameDialogVisible(true);
                      }}
                      height={16}
                      width={16}
                      style={{
                        cursor: 'pointer',
                        verticalAlign: 'middle',
                      }}
                    />
                    <img
                      title={i18n.t('cloudFilePanel.GenerateLink', lang)}
                      alt={'Link'}
                      src={LinkImage}
                      onClick={() => {
                        const url =
                          HOME_URL +
                          '?client=web&userid=' +
                          record.userid +
                          '&title=' +
                          encodeURIComponent(record.title);
                        copyTextToClipboard(url);
                        showSuccess(i18n.t('cloudFilePanel.LinkGeneratedInClipBoard', lang) + '.');
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
};

export default React.memo(CloudFilePanel);
