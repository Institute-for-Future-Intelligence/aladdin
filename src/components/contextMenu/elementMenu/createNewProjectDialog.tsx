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
import { REGEX_ALLOWABLE_IN_NAME } from '../../../constants';
import { useLanguage } from '../../../hooks';

const { Option } = Select;

const CreateNewProjectDialog = React.memo(
  ({ saveAs, setDialogVisible }: { saveAs: boolean; setDialogVisible: (b: boolean) => void }) => {
    const setCommonStore = useStore(Selector.set);
    const loggable = useStore(Selector.loggable);

    const [projectType, setProjectType] = useState<DesignProblem>(
      useStore.getState().projectState.type ?? DesignProblem.SOLAR_PANEL_ARRAY,
    );
    const [projectTitle, setProjectTitle] = useState<string | null>(useStore.getState().projectState.title);
    const [projectDescription, setProjectDescription] = useState<string | null>(
      useStore.getState().projectState.description,
    );
    const [dragEnabled, setDragEnabled] = useState<boolean>(false);
    const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
    const dragRef = useRef<HTMLDivElement | null>(null);

    const { TextArea } = Input;
    const lang = useLanguage();

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
      usePrimitiveStore.getState().set((state) => {
        if (saveAs) {
          state.saveProjectAsFlag = true;
        } else {
          state.createProjectFlag = true;
        }
      });
      usePrimitiveStore.getState().set((state) => {
        state.projectType = projectType;
        state.projectTitle = projectTitle;
        state.projectDescription = projectDescription;
      });
      if (loggable) {
        setCommonStore((state) => {
          state.actionInfo = {
            name: saveAs ? 'Save Project as' : 'Create New Project',
            timestamp: new Date().getTime(),
            details: { type: projectType, title: projectTitle, description: projectDescription },
          };
        });
      }
      setDialogVisible(false);
    };

    return (
      <Modal
        width={560}
        open={true}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {`${i18n.t(saveAs ? 'menu.project.SaveProjectAs' : 'menu.project.CreateNewProject', lang)}`}
          </div>
        }
        footer={[
          <Button key="Cancel" onClick={onCancelClick}>
            {`${i18n.t('word.Cancel', lang)}`}
          </Button>,
          <Button key="OK" type="primary" onClick={onOkClick} disabled={!projectTitle}>
            {`${i18n.t('word.OK', lang)}`}
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
          <Col span={8}>{i18n.t('projectPanel.ProjectType', lang) + ':'}</Col>
          <Col span={16}>
            <Select
              disabled={saveAs}
              style={{ width: '100%' }}
              value={projectType}
              onChange={(value) => {
                setProjectType(value);
              }}
            >
              <Option key={DesignProblem.SOLAR_PANEL_ARRAY} value={DesignProblem.SOLAR_PANEL_ARRAY}>
                {`${i18n.t('projectPanel.SolarPanelArray', lang)}`}
              </Option>
              <Option key={DesignProblem.HOUSE_DESIGN} value={DesignProblem.HOUSE_DESIGN}>
                {`${i18n.t('projectPanel.HouseDesign', lang)}`}
              </Option>
            </Select>
          </Col>
        </Row>

        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col span={8}>{`${i18n.t('word.Title', lang)}`}:</Col>
          <Col span={16}>
            <Input
              maxLength={50}
              style={{ width: '100%' }}
              value={projectTitle ?? ''}
              onKeyDown={(e) => {
                if (!REGEX_ALLOWABLE_IN_NAME.test(e.key)) {
                  e.preventDefault();
                  return false;
                }
              }}
              onChange={(e) => {
                setProjectTitle(e.target.value);
              }}
            />
          </Col>
        </Row>

        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col span={8}>
            {`${i18n.t('word.Description', lang)}`}:<br />
            <span style={{ fontSize: '10px' }}>({`${i18n.t('word.MaximumCharacters', lang)}`}: 200)</span>
          </Col>
          <Col span={16}>
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
  },
);

export default CreateNewProjectDialog;
