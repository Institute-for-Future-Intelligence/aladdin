import React from 'react';
import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { HALF_PI } from 'src/constants';
import { CanvasTexture, FrontSide, RepeatWrapping } from 'three';

export interface BatteryStorageMaterialRef {
  update: (lx: number, ly: number, lz: number) => void;
}

interface Props {
  lx: number;
  ly: number;
  lz: number;
  color: string;
}

const drawLineTexture = () => {
  const canvas = document.createElement('canvas') as HTMLCanvasElement;
  [canvas.width, canvas.height] = [100, 150];

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 100, 150);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(0, 25);
    ctx.lineTo(0, 125);
    ctx.moveTo(100, 25);
    ctx.lineTo(100, 125);
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(25, 50);
    ctx.lineTo(75, 50);
    ctx.moveTo(25, 60);
    ctx.lineTo(75, 60);
    ctx.moveTo(25, 70);
    ctx.lineTo(75, 70);
    ctx.moveTo(25, 80);
    ctx.lineTo(75, 80);
    ctx.moveTo(25, 90);
    ctx.lineTo(75, 90);
    ctx.moveTo(25, 100);
    ctx.lineTo(75, 100);
    ctx.stroke();
  }

  return new CanvasTexture(canvas);
};

const drawSparkTexture = (width: number, height: number) => {
  const canvas = document.createElement('canvas') as HTMLCanvasElement;
  [canvas.width, canvas.height] = [300 * width, 300 * height];

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 300 * width, 300 * height);

    ctx.lineWidth = 8;
    ctx.strokeStyle = 'blue';

    // circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 130, 0, 2 * Math.PI);
    ctx.stroke();

    // flash
    ctx.beginPath();
    ctx.moveTo(centerX + 10, centerY - 100); // top
    ctx.lineTo(centerX - 40, centerY + 15); // left
    ctx.lineTo(centerX - 3, centerY + 15); //
    ctx.lineTo(centerX - 10, centerY + 100); // bot
    ctx.lineTo(centerX + 40, centerY - 10); // right
    ctx.lineTo(centerX + 3, centerY - 10); //
    ctx.closePath();

    ctx.lineWidth = 8;
    ctx.stroke();
  }

  return new CanvasTexture(canvas);
};

const Material = React.memo(
  forwardRef<BatteryStorageMaterialRef, Props>(({ lx, ly, lz, color }, ref) => {
    const lineTexture = useMemo(() => {
      const t = drawLineTexture();
      t.wrapS = RepeatWrapping;
      t.repeat.set(Math.max(1, Math.round(lx / 1.5)), 1);
      return t;
    }, []);

    const handleSparkTexture = (ly: number, lz: number) => {
      const t = drawSparkTexture(ly, lz);
      t.wrapS = RepeatWrapping;
      t.wrapT = RepeatWrapping;
      t.repeat.set(1, 1);
      t.rotation = HALF_PI;
      return t;
    };

    const [sparkTexture, setSparkTexture] = useState(handleSparkTexture(ly, lz));

    useImperativeHandle(ref, () => ({
      update(lx, ly, lz) {
        lineTexture.repeat.setX(Math.max(1, Math.round(lx / 1.5)));
        setSparkTexture(handleSparkTexture(ly, lz));
      },
    }));

    return (
      <>
        <meshStandardMaterial side={FrontSide} attach={`material-0`} color={color} map={sparkTexture} />
        <meshStandardMaterial side={FrontSide} attach={`material-1`} color={color} map={sparkTexture} />
        <meshStandardMaterial side={FrontSide} attach={`material-2`} color={color} map={lineTexture} />
        <meshStandardMaterial side={FrontSide} attach={`material-3`} color={color} map={lineTexture} />
        <meshStandardMaterial side={FrontSide} attach={`material-4`} color={color} />
        <meshStandardMaterial side={FrontSide} attach={`material-5`} color={color} />
      </>
    );
  }),
);

export default Material;
