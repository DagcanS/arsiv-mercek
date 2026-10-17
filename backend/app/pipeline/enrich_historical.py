"""
Tarihsel gazete arşiv kayıtlarını (1970–2024) 2-3 paragraflık detaylı,
özgün basın metinleriyle zenginleştiren yardımcı betik.
"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.database import get_connection
from app.nlp.class_sentiment import SinifsalDuyguMotoru

_class_engine = SinifsalDuyguMotoru()

HISTORICAL_ENRICHMENTS = {
    43: (
        "DİSK'i kapatmayı ve sendikal hakları tırpanlamayı amaçlayan 274 ve 275 sayılı yasa tasarılarına karşı "
        "İstanbul ve Kocaeli'de yüz bini aşkın sanayi işçisi üretimi durdurarak fabrikalardan sokaklara aktı. "
        "Kadıköy, Bakırköy ve Topkapı hattında kurulan barikatlar işçi kortejleri tarafından aşıldı. "
        "Hükümet olaylar karşısında çaresiz kalarak sıkıyönetim ilan etti ve zırhlı birlikleri şehre sevk etti. "
        "İşçi sınıfı, Türkiye tarihinde ilk kez bu çapta bir kitlesellikle kendi örgütlenme hakkını fiilen savundu."
    ),
    44: (
        "DİSK Yönetim Kurulu tarafından yapılan acil toplantının ardından genel grev kararı ilan edildi. "
        "Açıklamada, işçilerin kendi sendikalarını seçme hürriyetinin anayasal ve evrensel bir hak olduğu vurgulandı. "
        "'Sermayenin ve sarı sendikaların dayatmalarına boyun eğmeyeceğiz' denilen bildiride, "
        "bütün demokratik kitle örgütleri ve emekçiler dayanışmaya çağrıldı. Fabrikalarda direniş komiteleri kuruldu."
    ),
    45: (
        "Kamu İktisadi Teşekkülleri'nde (KİT) çalışan 600 bini aşkın kamu işçisi, enflasyon karşısında eriyen ücretlerine "
        "karşı tarihe 'Bahar Eylemleri' olarak geçen kitlesel eylemlere imza attı. Viziteye çıkma, sakal bırakma, "
        "yemek boykotu ve yalınayak yürüyüşlerle başlayan eylemler dalga dalga tüm sanayi havzalarına yayıldı. "
        "Hükümet artan toplumsal basınç karşısında masaya oturmak zorunda kalarak yüzde 140'ı aşan tarihi bir ücret artışını kabul etti."
    ),
    46: (
        "Zonguldak kömür havzasında çalışan 48 bin maden işçisi, toplu iş sözleşmesi görüşmelerinin tıkanması ve "
        "ocakların kapatılma tehdidine karşı aileleriyle birlikte Ankara'ya doğru büyük yürüyüşe geçti. "
        "Yüz bini aşkın insan selinin oluşturduğu kortej günlerce karayolunda yürüdü. "
        "Madencilerin 'Çankaya'nın şişmanı işçi düşmanı' ve 'Madenler bizimdir satılamaz' sloganları Türkiye'nin gündemine oturdu."
    ),
    47: (
        "TEKEL'in özelleştirilmesi sonrası özlük hakları gasbedilerek 4-C statüsüne mahkum edilmek istenen 12 bin TEKEL işçisi, "
        "kışın dondurucu soğuğunda Ankara Sakarya Meydanı ve Türk-İş genel merkezi önünde çadırlar kurarak 78 gün süren destansı bir direniş başlattı. "
        "Polis müdahalelerine ve soğuk havaya rağmen halkın büyük desteğini alan işçiler, güvencesizliğe karşı emek hareketinin simgesi haline geldi."
    ),
    48: (
        "Bursa'daki otomotiv ve yan sanayi devlerinde çalışan binlerce metal işçisi, Türk Metal Sendikası'nın imzalamak istediği "
        "sefalet sözleşmesine karşı üretimi durdurarak fabrikaları işgal etti. Renault, Tofaş ve Coşkunöz fabrikalarında "
        "çarkların durmasıyla başlayan 'Metal Fırtına', sendikal bürokrasiye karşı tabandan gelen meşru bir başkaldırı olarak kayıtlara geçti."
    ),
    49: (
        "Başbakan Tansu Çiller tarafından kamuoyuna açıklanan 5 Nisan İstikrar Kararları ile Türk lirası yüzde 70 devalüe edildi. "
        "Akaryakıt, şeker, çimento ve kamu tekelindeki temel tüketim maddelerine yüzde 100'e varan fahiş zamlar yapıldı. "
        "Hazine faizleri yüzde 400'ün üzerine fırlarken, hükümet krizin faturasını çalışanların reel gelirlerini budayarak kapatmayı hedefliyor."
    ),
    50: (
        "5 Nisan ekonomik paketinin açıklanmasının ardından sendikalar, meslek odaları ve emek örgütleri ayağa kalktı. "
        "Türk-İş ve DİSK yaptıkları ortak açıklamalarda, sermayenin rantını korumak için emekçilerin kazanılmış haklarının gasbedildiğini belirterek "
        "'Fatura yine dar gelirliye çıktı, bu yıkım paketini kabul etmiyoruz' dedi. Çarşı ve pazarda fiyatlar ikiye katlandı."
    ),
    51: (
        "Merkez Bankası rezervlerinin tükenmesiyle birlikte serbest piyasada Amerikan Doları bir gecede 14 bin liradan 40 bin liraya tırmandı. "
        "Tahtakale döviz piyasasında ve bankalarda işlemler durma noktasına geldi. İthalata bağımlı sanayiciler hammadde temin edemezken, "
        "esnaf kepenk indirdi ve Türkiye finans tarihinin en sert döviz şoklarından birini yaşadı."
    ),
    53: (
        "Milli Güvenlik Kurulu'nun (MGK) Çankaya Köşkü'nde gerçekleşen 9 saatlik toplantısının ardından 18 maddelik bildiri yayımlandı. "
        "İrticanın PKK teröründen daha öncelikli bir tehdit olarak tanımlandığı metinde; 8 yıllık kesintisiz eğitim, "
        "tarikat yurtlarının denetlenmesi ve kılık kıyafet kanununun tavizsiz uygulanması talep edildi. "
        "Ordu kanadının baskısı siyasi kulislerde 'post-modern darbe' tartışmalarını başlattı."
    ),
    57: (
        "17 Ağustos depreminin yarattığı büyük ekonomik yıkımın ardından Türkiye, IMF ile 4 milyar dolarlık stand-by anlaşmasına vardı. "
        "Anlaşma kapsamında enflasyonla mücadele amacıyla döviz kuru çıpasına geçilirken, kamu harcamalarının kısılması ve "
        "bankacılık reformunun hızlandırılması taahhüt edildi. Emekçi kesimler kemer sıkma politikalarının yoksulluğu artıracağından endişeli."
    ),
    58: (
        "Çankaya Köşkü'nde toplanan Milli Güvenlik Kurulu toplantısında Cumhurbaşkanı Ahmet Necdet Sezer ile Başbakan Bülent Ecevit arasında "
        "yaşanan Anayasa kitapçığı gerginliği, Türkiye tarihinin en büyük mali krizini tetikledi. "
        "Gecelik faizler interbank piyasasında yüzde 7500'e fırladı. Merkez Bankası bir günde 5 milyar dolarlık rezerv kaybetti."
    ),
    59: (
        "Döviz rezervlerinin erimesi üzerine hükümet dalgalı kur rejimine geçildiğini ilan etti. "
        "Dolar 680 bin liradan 1 milyon 200 bin liraya yükselerek rekor kırdı. "
        "Kapanan batık bankaların Tasarruf Mevduatı Sigorta Fonu'na (TMSF) devredilmesiyle birlikte binlerce bankacı ve beyaz yakalı işsiz kaldı."
    ),
    60: (
        "2001 krizinin ardından Başbakanlığa yürüyen yüz binlerce esnaf, Başbakan Ecevit'in önüne yazar kasa fırlatarak isyan etti. "
        "Kızılay Meydanı'nda toplanan on binlerce yurttaş 'Hükümet istifa', 'Açız, geçinemiyoruz' sloganları attı. "
        "Polisin biber gazı ve copla müdahale ettiği gösterilerde çok sayıda esnaf ve yurttaş gözaltına alındı."
    )
}

def enrich_historical():
    conn = get_connection()
    cursor = conn.cursor()
    updated = 0
    for art_id, full_content in HISTORICAL_ENRICHMENTS.items():
        cursor.execute("SELECT title FROM articles WHERE id = ?", (art_id,))
        row = cursor.fetchone()
        if row:
            title = row[0]
            combined = f"{title}. {full_content}"
            nlp_res = _class_engine.analiz_et_tekil(combined)
            halk_duygu = float(nlp_res["halk_odakli_duygu"])
            direnis = float(nlp_res["direnis_dinamizmi"])
            kriz = float(nlp_res["yapisal_kriz_yuku"])
            sentiment_label = "pozitif" if halk_duygu > 0.08 else ("negatif" if halk_duygu < -0.08 else "nötr")

            cursor.execute("""
                UPDATE articles
                SET content = ?,
                    sentiment_score = ?,
                    polarization_score = ?,
                    crisis_score = ?,
                    sentiment_label = ?
                WHERE id = ?
            """, (full_content, halk_duygu, direnis, kriz, sentiment_label, art_id))
            updated += 1

    conn.commit()
    conn.close()
    print(f"{updated} tarihsel arşiv haberi detaylı basın metinleriyle zenginleştirildi.")

if __name__ == "__main__":
    enrich_historical()
