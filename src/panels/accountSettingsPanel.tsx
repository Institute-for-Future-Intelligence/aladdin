/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useState} from "react";
import styled from "styled-components";
import {useStore} from "../stores/common";
import ReactDraggable, {DraggableEventHandler} from "react-draggable";

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

export interface AccountSettingsPanelProps {
    requestUpdate: () => void;
}

const AccountSettingsPanel = ({
                                  requestUpdate
                              }: AccountSettingsPanelProps) => {

    const setCommonStore = useStore(state => state.set);
    const [curPosition, setCurPosition] = useState({x: 0, y: 0});

    const onDrag: DraggableEventHandler = (e, ui) => {
        setCurPosition({x: ui.x, y: ui.y});
    };

    const onDragEnd: DraggableEventHandler = (e, ui) => {
        // TODO: Should we save the position?
    };

    const closePanel = () => {
        setCommonStore((state) => {
            state.showAccountSettingsPanel = false;
        });
        requestUpdate();
    };

    return (
        <>
            <ReactDraggable
                handle={'.handle'}
                bounds={'parent'}
                axis='both'
                position={curPosition}
                onDrag={onDrag}
                onStop={onDragEnd}
            >
                <Container>
                    <ColumnWrapper>
                        <Header className='handle'>
                            <span>My Account Settings</span>
                            <span style={{cursor: 'pointer'}}
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
                    </ColumnWrapper>
                </Container>
            </ReactDraggable>
        </>
    )
};

export default AccountSettingsPanel;
