# KARE

## One-line promise
KARE, izlediğin filmleri kişisel bir sinema kütüphanesinde biriktirir ve zevkine, ruh haline ve ayırabildiğin zamana göre sıradaki filmi seçmene yardım eder.

## Problem
Film takip etmek büyük ölçüde çözülmüş bir problem; asıl sürtünme, dağınık izleme geçmişini anlamlı bir arşive dönüştürmek ve yüzlerce seçenek arasından "bu gece ne izlemeliyim?" kararını vermektir. Kullanıcılar aynı anda kişisel kayıt, sinema keşfi ve hızlı karar desteği için birden fazla ürüne ihtiyaç duyuyor.

## Primary user
Filmleri yalnızca tüketmek değil biriktirmek ve keşfetmek isteyen; düzenli film izleyen, kendi zevkini görmek isteyen ve sık sık ne izleyeceğine karar vermekte zorlanan sinema meraklısı mobil kullanıcı.

## Product concept
KARE dört katmanı tek üründe birleştirir:
1. **Arşiv** — izlenenler, izlenecekler, favoriler, puanlar, yorumlar ve kişisel listeler.
2. **Kürasyon** — klasikler, dönemler, türler ve önemli sinema seçkileri gibi otomatik raflar.
3. **Karar motoru** — ruh hali, süre, zorluk ve kişisel zevk sinyallerinden küçük ve açıklanabilir bir öneri seti.
4. **Kişisel profil** — kullanıcının izleme geçmişini ve zevk örüntülerini görünür kılan profil.

MVP sosyal ağ olmaya çalışmaz. Topluluk, zevk eşleşmesi, birlikte izleme ve gelişmiş AI küratörü sonraki sürümlerdedir.

## Core loop
1. Kullanıcı film keşfeder veya `Ne İzlesem?` akışından küçük bir öneri seti alır.
2. Filmi izleme listesine ekler ya da izledi olarak işaretler.
3. İzledikten sonra puanlar ve isteğe bağlı yorum yazar.
4. Kütüphanesi ve zevk profili zenginleşir.
5. Sonraki keşif ve öneriler daha kişisel hale gelir.

## MVP
- Hesap oluşturma, giriş, çıkış ve temel hesap yaşam döngüsü.
- İlk kullanımda kısa zevk onboarding'i.
- TMDB tabanlı film arama ve film detayları.
- `İzledim`, `İzleyeceğim` ve `Favori` durumları.
- 0.5 adımlı film puanlama.
- İsteğe bağlı yorum ve spoiler işaretleme.
- Kişisel film listeleri.
- Kullanıcı işlemi gerektirmeyen otomatik sinema rafları/kategorileri.
- Kütüphane ekranı ve temel filtre/sıralama.
- Keşfet ekranı.
- Profil ve temel izleme istatistikleri.
- `Ne İzlesem?` akışı: ruh hali + süre + zorluk + yalnızca izlemediklerim gibi temel filtreler.
- Sonuçta en fazla 3 açıklanabilir film önerisi ve `neden bunu önerdik?` gerekçesi.
- Loading, empty, error, retry ve kritik ağ kaybı durumları.

## Explicitly not in MVP
- Takipçi sistemi ve sosyal aktivite akışı.
- Kullanıcılar arası mesajlaşma.
- Zevk eşleşmesi ve `Birlikte İzle`.
- Sinema Pasaportu / achievement sistemi.
- Yönetmen rotaları ve interaktif sinema tarihi kursu.
- Gelişmiş streaming-platformu filtreleme.
- LLM tabanlı sohbet şeklinde AI sinema küratörü.
- Premium abonelik ve ödeme.
- Kullanıcıların film metadata'sını düzenlemesi.
- Tam kapsamlı ödül arşivi ve birincil kaynaklardan otomatik ödül ingest sistemi.

## Differentiation
- Film günlüğünden çok **kişisel sinema kütüphanesi + karar motoru** konumlandırması.
- Sonsuz öneri listeleri yerine az sayıda, gerekçeli öneri.
- Kullanıcının manuel dosyalama yapmasını azaltan otomatik raflar.
- Film keşfini sadece popülerlik değil kullanıcının kendi sinema geçmişiyle ilişkilendirme.
- Poster merkezli, editoryal ve sinematik mobil deneyim.

## Primary success metric
**Weekly Successful Movie Decisions (WSMD):** KARE içinde keşfedilen veya `Ne İzlesem?` tarafından önerilen bir filmin kullanıcının izleyeceği filme dönüşmesi.

MVP ölçümünde bir successful decision; öneri/keşif kaynağından gelen bir filmin `İzleyeceğim` olarak kaydedilmesi ve daha sonra `İzledim` durumuna geçirilmesiyle doğrulanır.

## Secondary metrics
- `Ne İzlesem?` başlatma → öneri kabul oranı.
- Watchlist → watched dönüşüm oranı.
- Haftalık kullanıcı başına eklenen/puanlanan film.
- İlk haftada tamamlanan zevk onboarding oranı.
- 1, 4 ve 8 haftalık retention.
- Film detayından kütüphane aksiyonuna dönüşüm.
- Hata/retry oranı ve TMDB bağımlı ekranlarda başarısız istek oranı.

## Known constraints
- Ürün mobile-first tasarlanır.
- Film metadata'sının ana harici kaynağı TMDB olacaktır; TMDB'nin kullanım şartları, attribution ve rate/availability sınırları mimaride açıkça ele alınmalıdır.
- Kullanıcı verisi, puanlar, yorumlar, listeler, izleme geçmişi ve öneri sinyalleri KARE'nin kendi veri katmanında tutulmalıdır.
- Gizli anahtarlar istemciye gömülmemeli; üretim sırları repository'ye commit edilmemelidir.
- MVP öneri motoru açıklanabilir ve test edilebilir olmalı; LLM zorunlu değildir.

## Key assumptions and risks
- Kullanıcılar yalnızca film kaydetmek için yeni bir ürüne geçmeyebilir; değer `Ne İzlesem?` ve kürasyon kalitesiyle kanıtlanmalıdır.
- Soğuk başlangıçta öneri kalitesi düşük olabilir; onboarding ve erken davranış sinyalleri bunu azaltmalıdır.
- TMDB erişimi, attribution şartları veya API davranışı değişebilir; entegrasyon sınırı izole edilmelidir.
- Otomatik kategori/raf kuralları öznel kategorilerde tutarsızlaşabilir; MVP'de kategoriler açık metadata veya küratörlü kurallarla sınırlanmalıdır.
- Yorumlar UGC sayıldığı için moderasyon, raporlama ve mağaza politikaları release aşamasında değerlendirilmelidir.
- Repo şu anda public'tir; hiçbir secret, kişisel veri veya üretim credential'ı commit edilmemelidir.

## Current status
Lifecycle planning started. Stage 01 (IDEA) and Stage 02 (product README) are complete. Next mandatory artifact: `docs/PRODUCT_SPEC.md`.
