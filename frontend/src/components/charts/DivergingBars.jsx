import React from 'react';

/**
 * Arşiv Mercek — İki Yönlü (Diverging) Çubuk Grafiği
 * Monroe Log-Odds Dirichlet Prior Z-skorları için:
 * Sol taraf (Negatif Z / Kiremit): İkinci grup / dönem
 * Sağ taraf (Pozitif Z / Petrol): Birinci grup / dönem
 * |Z| >= 1.96 olan terimler %95 düzeyinde istatistiksel olarak belirgindir.
 */
export default function DivergingBars({
  leftItems = [],
  rightItems = [],
  items = null,
  leftLabel = 'Grup B',
  rightLabel = 'Grup A',
  zThreshold = 1.96
}) {
  // Eğer tek bir `items` listesi geldiyse ayrıştır
  let lList = leftItems;
  let rList = rightItems;

  if (items && items.length > 0) {
    lList = items.filter(d => d.z < 0).sort((a, b) => a.z - b.z);
    rList = items.filter(d => d.z > 0).sort((a, b) => b.z - a.z);
  }

  const maxAbs = Math.max(
    zThreshold,
    ...lList.map(d => Math.abs(d.z || 0)),
    ...rList.map(d => Math.abs(d.z || 0))
  );

  const rowCount = Math.max(lList.length, rList.length);

  if (rowCount === 0) {
    return (
      <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Karşılaştırma için yeterli sözcük verisi bulunamadı.
      </div>
    );
  }

  const sigPct = (zThreshold / maxAbs) * 100;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      {/* Başlık ve Lejant */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        borderBottom: '1.5px solid var(--border-line)',
        paddingBottom: '10px',
        marginBottom: '12px'
      }}>
        <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.88rem', color: 'var(--accent-kiremit)' }}>
          &larr; {leftLabel}
        </div>
        <div style={{ textAlign: 'left', fontWeight: 700, fontSize: '0.88rem', color: 'var(--accent-petrol)' }}>
          {rightLabel} &rarr;
        </div>
      </div>

      {/* Satırlar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Array.from({ length: rowCount }).map((_, i) => {
          const leftItem = lList[i];
          const rightItem = rList[i];

          const leftZ = leftItem ? Math.abs(leftItem.z) : 0;
          const leftPct = (leftZ / maxAbs) * 100;
          const leftSig = leftZ >= zThreshold;

          const rightZ = rightItem ? Math.abs(rightItem.z) : 0;
          const rightPct = (rightZ / maxAbs) * 100;
          const rightSig = rightZ >= zThreshold;

          return (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24px',
                alignItems: 'center'
              }}
            >
              {/* Sol Taraf (Kiremit / Negatif Z) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                {leftItem ? (
                  <>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      Z = {leftItem.z.toFixed(2)}
                    </span>
                    <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {leftItem.term}
                    </span>
                    {/* Çubuk */}
                    <div style={{
                      width: '140px',
                      height: '14px',
                      background: '#FAF8F4',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '3px',
                      position: 'relative',
                      display: 'flex',
                      justifyContent: 'flex-end',
                      overflow: 'hidden'
                    }}>
                      <div
                        style={{
                          width: `${leftPct}%`,
                          height: '100%',
                          background: 'var(--accent-kiremit)',
                          borderRight: leftSig ? '2px solid #FFFFFF' : 'none'
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <div style={{ height: '14px' }} />
                )}
              </div>

              {/* Sağ Taraf (Petrol / Pozitif Z) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '10px' }}>
                {rightItem ? (
                  <>
                    {/* Çubuk */}
                    <div style={{
                      width: '140px',
                      height: '14px',
                      background: '#FAF8F4',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '3px',
                      position: 'relative',
                      display: 'flex',
                      justifyContent: 'flex-start',
                      overflow: 'hidden'
                    }}>
                      <div
                        style={{
                          width: `${rightPct}%`,
                          height: '100%',
                          background: 'var(--accent-petrol)',
                          borderLeft: rightSig ? '2px solid #FFFFFF' : 'none'
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {rightItem.term}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      Z = +{rightItem.z.toFixed(2)}
                    </span>
                  </>
                ) : (
                  <div style={{ height: '14px' }} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Alt Dipnot */}
      <div style={{
        marginTop: '16px',
        paddingTop: '10px',
        borderTop: '1px dashed var(--border-line)',
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
        textAlign: 'center'
      }}>
        İki yönlü çubuklar |Z| &ge; {zThreshold} değerinde %95 güven düzeyinde (p &lt; 0.05) anlamlı kabul edilir.
      </div>
    </div>
  );
}
