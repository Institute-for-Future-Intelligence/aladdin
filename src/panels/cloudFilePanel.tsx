/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useState} from "react";
import styled from "styled-components";
import {useStore} from "../stores/common";
import ReactDraggable, {DraggableEventHandler} from "react-draggable";
import {Space, Table} from "antd";
import {HOME_URL} from "../constants";

const {Column} = Table;

const Container = styled.div`
  position: fixed;
  top: 80px;
  right: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 9;
`;

const ColumnWrapper = styled.div`
  background-color: #f8f8f8;
  position: absolute;
  right: 0;
  top: 0;
  width: 600px;
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
    requestUpdate: () => void;
}

const CloudFilePanel = ({
                            cloudFileArray,
                            requestUpdate
                        }: CloudFilePanelProps) => {

    const setCommonStore = useStore(state => state.set);
    const [curPosition, setCurPosition] = useState({x: 0, y: 0});

    const onDrag: DraggableEventHandler = (e, ui) => {
        // TODO
        setCurPosition({
            x: ui.x,
            y: ui.y,
        });
    };

    const onDragStart: DraggableEventHandler = (e, ui) => {
        // TODO
    };

    const onDragEnd: DraggableEventHandler = (e, ui) => {
        // TODO
    };

    return (
        <ReactDraggable
            handle={'.handle'}
            bounds={'parent'}
            axis='both'
            position={curPosition}
            onDrag={onDrag}
            onStart={onDragStart}
            onStop={onDragEnd}
        >
            <Container>
                <ColumnWrapper>
                    <Header className='handle'>
                        <span>My Cloud Files</span>
                        <span style={{cursor: 'pointer'}}
                              onMouseDown={() => {
                                  setCommonStore((state) => {
                                      state.showCloudFilePanel = false;
                                  });
                                  requestUpdate();
                              }}>
                            Close
                        </span>
                    </Header>
                    <Table style={{width: '100%'}}
                           dataSource={cloudFileArray}
                           pagination={{
                               defaultPageSize: 10,
                               showSizeChanger: true,
                               pageSizeOptions: ['10', '50', '100']
                           }}>
                        <Column title="Title" dataIndex="title" key="title"/>
                        <Column title="Owner" dataIndex="owner" key="owner"/>
                        <Column title="Time" dataIndex="time" key="time"/>
                        <Column
                            title="Action"
                            key="action"
                            render={(text, record: any) => (
                                <Space size="middle">
                                    <a target="_blank" rel="noopener noreferrer"
                                       href={HOME_URL + '?tmp=yes&userid=' + record.email + '&title=' + record.title}>Open</a>
                                    <a>Delete</a>
                                </Space>
                            )}
                        />
                    </Table>
                </ColumnWrapper>
            </Container>
        </ReactDraggable>
    )
};

export default CloudFilePanel;
