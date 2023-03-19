/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Checkbox, Input, InputNumber, Menu } from 'antd';
import SubMenu from 'antd/lib/menu/SubMenu';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { CommonStoreState, useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import i18n from '../../../i18n/i18n';
import { UndoableCheck } from '../../../undo/UndoableCheck';
import { PolygonModel } from '../../../models/PolygonModel';
import { Copy, Cut, Lock, Paste } from '../menuItems';
import { ObjectType, PolygonTexture } from '../../../types';
import PolygonLineColorSelection from './polygonLineColorSelection';
import PolygonFillColorSelection from './polygonFillColorSelection';
import PolygonTextureSelection from './polygonTextureSelection';
import SolarPanelLayoutWizard from './solarPanelLayoutWizard';
import PolygonLineStyleSelection from './polygonLineStyleSelection';
import PolygonLineWidthSelection from './polygonLineWidthSelection';
import SolarPanelArrayGaWizard from './solarPanelArrayGaWizard';
import SolarPanelArrayPsoWizard from './solarPanelArrayPsoWizard';
import PolygonOpacityInput from './polygonOpacityInput';
import { UndoableChange } from '../../../undo/UndoableChange';

export const PolygonMenu = React.memo(() => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const addUndoable = useStore(Selector.addUndoable);
  const elementsToPaste = useStore(Selector.elementsToPaste);
  const setApplyCount = useStore(Selector.setApplyCount);

  const polygon = useStore((state) =>
    state.elements.find((e) => e.selected && e.type === ObjectType.Polygon),
  ) as PolygonModel;

  const [textContent, setTextContent] = useState<string>(polygon?.text ?? '');
  const [textSize, setTextSize] = useState<number>(polygon?.fontSize ?? 1);
  const [textColor, setTextColor] = useState<string>(polygon?.fontColor ?? 'black');
  const [textOutlineColor, setTextOutlineColor] = useState<string>(polygon?.fontOutlineColor ?? 'white');
  const [textOutlineWidth, setTextOutlineWidth] = useState<number>(polygon?.fontOutlineWidth ?? 0);
  const [textStrokeColor, setTextStrokeColor] = useState<string>(polygon?.fontStrokeColor ?? 'black');
  const [textStrokeWidth, setTextStrokeWidth] = useState<number>(polygon?.fontStrokeWidth ?? 0);
  const [lineColorDialogVisible, setLineColorDialogVisible] = useState(false);
  const [lineStyleDialogVisible, setLineStyleDialogVisible] = useState(false);
  const [lineWidthDialogVisible, setLineWidthDialogVisible] = useState(false);
  const [fillColorDialogVisible, setFillColorDialogVisible] = useState(false);
  const [textureDialogVisible, setTextureDialogVisible] = useState(false);
  const [opacityDialogVisible, setOpacityDialogVisible] = useState(false);
  const [solarPanelLayoutWizardVisible, setSolarPanelLayoutWizardVisible] = useState(false);
  const [solarPanelLayoutGaWizardVisible, setSolarPanelLayoutGaWizardVisible] = useState(false);
  const [solarPanelLayoutPsoWizardVisible, setSolarPanelLayoutPsoWizardVisible] = useState(false);
  const lang = { lng: language };

  // be sure to get the updated parent so that this memorized element can move with it
  const parent = useStore((state) => {
    for (const e of state.elements) {
      if (e.id === polygon?.parentId) {
        return e;
      }
    }
  });

  if (!polygon || !parent) return null;

  const editable = !polygon?.locked;

  const updateFilledById = (id: string, filled: boolean) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Polygon && e.id === id) {
          (e as PolygonModel).filled = filled;
          break;
        }
      }
    });
  };

  const updateNoOutlineById = (id: string, noOutline: boolean) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Polygon && e.id === id) {
          (e as PolygonModel).noOutline = noOutline;
          break;
        }
      }
    });
  };

  const updateShininessById = (id: string, shininess: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Polygon && e.id === id) {
          (e as PolygonModel).shininess = shininess;
          break;
        }
      }
    });
  };

  const updateTextById = (id: string, value: string) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          if (!e.locked && e.type === ObjectType.Polygon) {
            (e as PolygonModel).text = value;
          }
          break;
        }
      }
    });
  };

  const updateFontSizeById = (id: string, value: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          if (!e.locked && e.type === ObjectType.Polygon) {
            (e as PolygonModel).fontSize = value;
          }
          break;
        }
      }
    });
  };

  const updateFontColorById = (id: string, value: string) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          if (!e.locked && e.type === ObjectType.Polygon) {
            (e as PolygonModel).fontColor = value;
          }
          break;
        }
      }
    });
  };

  const updateFontOutlineWidthById = (id: string, value: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          if (!e.locked && e.type === ObjectType.Polygon) {
            (e as PolygonModel).fontOutlineWidth = value;
          }
          break;
        }
      }
    });
  };

  const updateFontOutlineColorById = (id: string, value: string) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          if (!e.locked && e.type === ObjectType.Polygon) {
            (e as PolygonModel).fontOutlineColor = value;
          }
          break;
        }
      }
    });
  };

  const updateFontStrokeWidthById = (id: string, value: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          if (!e.locked && e.type === ObjectType.Polygon) {
            (e as PolygonModel).fontStrokeWidth = value;
          }
          break;
        }
      }
    });
  };

  const updateFontStrokeColorById = (id: string, value: string) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          if (!e.locked && e.type === ObjectType.Polygon) {
            (e as PolygonModel).fontStrokeColor = value;
          }
          break;
        }
      }
    });
  };

  const toggleFilled = (e: CheckboxChangeEvent) => {
    if (polygon) {
      const undoableCheck = {
        name: 'Fill Polygon',
        timestamp: Date.now(),
        checked: !polygon.filled,
        selectedElementId: polygon.id,
        selectedElementType: ObjectType.Polygon,
        undo: () => {
          updateFilledById(polygon.id, !undoableCheck.checked);
        },
        redo: () => {
          updateFilledById(polygon.id, undoableCheck.checked);
        },
      } as UndoableCheck;
      addUndoable(undoableCheck);
      updateFilledById(polygon.id, e.target.checked);
    }
  };

  const toggleNoOutline = (e: CheckboxChangeEvent) => {
    if (polygon) {
      const undoableCheck = {
        name: 'No Outline for Polygon',
        timestamp: Date.now(),
        checked: !polygon.noOutline,
        selectedElementId: polygon.id,
        selectedElementType: ObjectType.Polygon,
        undo: () => {
          updateNoOutlineById(polygon.id, !undoableCheck.checked);
        },
        redo: () => {
          updateNoOutlineById(polygon.id, undoableCheck.checked);
        },
      } as UndoableCheck;
      addUndoable(undoableCheck);
      updateNoOutlineById(polygon.id, e.target.checked);
    }
  };

  const toggleShiny = (e: CheckboxChangeEvent) => {
    if (polygon) {
      const shininess = 100;
      const undoableCheck = {
        name: 'Shiny Polygon',
        timestamp: Date.now(),
        checked: (polygon?.shininess ?? 0) > 0,
        selectedElementId: polygon.id,
        selectedElementType: ObjectType.Polygon,
        undo: () => {
          updateShininessById(polygon.id, undoableCheck.checked ? 0 : shininess);
        },
        redo: () => {
          updateShininessById(polygon.id, undoableCheck.checked ? shininess : 0);
        },
      } as UndoableCheck;
      addUndoable(undoableCheck);
      updateShininessById(polygon.id, e.target.checked ? shininess : 0);
    }
  };

  const changeText = () => {
    if (polygon) {
      const undoableChange = {
        name: 'Set Text for Polygon',
        timestamp: Date.now(),
        oldValue: polygon.text ?? '',
        newValue: textContent,
        changedElementId: polygon.id,
        changedElementType: ObjectType.Polygon,
        undo: () => {
          updateTextById(polygon.id, undoableChange.oldValue as string);
        },
        redo: () => {
          updateTextById(polygon.id, undoableChange.newValue as string);
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      updateTextById(polygon.id, textContent);
    }
  };

  const changeFontSize = () => {
    if (polygon) {
      const undoableChange = {
        name: 'Set Font Size for Polygon',
        timestamp: Date.now(),
        oldValue: polygon.fontSize ?? 1,
        newValue: textSize,
        changedElementId: polygon.id,
        changedElementType: ObjectType.Polygon,
        undo: () => {
          updateFontSizeById(polygon.id, undoableChange.oldValue as number);
        },
        redo: () => {
          updateFontSizeById(polygon.id, undoableChange.newValue as number);
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      updateFontSizeById(polygon.id, textSize);
    }
  };

  const changeFontColor = () => {
    if (polygon) {
      const undoableChange = {
        name: 'Set Font Color for Polygon',
        timestamp: Date.now(),
        oldValue: polygon.fontColor ?? 'black',
        newValue: textColor,
        changedElementId: polygon.id,
        changedElementType: ObjectType.Polygon,
        undo: () => {
          updateFontColorById(polygon.id, undoableChange.oldValue as string);
        },
        redo: () => {
          updateFontColorById(polygon.id, undoableChange.newValue as string);
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      updateFontColorById(polygon.id, textColor);
    }
  };

  const changeFontOutlineWidth = () => {
    if (polygon) {
      const undoableChange = {
        name: 'Set Font Outline Width for Polygon',
        timestamp: Date.now(),
        oldValue: polygon.fontOutlineWidth ?? 0,
        newValue: textOutlineWidth,
        changedElementId: polygon.id,
        changedElementType: ObjectType.Polygon,
        undo: () => {
          updateFontOutlineWidthById(polygon.id, undoableChange.oldValue as number);
        },
        redo: () => {
          updateFontOutlineWidthById(polygon.id, undoableChange.newValue as number);
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      updateFontOutlineWidthById(polygon.id, textOutlineWidth);
    }
  };

  const changeFontOutlineColor = () => {
    if (polygon) {
      const undoableChange = {
        name: 'Set Font Outline Color for Polygon',
        timestamp: Date.now(),
        oldValue: polygon.fontOutlineColor ?? 'white',
        newValue: textOutlineColor,
        changedElementId: polygon.id,
        changedElementType: ObjectType.Polygon,
        undo: () => {
          updateFontOutlineColorById(polygon.id, undoableChange.oldValue as string);
        },
        redo: () => {
          updateFontOutlineColorById(polygon.id, undoableChange.newValue as string);
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      updateFontOutlineColorById(polygon.id, textOutlineColor);
    }
  };

  const changeFontStrokeWidth = () => {
    if (polygon) {
      const undoableChange = {
        name: 'Set Font Stroke Width for Polygon',
        timestamp: Date.now(),
        oldValue: polygon.fontStrokeWidth ?? 0,
        newValue: textStrokeWidth,
        changedElementId: polygon.id,
        changedElementType: ObjectType.Polygon,
        undo: () => {
          updateFontStrokeWidthById(polygon.id, undoableChange.oldValue as number);
        },
        redo: () => {
          updateFontStrokeWidthById(polygon.id, undoableChange.newValue as number);
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      updateFontStrokeWidthById(polygon.id, textStrokeWidth);
    }
  };

  const changeFontStrokeColor = () => {
    if (polygon) {
      const undoableChange = {
        name: 'Set Font Stroke Color for Polygon',
        timestamp: Date.now(),
        oldValue: polygon.fontStrokeColor ?? 'black',
        newValue: textStrokeColor,
        changedElementId: polygon.id,
        changedElementType: ObjectType.Polygon,
        undo: () => {
          updateFontStrokeColorById(polygon.id, undoableChange.oldValue as string);
        },
        redo: () => {
          updateFontStrokeColorById(polygon.id, undoableChange.newValue as string);
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      updateFontStrokeColorById(polygon.id, textStrokeColor);
    }
  };

  const legalToPaste = () => {
    if (elementsToPaste && elementsToPaste.length > 0) {
      const e = elementsToPaste[0];
      if (
        e.type === ObjectType.Human ||
        e.type === ObjectType.Tree ||
        e.type === ObjectType.Polygon ||
        e.type === ObjectType.Sensor ||
        e.type === ObjectType.SolarPanel
      ) {
        return true;
      }
    }
    return false;
  };

  return (
    <Menu.ItemGroup>
      {legalToPaste() && <Paste keyName={'polygon-paste'} />}
      <Copy keyName={'polygon-copy'} />
      {editable && <Cut keyName={'polygon-cut'} />}
      {(parent?.type === ObjectType.Foundation || parent?.type === ObjectType.Cuboid) && (
        <SubMenu key={'layout'} title={i18n.t('polygonMenu.Layout', lang)} style={{ paddingLeft: '24px' }}>
          {solarPanelLayoutWizardVisible && (
            <SolarPanelLayoutWizard setDialogVisible={setSolarPanelLayoutWizardVisible} />
          )}
          <Menu.Item
            key={'solar-panel-layout'}
            onClick={() => {
              setApplyCount(0);
              setSolarPanelLayoutWizardVisible(true);
            }}
            style={{ paddingLeft: '36px' }}
          >
            {i18n.t('polygonMenu.SolarPanelArrayLayoutParametricDesign', lang)} ...
          </Menu.Item>
          <SubMenu
            key={'solar-panel-layout-ai'}
            title={i18n.t('polygonMenu.SolarPanelArrayLayoutGenerativeDesign', lang)}
            style={{ paddingLeft: '24px' }}
          >
            {solarPanelLayoutGaWizardVisible && (
              <SolarPanelArrayGaWizard setDialogVisible={setSolarPanelLayoutGaWizardVisible} />
            )}
            <Menu.Item
              key={'solar-panel-layout-ga'}
              onClick={() => {
                setApplyCount(0);
                setSolarPanelLayoutGaWizardVisible(true);
              }}
              style={{ paddingLeft: '36px' }}
            >
              {i18n.t('optimizationMenu.GeneticAlgorithm', lang)} ...
            </Menu.Item>
            {solarPanelLayoutPsoWizardVisible && (
              <SolarPanelArrayPsoWizard setDialogVisible={setSolarPanelLayoutPsoWizardVisible} />
            )}
            <Menu.Item
              key={'solar-panel-layout-pso'}
              onClick={() => {
                setApplyCount(0);
                setSolarPanelLayoutPsoWizardVisible(true);
              }}
              style={{ paddingLeft: '36px' }}
            >
              {i18n.t('optimizationMenu.ParticleSwarmOptimization', lang)} ...
            </Menu.Item>
          </SubMenu>
        </SubMenu>
      )}
      <Lock keyName={'polygon-lock'} />
      {editable && (
        <Menu.Item key={'polygon-filled'}>
          <Checkbox checked={!!polygon?.filled} onChange={toggleFilled}>
            {i18n.t('polygonMenu.Filled', lang)}
          </Checkbox>
        </Menu.Item>
      )}
      {editable && polygon.filled && (
        <Menu.Item key={'polygon-shiny'}>
          <Checkbox checked={(polygon?.shininess ?? 0) > 0} onChange={toggleShiny}>
            {i18n.t('polygonMenu.Shiny', lang)}
          </Checkbox>
        </Menu.Item>
      )}
      {editable && (
        <Menu.Item key={'polygon-no-outline'}>
          <Checkbox checked={!!polygon?.noOutline} onChange={toggleNoOutline}>
            {i18n.t('polygonMenu.NoOutline', lang)}
          </Checkbox>
        </Menu.Item>
      )}
      {editable && (
        <>
          {lineColorDialogVisible && <PolygonLineColorSelection setDialogVisible={setLineColorDialogVisible} />}
          <Menu.Item
            key={'polygon-line-color'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setLineColorDialogVisible(true);
            }}
          >
            {i18n.t('polygonMenu.LineColor', lang)} ...
          </Menu.Item>
          {lineStyleDialogVisible && <PolygonLineStyleSelection setDialogVisible={setLineStyleDialogVisible} />}
          <Menu.Item
            key={'polygon-line-style'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setLineStyleDialogVisible(true);
            }}
          >
            {i18n.t('polygonMenu.LineStyle', lang)} ...
          </Menu.Item>
          {lineWidthDialogVisible && <PolygonLineWidthSelection setDialogVisible={setLineWidthDialogVisible} />}
          <Menu.Item
            key={'polygon-line-width'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setLineWidthDialogVisible(true);
            }}
          >
            {i18n.t('polygonMenu.LineWidth', lang)} ...
          </Menu.Item>
        </>
      )}
      {editable && polygon.filled && (!polygon.textureType || polygon.textureType === PolygonTexture.NoTexture) && (
        <>
          {fillColorDialogVisible && <PolygonFillColorSelection setDialogVisible={setFillColorDialogVisible} />}
          <Menu.Item
            key={'polygon-fill-color'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setFillColorDialogVisible(true);
            }}
          >
            {i18n.t('polygonMenu.FillColor', lang)} ...
          </Menu.Item>
        </>
      )}
      {editable && polygon.filled && (
        <>
          {textureDialogVisible && <PolygonTextureSelection setDialogVisible={setTextureDialogVisible} />}
          <Menu.Item
            key={'polygon-texture'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setTextureDialogVisible(true);
            }}
          >
            {i18n.t('polygonMenu.FillTexture', lang)} ...
          </Menu.Item>
        </>
      )}
      {editable && polygon.filled && (
        <>
          {opacityDialogVisible && <PolygonOpacityInput setDialogVisible={setOpacityDialogVisible} />}
          <Menu.Item
            key={'polygon-opacity'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setOpacityDialogVisible(true);
            }}
          >
            {i18n.t('polygonMenu.Opacity', lang)} ...
          </Menu.Item>
        </>
      )}

      {editable && (
        <SubMenu key={'polygon-text'} title={i18n.t('polygonMenu.TextBox', lang)} style={{ paddingLeft: '24px' }}>
          {/*have to wrap the text field with a Menu so that it can stay open when the user types in it */}
          <Menu>
            {/* text */}
            <Menu.Item key={'polygon-text'} style={{ height: '36px', paddingLeft: '36px', marginTop: 10 }}>
              <Input
                addonBefore={i18n.t('word.Text', lang) + ':'}
                value={textContent}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTextContent(e.target.value)}
                onPressEnter={changeText}
                onBlur={changeText}
              />
            </Menu.Item>
            {/* font size */}
            <Menu.Item style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }} key={'polygon-font-size'}>
              <InputNumber
                addonBefore={i18n.t('word.FontSize', lang) + ':'}
                min={0.1}
                max={5}
                step={0.01}
                precision={2}
                value={textSize}
                onChange={(value) => setTextSize(value)}
                onPressEnter={changeFontSize}
                onBlur={changeFontSize}
              />
            </Menu.Item>
            {/* font color */}
            <Menu.Item style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }} key={'polygon-font-color'}>
              <Input
                addonBefore={i18n.t('word.FontColor', lang) + ':'}
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                onPressEnter={changeFontColor}
                onBlur={changeFontColor}
              />
            </Menu.Item>
            {/* font outline color */}
            <Menu.Item style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }} key={'polygon-font-outline-color'}>
              <Input
                addonBefore={i18n.t('polygonMenu.FontOutlineColor', lang) + ':'}
                value={textOutlineColor}
                onChange={(e) => setTextOutlineColor(e.target.value)}
                onPressEnter={changeFontOutlineColor}
                onBlur={changeFontOutlineColor}
              />
            </Menu.Item>
            {/* font outline width */}
            <Menu.Item style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }} key={'polygon-font-outline-width'}>
              <InputNumber
                addonBefore={i18n.t('polygonMenu.FontOutlineWidth', lang) + ':'}
                min={0}
                max={1}
                step={0.01}
                precision={2}
                value={textOutlineWidth}
                onChange={(value) => setTextOutlineWidth(value)}
                onPressEnter={changeFontOutlineWidth}
                onBlur={changeFontOutlineWidth}
              />
            </Menu.Item>
            {/* font stroke color */}
            <Menu.Item style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }} key={'polygon-font-stroke-color'}>
              <Input
                addonBefore={i18n.t('polygonMenu.FontStrokeColor', lang) + ':'}
                value={textStrokeColor}
                onChange={(e) => setTextStrokeColor(e.target.value)}
                onPressEnter={changeFontStrokeColor}
                onBlur={changeFontStrokeColor}
              />
            </Menu.Item>
            {/* font stroke width */}
            <Menu.Item style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }} key={'polygon-font-stroke-width'}>
              <InputNumber
                addonBefore={i18n.t('polygonMenu.FontStrokeWidth', lang) + ':'}
                min={0}
                max={1}
                step={0.01}
                precision={2}
                value={textStrokeWidth}
                onChange={(value) => setTextStrokeWidth(value)}
                onPressEnter={changeFontStrokeWidth}
                onBlur={changeFontStrokeWidth}
              />
            </Menu.Item>
          </Menu>
        </SubMenu>
      )}
    </Menu.ItemGroup>
  );
});
