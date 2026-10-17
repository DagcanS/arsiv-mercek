"""
Tarihsel Gazete ve Manşet Benchmark Tohumlayıcı (Demo Seed Data)
==============================================================
DİKKAT / VERİ KÖKENİ AÇIKLAMASI (DATA PROVENANCE):
Bu veri kümesi, 1970–2024 yılları arasında Türk basınında ve siyasal tarihinde
yaşanan dönüm noktalarını (15-16 Haziran, 24 Ocak, 5 Nisan, 2001 Krizi vb.)
ve farklı gazete ekollerinin (Cumhuriyet, Milliyet, Sabah, Sözcü, vb.)
söylemlerini modellemek için derlenmiş SENTETİK / ÖRNEK bir kalibrasyon külliyatıdır.

Bu kayıtlar taranmış fiziksel gazete mikrofilmlerinden ya da doğrulanmış OCR
kupürlerinden alınmamıştır; istatistiksel zaman serisi, Monroe Log-Odds ve
söylem kutuplaşması algoritmalarını test etmek amacıyla hazırlanmış demo verisidir.
Arayüzde bu kayıtlar açıkça 'Örnek Demo Kaydı' etiketiyle ayrıştırılır.
"""

import json
from datetime import datetime
from app.database import get_connection, init_db
from app.nlp.sentiment import analyze_sentiment
from app.nlp.polarization import analyze_polarization
from app.nlp.crisis_radar import analyze_crisis_radar

HISTORICAL_DATA = [
    # --- 1970 - 15-16 Haziran Büyük İşçi Direnişi ---
    {
        "title": "15-16 Haziran: Yüz Binlerce İşçi Sokaklara Döküldü, Fabrikalarda Çarklar Durdu",
        "content": "DİSK'i kapatmayı amaçlayan yasa tasarısına karşı işçi sınıfı ayağa kalktı. Kadıköy ve Topkapı'da barikatlar kuruldu, sıkıyönetim ilan edildi.",
        "source": "Evrensel (Arşiv)",
        "newspaper_type": "sol",
        "date": "1970-06-16",
        "year": 1970,
        "month": 6,
        "category": "Emek"
    },
    {
        "title": "DİSK Genel Grev İlan Etti: İşçilerin Sendika Seçme Hakkı Engellenemez",
        "content": "Sendikal hak ve özgürlükler mücadelesinde geri adım atılmayacak. İşçi sınıfı kendi kaderini eline almıştır.",
        "source": "Ant Dergisi",
        "newspaper_type": "sol",
        "date": "1970-06-17",
        "year": 1970,
        "month": 6,
        "category": "Emek"
    },
    # --- 1989 Bahar Eylemleri ---
    {
        "title": "1989 Bahar Eylemleri: 600 Bin Kamu İşçisi Yalınayak Yürüdü, Haklarını Söke Söke Aldı",
        "content": "Viziteye çıkma, sakal bırakma ve fabrika önlerinde oturma eylemleriyle başlayan Bahar Eylemleri hükümete geri adım attırdı. Yüzde 140 ücret artışı kazanıldı.",
        "source": "BirGün (Arşiv)",
        "newspaper_type": "sol",
        "date": "1989-05-18",
        "year": 1989,
        "month": 5,
        "category": "Emek"
    },
    # --- 1991 Büyük Zonguldak Madenci Yürüyüşü ---
    {
        "title": "100 Bin Madenci Ankara'ya Yürüyor: Çankaya'nın Şişmanı İşçi Düşmanı",
        "content": "Zonguldak kömür havzasında greve giden 48 bin madenci aileleriyle birlikte Ankara'ya doğru tarihi yürüyüşe geçti. Karayolu insan seline döndü.",
        "source": "Evrensel (Arşiv)",
        "newspaper_type": "sol",
        "date": "1991-01-05",
        "year": 1991,
        "month": 1,
        "category": "Emek"
    },
    # --- 2010 TEKEL İşçileri Direnişi ---
    {
        "title": "TEKEL İşçileri Ankara'yı Direniş Alanına Çevirdi: 4-C Köleliktir, Kabul Etmiyoruz",
        "content": "Özelleştirme sonrası güvencesizliğe mahkum edilen TEKEL işçileri Abdi İpekçi Parkı ve Türk-İş önünde 78 gün boyunca çadır kurarak direndi.",
        "source": "SendikaOrg",
        "newspaper_type": "sol",
        "date": "2010-01-15",
        "year": 2010,
        "month": 1,
        "category": "Emek"
    },
    # --- 2015 Metal Fırtına ---
    {
        "title": "Bursa'da Metal Fırtına: Otomotiv Fabrikalarında Fiili Grev ve İşgal Başladı",
        "content": "Renault, Tofaş ve Coşkunöz işçileri sarı sendikaya ve sefalet ücretine karşı üretimi durdurdu. İşçiler fabrikalara kapandı.",
        "source": "Evrensel",
        "newspaper_type": "sol",
        "date": "2015-05-16",
        "year": 2015,
        "month": 5,
        "category": "Emek"
    },
    # --- 1994 Kriz ve 5 Nisan Kararları ---
    {
        "title": "5 Nisan Kararları Açıklandı: Kemerler Sıkılacak, Yüzde 70 Devalüasyon",
        "content": "Başbakan Tansu Çiller tarihi istikrar paketini duyurdu. Dolar bir gecede fırlarken kamu zamları ardı ardına geldi.",
        "source": "Hürriyet",
        "newspaper_type": "merkez",
        "date": "1994-04-06",
        "year": 1994,
        "month": 4,
        "category": "Ekonomi"
    },
    {
        "title": "Fatura Yine Emekçiye ve Dar Gelirliye Çıktı: Krizin Bedelini Halk Ödemeyecek",
        "content": "Sendikalar ve muhalefet 5 Nisan paketine sert tepki gösterdi. Devalüasyon ve zam fırtınası dar gelirliyi ezdi.",
        "source": "Cumhuriyet",
        "newspaper_type": "sol",
        "date": "1994-04-07",
        "year": 1994,
        "month": 4,
        "category": "Ekonomi"
    },
    {
        "title": "Dolar 14 Binden 40 Bine Fırladı, Tahtakale ve Döviz Bürolarında Büyük Kaos",
        "content": "Piyasalarda likidite kurudu, bankalar arası faizler rekor kırarken vatandaş dövize hücum etti.",
        "source": "Milliyet",
        "newspaper_type": "merkez",
        "date": "1994-04-08",
        "year": 1994,
        "month": 4,
        "category": "Ekonomi"
    },
    {
        "title": "Milli Seferberlik Şart: Hükümetin Aldığı Kararların Arkasında Birlikte Durulmalı",
        "content": "Türkiye bu darboğazı el ele vererek aşacaktır. Karamsarlık aşılayan iç ve dış mihraklara prim verilmemeli.",
        "source": "Tercüman",
        "newspaper_type": "sag",
        "date": "1994-04-10",
        "year": 1994,
        "month": 4,
        "category": "Siyaset"
    },
    
    # --- 1997 - 28 Şubat Süreci ---
    {
        "title": "MGK'dan 18 Maddelik Tarihi Muhtıra: İrtica Öncelikli Tehdit İlan Edildi",
        "content": "9 saat süren toplantıda askerler hükümete kesin uyarıda bulundu: Laiklik ilkesinden asla taviz verilemez.",
        "source": "Hürriyet",
        "newspaper_type": "merkez",
        "date": "1997-03-01",
        "year": 1997,
        "month": 3,
        "category": "Siyaset"
    },
    {
        "title": "Laik Cumhuriyet Tehdit Altında: Yobaz ve Gerici Kuşatmaya Karşı Toplumsal Refleks",
        "content": "Cumhuriyet devrimleri savunulmalıdır. Hükümetin tarikatlara açtığı alan rejimin temel direklerini sarsıyor.",
        "source": "Cumhuriyet",
        "newspaper_type": "sol",
        "date": "1997-03-02",
        "year": 1997,
        "month": 3,
        "category": "Siyaset"
    },
    {
        "title": "Milli İradeye Vesayet Dayatılamaz: Demokrasi Dışı Müdahaleler Tarihe Gömülecektir",
        "content": "Halkın oylarıyla gelen meşru hükümete yönelik baskılar kabul edilemez. Karanlık odakların senaryosu tutmayacak.",
        "source": "Yeni Şafak",
        "newspaper_type": "iktidar",
        "date": "1997-03-03",
        "year": 1997,
        "month": 3,
        "category": "Siyaset"
    },

    # --- 1999 Deprem & IMF Anlaşması ---
    {
        "title": "Asrın Felaketi: Marmara Enkaz Altında, 17 Bin Can Kaybı ve Büyük Yıkım",
        "content": "Tüm Türkiye yasa boğuldu. Sanayi tesisleri hasar görürken ekonomi için uluslararası yardım çağrısı yapıldı.",
        "source": "Milliyet",
        "newspaper_type": "merkez",
        "date": "1999-08-18",
        "year": 1999,
        "month": 8,
        "category": "Manşet"
    },
    {
        "title": "IMF ile 3 Yıllık Tarihi Stand-By Anlaşması: Enflasyon Hedefi Tek Hane",
        "content": "Hükümet IMF heyeti ile anlaşmaya vardı. 4 milyar dolarlık kaynak ile dezenflasyon programı başlatılıyor.",
        "source": "Dünya",
        "newspaper_type": "ekonomi",
        "date": "1999-12-10",
        "year": 1999,
        "month": 12,
        "category": "Ekonomi"
    },

    # --- 2001 Büyük Bankacılık ve Finans Krizi ---
    {
        "title": "Çankaya'da Tarihi Kriz: Sezer Anayasa Kitapçığını Ecevit'e Fırlattı",
        "content": "MGK toplantısında Cumhurbaşkanı Sezer ile Başbakan Ecevit arasında sert kavga çıktı. Ecevit 'Bu bir devlet krizidir' dedi.",
        "source": "Hürriyet",
        "newspaper_type": "merkez",
        "date": "2001-02-20",
        "year": 2001,
        "month": 2,
        "category": "Siyaset"
    },
    {
        "title": "Gecelik Faiz Yüzde 7500'e Fırladı, Borsa Çöktü, Bankalar Kilitlendi",
        "content": "Cumhuriyet tarihinin en ağır finansal çöküşü yaşanıyor. Merkez Bankası rezervleri eridi, dalgalı kura geçildi.",
        "source": "Dünya",
        "newspaper_type": "ekonomi",
        "date": "2001-02-22",
        "year": 2001,
        "month": 2,
        "category": "Ekonomi"
    },
    {
        "title": "Çürüyen Sistemin ve Batık Bankaların İflası: Yolsuzluk Düzeni Çöktü",
        "content": "Halkın vergileriyle fon bankalarına aktarılan milyarlar hortumcuların cebine gitti. Sorumlular hesap vermeli.",
        "source": "Cumhuriyet",
        "newspaper_type": "sol",
        "date": "2001-02-23",
        "year": 2001,
        "month": 2,
        "category": "Ekonomi"
    },
    {
        "title": "Kemal Derviş Ankara'ya Çağrıldı: Güçlü Ekonomiye Geçiş Programı Başlıyor",
        "content": "Dünya Bankası Başkan Yardımcısı Derviş ekonominin patronu oldu. Bankacılık ve kamu maliyesinde köklü reformlar geliyor.",
        "source": "Milliyet",
        "newspaper_type": "merkez",
        "date": "2001-03-03",
        "year": 2001,
        "month": 3,
        "category": "Ekonomi"
    },
    {
        "title": "20 Bankaya El Konuldu, TMSF Batık Kredilerin ve Hortumcuların Peşinde",
        "content": "Bankacılık sistemi yeniden yapılandırılıyor. BDDK ve TMSF batık patronların holdinglerine tedbir koydu.",
        "source": "Sabah",
        "newspaper_type": "merkez",
        "date": "2001-05-15",
        "year": 2001,
        "month": 5,
        "category": "Ekonomi"
    },

    # --- 2002 - 2005 İstikrar ve AB Süreci ---
    {
        "title": "3 Kasım Sandığından Tek Başına İktidar Çıktı: Siyasi Belirsizlik Bitti",
        "content": "Koalisyon partileri baraj altında kalırken AK Parti ezici çoğunlukla hükümet kurma yetkisi aldı. Piyasalar coştu.",
        "source": "Hürriyet",
        "newspaper_type": "merkez",
        "date": "2002-11-04",
        "year": 2002,
        "month": 11,
        "category": "Siyaset"
    },
    {
        "title": "Türk Lirasından 6 Sıfır Atıldı: Yeni Kuruşlar Ceplerde, Paramıza İtibar Geldi",
        "content": "1 Ocak itibarıyla YTL resmen yürürlükte. Milyoner enflasyonist psikoloji tarihe karıştı, etiketler sadeleşti.",
        "source": "Milliyet",
        "newspaper_type": "merkez",
        "date": "2005-01-02",
        "year": 2005,
        "month": 1,
        "category": "Ekonomi"
    },
    {
        "title": "Türkiye AB ile Müzakerelere Resmen Başladı: Brüksel'de Tarihi Zirve",
        "content": "Avrupa Birliği ile katılım müzakereleri start aldı. Yabancı doğrudan yatırımlarda rekor artış bekleniyor.",
        "source": "Sabah",
        "newspaper_type": "iktidar",
        "date": "2005-10-04",
        "year": 2005,
        "month": 10,
        "category": "Dış Politika"
    },
    {
        "title": "AB Dayatmaları Ulusal Egemenliğimizi Tartışmaya Açıyor: Kıbrıs ve Güvenlik Tavizi",
        "content": "Müzakere çerçeve belgesi Türkiye'nin kırmızı çizgilerini aşındırıyor. Brüksel kapısında teslimiyetçi politika.",
        "source": "Cumhuriyet",
        "newspaper_type": "sol",
        "date": "2005-10-05",
        "year": 2005,
        "month": 10,
        "category": "Dış Politika"
    },

    # --- 2008 Küresel Finans Krizi ---
    {
        "title": "Lehman Brothers Battı, Wall Street Çöktü: Küresel Finansal Tsunami",
        "content": "ABD'de mortgage krizi dev yatırım bankasını batırdı. Dünya borsaları serbest düşüşte.",
        "source": "Dünya",
        "newspaper_type": "ekonomi",
        "date": "2008-09-16",
        "year": 2008,
        "month": 9,
        "category": "Ekonomi"
    },
    {
        "title": "Erdoğan: Küresel Finans Krizi Türkiye'yi Teğet Geçecektir",
        "content": "Başbakan bankacılık sisteminin sağlam olduğunu, panik yapmaya gerek olmadığını vurguladı.",
        "source": "Sabah",
        "newspaper_type": "iktidar",
        "date": "2008-10-18",
        "year": 2008,
        "month": 10,
        "category": "Ekonomi"
    },
    {
        "title": "Teğet Değil Deldi Geçti: İhracat Pazarlarında Sert Daralma, İşsizlik Tırmanışta",
        "content": "Avrupa pazarının çökmesiyle otomotiv ve tekstil fabrikalarında vardiyalar durdu, binlerce emekçi işsiz kaldı.",
        "source": "Sözcü",
        "newspaper_type": "muhalif",
        "date": "2008-11-20",
        "year": 2008,
        "month": 11,
        "category": "Ekonomi"
    },

    # --- 2013 Gezi Parkı & 'Faiz Lobisi' Söylemi ---
    {
        "title": "Gezi Parkı Eylemleri Ülke Çapına Yayıldı: Taksim'de Gaz Bombası ve Barikatlar",
        "content": "Parktaki ağaçların kesilmesine tepki olarak başlayan eylemler milyonların katıldığı kitlesel protestolara dönüştü.",
        "source": "Hürriyet",
        "newspaper_type": "merkez",
        "date": "2013-06-01",
        "year": 2013,
        "month": 6,
        "category": "Siyaset"
    },
    {
        "title": "Erdoğan: Mesele Birkaç Ağaç Değil, Faiz Lobisinin Kirli Oyunu Devrede",
        "content": "Hükümet faizlerin yüzde 4.5'e indiği dönemde Türkiye'nin büyümesini engellemek isteyen faiz lobisini işaret etti.",
        "source": "Yeni Şafak",
        "newspaper_type": "iktidar",
        "date": "2013-06-05",
        "year": 2013,
        "month": 6,
        "category": "Siyaset"
    },
    {
        "title": "Gençlik Özgürlük İstiyor, İktidarın Otoriter Baskı Düzeni Çatırdadı",
        "content": "Polis şiddeti ve orantısız güç tepki çekiyor. Milyonlar meydanlarda hak, hukuk ve adalet haykırıyor.",
        "source": "Sözcü",
        "newspaper_type": "muhalif",
        "date": "2013-06-06",
        "year": 2013,
        "month": 6,
        "category": "Siyaset"
    },

    # --- 2018 Rahip Brunson & Kur Şoku ---
    {
        "title": "Trump'tan Türkiye'ye Açık Yaptırım Tehdidi: Dolar 7 Lira Barajını Aştı",
        "content": "ABD Başkanı'nın çelik ve alüminyuma ek vergi tweeti sonrası Türk Lirasında sert değer kaybı yaşandı.",
        "source": "Hürriyet",
        "newspaper_type": "merkez",
        "date": "2018-08-11",
        "year": 2018,
        "month": 8,
        "category": "Ekonomi"
    },
    {
        "title": "Onların Doları Varsa Bizim de Halkımız ve Hakk'ımız Var: Ekonomik Savaşa Karşı Direniş",
        "content": "Cumhurbaşkanı Erdoğan halka döviz ve altınlarını bozdurarak milli paraya sahip çıkma çağrısında bulundu.",
        "source": "Sabah",
        "newspaper_type": "iktidar",
        "date": "2018-08-12",
        "year": 2018,
        "month": 8,
        "category": "Ekonomi"
    },
    {
        "title": "Dış Politika Fiyaskosu Ekonomiyi Enkaz Haline Getirdi: İflaslar ve Konkordato Dalgası",
        "content": "Yüksek dış borç altındaki şirketler döviz şoku ile batma noktasına geldi. Çarşı pazarda zam fırtınası başladı.",
        "source": "Cumhuriyet",
        "newspaper_type": "sol",
        "date": "2018-08-14",
        "year": 2018,
        "month": 8,
        "category": "Ekonomi"
    },
    {
        "title": "Hazine Bakanı Berat Albayrak Yeni Dengelenme Programını Açıkladı",
        "content": "Kamu harcamalarında tasarruf, enflasyonla topyekun mücadele ve bankalara likidite desteği içeren plan açıklandı.",
        "source": "Dünya",
        "newspaper_type": "ekonomi",
        "date": "2018-09-20",
        "year": 2018,
        "month": 9,
        "category": "Ekonomi"
    },

    # --- 2021-2022 Yeni Ekonomi Modeli & Nas Politikası ---
    {
        "title": "Nas Ortada, Faiz Sebeptir Enflasyon Neticedir: Faiz İndirimi Kararı Geldi",
        "content": "Merkez Bankası piyasa beklentilerine rağmen politika faizini yüzde 14'e indirdi. Üretim ve ihracat odaklı model.",
        "source": "Yeni Şafak",
        "newspaper_type": "iktidar",
        "date": "2021-11-19",
        "year": 2021,
        "month": 11,
        "category": "Ekonomi"
    },
    {
        "title": "Dolar 18 Lirayı Gördü: 20 Aralık Gece Operasyonuyla Kur Korumalı Mevduat İlan Edildi",
        "content": "Cumhurbaşkanı Erdoğan'ın kabine toplantısı sonrası yaptığı KKM açıklamasıyla dolar bir gecede 12 liraya çakıldı.",
        "source": "Sabah",
        "newspaper_type": "iktidar",
        "date": "2021-12-21",
        "year": 2021,
        "month": 12,
        "category": "Ekonomi"
    },
    {
        "title": "Hazineye Saatli Bomba Koydular: KKM ile Zengine Servet Transferi, Yoksula Enflasyon Yangını",
        "content": "Kur farkının bütçeden karşılanması bütçe açığını patlatacak. Tüketici enflasyonu yüzde 85'e fırlayarak rekor kırdı.",
        "source": "Sözcü",
        "newspaper_type": "muhalif",
        "date": "2021-12-22",
        "year": 2021,
        "month": 12,
        "category": "Ekonomi"
    },
    {
        "title": "Sanayici Kur Şoku ve Yüksek Enflasyon Arasında Sıkıştı: Öngörülebilirlik Kayboldu",
        "content": "Fiyatlama davranışları bozulurken işletmeler hammadde temin etmekte ve vadeli satış yapmakta zorlanıyor.",
        "source": "Dünya",
        "newspaper_type": "ekonomi",
        "date": "2022-03-15",
        "year": 2022,
        "month": 3,
        "category": "Ekonomi"
    },

    # --- 2023-2024 Rasyonel Politikalara Dönüş & Dezenflasyon ---
    {
        "title": "Mehmet Şimşek Görevi Devraldı: Türkiye'nin Rasyonel Bir Zemine Dönmekten Başka Çaresi Yok",
        "content": "Hazine ve Maliye Bakanlığı'nda devir teslim. Şeffaflık, öngörülebilirlik ve kurala dayalı ekonomi vurgusu öne çıktı.",
        "source": "Hürriyet",
        "newspaper_type": "merkez",
        "date": "2023-06-04",
        "year": 2023,
        "month": 6,
        "category": "Ekonomi"
    },
    {
        "title": "Merkez Bankası Faizi Yüzde 50 Seviyesine Yükseltti: Enflasyonda Kararlı Duruş",
        "content": "Hafize Gaye Erkan ve Fatih Karahan başkanlığında sıkı para politikası sürdürülüyor. Rezervlerde tarihi toparlanma.",
        "source": "Dünya",
        "newspaper_type": "ekonomi",
        "date": "2024-03-22",
        "year": 2024,
        "month": 3,
        "category": "Ekonomi"
    },
    {
        "title": "Türkiye Gri Listeden Çıktı, Uluslararası Yatırımcı İlgisi ve Not Artırımları Hızlandı",
        "content": "FATF genel kurulunda Türkiye gri listeden çıkarıldı. Kredi derecelendirme kuruluşları peş peşe not artırdı.",
        "source": "Sabah",
        "newspaper_type": "iktidar",
        "date": "2024-06-29",
        "year": 2024,
        "month": 6,
        "category": "Ekonomi"
    },
    {
        "title": "Faiz Yüzde 50 Oldu Ama Çarşı Pazardaki Hayat Pahalılığı Sönmüyor: Emekli ve Asgari Ücretli Çaresiz",
        "content": "TÜİK verilerine göre yıllık enflasyon düşüş eğilimine girse de kira, gıda ve eğitim masrafları vatandaşı eziyor.",
        "source": "Sözcü",
        "newspaper_type": "muhalif",
        "date": "2024-07-10",
        "year": 2024,
        "month": 7,
        "category": "Ekonomi"
    },
    {
        "title": "Dezenflasyon Süreci Başladı: Yıllık Enflasyonda Kesintisiz Gerileme Beklentisi",
        "content": "Hazine ve Maliye Bakanı Şimşek bütçe disiplini ve yapısal reformlarla enflasyonun tek haneye ineceğini açıkladı.",
        "source": "Milliyet",
        "newspaper_type": "merkez",
        "date": "2024-08-05",
        "year": 2024,
        "month": 8,
        "category": "Ekonomi"
    }
]

def seed_database():
    init_db()
    conn = get_connection()
    cursor = conn.cursor()
    
    # Mevcut kayıt sayısını kontrol et
    cursor.execute("SELECT COUNT(*) FROM articles")
    count = cursor.fetchone()[0]
    
    if count > 0:
        print(f"Veritabanında halihazırda {count} kayıt mevcut. Yeniden tohumlama atlandı.")
        conn.close()
        return count
        
    print(f"Toplam {len(HISTORICAL_DATA)} tarihsel haber manşeti NLP hattından geçirilerek veritabanına ekleniyor...")
    
    for item in HISTORICAL_DATA:
        full_text = f"{item['title']}. {item['content']}"
        
        # NLP motorlarını çalıştır
        sent_res = analyze_sentiment(full_text)
        pol_res = analyze_polarization(full_text, source=item["source"])
        crisis_res = analyze_crisis_radar(full_text)
        
        all_keywords = list(set(
            crisis_res["matched_keywords"] + 
            sent_res["pos_words"] + 
            sent_res["neg_words"] + 
            pol_res["markers_found"]
        ))
        
        cursor.execute("""
        INSERT INTO articles (
            title, content, source, newspaper_type, date, year, month, category,
            sentiment_label, sentiment_score, polarization_score, crisis_score,
            crisis_category, keywords, entities, source_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            item["title"],
            item["content"],
            item["source"],
            item["newspaper_type"],
            item["date"],
            item["year"],
            item["month"],
            item["category"],
            sent_res["label"],
            sent_res["score"],
            pol_res["score"],
            crisis_res["crisis_score"],
            crisis_res["primary_crisis"],
            json.dumps(all_keywords, ensure_ascii=False),
            json.dumps([item["source"]], ensure_ascii=False),
            "curated_demo"
        ))
        
    conn.commit()
    conn.close()
    print(f"Başarıyla {len(HISTORICAL_DATA)} tarihsel makale kaydedildi.")
    return len(HISTORICAL_DATA)

if __name__ == "__main__":
    seed_database()
