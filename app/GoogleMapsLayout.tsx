"use client";

import { GoogleMapsProvider } from '../utils/googleMapsContext';

export default function GoogleMapsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GoogleMapsProvider>{children}</GoogleMapsProvider>;
}
