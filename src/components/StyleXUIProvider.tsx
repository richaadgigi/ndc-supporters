'use client';

import { useEffect } from 'react';
import { apply } from '@richaadgigi/stylexui';
import "@richaadgigi/stylexui/css/xui.min.css";

export default function StyleXuiProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    apply();
  }, []);

  return children;
}   