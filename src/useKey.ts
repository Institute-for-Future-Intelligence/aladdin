/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { useEffect, useState } from 'react';

const useKey = (key: string) => {
  const [pressed, setPressed] = useState(false);

  const match = (e: KeyboardEvent) => key.toLowerCase() === e.key.toLowerCase();

  const onDown = (e: KeyboardEvent) => {
    if (match(e)) {
      setPressed(true);
    }
  };

  const onUp = (e: KeyboardEvent) => {
    if (match(e)) {
      setPressed(false);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  });
  return pressed;
};

export default useKey;
