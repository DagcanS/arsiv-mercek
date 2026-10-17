import React, { useMemo, useRef, useState } from 'react';

/**
 * Arşiv Mercek — Çok Serili, Boşluklara (null) Dayanıklı SVG Çizgi Grafiği
 * - series: [{ key, label, color, values: (number|null)[], dashed?, area?, width? }]
 * - xs: x ekseni değerleri (yıllar)
 * - pins: [{ x, label, color, sub? }] -> anomali / kırılma işaretleri
 * - refLines: [{ y, label, color }] -> referans çizgileri (örn: Nötr 0.0)
 * - yDomain: [min, max] isteğe bağlı sabit aralık
 * - height: SVG yüksekliği (varsayılan 270)
 * - yFormat: Değer biçimlendirici fonksiyon
 * - selectedX: Seçili yıl
 * - onSelectX: Yıl tıklama eylemi
 */
export default function LineChart({
  xs = [],
  series = [],
  pins = [],
  refLines = [],
  yDomain,
  height = 270,
  yFormat,
  selectedX,
  onSelectX,
}) {
  const width = 880;
  // 82px sol boşluk: 45.455 ppm gibi uzun etiketlerin kesilmesini kesinlikle önler
  const pad = { top: 34, right: 38, bottom: 42, left: 82 };
  const svgRef = useRef(null);
  const [hoverIdx, setHoverIdx] = useState(null);

  // 1. Dinamik Eksen Aralığı (yMin, yMax)
  const [yMin, yMax] = useMemo(() => {
    if (yDomain) return yDomain;
    const all = series.flatMap((s) => s.values).filter((v) => v !== null && v !== undefined && !isNaN(v));
    refLines.forEach((r) => all.push(r.y));
    if (!all.length) return [0, 1];

    const allLo = Math.min(...all);
    const allHi = Math.max(...all);
    let lo = allLo, hi = allHi;
    if (lo === hi) { lo -= 1; hi += 1; }
    const span = hi - lo;
    const m = span * 0.12;

    if (allLo >= 0) {
      // Tamamen pozitif veri (PPM sıklığı, yüzde, sayı) -> taban 0 olmalı
      return [0, hi + m];
    } else if (allHi <= 0) {
      // Tamamen negatif veri
      return [lo - m, 0];
    } else {
      // Hem negatif hem pozitif (Duygu skoru, Z-skoru) -> 0 çizgisi içeride olmalı
      return [lo - m, hi + m];
    }
  }, [series, refLines, yDomain]);

  if (!xs.length) {
    return <div className="chart-empty">Gösterilecek zaman serisi verisi bulunamadı.</div>;
  }

  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;
  const X = (x) => pad.left + (xMax === xMin ? cw / 2 : ((x - xMin) / (xMax - xMin)) * cw);
  const Y = (y) => pad.top + ch - ((y - yMin) / (yMax - yMin)) * ch;

  // Boşluklu (null) segmentlere ayırma
  const segments = (values) => {
    const segs = [];
    let cur = [];
    values.forEach((v, i) => {
      if (v === null || v === undefined || isNaN(v)) {
        if (cur.length) segs.push(cur);
        cur = [];
      } else {
        cur.push([X(xs[i]), Y(v)]);
      }
    });
    if (cur.length) segs.push(cur);
    return segs;
  };

  // Dinamik Izgara Çizgileri (Ticks)
  const ticks = useMemo(() => {
    if (yMin < 0 && yMax > 0) {
      // 0 çizgisi her zaman dahil edilsin
      const stepPos = yMax / 2;
      const stepNeg = Math.abs(yMin) / 2;
      return [yMin, yMin + stepNeg, 0, stepPos, yMax];
    }
    return Array.from({ length: 5 }, (_, i) => yMin + ((yMax - yMin) * i) / 4);
  }, [yMin, yMax]);

  const xLabelStep = Math.max(1, Math.ceil(xs.length / 12));

  // Değer Biçimlendirici
  const formatVal = (v) => {
    if (yFormat) return yFormat(v);
    if (typeof v === 'number') {
      if (Math.abs(v) >= 1000) {
        return Math.round(v).toLocaleString('tr-TR');
      }
      return v > 0 && yMin < 0 ? `+${v.toFixed(2)}` : v.toFixed(2);
    }
    return v;
  };

  const handleMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    let best = 0, bestD = Infinity;
    xs.forEach((x, i) => {
      const d = Math.abs(X(x) - px);
      if (d < bestD) { bestD = d; best = i; }
    });
    setHoverIdx(best);
  };

  // Sıralı Pinler (Çakışma önleyici)
  const sortedPins = useMemo(() => {
    return [...pins].filter(p => xs.includes(p.x)).sort((a, b) => a.x - b.x);
  }, [pins, xs]);

  // Taban Y Koordinatı (Area Fill için)
  const baselineY = yMin < 0 && yMax > 0 ? Y(0) : Y(yMin);

  return (
    <div className="chart-wrap">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="chart-svg"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
        onClick={() => hoverIdx !== null && onSelectX && onSelectX(xs[hoverIdx])}
        style={{ cursor: onSelectX ? 'pointer' : 'default' }}
      >
        {/* Yatay Izgara Çizgileri ve Eksen Değerleri */}
        {ticks.map((t, i) => {
          const isZero = Math.abs(t) < 0.0001;
          return (
            <g key={i}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={Y(t)}
                y2={Y(t)}
                stroke={isZero ? '#8E9896' : '#DCD9D1'}
                strokeDasharray={isZero ? 'none' : '3 3'}
                strokeWidth={isZero ? 1.5 : 1}
                strokeOpacity={isZero ? 0.9 : 0.7}
              />
              <text
                x={pad.left - 10}
                y={Y(t) + 4}
                className="chart-axis"
                textAnchor="end"
                fill={isZero ? '#202B30' : '#66716F'}
                fontWeight={isZero ? 600 : 400}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatVal(t)}
              </text>
            </g>
          );
        })}

        {/* Özel Referans Çizgileri */}
        {refLines.map((r, i) => (
          r.y >= yMin && r.y <= yMax && (
            <g key={`ref-${i}`}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={Y(r.y)}
                y2={Y(r.y)}
                stroke={r.color || '#527C9B'}
                strokeOpacity="0.7"
                strokeDasharray="5 3"
                strokeWidth="1.5"
              />
              <text
                x={width - pad.right}
                y={Y(r.y) - 6}
                className="chart-axis"
                textAnchor="end"
                fill={r.color || '#527C9B'}
                fontWeight="600"
              >
                {r.label}
              </text>
            </g>
          )
        ))}

        {/* Seçili Yıl Düşey Rehber Çizgisi */}
        {selectedX !== undefined && selectedX !== null && xs.includes(selectedX) && (
          <g>
            <line
              x1={X(selectedX)}
              x2={X(selectedX)}
              y1={pad.top}
              y2={pad.top + ch}
              stroke="#B96D55"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
            <circle
              cx={X(selectedX)}
              cy={pad.top + ch}
              r="4.5"
              fill="#B96D55"
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
          </g>
        )}

        {/* Hover Rehber Çizgisi */}
        {hoverIdx !== null && (
          <line
            x1={X(xs[hoverIdx])}
            x2={X(xs[hoverIdx])}
            y1={pad.top}
            y2={pad.top + ch}
            stroke="#176B68"
            strokeOpacity="0.55"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        )}

        {/* Seriler (Alan ve Çizgi) */}
        {series.map((s) => segments(s.values).map((seg, si) => (
          <g key={`${s.key}-${si}`}>
            {s.area && seg.length > 1 && (
              <path
                className="chart-area"
                d={`M ${seg[0][0]},${baselineY} L ${seg.map((p) => p.join(',')).join(' L ')} L ${seg[seg.length - 1][0]},${baselineY} Z`}
                fill={s.color}
                fillOpacity="0.12"
              />
            )}
            {seg.length > 1 && (
              <path
                className="chart-line"
                d={`M ${seg.map((p) => p.join(',')).join(' L ')}`}
                fill="none"
                stroke={s.color}
                strokeWidth={s.width || 2.6}
                strokeDasharray={s.dashed ? '6 4' : undefined}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {seg.map(([cx, cy], pi) => {
              const pointYear = xs[pi];
              const isPointSelected = selectedX === pointYear;
              const isPointHovered = hoverIdx === pi;
              return (
                <circle
                  key={pi}
                  cx={cx}
                  cy={cy}
                  r={isPointSelected || isPointHovered ? 5.5 : 3.5}
                  fill={isPointSelected ? '#B96D55' : s.color}
                  stroke="#FFFFFF"
                  strokeWidth={isPointSelected || isPointHovered ? 2.5 : 1.8}
                  className="chart-dot"
                />
              );
            })}
          </g>
        )))}

        {/* Anomali / Kırılma Pinleri (Staggered & Clamped) */}
        {sortedPins.map((p, i) => {
          const px = X(p.x);
          const isNearRight = px > width - 110;
          // Yakındaki pinlerle çakışmayı önlemek için düşey basamaklama
          const prevPin = i > 0 ? sortedPins[i - 1] : null;
          const isClose = prevPin && Math.abs(px - X(prevPin.x)) < 55;
          const labelY = pad.top + (isClose && i % 2 !== 0 ? 20 : 6);

          return (
            <g key={`pin-${i}`} className="chart-pin">
              <line
                x1={px}
                x2={px}
                y1={labelY + 8}
                y2={pad.top + ch}
                stroke={p.color || '#B96D55'}
                strokeWidth="1.5"
                strokeOpacity="0.8"
                strokeDasharray="2 2"
              />
              <polygon
                points={`${px - 5},${labelY - 5} ${px + 5},${labelY - 5} ${px},${labelY + 4}`}
                fill={p.color || '#B96D55'}
              />
              {p.label && (
                <g>
                  {/* Okunabilir hap arka planı */}
                  <rect
                    x={isNearRight ? px - 78 : px + 6}
                    y={labelY - 11}
                    width={72}
                    height={16}
                    rx={3}
                    fill="#FFFFFF"
                    fillOpacity="0.92"
                    stroke={p.color || '#B96D55'}
                    strokeWidth="0.8"
                  />
                  <text
                    x={isNearRight ? px - 42 : px + 42}
                    y={labelY + 1}
                    textAnchor="middle"
                    className="chart-axis"
                    fill={p.color || '#B96D55'}
                    fontWeight="700"
                    fontSize="10px"
                  >
                    {p.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* X Ekseni Yıl Etiketleri */}
        {xs.map((x, i) => {
          const isStep = i % xLabelStep === 0;
          const isSelected = x === selectedX;
          const isHovered = hoverIdx === i;
          if (!isStep && !isSelected && !isHovered) return null;

          return (
            <g key={x}>
              {isSelected && (
                <rect
                  x={X(x) - 20}
                  y={height - 23}
                  width={40}
                  height={18}
                  rx={3}
                  fill="#B96D55"
                />
              )}
              <text
                x={X(x)}
                y={height - 10}
                textAnchor="middle"
                className="chart-axis"
                fill={isSelected ? '#FFFFFF' : isHovered ? '#176B68' : '#66716F'}
                fontWeight={isSelected || isHovered ? 700 : 500}
                fontSize={isSelected ? '11px' : '10.5px'}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {x}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Hover Tooltip (Etkileşimli Veri Kartı) */}
      {hoverIdx !== null && (
        <div
          className="chart-tooltip"
          style={{
            left: `${Math.min(84, Math.max(16, (X(xs[hoverIdx]) / width) * 100))}%`,
          }}
        >
          <div className="chart-tooltip-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{xs[hoverIdx]} Yılı Kayıtları</span>
            {pins.some(p => p.x === xs[hoverIdx]) && (
              <span style={{ color: '#B96D55', fontSize: '0.72rem', fontWeight: 700 }}>
                ⚡ {pins.find(p => p.x === xs[hoverIdx])?.label}
              </span>
            )}
          </div>
          {series.map((s) => (
            <div key={s.key} className="chart-tooltip-row">
              <span className="chart-swatch" style={{ background: s.color }} />
              <span>{s.label}:</span>
              <strong>
                {s.values[hoverIdx] === null || s.values[hoverIdx] === undefined
                  ? 'Veri yok'
                  : formatVal(s.values[hoverIdx])}
              </strong>
            </div>
          ))}
          <div style={{ fontSize: '0.72rem', color: '#8E9896', marginTop: '6px', borderTop: '1px solid #ECEAE4', paddingTop: '4px' }}>
            {onSelectX ? 'Tıklayarak bu yılın gazete küpürlerini filtreleyin' : ''}
          </div>
        </div>
      )}

      {/* Lejant (Gösterge) */}
      <div className="chart-legend">
        {series.map((s) => (
          <span key={s.key} className="chart-legend-item">
            <span className="chart-swatch" style={{ background: s.color }} />
            <span>{s.label}</span>
          </span>
        ))}
        {selectedX && (
          <span className="chart-legend-item" style={{ color: '#B96D55', fontWeight: 600 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#B96D55', display: 'inline-block' }} />
            Filtrelenen Yıl: {selectedX}
          </span>
        )}
      </div>
    </div>
  );
}
