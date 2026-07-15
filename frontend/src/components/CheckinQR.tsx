'use client';
import { QRCodeSVG } from 'qrcode.react';

// Renders the camper's reference code as a QR code the check-in station scans.
export default function CheckinQR({ value, size = 130 }: { value: string; size?: number }) {
  if (!value) return null;
  return (
    <QRCodeSVG
      value={value}
      size={size}
      level="M"
      marginSize={2}
      bgColor="#ffffff"
      fgColor="#301317"
    />
  );
}
