#include <WiFi.h>
#include <ThingSpeak.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_NeoPixel.h>
#include <WebServer.h>

// CONFIGURACIÓN DE RED Y CLAVE (¡ACTUALIZAR ESTOS VALORES!)
const char* ssid = ""; 
const char* password = "";      
WebServer server(80);

unsigned long channelID = 3158861;  
const char* myWriteAPIKey = "2MRORQ5PWL5DMYNH";
WiFiClient client;

// DEFINICIONES DE PINES Y CONSTANTES
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

const int trigPin = 5;   
const int echoPin = 18;  
#define PIN_WS2812B 16   
#define NUM_PIXELS 25
#define LIGHT_SENSOR_PIN 36 
#define BUZZER 32            
#define SOUND_SPEED 0.034  

// DECLARACIONES DE OBJETOS Y VARIABLES
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
Adafruit_NeoPixel ws2812b(NUM_PIXELS, PIN_WS2812B, NEO_GRB + NEO_KHZ800);

unsigned long previousMillisOLED = 0;
const long intervalOLED = 500;  

unsigned long previousMillisFade = 0;
const long intervalFade = 5;  

unsigned long previousMillisTS = 0;
const long intervalThingSpeak = 20000;  

long duration;
float distanceCm;
float distanceInch;

int currentR = 0, currentG = 0, currentB = 0;
int targetR = 0, targetG = 0, targetB = 0;
int currentBrightness = 0;
int targetBrightness = 0;
int mappedValue = 0;

bool buzzerManualControl = false; 
bool ledsManualControl = false;

// --- VARIABLES DE MENSAJE OLED ---
String customMessage = "";
bool displayCustomMessage = false;
unsigned long messageDisplayTime = 0;
// La duración del mensaje ya no se usa, el mensaje es PERMANENTE hasta /oled/auto
const long messageDuration = 5000; 


// FUNCIONES DE ENDPOINT (CONTROL WEB)

void handleBuzzerOn() {
  digitalWrite(BUZZER, HIGH); 
  buzzerManualControl = true; 
  Serial.println("Buzzer ENCENDIDO (Web Override)");
  server.send(200, "text/plain", "Buzzer activado manualmente.");
}

void handleBuzzerOff() {
  digitalWrite(BUZZER, LOW);
  buzzerManualControl = false; 
  Serial.println("Buzzer APAGADO (Web Override Ended)");
  server.send(200, "text/plain", "Buzzer desactivado manualmente.");
}

void handleLedsMax() {
  targetBrightness = 200; 
  targetR = 255; targetG = 255; targetB = 255;
  ledsManualControl = true; 
  Serial.println("LEDs target MAX establecido, Fade iniciado.");
  server.send(200, "text/plain", "LEDs target MAX establecido.");
}

void handleLedsMin () {
  targetBrightness = 50; 
  targetR = 100; targetG = 100; targetB = 100;
  ledsManualControl = true;
  Serial.println("Leds target MIN establecido, Fade iniciado.");
  server.send(200, "text/plain", "Leds target MIN establecido.");
}

void handleLedsAuto () {
  ledsManualControl = false; 
  Serial.println("Leds control: Automatico LDR");
  server.send(200, "text/plain", "Leds control: Automatico LDR");
}

// --- ENDPOINT AÑADIDO: RECIBIR Y MOSTRAR MENSAJE ---
void handleMessage() {
  if (server.hasArg("text")) {
    customMessage = server.arg("text");
    customMessage.replace("+", " "); 
    
    // Activa la bandera PERMANENTEMENTE (hasta que se llame /oled/auto)
    displayCustomMessage = true; 
    
    Serial.print("Mensaje recibido: ");
    Serial.println(customMessage);
    server.send(200, "text/plain", "Mensaje recibido y en pantalla.");
  } else {
    server.send(400, "text/plain", "Error: Falta el parámetro 'text'.");
  }
}

// --- ENDPOINT AÑADIDO: VOLVER AL MODO DISTANCIA AUTOMÁTICO ---
void handleOledAuto() {
  displayCustomMessage = false; // Desactiva la bandera para volver al modo automático
  customMessage = ""; 
  Serial.println("OLED Control: Automatico (Distancia)");
  server.send(200, "text/plain", "OLED Control: Automatico (Distancia)");
}


// ==========================================================
// SETUP
// ==========================================================

void setup() {
  Serial.begin(115200);

  // --- Configuración de Pines ---
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(BUZZER, OUTPUT);
  digitalWrite(BUZZER, LOW); 

  // --- Inicialización de Periféricos ---
  ws2812b.begin();
  Wire.begin(21, 22);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("SSD1306 allocation failed"));
    for (;;) ;
  }

  // 1. Conexión WiFi
  Serial.print("Conectando a WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConectado a WiFi!");

  // 2. Definición de Endpoints
  server.on("/buzzer/on", HTTP_GET, handleBuzzerOn);
  server.on("/buzzer/off", HTTP_GET, handleBuzzerOff);
  server.on("/leds/max", HTTP_GET, handleLedsMax);
  server.on("/leds/min", HTTP_GET, handleLedsMin);
  server.on("/leds/auto", HTTP_GET, handleLedsAuto); 
  server.on("/message", HTTP_GET, handleMessage);       
  server.on("/oled/auto", HTTP_GET, handleOledAuto);  
  server.begin(); 
  Serial.println("Servidor HTTP iniciado");

  // 3. Inicializar ThingSpeak
  ThingSpeak.begin(client);

  // Configuración inicial de la pantalla
  display.clearDisplay();
  display.setTextSize(2);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("READY!");
  display.println(WiFi.localIP());
  Serial.println(WiFi.localIP());
  display.display();
  delay(1000);
}

// ==========================================================
// LOOP PRINCIPAL (Multitarea Sin Bloqueo)
// ==========================================================

void loop() {
  server.handleClient();
  unsigned long currentMillis = millis();

  // --- BLOQUE 1: SENSORES Y PANTALLA (500 ms) ---
  if (currentMillis - previousMillisOLED >= intervalOLED) {
    previousMillisOLED = currentMillis;

    // 1. LECTURA ULTRASÓNICO
    digitalWrite(trigPin, LOW); delayMicroseconds(2);
    digitalWrite(trigPin, HIGH); delayMicroseconds(10);
    digitalWrite(trigPin, LOW);
    duration = pulseIn(echoPin, HIGH);
    distanceCm = duration * SOUND_SPEED / 2.0;

    // 2. LÓGICA LDR (Solo si el control de LEDs no es manual)
    int analogValue = analogRead(LIGHT_SENSOR_PIN);
    mappedValue = map(analogValue, 0, 4095, 0, 1000);

    if (!ledsManualControl) { 
        if (mappedValue < 100) { targetR = 153; targetG = 0; targetB = 0; targetBrightness = 200; } 
        else if (mappedValue < 700) { targetR = 153; targetG = 0; targetB = 0; targetBrightness = 50; } 
        else { targetR = 0; targetG = 0; targetB = 0; targetBrightness = 0; }
    }

    // 3. ACTUALIZACIÓN PANTALLA
    display.clearDisplay();

     if (!buzzerManualControl) { 
            if (distanceCm < 10) {
              digitalWrite(BUZZER, HIGH);  
            } else {
              digitalWrite(BUZZER, LOW);  
            }
        } 
    
    // Si el mensaje personalizado está activo, el OLED SÓLO mostrará el mensaje
    if (displayCustomMessage) {
        display.setTextSize(1); display.setCursor(0, 0); display.println("MENSAJE WEB:");
        
        display.setTextSize(2);
        display.setCursor(0, 20); 
        // Mostrar mensaje (la pantalla es de 128x64, solo dos líneas son viables para texto grande)
        display.print(customMessage); 
    } else {
        // --- MODO DISTANCIA AUTOMÁTICO ---
        
        // Muestra Distancia en las dos líneas superiores siempre
        display.setTextSize(2); display.setCursor(0, 0); display.println("Distancia:");
        display.setTextSize(3); display.setCursor(0, 30); display.print((int)distanceCm);
        display.setTextSize(2); display.println(" cm");

        // LÓGICA DE CONTROL DEL BUZZER (Línea 50)
        if (!buzzerManualControl) { 
            if (distanceCm < 10) {
              display.setCursor(80, 0); display.print("<<<");
              display.setCursor(0, 50); display.setTextSize(1); display.println("MUY CERCA!");
              digitalWrite(BUZZER, HIGH);  
            } else {
              digitalWrite(BUZZER, LOW);  
            }
        } else {
            // Mostrar estado de control manual de buzzer
            display.setCursor(0, 50); display.setTextSize(1); display.println("WEB CONTROL ACTIVO");
        }
    }
    display.display();
  }

  // --- BLOQUE 2: THING SPEAK (20 segundos) ---
  if (currentMillis - previousMillisTS >= intervalThingSpeak) {
    previousMillisTS = currentMillis;

    if (WiFi.status() == WL_CONNECTED) {
      ThingSpeak.setField(1, (int)distanceCm);
      ThingSpeak.setField(2, mappedValue);
      int statusCode = ThingSpeak.writeFields(channelID, myWriteAPIKey);

      if (statusCode == 200) {
        Serial.println("TS: Envío exitoso.");
        Serial.print("IP: "); Serial.println(WiFi.localIP());
      } else {
        Serial.print("TS: Error de envío. Código: "); Serial.println(statusCode);
      }
    } else {
      Serial.println("TS: WiFi desconectado, reintentando...");
    }
  }

  // --- BLOQUE 3: FADE DE NEOPIXEL (5 ms) ---
  if (currentMillis - previousMillisFade >= intervalFade) {
    previousMillisFade = currentMillis;

    // LÓGICA DE FADE
    if (currentR != targetR) currentR += (currentR < targetR) ? 1 : -1;
    if (currentG != targetG) currentG += (currentG < targetG) ? 1 : -1;
    if (currentB != targetB) currentB += (currentB < targetB) ? 1 : -1;
    if (currentBrightness != targetBrightness) currentBrightness += (currentBrightness < targetBrightness) ? 1 : -1;

    // APLICAR CAMBIOS A LED
    ws2812b.setBrightness(currentBrightness);
    uint32_t finalColor = ws2812b.Color(currentR, currentG, currentB);
    for (int pixel = 0; pixel < NUM_PIXELS; pixel++) {
      ws2812b.setPixelColor(pixel, finalColor);
    }
    ws2812b.show();
  }
}