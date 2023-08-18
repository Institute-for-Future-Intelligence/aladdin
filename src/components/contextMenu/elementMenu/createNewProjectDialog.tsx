/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useRef, useState } from 'react';
import { Button, Col, Input, Modal, Row, Select } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import i18n from '../../../i18n/i18n';
import { usePrimitiveStore } from '../../../stores/commonPrimitive';
import { DesignProblem } from '../../../types';

const { Option } = Select;

const CreateNewProjectDialog = ({
  saveAs,
  setDialogVisible,
}: {
  saveAs: boolean;
  setDialogVisible: (b: boolean) => void;
}) => {
  const setCommonStore = useStore(Selector.set);
  const loggable = useStore(Selector.loggable);
  const language = useStore(Selector.language);

  const [projectType, setProjectType] = useState<DesignProblem>(
    useStore.getState().projectInfo.type ?? DesignProblem.SOLAR_PANEL_ARRAY,
  );
  const [projectTitle, setProjectTitle] = useState<string | null>(useStore.getState().projectInfo.title);
  const [projectDescription, setProjectDescription] = useState<string | null>(
    useStore.getState().projectInfo.description,
  );
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const { TextArea } = Input;
  const lang = { lng: language };

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
  };

  const onOkClick = () => {
    usePrimitiveStore.setState((state) => {
      if (saveAs) {
        state.saveProjectFlag = true;
      } else {
        state.createProjectFlag = true;
      }
    });
    setCommonStore((state) => {
      state.projectInfo.type = projectType;
      state.projectInfo.title = projectTitle;
      state.projectInfo.description = projectDescription;
    });
    if (loggable) {
      setCommonStore((state) => {
        state.actionInfo = {
          name: saveAs ? 'Save Project as' : 'Create New Project',
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
          {i18n.t(saveAs ? 'menu.project.SaveProjectAs' : 'menu.project.CreateNewProject', lang)}
        </div>
      }
      footer={[
        <Button key="Cancel" onClick={onCancelClick}>
          {i18n.t('word.Cancel', lang)}
        </Button>,
        <Button key="OK" type="primary" onClick={onOkClick} disabled={!projectTitle}>
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
          {i18n.t('projectPanel.ProjectType', lang) + ':'}
        </Col>
        <Col className="gutter-row" span={16}>
          <Select
            style={{ width: '100%' }}
            value={projectType}
            onChange={(value) => {
              setProjectType(value);
            }}
          >
            <Option key={DesignProblem.SOLAR_PANEL_ARRAY} value={DesignProblem.SOLAR_PANEL_ARRAY}>
              {i18n.t('projectPanel.SolarPanelArray', lang)}
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
