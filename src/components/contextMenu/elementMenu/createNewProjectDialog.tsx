/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, Input, Modal, Row, Select } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import i18n from '../../../i18n/i18n';
import { usePrimitiveStore } from '../../../stores/commonPrimitive';
import { ProjectType } from '../../../types';

const { Option } = Select;

const CreateNewProjectDialog = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const loggable = useStore(Selector.loggable);
  const language = useStore(Selector.language);

  const [projectType, setProjectType] = useState<ProjectType>(
    useStore.getState().projectType ?? ProjectType.SOLAR_FARM_DESIGN,
  );
  const [projectTitle, setProjectTitle] = useState<string | null>(useStore.getState().projectTitle);
  const [projectDescription, setProjectDescription] = useState<string | null>(useStore.getState().projectDescription);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const okButtonRef = useRef<HTMLElement | null>(null);
  const okButtonClickedRef = useRef<boolean>(false);

  const { TextArea } = Input;
  const lang = { lng: language };

  useEffect(() => {
    okButtonRef.current?.focus();
  }, []);

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

  const onCancelClick = () => {
    setDialogVisible(false);
    okButtonClickedRef.current = false;
  };

  const onOkClick = () => {
    usePrimitiveStore.setState((state) => {
      state.saveProjectFlag = !state.saveProjectFlag;
    });
    setCommonStore((state) => {
      state.projectType = projectType;
      state.projectTitle = projectTitle;
      state.projectDescription = projectDescription;
      state.changed = true;
    });
    if (loggable) {
      setCommonStore((state) => {
        state.actionInfo = {
          name: 'Create New Project',
          timestamp: new Date().getTime(),
        };
      });
    }
    setDialogVisible(false);
  };

  return (
    <Modal
      width={560}
      visible={true}
      title={
        <div
          style={{ width: '100%', cursor: 'move' }}
          onMouseOver={() => setDragEnabled(true)}
          onMouseOut={() => setDragEnabled(false)}
        >
          {i18n.t('menu.project.CreateNewProject', lang)}
        </div>
      }
      footer={[
        <Button key="Cancel" onClick={onCancelClick}>
          {i18n.t('word.Cancel', lang)}
        </Button>,
        <Button key="OK" type="primary" ref={okButtonRef} onClick={onOkClick}>
          {i18n.t('word.OK', lang)}
        </Button>,
      ]}
      // this must be specified for the x button in the upper-right corner to work
      onCancel={() => {
        setDialogVisible(false);
      }}
      maskClosable={false}
      destroyOnClose={false}
      modalRender={(modal) => (
        <Draggable disabled={!dragEnabled} bounds={bounds} onStart={(event, uiData) => onStart(event, uiData)}>
          <div ref={dragRef}>{modal}</div>
        </Draggable>
      )}
    >
      <Row gutter={6} style={{ paddingBottom: '4px' }}>
        <Col className="gutter-row" span={8}>
          {i18n.t('shared.ProjectType', lang) + ':'}
        </Col>
        <Col className="gutter-row" span={16}>
          <Select
            style={{ width: '100%' }}
            value={projectType}
            onChange={(value) => {
              setProjectType(value);
            }}
          >
            <Option key={ProjectType.SOLAR_FARM_DESIGN} value={ProjectType.SOLAR_FARM_DESIGN}>
              {i18n.t('shared.SolarFarmDesign', lang)}
            </Option>
          </Select>
        </Col>
      </Row>

      <Row gutter={6} style={{ paddingBottom: '4px' }}>
        <Col className="gutter-row" span={8}>
          {i18n.t('word.Title', lang)}:
        </Col>
        <Col className="gutter-row" span={16}>
          <Input
            maxLength={50}
            style={{ width: '100%' }}
            value={projectTitle ?? ''}
            onChange={(e) => {
              setProjectTitle(e.target.value);
            }}
          />
        </Col>
      </Row>

      <Row gutter={6} style={{ paddingBottom: '4px' }}>
        <Col className="gutter-row" span={8}>
          {i18n.t('word.Description', lang)}:<br />
          <span style={{ fontSize: '10px' }}>({i18n.t('word.MaximumCharacters', lang)}: 200)</span>
        </Col>
        <Col className="gutter-row" span={16}>
          <TextArea
            rows={5}
            maxLength={200}
            style={{ width: '100%' }}
            value={projectDescription ?? ''}
            onChange={(e) => {
              setProjectDescription(e.target.value);
            }}
          />
        </Col>
      </Row>
    </Modal>
  );
};

export default React.memo(CreateNewProjectDialog);
