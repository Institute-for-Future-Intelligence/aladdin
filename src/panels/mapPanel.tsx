/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import styled from 'styled-components';
import { Space, Switch } from 'antd';
import GroundMap from '../components/groundMap';
import { StandaloneSearchBox, useJsApiLoader } from '@react-google-maps/api';
import { Libraries } from '@react-google-maps/api/dist/utils/make-load-script-url';
import Spinner from '../components/spinner';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import 'antd/dist/reset.css';
import i18n from '../i18n/i18n';
import { UndoableChangeLocation } from '../undo/UndoableChangeLocation';
import { UndoableCheck } from '../undo/UndoableCheck';
import { Undoable } from '../undo/Undoable';
import { LAT_LNG_FRACTION_DIGITS, Z_INDEX_FRONT_PANEL } from '../constants';
import { turnOffisualization } from './panelUtils';

const libraries = ['places'] as Libraries;

const Container = styled.div`
  position: fixed;
  top: 40px;
  left: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 10;
`;

const ColumnWrapper = styled.div`
  background-color: #f8f8f8;
  position: absolute;
  left: 0;
  top: 0;
  width: 410px;
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
  overflow-y: auto;
  resize: both;
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

const MapPanel = () => {
  const language = useStore(Selector.language);
  const setCommonStore = useStore(Selector.set);
  const addUndoable = useStore(Selector.addUndoable);
  const address = useStore(Selector.world.address);
  const latitude = useStore(Selector.world.latitude);
  const longitude = useStore(Selector.world.longitude);
  const mapPanelX = useStore(Selector.viewState.mapPanelX);
  const mapPanelY = useStore(Selector.viewState.mapPanelY);
  const groundImage = useStore(Selector.viewState.groundImage);
  const mapZoom = useStore(Selector.viewState.mapZoom);
  const selectedFloatingWindow = useStore(Selector.selectedFloatingWindow);

  // nodeRef is to suppress ReactDOM.findDOMNode() deprecation warning. See:
  // https://github.com/react-grid-layout/react-draggable/blob/v4.4.2/lib/DraggableCore.js#L159-L171
  const nodeRef = React.useRef(null);

  const searchBox = useRef<google.maps.places.SearchBox>();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : 460;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 40 : 600;
  const [curPosition, setCurPosition] = useState({
    x: isNaN(mapPanelX) ? 0 : Math.min(mapPanelX, window.innerWidth - wOffset),
    y: isNaN(mapPanelY) ? 0 : Math.min(mapPanelY, window.innerHeight - hOffset),
  });
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const lang = { lng: language };

  // when the window is resized (the code depends on where the panel is originally anchored in the CSS)
  useEffect(() => {
    const handleResize = () => {
      setCurPosition({
        x: Math.min(mapPanelX, window.innerWidth - wOffset),
        y: Math.min(mapPanelY, window.innerHeight - hOffset),
      });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_MAPS_API_KEY as string,
    libraries: libraries,
  });

  const onPlacesChanged = () => {
    const places = searchBox.current?.getPlaces();
    if (places && places.length > 0) {
      const geometry = places[0].geometry;
      if (geometry && geometry.location) {
        const undoableChangeLocation = {
          name: 'Set Location',
          timestamp: Date.now(),
          oldLatitude: latitude,
          newLatitude: geometry.location.lat(),
          oldLongitude: longitude,
          newLongitude: geometry.location.lng(),
          oldAddress: address,
          newAddress: places[0].formatted_address as string,
          undo: () => {
            setCommonStore((state) => {
              state.world.latitude = undoableChangeLocation.oldLatitude;
              state.world.longitude = undoableChangeLocation.oldLongitude;
              state.world.address = undoableChangeLocation.oldAddress;
            });
            turnOffisualization();
            setUpdateFlag(!updateFlag);
          },
          redo: () => {
            setCommonStore((state) => {
              state.world.latitude = undoableChangeLocation.newLatitude;
              state.world.longitude = undoableChangeLocation.newLongitude;
              state.world.address = undoableChangeLocation.newAddress;
            });
            turnOffisualization();
            setUpdateFlag(!updateFlag);
          },
        } as UndoableChangeLocation;
        addUndoable(undoableChangeLocation);
        turnOffisualization();
        setCommonStore((state) => {
          if (geometry.location) {
            state.world.latitude = geometry.location.lat();
            state.world.longitude = geometry.location.lng();
          }
          if (places[0]) {
            state.world.address = places[0].formatted_address as string;
            if (places[0].address_components) {
              for (const a of places[0].address_components) {
                if (a.types[0] === 'country') {
                  state.world.countryCode = a.short_name;
                  break;
                }
              }
            }
          }
        });
      }
    }
  };

  const onLoad = (s: google.maps.places.SearchBox) => {
    searchBox.current = s;
  };

  const onDrag: DraggableEventHandler = (e, ui) => {
    setCurPosition({
      x: Math.min(ui.x, window.innerWidth - wOffset),
      y: Math.min(ui.y, window.innerHeight - hOffset),
    });
  };

  const onDragEnd: DraggableEventHandler = (e, ui) => {
    setCommonStore((state) => {
      state.viewState.mapPanelX = Math.min(ui.x, window.innerWidth - wOffset);
      state.viewState.mapPanelY = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    const undoable = {
      name: 'Close Maps',
      timestamp: Date.now(),
      undo: () => {
        setCommonStore((state) => {
          state.viewState.showMapPanel = true;
        });
      },
      redo: () => {
        setCommonStore((state) => {
          state.viewState.showMapPanel = false;
        });
      },
    } as Undoable;
    addUndoable(undoable);
    setCommonStore((state) => {
      state.viewState.showMapPanel = false;
    });
  };

  return (
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
          state.selectedFloatingWindow = 'mapPanel';
        });
      }}
    >
      <Container ref={nodeRef} style={{ zIndex: selectedFloatingWindow === 'mapPanel' ? Z_INDEX_FRONT_PANEL : 10 }}>
        <ColumnWrapper ref={wrapperRef}>
          <Header className="handle">
            <span>{i18n.t('word.Location', lang)}</span>
            <span
              style={{ cursor: 'pointer' }}
              onTouchStart={() => {
                closePanel();
              }}
              onMouseDown={() => {
                closePanel();
              }}
            >
              {i18n.t('word.Close', lang)}
            </span>
          </Header>
          <Space direction={'vertical'}>
            <Space style={{ paddingTop: '10px' }} align={'center'} size={20}>
              <Space direction={'horizontal'}>
                <Space>{i18n.t('mapPanel.ImageOnGround', lang) + ':'}</Space>
                <Switch
                  title={'Show ground image'}
                  checked={groundImage}
                  onChange={(checked) => {
                    const undoableCheck = {
                      name: 'Show Ground Image',
                      timestamp: Date.now(),
                      checked: checked,
                      undo: () => {
                        setCommonStore((state) => {
                          state.viewState.groundImage = !undoableCheck.checked;
                        });
                      },
                      redo: () => {
                        setCommonStore((state) => {
                          state.viewState.groundImage = undoableCheck.checked;
                        });
                      },
                    } as UndoableCheck;
                    addUndoable(undoableCheck);
                    setCommonStore((state) => {
                      state.viewState.groundImage = checked;
                    });
                  }}
                />
              </Space>
            </Space>
            {isLoaded && (
              <Space>
                <div>
                  <StandaloneSearchBox onLoad={onLoad} onPlacesChanged={onPlacesChanged}>
                    <input
                      type="text"
                      placeholder={address}
                      style={{
                        boxSizing: `border-box`,
                        border: `1px solid transparent`,
                        width: `400px`,
                        height: `32px`,
                        padding: `0 12px`,
                        borderRadius: `3px`,
                        boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`,
                        fontSize: `14px`,
                        outline: `none`,
                        textOverflow: `ellipses`,
                        position: 'relative',
                      }}
                    />
                  </StandaloneSearchBox>
                </div>
              </Space>
            )}
            {isLoaded ? (
              <Space>
                <div>
                  <GroundMap width={400} height={400} />
                  <p style={{ paddingTop: '10px', fontSize: '12px' }}>
                    {i18n.t('mapPanel.Coordinates', lang) + ':'} (
                    {Math.abs(latitude).toFixed(LAT_LNG_FRACTION_DIGITS) + (latitude > 0 ? '°N' : '°S')},{' '}
                    {Math.abs(longitude).toFixed(LAT_LNG_FRACTION_DIGITS) + (longitude > 0 ? '°E' : '°W')}), &nbsp;
                    {i18n.t('mapPanel.Zoom', lang) + ':'} {mapZoom}
                  </p>
                </div>
              </Space>
            ) : (
              <Spinner />
            )}
            {loadError && (
              <Space>
                <div>Map cannot be loaded right now, sorry.</div>
              </Space>
            )}
          </Space>
        </ColumnWrapper>
      </Container>
    </ReactDraggable>
  );
};

export default React.memo(MapPanel);
