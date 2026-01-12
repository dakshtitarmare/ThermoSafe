#include <WiFi.h>
#include <Firebase_ESP_Client.h>

#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>

#include <OneWire.h>
#include <DallasTemperature.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <time.h>

// ================= WIFI =================
#define WIFI_SSID "WIFI_NAME"
#define WIFI_PASSWORD "WIFI_PASSWORD"

// ================= FIREBASE =================
#define API_KEY "****"
#define DATABASE_URL "https://cmrhyd-default-rtdb.asia-southeast1.firebasedatabase.app"

#define USER_EMAIL "firebase_account"
#define USER_PASSWORD "firebase_password"

// ================= DS18B20 =================
#define ONE_WIRE_BUS 4
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

// ================= LCD =================
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ================= FIREBASE OBJECTS =================
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// ================= TIMING =================
unsigned long lcdMillis = 0;
unsigned long firebaseMillis = 0;

const unsigned long LCD_INTERVAL = 2000;        // 2 sec
const unsigned long FIREBASE_INTERVAL = 900000; // 15 min

// ================= WIFI =================
void connectWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nWiFi Connected");
}

// ================= TIME =================
void setupTime() {
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  Serial.print("Syncing time");
  time_t now;
  while (time(&now) < 100000) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nTime synced");
}

// ================= LCD =================
void showOnLCD(float temp) {
  lcd.setCursor(0, 0);
  lcd.print("Temperature    ");
  lcd.setCursor(0, 1);
  lcd.print(temp);
  lcd.print(" C        ");
}

// ================= SETUP =================
void setup() {
  Serial.begin(115200);

  sensors.begin();

  Wire.begin(21, 22);
  lcd.init();
  lcd.backlight();
  lcd.print("System Starting");

  connectWiFi();
  setupTime();

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  lcd.clear();
  lcd.print("Firebase Ready");
}

// ================= LOOP =================
void loop() {

  // ---------- LCD UPDATE (2 sec) ----------
  if (millis() - lcdMillis >= LCD_INTERVAL) {
    lcdMillis = millis();

    sensors.requestTemperatures();
    float temp = sensors.getTempCByIndex(0);

    if (temp != DEVICE_DISCONNECTED_C) {
      showOnLCD(temp);
      Serial.print("Temp: ");
      Serial.println(temp);
    }
  }

  // ---------- FIREBASE LOG (15 min) ----------
  if (Firebase.ready() && millis() - firebaseMillis >= FIREBASE_INTERVAL) {
    firebaseMillis = millis();

    sensors.requestTemperatures();
    float temp = sensors.getTempCByIndex(0);
    time_t now;
    time(&now);

    FirebaseJson json;
    json.set("temperature", temp);
    json.set("timestamp", (long)now);

    if (Firebase.RTDB.pushJSON(&fbdo, "/sensor_logs", &json)) {
      Serial.println("Firebase log saved");
    } else {
      Serial.println(fbdo.errorReason());
    }
  }
}