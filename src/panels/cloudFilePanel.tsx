/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import { Input, Modal, Space, Table } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faFile, faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { faLink } from '@fortawesome/free-solid-svg-icons';
import { HOME_URL } from '../constants';
import { copyTextToClipboard, showSuccess } from '../helpers';

const { Column } = Table;

const Container = styled.div`
  position: fixed;
  top: 80px;
  right: 10px;
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
  height: 500px;
  padding-bottom: 10px;
  border: 2px solid gainsboro;
  border-radius: 10px 10px 10px 10px;
  display: flex;
  flex-direction: column;
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
  cloudFileArray: any[];
  openCloudFile: (userid: string, title: string) => void;
  deleteCloudFile: (userid: string, title: string) => void;
  renameCloudFile: (userid: string, oldTitle: string, newTitle: string) => void;
}

const CloudFilePanel = ({
  cloudFileArray,
  openCloudFile,
  deleteCloudFile,
  renameCloudFile,
}: CloudFilePanelProps) => {
  const setCommonStore = useStore((state) => state.set);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : 680;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : 600;
  const [curPosition, setCurPosition] = useState({ x: 0, y: 0 });
  const [renameDialogVisible, setRenameDialogVisible] = useState(false);
  const [oldTitle, setOldTitle] = useState<string>();
  const [newTitle, setNewTitle] = useState<string>();
  const [email, setEmail] = useState<string>();

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
      state.showCloudFilePanel = false;
    });
  };

  const deleteFile = (email: string, title: string) => {
    Modal.confirm({
      title: 'Do you really want to delete this document titled with "' + title + '"?',
      icon: <ExclamationCircleOutlined />,
      okText: 'OK',
      cancelText: 'Cancel',
      onOk: () => {
        deleteCloudFile(email, title);
      },
    });
  };

  const renameFile = () => {
    if (email && oldTitle && newTitle) {
      renameCloudFile(email, oldTitle, newTitle);
    }
    setRenameDialogVisible(false);
  };

  return (
    <>
      <Modal
        title="Rename"
        visible={renameDialogVisible}
        onOk={renameFile}
        onCancel={() => {
          setRenameDialogVisible(false);
          setNewTitle(undefined);
        }}
      >
        <Input
          placeholder="Title"
          value={newTitle ? newTitle : oldTitle}
          onPressEnter={renameFile}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setNewTitle(e.target.value);
          }}
        />
      </Modal>
      <ReactDraggable
        handle={'.handle'}
        bounds={'parent'}
        axis="both"
        position={curPosition}
        onDrag={onDrag}
        onStop={onDragEnd}
      >
        <Container>
          <ColumnWrapper ref={wrapperRef}>
            <Header className="handle">
              <span>My Cloud Files</span>
              <span
                style={{ cursor: 'pointer' }}
                onMouseDown={() => {
                  closePanel();
                }}
                onTouchStart={() => {
                  closePanel();
                }}
              >
                Close
              </span>
            </Header>
            <Table
              style={{ width: '100%' }}
              dataSource={cloudFileArray}
              pagination={{
                defaultPageSize: 5,
                showSizeChanger: true,
                pageSizeOptions: ['5', '10', '50'],
              }}
            >
              <Column title="Title" dataIndex="title" key="title" />
              <Column title="Owner" dataIndex="owner" key="owner" />
              <Column title="Time" dataIndex="time" key="time" />
              <Column
                title="Action"
                key="action"
                render={(text, record: any) => (
                  <Space size="middle">
                    <FontAwesomeIcon
                      title={'Open'}
                      icon={faFile}
                      size={'lg'}
                      color={'#666666'}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        openCloudFile(record.email, record.title);
                      }}
                    />
                    <FontAwesomeIcon
                      title={'Delete'}
                      icon={faTrashAlt}
                      size={'lg'}
                      color={'#666666'}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        deleteFile(record.email, record.title);
                      }}
                    />
                    <FontAwesomeIcon
                      title={'Rename'}
                      icon={faEdit}
                      size={'lg'}
                      color={'#666666'}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setOldTitle(record.title);
                        setEmail(record.email);
                        setRenameDialogVisible(true);
                      }}
                    />
                    <FontAwesomeIcon
                      title={'Generate link'}
                      icon={faLink}
                      size={'lg'}
                      color={'#666666'}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        let url =
                          HOME_URL +
                          '?client=web&userid=' +
                          encodeURIComponent(record.email) +
                          '&title=' +
                          encodeURIComponent(record.title);
                        copyTextToClipboard(url);
                        showSuccess('A link has been generated in the clip board.');
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
