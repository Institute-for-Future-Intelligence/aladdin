/*
 * @Copyright 2023-2024. Institute for Future Intelligence, Inc.
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { throttle } from 'lodash';

interface SplitPaneProps {
  showGallery: boolean;
  children: [React.ReactNode, React.ReactNode];
  defaultSize?: number; // left side: 0 - 100 %
  minWidth?: number; // left side: 0 - 100 %
  maxWidth?: number; // left side: 0 - 100 %
  wait?: number; // throttle wait time
  onChange?: (size: number) => void;
}

const SplitPane = React.memo(
  ({ showGallery, defaultSize = 50, minWidth = 25, maxWidth = 75, children, wait = 50, onChange }: SplitPaneProps) => {
    const [leftChild, rightChild] = children;
    const pointerDownRef = useRef(false);

    const updateCSSPercentWidth = (pos: number) => {
      const sp = document.querySelector('.split-pane') as any;
      if (sp) {
        sp.style.setProperty('--percentWidth', pos + '%');
      }
    };

    const handlePointerDown = () => {
      pointerDownRef.current = true;
    };

    const handlePointerMove = useCallback(
      throttle((e: React.PointerEvent<HTMLDivElement>) => {
        if (!pointerDownRef.current) return;

        const percentWidth = Math.max(minWidth, Math.min(maxWidth, (e.clientX / window.innerWidth) * 100));
        updateCSSPercentWidth(percentWidth);

        if (onChange) {
          onChange(percentWidth);
        }
      }, wait),
      [],
    );

    useEffect(() => {
      updateCSSPercentWidth(defaultSize);
    }, [defaultSize]);

    useEffect(() => {
      const handlePointerUp = () => {
        pointerDownRef.current = false;
      };
      window.addEventListener('pointerup', handlePointerUp);
      return () => window.removeEventListener('pointerup', handlePointerUp);
    }, []);

    useEffect(() => {
      if (!showGallery) {
        updateCSSPercentWidth(0);
      } else {
        updateCSSPercentWidth(defaultSize);
      }
    }, [showGallery, defaultSize]);

    return (
      <div className="split-pane" onPointerMove={handlePointerMove}>
        <div className="left-child">{leftChild}</div>
        {showGallery && <div className="sash" onPointerDown={handlePointerDown} />}
        <div className="right-child">{rightChild}</div>
      </div>
    );
  },
  (prev, next) => {
    return prev.showGallery === next.showGallery && prev.onChange === next.onChange;
  },
);

export default SplitPane;
