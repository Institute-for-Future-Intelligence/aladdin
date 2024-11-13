/*
 * @Copyright 2023-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import ReactDraggable, { DraggableBounds, DraggableData, DraggableEvent, DraggableEventHandler } from 'react-draggable';
import { Dropdown, Input, Modal, Space, Table, Typography } from 'antd';
import { CaretDownOutlined, QuestionCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { HOME_URL, REGEX_ALLOWABLE_IN_NAME, Z_INDEX_FRONT_PANEL } from '../constants';
import { showSuccess } from '../helpers';
import Draggable from 'react-draggable';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { ProjectState } from '../types';
import { useTranslation } from 'react-i18next';
import { MenuProps } from 'antd/lib';
import { MenuItem } from 'src/components/contextMenu/menuItems';
import { useLanguage } from '../hooks';

const { Column } = Table;

const Container = styled.div`
  position: fixed;
  top: 90px;
  right: 40px;
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
`;

export interface ProjectListPanelProps {
  projects: object[];
  setProjectState: (projectState: ProjectState) => void;
  deleteProject: (title: string) => void;
  renameProject: (oldTitle: string, newTitle: string) => void;
}

const ProjectListPanel = React.memo(
  ({ projects, setProjectState, deleteProject, renameProject }: ProjectListPanelProps) => {
    const user = useStore(Selector.user);
    const loggable = useStore(Selector.loggable);
    const undoManager = useStore(Selector.undoManager);
    const setCommonStore = useStore(Selector.set);
    const selectedFloatingWindow = useStore(Selector.selectedFloatingWindow);

    // nodeRef is to suppress ReactDOM.findDOMNode() deprecation warning. See:
    // https://github.com/react-grid-layout/react-draggable/blob/v4.4.2/lib/DraggableCore.js#L159-L171
    const nodeRef = React.useRef(null);

    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : 680;
    const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : 600;
    const [curPosition, setCurPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [renameDialogVisible, setRenameDialogVisible] = useState<boolean>(false);
    const [dragEnabled, setDragEnabled] = useState<boolean>(false);
    const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
    const [oldTitle, setOldTitle] = useState<string>();
    const [newTitle, setNewTitle] = useState<string>();
    const dragRef = useRef<HTMLDivElement | null>(null);
    // make an editable copy because the project array is not mutable
    const projectsRef = useRef<object[]>([...projects]);
    // set a flag so that we can update when projectsRef changes
    const [recountFlag, setRecountFlag] = useState<boolean>(false);
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);

    const { Search } = Input;
    const { t } = useTranslation();
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
      usePrimitiveStore.getState().set((state) => {
        state.showProjectListPanel = false;
      });
      if (loggable) {
        setCommonStore((state) => {
          state.actionInfo = {
            name: 'Close Project List',
            timestamp: new Date().getTime(),
          };
        });
      }
    };

    const confirmDeleteProject = (title: string) => {
      Modal.confirm({
        title: t('projectListPanel.DoYouReallyWantToDeleteProject', lang) + ' "' + title + '"?',
        content: (
          <span style={{ color: 'red', fontWeight: 'bold' }}>
            <WarningOutlined style={{ marginRight: '6px' }} />
            {t('word.Warning', lang) + ': ' + t('message.ThisCannotBeUndone', lang)}
          </span>
        ),
        icon: <QuestionCircleOutlined />,
        onOk: () => {
          deleteProject(title);
          if (loggable) {
            setCommonStore((state) => {
              state.actionInfo = {
                name: 'Delete Project',
                timestamp: new Date().getTime(),
                details: title,
              };
            });
          }
        },
      });
    };

    const changeProjectTitle = () => {
      if (oldTitle && newTitle) {
        renameProject(oldTitle, newTitle);
        setNewTitle(undefined);
        setRecountFlag(!recountFlag);
        if (loggable) {
          setCommonStore((state) => {
            state.actionInfo = {
              name: 'Rename Project',
              timestamp: new Date().getTime(),
              details: { oldTitle, newTitle },
            };
          });
        }
      }
      setRenameDialogVisible(false);
    };

    const openProject = (projectState: ProjectState) => {
      setProjectState(projectState);
      undoManager.clear();
      if (loggable) {
        setCommonStore((state) => {
          state.actionInfo = {
            name: 'Open Project',
            timestamp: new Date().getTime(),
            details: projectState.title,
          };
        });
      }
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
              {t('word.Rename', lang)}
            </div>
          }
          open={renameDialogVisible}
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
              onKeyDown={(e) => {
                if (!REGEX_ALLOWABLE_IN_NAME.test(e.key)) {
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
              {t('word.Caution', lang) +
                ': ' +
                t('projectListPanel.IfSharedOrPublishedRenamingProjectBreaksExistingLinks', lang)}
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
              state.selectedFloatingWindow = 'projectListPanel';
            });
          }}
        >
          <Container
            ref={nodeRef}
            style={{ zIndex: selectedFloatingWindow === 'projectListPanel' ? Z_INDEX_FRONT_PANEL : 14 }}
          >
            <ColumnWrapper ref={wrapperRef}>
              <Header className="handle" style={{ direction: 'ltr' }}>
                <span>{t('projectListPanel.MyProjects', lang) + ' (' + projectsRef.current.length + ')'}</span>
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
                  title={t('projectListPanel.SearchByTitle', lang)}
                  allowClear
                  size={'small'}
                  enterButton
                  onSearch={(s) => {
                    if (!projects) return;
                    // must create a new array for ant table to update (don't just set length to 0)
                    projectsRef.current = [];
                    for (const f of projects) {
                      // @ts-expect-error ignore
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
                  title={`${t('word.Title', lang)}`}
                  dataIndex="title"
                  key="title"
                  width={'50%'}
                  sortDirections={['ascend', 'descend', 'ascend']}
                  sorter={(a: any, b: any) => {
                    return a['title'].localeCompare(b['title']);
                  }}
                  render={(title, record, index) => {
                    const items: MenuProps['items'] = [
                      {
                        key: 'project-title',
                        label: (
                          <>
                            <MenuItem noPadding fontWeight={'bold'}>
                              {title}
                            </MenuItem>
                            <hr />
                          </>
                        ),
                      },
                      {
                        key: 'open-project',
                        label: (
                          <MenuItem noPadding onClick={() => openProject(record as unknown as ProjectState)}>
                            {t('word.Open', lang)}
                          </MenuItem>
                        ),
                      },
                      {
                        key: 'copy-title-to-clip-board',
                        label: (
                          <MenuItem
                            noPadding
                            onClick={() => {
                              navigator.clipboard.writeText(title).then(() => {
                                showSuccess(t('projectListPanel.TitleCopiedToClipBoard', lang) + '.');
                                if (loggable) {
                                  setCommonStore((state) => {
                                    state.actionInfo = {
                                      name: 'Copy Project Title',
                                      timestamp: new Date().getTime(),
                                      details: title,
                                    };
                                  });
                                }
                              });
                            }}
                          >
                            {t('projectListPanel.CopyTitle', lang)}
                          </MenuItem>
                        ),
                      },
                      {
                        key: 'rename-project',
                        label: (
                          <MenuItem
                            noPadding
                            onClick={() => {
                              setOldTitle(title);
                              setRenameDialogVisible(true);
                            }}
                          >
                            {t('word.Rename', lang)}
                          </MenuItem>
                        ),
                      },
                      {
                        key: 'delete-project',
                        label: (
                          <MenuItem noPadding onClick={() => confirmDeleteProject(title)}>
                            {t('word.Delete', lang)}
                          </MenuItem>
                        ),
                      },
                      {
                        key: 'generate-project-link',
                        label: (
                          <MenuItem
                            noPadding
                            onClick={() => {
                              const url =
                                HOME_URL + '?client=web&userid=' + user.uid + '&project=' + encodeURIComponent(title);
                              navigator.clipboard.writeText(url).then(() => {
                                showSuccess(t('projectListPanel.ProjectLinkGeneratedInClipBoard', lang) + '.');
                                if (loggable) {
                                  setCommonStore((state) => {
                                    state.actionInfo = {
                                      name: 'Generate Project Link',
                                      timestamp: new Date().getTime(),
                                      details: url,
                                    };
                                  });
                                }
                              });
                            }}
                          >
                            {t('projectListPanel.GenerateProjectLink', lang)}
                          </MenuItem>
                        ),
                      },
                    ];

                    return (
                      <Space style={{ width: '100%' }}>
                        <Dropdown menu={{ items }} trigger={['hover']}>
                          <CaretDownOutlined
                            style={{ fontSize: '12px', cursor: 'pointer' }}
                            onMouseEnter={() => {
                              if (index !== undefined) setSelectedIndex(index);
                            }}
                            onMouseLeave={() => {
                              setSelectedIndex(-1);
                            }}
                          />
                        </Dropdown>
                        <Typography.Text
                          title={t('word.Open', lang)}
                          style={{ fontSize: '12px', cursor: 'pointer', verticalAlign: 'top' }}
                          onClick={() => {
                            const selection = window.getSelection();
                            if (selection && selection.toString().length > 0) return;
                            // only proceed when no text is selected
                            openProject(record as unknown as ProjectState);
                          }}
                        >
                          {title}
                        </Typography.Text>
                      </Space>
                    );
                  }}
                  onCell={(data, index) => {
                    return {
                      style: {
                        background:
                          selectedIndex === index
                            ? 'lightskyblue'
                            : index !== undefined && index % 2 === 0
                            ? 'beige'
                            : 'gainsboro',
                      },
                    };
                  }}
                />
                <Column
                  title={`${t('word.Type', lang)}`}
                  dataIndex="type"
                  key="type"
                  width={'25%'}
                  render={(type) => {
                    return <Typography.Text style={{ fontSize: '12px', verticalAlign: 'top' }}>{type}</Typography.Text>;
                  }}
                  onCell={(data, index) => {
                    return {
                      style: {
                        background:
                          selectedIndex === index
                            ? 'lightskyblue'
                            : index !== undefined && index % 2 === 0
                            ? 'beige'
                            : 'gainsboro',
                      },
                    };
                  }}
                />
                <Column
                  title={`${t('word.Time', lang)}`}
                  dataIndex="time"
                  key="time"
                  width={'25%'}
                  defaultSortOrder={'descend'}
                  sortDirections={['ascend', 'descend', 'ascend']}
                  sorter={(a: any, b: any) => {
                    return a['timestamp'] - b['timestamp'];
                  }}
                  render={(time) => {
                    return <Typography.Text style={{ fontSize: '12px', verticalAlign: 'top' }}>{time}</Typography.Text>;
                  }}
                  onCell={(data, index) => {
                    return {
                      style: {
                        background:
                          selectedIndex === index
                            ? 'lightskyblue'
                            : index !== undefined && index % 2 === 0
                            ? 'beige'
                            : 'gainsboro',
                      },
                    };
                  }}
                />
              </Table>
            </ColumnWrapper>
          </Container>
        </ReactDraggable>
      </>
    );
  },
);

export default ProjectListPanel;
