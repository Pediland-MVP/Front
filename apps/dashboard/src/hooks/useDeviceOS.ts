'use client';

import { useEffect, useState } from 'react';

export type DeviceOS = 'android' | 'ios' | 'other';

export function detectDeviceOS(userAgent: string): DeviceOS {
  if (/android/i.test(userAgent)) return 'android';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios';
  return 'other';
}

export function useDeviceOS(): DeviceOS {
  const [os, setOs] = useState<DeviceOS>('other');

  useEffect(() => {
    setOs(detectDeviceOS(navigator.userAgent));
  }, []);

  return os;
}
