/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { Design, DesignProblem } from '../types';

const { Column } = Table;

const Container = styled.div`
  position: fixed;
  top: 90px;
  right: 40px;
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

export interface ProjectListPanelProps {
  projects: object[];
  setProjectState: (
    owner: string,
    title: string,
    type: DesignProblem,
    description: string,
    designs: Design[] | null,
    hiddenParameters: string[] | null,
    designCounter: number,
  ) => void;
  deleteProject: (title: string) => void;
  renameProject: (oldTitle: string, newTitle: string) => void;
}

const ProjectListPanel = ({ projects, setProjectState, deleteProject, renameProject }: ProjectListPanelProps) => {
  const language = useStore(Selector.language);
  const user = useStore(Selector.user);

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
  const dragRef = useRef<HTMLDivElement | null>(null);
  // make an editable copy because the project array is not mutable
  const projectsRef = useRef<object[]>([...projects]);
  // set a flag so that we can update when projectsRef changes
  const [recountFlag, setRecountFlag] = useState<boolean>(false);

  const { Search } = Input;
  const lang = useMemo(() => {
    return { lng: language };
  }, [language]);

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
    if (projects) {
      projectsRef.current = [...projects];
      setRecountFlag(!recountFlag);
    }
  }, [projects]);

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
      state.showProjectListPanel = false;
    });
  };

  const confirmDeleteProject = (title: string) => {
    Modal.confirm({
      title: i18n.t('projectListPanel.DoYouReallyWantToDeleteProject', lang) + ' "' + title + '"?',
      content: (
        <span style={{ color: 'red', fontWeight: 'bold' }}>
          <WarningOutlined style={{ marginRight: '6px' }} />
          {i18n.t('word.Warning', lang) + ': ' + i18n.t('message.ThisCannotBeUndone', lang)}
        </span>
      ),
      icon: <QuestionCircleOutlined />,
      onOk: () => {
        deleteProject(title);
      },
    });
  };

  const changeProjectTitle = () => {
    if (oldTitle && newTitle) {
      renameProject(oldTitle, newTitle);
      setNewTitle(undefined);
      setRecountFlag(!recountFlag);
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
        onOk={changeProjectTitle}
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
            onPressEnter={changeProjectTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setNewTitle(e.target.value);
            }}
          />
          <span style={{ fontSize: '11px', color: 'red' }}>
            <WarningOutlined style={{ marginRight: '4px' }} />
            {i18n.t('word.Caution', lang) +
              ': ' +
              i18n.t('projectListPanel.IfSharedOrPublishedRenamingProjectBreaksExistingLinks', lang)}
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
              <span>{i18n.t('projectListPanel.MyProjects', lang) + ' (' + projectsRef.current.length + ')'}</span>
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
                title={i18n.t('projectListPanel.SearchByTitle', lang)}
                allowClear
                size={'small'}
                enterButton
                onSearch={(s) => {
                  if (!projects) return;
                  // must create a new array for ant table to update (don't just set length to 0)
                  projectsRef.current = [];
                  for (const f of projects) {
                    // @ts-ignore
                    if (f['title']?.toLowerCase().includes(s.toLowerCase())) {
                      projectsRef.current.push(f);
                    }
                  }
                  setRecountFlag(!recountFlag);
                }}
              />
            </span>
            <Table
              size={'small'}
              style={{ width: '100%', direction: 'ltr', verticalAlign: 'top' }}
              dataSource={projectsRef.current}
              scroll={{ y: 360 }}
              pagination={{
                defaultPageSize: 10,
                showSizeChanger: true,
                position: ['bottomCenter'],
                pageSizeOptions: ['10', '20', '50'],
              }}
            >
              <Column
                title={i18n.t('word.Type', lang)}
                dataIndex="type"
                key="type"
                width={'25%'}
                render={(type) => {
                  return <Typography.Text style={{ fontSize: '12px', verticalAlign: 'top' }}>{type}</Typography.Text>;
                }}
              />
              <Column
                title={i18n.t('word.Title', lang)}
                dataIndex="title"
                key="title"
                width={'33%'}
                sortDirections={['ascend', 'descend', 'ascend']}
                sorter={(a, b) => {
                  // @ts-ignore
                  return a['title'].localeCompare(b['title']);
                }}
                render={(title) => {
                  return (
                    <Typography.Text
                      style={{ fontSize: '12px', cursor: 'pointer', verticalAlign: 'top' }}
                      title={i18n.t('word.Open', lang)}
                    >
                      {title}
                    </Typography.Text>
                  );
                }}
                onCell={(r) => {
                  return {
                    onClick: () => {
                      const selection = window.getSelection();
                      if (selection && selection.toString().length > 0) return;
                      // only proceed when no text is selected
                      // @ts-ignore
                      setProjectState(
                        // @ts-ignore
                        r.owner,
                        // @ts-ignore
                        r.title,
                        // @ts-ignore
                        r.type,
                        // @ts-ignore
                        r.description,
                        // @ts-ignore
                        r.designs,
                        // @ts-ignore
                        r.hiddenParameters,
                        // @ts-ignore
                        r.counter,
                      );
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
                render={(time) => {
                  return <Typography.Text style={{ fontSize: '12px', verticalAlign: 'top' }}>{time}</Typography.Text>;
                }}
              />
              <Column
                width={'17%'}
                title={i18n.t('word.Action', lang)}
                key="action"
                render={(text, record: any) => (
                  <Space size="middle" style={{ verticalAlign: 'top' }}>
                    <img
                      title={i18n.t('word.Delete', lang)}
                      alt={'Delete'}
                      src={DeleteImage}
                      onClick={() => {
                        confirmDeleteProject(record.title);
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
                      title={i18n.t('projectListPanel.GenerateProjectLink', lang)}
                      alt={'Link'}
                      src={LinkImage}
                      onClick={() => {
                        const url =
                          HOME_URL + '?client=web&userid=' + user.uid + '&project=' + encodeURIComponent(record.title);
                        copyTextToClipboard(url);
                        showSuccess(i18n.t('projectListPanel.ProjectLinkGeneratedInClipBoard', lang) + '.');
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

export default React.memo(ProjectListPanel);
