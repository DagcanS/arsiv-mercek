import React from 'react';

/**
 * Arşiv Mercek Logo İkonu:
 * Daire (mercek), içindeki gazete sütun çizgileri ve incelenen dönemi/odağı temsil eden kiremit rengi odak noktası.
 */
export default function ArsivMercekLogo({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Arşiv Mercek Logo"
    >
      {/* Mercek Dış Çemberi (Petrol) */}
      <circle
        cx="16"
        cy="16"
        r="12.5"
        stroke="#176B68"
        strokeWidth="2.5"
      />
      {/* Mercek Sapı / Zaman Ekseni Uzantısı */}
      <path
        d="M25 25L32 32"
        stroke="#176B68"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Gazete Sütun Çizgisi 1 */}
      <line
        x1="10"
        y1="11.5"
        x2="22"
        y2="11.5"
        stroke="#66716F"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Gazete Sütun Çizgisi 2 (Kısmi) */}
      <line
        x1="10"
        y1="16"
        x2="17"
        y2="16"
        stroke="#66716F"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Gazete Sütun Çizgisi 3 */}
      <line
        x1="10"
        y1="20.5"
        x2="20"
        y2="20.5"
        stroke="#66716F"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Aranan Terimi / Odak Dönemi Temsil Eden Küçük Nokta (Kiremit) */}
      <circle
        cx="20.5"
        cy="16"
        r="2"
        fill="#B96D55"
      />
    </svg>
  );
}
