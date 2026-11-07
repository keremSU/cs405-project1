# A–C hesap notları

## A: Dönüşümler

Sütun vektörü kullanılıyor. TRS önce ölçekler, sonra döndürür, sonra taşır. SRT önce taşır; öteleme de dönme ve ölçeklemeden etkilenir. Diğer nesnelerde TRS kullanılıyor.

Başlangıçta `T=(1,0,0.8)`, `Rz=30 derece`, `S=0.6`:

```text
TRS =
 0.519615 -0.300000  0.000000  1.000000
 0.300000  0.519615  0.000000  0.000000
 0.000000  0.000000  0.600000  0.800000
 0.000000  0.000000  0.000000  1.000000

SRT =
 0.519615 -0.300000  0.000000  0.519615
 0.300000  0.519615  0.000000  0.300000
 0.000000  0.000000  0.600000  0.480000
 0.000000  0.000000  0.000000  1.000000
```

Rijit dönüşüm `M=[R t; 0 1]` için `R^-1=R^T`. Bu yüzden `M^-1=[R^T -R^T*t; 0 1]`. Bu işlem ölçek içeren matrislerde kullanılmıyor.

## B: Sahne grafiği

```text
gallery
├── animated-pivot
│   └── lavender-cube
├── amber-cube
└── teal-cube
```

Her düğüm için `world = parent.world * local`. Kökten başlayarak alt düğümlere gidiliyor.

Pivot sıfır açıda durdurulunca:

```text
gallery.world = I
pivot.local = T(-0.8, 0.8, 0.9)
lavender.local = T(0.8, 0, 0) * S(0.5, 0.5, 0.5)

lavender.world = T(-0.8+0.8, 0.8, 0.9) * S(0.5, 0.5, 0.5)

 0.5  0    0    0
 0    0.5  0    0.8
 0    0    0.5  0.9
 0    0    0    1
```

Lokal `(1,0,0)` noktası dünyada `(0.5,0.8,0.9)` olur. Pivot 90 derece döndüğünde küp merkezi `(-0.8,1.6,0.9)` olur.

## C: Kamera

Kamera negatif Z yönüne bakar. Kamera eksenleri:

```text
b = normalize(eye-target)
r = normalize(cross(up,b))
u = cross(b,r)
```

`eye=target` ise `b=(0,0,1)` seçilir. `up` sıfırsa veya bakış yönüne paralelse başka bir eksen kullanılır.

Bir noktanın kamera koordinatları `dot(r,p-eye)`, `dot(u,p-eye)` ve `dot(b,p-eye)` olur. Buradan view matrisi elde edilir:

```text
 r.x  r.y  r.z  -dot(r,eye)
 u.x  u.y  u.z  -dot(u,eye)
 b.x  b.y  b.z  -dot(b,eye)
 0    0    0    1
```

Bu matris göz konumunu orijine taşır. Kodda sütun öncelikli saklanır.

Perspektifte `f=1/tan(fovY/2)` ve `w_clip=-z`. `z_clip=a*z+b` olsun:

```text
z=-near: (-a*near+b)/near = 0
z=-far:  (-a*far+b)/far = 1

a = far/(near-far)
b = near*far/(near-far)
```

Buna göre perspektif matrisi:

```text
 f/aspect  0  0                0
 0         f  0                0
 0         0  far/(near-far)    near*far/(near-far)
 0         0 -1                0
```

Ortografikte `z_ndc=(z+near)/(near-far)`. İki projeksiyon da `-near` değerini 0'a, `-far` değerini 1'e götürür.

Near 0.5, far 16; kamera başlangıçta yaklaşık 9 birim uzakta. Far/near oranı 32. Perspektifte derinlik hassasiyeti yakında daha yüksektir. Near'ı çok küçültmek veya far'ı gereksiz büyütmek hassasiyeti azaltır. Ortografikte dağılım doğrusaldır.

Frustum için near ve far düzlemlerinin sekiz köşesi bulunur. Perspektifte yarı yükseklik `distance*tan(fovY/2)`, ortografikte `orthoHeight/2`. View matrisinin rijit tersi köşeleri dünyaya taşır. İkinci kamera bu köşeleri bağlayan 12 kenarı gösterir.

Kaynak: [WebGPU koordinat sistemi](https://www.w3.org/TR/webgpu/#coordinate-systems).
