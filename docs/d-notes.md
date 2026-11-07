# D hesap notları

Eğri, öndeki teknenin alt kenarını üç segmentle izliyor.

## Bézier

```text
B(t) = b0(t)P0 + b1(t)P1 + b2(t)P2 + b3(t)P3

b0(t) = (1-t)^3
b1(t) = 3(1-t)^2*t
b2(t) = 3(1-t)*t^2
b3(t) = t^3
```

`t=0` için katsayılar `(1,0,0,0)`, yani sonuç `P0`. `t=1` için `(0,0,0,1)`, yani sonuç `P3`.

```text
B'(t) = 3(1-t)^2(P1-P0)
      + 6(1-t)t(P2-P1)
      + 3t^2(P3-P2)
```

Okun açısı `atan2(B'.y,B'.x)` ile hesaplanır. Geri giderken teğet ters çevrilir. Teğet sıfırsa yakın iki örnekten yön bulunmaya çalışılır.

## de Casteljau

`lerp(A,B,t)=(1-t)A+tB` kullanılır. Dört kontrol noktası sırasıyla üç, iki ve bir noktaya indirilir. Son nokta `B(t)` olur. Arayüzden segment ve `t` seçilir.

## C1 sürekliliği

İlk segmentin sonu `P3`, sonraki segmentin başı `Q0` olsun:

```text
Q0 = P3
3(P3-P2) = 3(Q1-Q0)
Q1 = 2P3-P2
```

Karşı tutamaç bu eşitlikle güncellenir. Eklem taşınırsa iki komşu tutamaç da aynı miktarda taşınır. Segmentlerin parametre aralıkları eşittir.

Dört yeni eklem yerleştirildiğinde her eklem için ortak bir teğet hesaplanır. Gelen tutamaç `P-d/3`, giden tutamaç `P+d/3` olur. Sınırda iki tutamaç birlikte kısaltılır; C1 korunur.

## Catmull–Rom

`p1` ile `p2` arasındaki segment:

```text
C(t) = 0.5 * [2p1 + (-p0+p2)t
       + (2p0-5p1+4p2-p3)t^2
       + (-p0+3p1-3p2+p3)t^3]
```

`C(0)=p1`, `C(1)=p2`. Eklemde iki taraftaki türev de `(sonraki-önceki)/2` olur. Dört nokta üç segment oluşturur. Uçlarda ilk ve son nokta tekrarlanır.

## Nokta sürükleme ve JSON

Fare konumundan bir ışın çıkarılır. View matrisinin rijit tersi ışını dünyaya taşır. `origin.z+s*direction.z=0.04` çözülerek eğri düzlemi bulunur. Paralel ışınlar ve kırpma aralığı dışındaki kesişimler kullanılmaz.

Tablo `z=0`, eğri `z=0.04` düzlemindedir. Aradaki küçük mesafe derinlik çakışmasını önler. Nokta seçimi ekrandaki mesafeye göre yapılır.

JSON koordinatları:

```text
u = x/4.45 + 0.5
v = 0.5 - y/5.4
```

`u` soldan sağa, `v` yukarıdan aşağıya artar. Başlangıç eğrileri `exports/boat-bezier.json` ve `exports/boat-catmull-rom.json` içinde. `placed-bezier.json` dört nokta yerleştirilerek indirilen örnektir.
