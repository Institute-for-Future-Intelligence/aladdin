/*
 * @Copyright 2024. Institute for Future Intelligence, Inc.
 *
 * House Print Preview — breaks a building into its planar pieces and lays
 * them flat for printing, analogous to jaladdin's PrintController +
 * Roof.flatten() + MeshLib.groupByPlanar() pipeline.
 */

import React, { useMemo, useRef, useState } from 'react';
import { Button, Modal } from 'antd';
import { PrinterOutlined, CloseOutlined } from '@ant-design/icons';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from 'src/stores/common';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { useDataStore } from 'src/stores/commonData';
import * as Selector from 'src/stores/selector';
import { ObjectType } from 'src/types';
import { collectBuildingPieces, PrintPiece } from 'src/analysis/houseDecomposer';

// ─── layout constants ────────────────────────────────────────────────────────
const SVG_WIDTH = 900; // SVG canvas width (px)
const PADDING = 24; // outer margin
const GAP = 36; // gap between pieces
const MAX_PIECE_PX = 180; // cap on the largest piece's longest dimension (px)
const LABEL_H = 28; // height reserved below each piece for its label

// ─── types ───────────────────────────────────────────────────────────────────
interface PlacedPiece {
  piece: PrintPiece;
  x: number; // top-left x in SVG space
  y: number; // top-left y in SVG space
  scale: number; // px-per-meter for this piece
  pxW: number; // rendered width
  pxH: number; // rendered height
}

// ─── layout helpers ──────────────────────────────────────────────────────────

/**
 * Compute one uniform scale (px/m) for all pieces so they share the same
 * real-world ratio — analogous to jaladdin's world-space coordinate system
 * where all pieces exist at the same scale before flattening.
 * The scale is chosen so the largest piece's longest side fits MAX_PIECE_PX.
 */
function computeUniformScale(pieces: PrintPiece[]): number {
  let maxDim = 0;
  for (const p of pieces) {
    maxDim = Math.max(maxDim, p.boundWidth, p.boundHeight);
  }
  if (maxDim <= 0) return 1;
  return MAX_PIECE_PX / maxDim;
}

/**
 * Greedy shelf packing — place pieces left-to-right, new row when the
 * current row overflows, similar to jaladdin's computePrintCenters().
 */
function layoutPieces(pieces: PrintPiece[]): { placed: PlacedPiece[]; totalHeight: number } {
  const placed: PlacedPiece[] = [];
  const availableWidth = SVG_WIDTH - PADDING * 2;
  const scale = computeUniformScale(pieces);

  let rowX = PADDING;
  let rowY = PADDING + 20; // leave room for title
  let rowMaxH = 0;

  for (const piece of pieces) {
    const pxW = Math.max(piece.boundWidth * scale, 4);
    const pxH = Math.max(piece.boundHeight * scale, 4);
    const slotH = pxH + LABEL_H;

    if (rowX + pxW > PADDING + availableWidth && rowX > PADDING) {
      // wrap to next row
      rowY += rowMaxH + GAP;
      rowX = PADDING;
      rowMaxH = 0;
    }

    placed.push({ piece, x: rowX, y: rowY, scale: scale, pxW, pxH });
    rowX += pxW + GAP;
    rowMaxH = Math.max(rowMaxH, slotH);
  }

  return { placed, totalHeight: rowY + rowMaxH + PADDING };
}

// ─── SVG piece renderer ──────────────────────────────────────────────────────

function PieceSVG({ pp }: { pp: PlacedPiece }) {
  const { piece, x, y, scale, pxW, pxH } = pp;

  const fillColor = piece.type === 'roof' ? '#ddeeff' : piece.type === 'floor' ? '#f5e6c8' : '#eef5dd';
  const strokeColor = piece.type === 'roof' ? '#3366aa' : piece.type === 'floor' ? '#aa7733' : '#336633';

  // Build SVG polygon points string from 2D vertices (scale and offset into local slot)
  const polyPoints = piece.vertices.map(([vx, vy]) => `${x + vx * scale},${y + pxH - vy * scale}`).join(' ');

  // Dimension labels
  const wLabel = piece.boundWidth.toFixed(2) + ' m';
  const hLabel = piece.boundHeight.toFixed(2) + ' m';
  const midX = x + pxW / 2;
  const midY = y + pxH / 2;

  return (
    <g>
      {/* piece fill */}
      <polygon points={polyPoints} fill={fillColor} stroke={strokeColor} strokeWidth={1.5} />

      {/* width dimension (bottom) */}
      <line x1={x} y1={y + pxH + 4} x2={x + pxW} y2={y + pxH + 4} stroke="#666" strokeWidth={0.8} />
      <line x1={x} y1={y + pxH + 2} x2={x} y2={y + pxH + 6} stroke="#666" strokeWidth={0.8} />
      <line x1={x + pxW} y1={y + pxH + 2} x2={x + pxW} y2={y + pxH + 6} stroke="#666" strokeWidth={0.8} />
      <text x={midX} y={y + pxH + 13} fontSize={9} fill="#444" textAnchor="middle">
        {wLabel}
      </text>

      {/* height dimension (right side) — only if meaningful height */}
      {piece.boundHeight > 0.01 && (
        <>
          <line x1={x + pxW + 4} y1={y} x2={x + pxW + 4} y2={y + pxH} stroke="#666" strokeWidth={0.8} />
          <line x1={x + pxW + 2} y1={y} x2={x + pxW + 6} y2={y} stroke="#666" strokeWidth={0.8} />
          <line x1={x + pxW + 2} y1={y + pxH} x2={x + pxW + 6} y2={y + pxH} stroke="#666" strokeWidth={0.8} />
          <text
            x={x + pxW + 16}
            y={midY + 4}
            fontSize={9}
            fill="#444"
            textAnchor="middle"
            transform={`rotate(-90,${x + pxW + 16},${midY + 4})`}
          >
            {hLabel}
          </text>
        </>
      )}

      {/* piece label */}
      <text x={midX} y={y + pxH + LABEL_H} fontSize={10} fill="#222" textAnchor="middle" fontWeight="bold">
        {piece.label}
      </text>
    </g>
  );
}

// ─── main modal component ────────────────────────────────────────────────────

const HousePrintPreview = React.memo(() => {
  const showPreview = usePrimitiveStore((s) => s.showHousePrintPreview);
  const elements = useStore(Selector.elements);
  const roofSegmentVerticesMap = useDataStore((s) => s.roofSegmentVerticesMap);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);

  const onStart = (_event: DraggableEvent, uiData: DraggableData) => {
    if (dragRef.current) {
      const { clientWidth, clientHeight } = window.document.documentElement;
      const targetRect = dragRef.current.getBoundingClientRect();
      setBounds({
        left: -targetRect.left + uiData.x,
        right: clientWidth - (targetRect.right - targetRect.left) - targetRect.left + uiData.x,
        top: -targetRect.top + uiData.y,
        bottom: clientHeight - (targetRect.bottom - targetRect.top) - targetRect.top + uiData.y,
      });
    }
  };

  const pieces = useMemo(() => {
    const foundationIds = [...new Set(elements.filter((e) => e.type === ObjectType.Foundation).map((e) => e.id))];
    return foundationIds.flatMap((fid) => collectBuildingPieces(fid, elements, roofSegmentVerticesMap));
  }, [elements, roofSegmentVerticesMap]);

  const { placed, totalHeight } = useMemo(() => layoutPieces(pieces), [pieces]);

  const handleClose = () => {
    usePrimitiveStore.getState().set((state) => {
      state.showHousePrintPreview = false;
    });
  };

  const handlePrint = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
      win.onload = () => {
        win.print();
        URL.revokeObjectURL(url);
      };
    }
  };

  if (!showPreview) return null;

  return (
    <Modal
      title={
        <div
          style={{ width: '100%', cursor: 'move' }}
          onMouseOver={() => setDragEnabled(true)}
          onMouseOut={() => setDragEnabled(false)}
        >
          Print House Pieces
        </div>
      }
      open={showPreview}
      onCancel={handleClose}
      width={SVG_WIDTH + 60}
      footer={[
        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
          Print
        </Button>,
        <Button key="close" icon={<CloseOutlined />} onClick={handleClose}>
          Close
        </Button>,
      ]}
      style={{ top: 20 }}
      styles={{ body: { padding: '8px 4px', overflowY: 'auto', maxHeight: '80vh' } }}
      modalRender={(modal) => (
        <Draggable nodeRef={dragRef} disabled={!dragEnabled} bounds={bounds} onStart={onStart}>
          <div ref={dragRef}>{modal}</div>
        </Draggable>
      )}
    >
      {pieces.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>
          No building found. Add a foundation with walls and a roof first.
        </div>
      ) : (
        <svg
          ref={svgRef}
          width={SVG_WIDTH}
          height={totalHeight}
          style={{ display: 'block', background: '#fff', border: '1px solid #ddd' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* background */}
          <rect width={SVG_WIDTH} height={totalHeight} fill="white" />

          {/* title */}
          <text x={SVG_WIDTH / 2} y={16} fontSize={13} fill="#333" textAnchor="middle" fontWeight="bold">
            House Pieces — {pieces.length} part{pieces.length !== 1 ? 's' : ''}
          </text>

          {/* pieces */}
          {placed.map((pp) => (
            <PieceSVG key={pp.piece.id} pp={pp} />
          ))}
        </svg>
      )}
    </Modal>
  );
});

export default HousePrintPreview;
