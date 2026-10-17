import React, { useMemo } from 'react';
import { FileText, Calendar, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function MetricCards({ stats, dualAxisData }) {
  if (!stats) return null;

  const { total_articles, year_range, averages } = stats;
  const sentimentScore = averages?.sentiment || 0;
  const crisisScore = averages?.crisis_intensity || 0;

  // Çift eksenli zaman serisinden dinamik ortalamalar
  const { avgHalkDuygu, avgDirenis, avgKriz } = useMemo(() => {
    const list = dualAxisData?.timeline || [];
    if (!list.length) {
      return {
        avgHalkDuygu: sentimentScore,
        avgDirenis: 0,
        avgKriz: crisisScore
      };
    }
    const halkList = list.filter(t => t.halk_odakli_duygu !== null && t.halk_odakli_duygu !== undefined);
    const direnisList = list.filter(t => t.direnis_dinamizmi !== null && t.direnis_dinamizmi !== undefined);
    const krizList = list.filter(t => t.yapisal_kriz_yuku !== null && t.yapisal_kriz_yuku !== undefined);

    const halkAvg = halkList.length ? halkList.reduce((acc, c) => acc + c.halk_odakli_duygu, 0) / halkList.length : sentimentScore;
    const direnisAvg = direnisList.length ? direnisList.reduce((acc, c) => acc + c.direnis_dinamizmi, 0) / direnisList.length : 0;
    const krizAvg = krizList.length ? krizList.reduce((acc, c) => acc + c.yapisal_kriz_yuku, 0) / krizList.length : crisisScore;

    return { avgHalkDuygu: halkAvg, avgDirenis: direnisAvg, avgKriz: krizAvg };
  }, [dualAxisData, sentimentScore, crisisScore]);

  const formattedHalkDuygu = avgHalkDuygu > 0 ? `+${avgHalkDuygu.toFixed(2)}` : avgHalkDuygu.toFixed(2);
  const direnisPct = Math.round(avgDirenis * 100);
  const krizPct = Math.round(avgKriz * 100);

  return (
    <div className="metrics-grid">
      {/* 1. Toplam Arşiv */}
      <div className="metric-card" style={{ '--card-accent': 'var(--red-soviet)' }}>
        <div className="metric-header">
          <span className="metric-title">Taranan Arşiv</span>
          <div className="metric-icon" style={{ background: 'var(--red-bg)', color: 'var(--red-soviet-light)' }}>
            <FileText size={18} />
          </div>
        </div>
        <div className="metric-value">{total_articles}</div>
        <div className="metric-footer">
          <span>Tarihsel Gazete & Basın Manşeti</span>
        </div>
      </div>

      {/* 2. Tarihsel Aralık */}
      <div className="metric-card" style={{ '--card-accent': 'var(--yellow-soviet)' }}>
        <div className="metric-header">
          <span className="metric-title">Tarihsel Bellek</span>
          <div className="metric-icon" style={{ background: 'var(--yellow-bg)', color: 'var(--yellow-soviet)' }}>
            <Calendar size={18} />
          </div>
        </div>
        <div className="metric-value" style={{ fontSize: '1.75rem' }}>
          {year_range?.min || 1970} — {year_range?.max || 2024}
        </div>
        <div className="metric-footer">
          <span>1970'lerden Günümüze Dönemsel Kayıt</span>
        </div>
      </div>

      {/* 3. Düzeltilmiş Halk Odaklı Duygu */}
      <div className="metric-card" style={{ '--card-accent': 'var(--yellow-soviet)' }}>
        <div className="metric-header">
          <span className="metric-title">Halk Odaklı Duygu</span>
          <div className="metric-icon" style={{ background: 'var(--yellow-bg)', color: 'var(--yellow-soviet)' }}>
            <Sparkles size={18} />
          </div>
        </div>
        <div className="metric-value" style={{ color: avgHalkDuygu >= 0 ? 'var(--yellow-soviet)' : 'var(--red-soviet-light)' }}>
          {formattedHalkDuygu}
        </div>
        <div className="metric-footer">
          <span>S_revize = S_ham + γ·Direniş (Sınıfsal Çerçeve)</span>
        </div>
      </div>

      {/* 4. Yapısal Kriz / Sömürü Şiddeti */}
      <div className="metric-card" style={{ '--card-accent': 'var(--red-soviet)' }}>
        <div className="metric-header">
          <span className="metric-title">Yapısal Kriz Yoğunluğu</span>
          <div className="metric-icon" style={{ background: 'var(--red-bg)', color: 'var(--red-soviet-light)' }}>
            <AlertTriangle size={18} />
          </div>
        </div>
        <div className="metric-value" style={{ color: 'var(--red-soviet-light)' }}>
          %{krizPct}
        </div>
        <div className="metric-footer">
          <span>Enflasyon, Devalüasyon, Borç & Faiz Yükü</span>
        </div>
      </div>

      {/* 5. Direniş & Dayanışma Dinamizmi */}
      <div className="metric-card" style={{ '--card-accent': '#ffffff' }}>
        <div className="metric-header">
          <span className="metric-title">Direniş & Dayanışma</span>
          <div className="metric-icon" style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#ffffff' }}>
            <ShieldCheck size={18} />
          </div>
        </div>
        <div className="metric-value" style={{ color: '#ffffff' }}>
          %{direnisPct}
        </div>
        <div className="metric-footer">
          <span>Grev, Boykot, Eylem & Sendikal Hak Yoğunluğu</span>
        </div>
      </div>
    </div>
  );
}
