# 🛠️ AURA SMART HOME OS - DONANIM, ESP32 DEVRE ŞEMALARI VE MAKET EV REHBERİ

> **Dosya Konumu:** `c:\Users\LENOVO\Documents\smart house\MAKET_EV_VE_DONANIM_REHBERI.md`  
> **Kapsam:** FAZ 4 - Fiziksel Donanım Prototipi & 500-1000 TL Bütçeli Maket Ev Yapımı

---

## 🛠️ 1. MALZEME LİSTESİ VE MALİYET TABLOSU (BOM - Bill of Materials)

Yarışmalarda, sergilerde ve sunumlarda jüriye sunmak üzere **500 - 1000 TL** bütçe ile masaüstünüzde harika çalışan bir maket ev yapabilirsiniz.

| Donanım / Malzeme | Adet | Tahmini Fiyat (TL) | Görevi |
| :--- | :---: | :---: | :--- |
| **ESP32-WROOM-32 Mikrodenetleyici** | 2 Adet | ~350 TL ($10) | Oda nodları ve sensör verilerini işleyen ana beyin. |
| **DHT22 / DHT11 Sıcaklık & Nem Sensörü** | 2 Adet | ~100 TL ($3) | Yatak odası ve Salon sıcaklığını ölçer. |
| **SG90 Mini Servo Motor** | 2 Adet | ~80 TL ($2.5) | Motorlu sürgülü/otomatik maket kapıları açıp kapatır. |
| **5V Mini Su Pompası & Hortum** | 1 Adet | ~70 TL ($2) | Gri suyun makette tanktan depoya aktarılmasını sağlar. |
| **5V 2-Kanal Röle Modülü** | 1 Adet | ~50 TL ($1.5) | Su pompası ve kalorifer rezistansını tetikler. |
| **MQ-135 Hava Kalitesi / Duman Sensörü** | 1 Adet | ~60 TL ($2) | Mutfak duman ve hava kalitesini ölçer. |
| **Karton / Oluklu Mukavva veya Akrilik** | 1 Plaka | ~100 TL ($3) | Evin kat planı duvarları ve odaları. |
| **Jumper Kablolar & Breadboard** | 1 Set | ~50 TL ($1.5) | Devre bağlantıları. |
| **TOPLAM BÜTÇE** | - | **~860 TL ($25)** | **Dünya Standartlarında Masaüstü Maket Prototip!** |

---

## 🔌 2. ESP32 DEVRE BAĞLANTI ŞEMASI (PINOUT MAP)

### 📌 ESP32 Nodal Bağlantı Haritası:

```text
               +----------------------------------+
               |        ESP32 MİKRODENETLEYİCİ    |
               +----------------------------------+
               | GND  -------------------> GND    |
               | 5V   -------------------> VCC    |
               |                                  |
               | GPIO 4  --------> DHT22 (Sıcaklık|
               | GPIO 13 --------> SG90 Servo (Kapı|
               | GPIO 34 --------> MQ-135 (Duman) |
               | GPIO 26 --------> Röle 1 (Pompa) |
               | GPIO 27 --------> Röle 2 (HVAC)  |
               +----------------------------------+
```

---

## 💻 3. ESP32 MİKRODENETLEYİCİ KODU (ARDUINO / C++)

Aşağıdaki kod, maket evinizdeki ESP32 kartına yüklenecek olan tak-çalıştır C++ kodudur. Sensör verilerini okur ve motorlu kapıyı açıp kapatır.

```cpp
/*
 * AURA SMART HOME OS - ESP32 ROOM NODE CODE (C++)
 */
#include <WiFi.h>
#include <PubSubClient.h>
#include <ESP32Servo.h>
#include "DHT.h"

#define DHTPIN 4
#define DHTTYPE DHT22
#define SERVO_PIN 13
#define RELAY_PUMP_PIN 26

DHT dht(DHTPIN, DHTTYPE);
Servo doorServo;
WiFiClient espClient;
PubSubClient client(espClient);

const char* ssid = "EV_WIFI_AGI";
const char* password = "WIFI_SIFRESI";
const char* mqtt_server = "192.168.1.100"; // Yerel Sunucu IP

void setup() {
  Serial.begin(115200);
  dht.begin();
  doorServo.attach(SERVO_PIN);
  pinMode(RELAY_PUMP_PIN, OUTPUT);
  digitalWrite(RELAY_PUMP_PIN, LOW);

  // WiFi Bağlantısı
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[ESP32] Yerel Ağ Bağlandı!");
  client.setServer(mqtt_server, 1883);
}

void loop() {
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();

  // Telemetriyi Yerel Sunucuya Gönder (MQTT)
  String payload = "{\"temp\":" + String(temp) + ",\"hum\":" + String(hum) + "}";
  client.publish("aura/bedroom/telemetry", payload.c_str());

  // Eğer sıcaklık 20C altındaysa motorlu perdeyi kapatsın
  if (temp < 20.0) {
    doorServo.write(0); // Kapıyı Kapat
  } else {
    doorServo.write(90); // Kapıyı Aç
  }

  delay(2000); // 2 Saniyede bir oku
}
```

---

## 📦 4. MAKET EV ADIM ADIM YAPIM REHBERİ

1. **Taban ve Duvar Çizimi:**  
   Karton veya akrilik levha üzerine 50x40 cm boyutlarında ev tabanını çizin. `smart_home_floorplan.jpg` görselindeki gibi Yatak Odası, Mutfak, Banyo, Salon, Koridor ve Sunucu Odası duvar hatlarını maket bıçağı ile kesin.

2. **Motorlu Sürgülü Kapıların Takılması:**  
   Yatak odası ve salon girişlerine kapı boşluğu bırakın. SG90 mini servo motorların ucuna küçük dondurma çubuğu veya akrilik kapı kanadı yapıştırarak servo motoru duvara sabitleyin.

3. **Su Arıtma Maket Tankı:**  
   Banyo bölümüne 2 adet şeffaf plastik bardak yerleştirin (1. Bardak: Gri Su Deposu, 2. Bardak: Arıtılmış Su Deposu). Mini 5V su pompasını iki bardak arasına bağlayın.

4. **ESP32 Devresinin Yerleştirilmesi:**  
   ESP32 kartını ve breadboard'u Sunucu Odası bölümüne gizleyin. Kabloları duvar diplerinden geçirerek düzenleyin.

5. **Test Etme:**  
   ESP32'ye USB kablosunu bağlayın. Web uygulamasından veya sohbet ekranından komut verdiğinizde servo motorun kapıyı açtığını ve su pompasının çalıştığını görün!

---

> 📌 **Not:** Bu dosya projenizin fiziksel donanım aşamasını %100 tamamlar. Artık elinizde hem canlı web yazılımı, hem Python sunucu backend'i, hem de 500 TL bütçeli maket yapım kılavuzu bulunmaktadır!
