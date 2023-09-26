/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import ResidentialBuildingIcon from '../../../assets/map_residential_building.png';
import CommercialBuildingIcon from '../../../assets/map_commercial_building.png';
import SchoolBuildingIcon from '../../../assets/map_school_building.png';
import TouristAttractionIcon from '../../../assets/map_tourist_attraction.png';
import SolarPanelIcon from '../../../assets/map_solar_panel.png';
import ParabolicDishIcon from '../../../assets/map_parabolic_dish.png';
import ParabolicTroughIcon from '../../../assets/map_parabolic_trough.png';
import FresnelReflectorIcon from '../../../assets/map_fresnel_reflector.png';
import HeliostatIcon from '../../../assets/map_heliostat.png';
import UnderConstructionIcon from '../../../assets/map_under_construction.png';
import UnknownIcon from '../../../assets/map_marker.png';

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, Input, Modal, Row, Select } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import i18n from '../../../i18n/i18n';
import { usePrimitiveStore } from '../../../stores/commonPrimitive';
import { ModelType } from '../../../types';
import generateRandomAnimal from 'random-animal-name';
import { REGEX_ALLOWABLE_IN_NAME } from '../../../constants';

const { Option } = Select;

const ModelSiteDialog = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const loggable = useStore(Selector.loggable);
  const language = useStore(Selector.language);

  const [modelType, setModelType] = useState<ModelType>(useStore.getState().modelType);
  const [modelAuthor, setModelAuthor] = useState<string | null>(
    useStore.getState().modelAuthor ?? generateRandomAnimal(),
  );
  const [modelLabel, setModelLabel] = useState<string | null>(
    useStore.getState().modelLabel ?? useStore.getState().cloudFile ?? null,
  );
  const [modelDescription, setModelDescription] = useState<string | null>(useStore.getState().modelDescription);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const okButtonRef = useRef<HTMLElement | null>(null);

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
  };

  const onOkClick = () => {
    usePrimitiveStore.setState((state) => {
      state.publishOnModelsMapFlag = true;
    });
    setCommonStore((state) => {
      state.modelType = modelType;
      state.modelAuthor = modelAuthor;
      state.modelLabel = modelLabel;
      state.modelDescription = modelDescription;
    });
    usePrimitiveStore.getState().setChanged(true);
    if (loggable) {
      setCommonStore((state) => {
        state.actionInfo = {
          name: 'Publish on Map of Models',
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
          {i18n.t('menu.file.PublishOnModelsMap', lang)}
        </div>
      }
      footer={[
        <Button key="Cancel" onClick={onCancelClick}>
          {i18n.t('word.Cancel', lang)}
        </Button>,
        <Button key="OK" type="primary" ref={okButtonRef} onClick={onOkClick} disabled={!modelAuthor || !modelLabel}>
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
          {i18n.t('shared.ModelType', lang) + ':'}
        </Col>
        <Col className="gutter-row" span={16}>
          <Select
            style={{ width: '100%' }}
            value={modelType}
            onChange={(value) => {
              setModelType(value);
            }}
          >
            <Option key={ModelType.UNKNOWN} value={ModelType.UNKNOWN}>
              <img alt={'Building'} width={24} src={UnknownIcon} style={{ marginRight: '8px' }} />
              {i18n.t('word.Unknown', lang)}
            </Option>
            <Option key={ModelType.UNDER_CONSTRUCTION} value={ModelType.UNDER_CONSTRUCTION}>
              <img alt={'Building'} width={24} src={UnderConstructionIcon} style={{ marginRight: '8px' }} />
              {i18n.t('word.UnderConstruction', lang)}
            </Option>
            <Option key={ModelType.RESIDENTIAL_BUILDING} value={ModelType.RESIDENTIAL_BUILDING}>
              <img
                alt={'Residential Building'}
                width={24}
                src={ResidentialBuildingIcon}
                style={{ marginRight: '8px' }}
              />
              {i18n.t('word.ResidentialBuilding', lang)}
            </Option>
            <Option key={ModelType.COMMERCIAL_BUILDING} value={ModelType.COMMERCIAL_BUILDING}>
              <img alt={'Commercial Building'} width={24} src={CommercialBuildingIcon} style={{ marginRight: '8px' }} />
              {i18n.t('word.CommercialBuilding', lang)}
            </Option>
            <Option key={ModelType.SCHOOL_BUILDING} value={ModelType.SCHOOL_BUILDING}>
              <img alt={'School Building'} width={24} src={SchoolBuildingIcon} style={{ marginRight: '8px' }} />
              {i18n.t('word.SchoolBuilding', lang)}
            </Option>
            <Option key={ModelType.TOURIST_ATTRACTION} value={ModelType.TOURIST_ATTRACTION}>
              <img alt={'Tourist Attraction'} width={24} src={TouristAttractionIcon} style={{ marginRight: '8px' }} />
              {i18n.t('word.TouristAttraction', lang)}
            </Option>
            <Option key={ModelType.PHOTOVOLTAIC} value={ModelType.PHOTOVOLTAIC}>
              <img alt={'Photovoltaic'} width={24} src={SolarPanelIcon} style={{ marginRight: '8px' }} />
              {i18n.t('word.Photovoltaic', lang)}
            </Option>
            <Option key={ModelType.PARABOLIC_DISH} value={ModelType.PARABOLIC_DISH}>
              <img alt={'Parabolic Dish'} width={24} src={ParabolicDishIcon} style={{ marginRight: '8px' }} />
              {i18n.t('shared.ParabolicDishElement', lang)}
            </Option>
            <Option key={ModelType.PARABOLIC_TROUGH} value={ModelType.PARABOLIC_TROUGH}>
              <img alt={'Parabolic Trough'} width={24} src={ParabolicTroughIcon} style={{ marginRight: '8px' }} />
              {i18n.t('shared.ParabolicTroughElement', lang)}
            </Option>
            <Option key={ModelType.FRESNEL_REFLECTOR} value={ModelType.FRESNEL_REFLECTOR}>
              <img alt={'Fresnel Reflector'} width={24} src={FresnelReflectorIcon} style={{ marginRight: '8px' }} />
              {i18n.t('shared.FresnelReflectorElement', lang)}
            </Option>
            <Option key={ModelType.SOLAR_POWER_TOWER} value={ModelType.SOLAR_POWER_TOWER}>
              <img alt={'Heliostat'} width={24} src={HeliostatIcon} style={{ marginRight: '8px' }} />
              {i18n.t('shared.HeliostatElement', lang)}
            </Option>
          </Select>
        </Col>
      </Row>

      <Row gutter={6} style={{ paddingBottom: '4px' }}>
        <Col className="gutter-row" span={8}>
          {i18n.t('word.Publisher', lang)}:
        </Col>
        <Col className="gutter-row" span={16}>
          <Input
            maxLength={30}
            style={{ width: '100%' }}
            value={modelAuthor ?? ''}
            onKeyDown={(e) => {
              if (!REGEX_ALLOWABLE_IN_NAME.test(e.key)) {
                e.preventDefault();
                return false;
              }
            }}
            onChange={(e) => {
              setModelAuthor(e.target.value);
            }}
          />
        </Col>
      </Row>

      <Row gutter={6} style={{ paddingBottom: '4px' }}>
        <Col className="gutter-row" span={8}>
          {i18n.t('word.Label', lang)}:
        </Col>
        <Col className="gutter-row" span={16}>
          <Input
            maxLength={50}
            style={{ width: '100%' }}
            value={modelLabel ?? ''}
            onKeyDown={(e) => {
              if (!REGEX_ALLOWABLE_IN_NAME.test(e.key)) {
                e.preventDefault();
                return false;
              }
            }}
            onChange={(e) => {
              setModelLabel(e.target.value);
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
            value={modelDescription ?? ''}
            onChange={(e) => {
              setModelDescription(e.target.value);
            }}
          />
        </Col>
      </Row>
    </Modal>
  );
};

export default React.memo(ModelSiteDialog);
