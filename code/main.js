// ==========================================================
// CONFIGURACIÓN DE THING SPEAK
// ==========================================================
const CHANNEL_ID = process.env.CHANNEL_ID;
const READ_API_KEY = process.env.READ_API_KEY;

const RESULTS = 10;
const URL_API = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${READ_API_KEY}&results=${RESULTS}`;
console.log("Canal ID (desde .env):", CHANNEL_ID);
console.log("API Key (desde .env):", READ_API_KEY);
console.log("Resultados (desde .env):", RESULTS);
// Variables globales para almacenar los datos procesados
let fechas = [];
let distancias = [];
let luz = [];

let conteoBrilloUp = 0;
let conteoBrilloDown = 0;
let conteoBrilloAutomatic = 0;
let conteoMsjSend = 0;
let conteoClearOled = 0;
let conteoEncenderBuzzer = 0;
let conteoApagarBuzzer = 0;

// Variables globales para las instancias de Chart.js
let chartDistanciaInstance = null;
let chartLuzInstance = null;
let chartHistogramaDistanciaInstance = null;
let chartHistogramaLuzInstance = null;

// ==========================================================
// BOTONES ACCIONADORES
// ==========================================================

// 1. Boton para encender y apagar buzzer

document.addEventListener("DOMContentLoaded", () => {
  // Definimos una única referencia a localStorage para consistencia
  const storage = window.localStorage;

  // Función auxiliar para cargar el valor de localStorage o usar 0 si no existe
  const cargarContador = (key, variable) => {
    // Obtenemos el valor. Si no existe, es null. Usamos un operador OR (||) para usar '0' por defecto.
    // Usamos parseInt para asegurar que el valor sea un número.
    const valorGuardado = parseInt(storage.getItem(key)) || 0;

    // Asignar el valor al elemento HTML
    const elemento = document.getElementById(key);
    if (elemento) {
      elemento.textContent = `Veces encendido: ${valorGuardado}`;
    }

    return valorGuardado; // Retornamos el valor para asignarlo a la variable global
  };

  // Cargar y asignar los valores guardados a las variables globales
  conteoBrilloDown = cargarContador("conteoBrilloDown", conteoBrilloDown);
  conteoBrilloUp = cargarContador("conteoBrilloUp", conteoBrilloUp);
  conteoBrilloAutomatic = cargarContador(
    "conteoBrilloAutomatic",
    conteoBrilloAutomatic
  );
  conteoMsjSend = cargarContador("conteoMsjSend", conteoMsjSend);
  conteoClearOled = cargarContador("conteoClearOled", conteoClearOled);
  conteoEncenderBuzzer = cargarContador(
    "conteoEncenderBuzzer",
    conteoEncenderBuzzer
  );
  conteoApagarBuzzer = cargarContador("conteoApagarBuzzer", conteoApagarBuzzer);
});

// 3. Listener para el botón (sin cambios, solo se asegura que la función de actualizar se llame)
document
  .getElementById("btnEncenderBuzzer")
  .addEventListener("click", async () => {
    const response = await fetch("http://10.207.196.227/buzzer/on");
    // Llama a la función de actualización después de la petición
    cambiartxtencenderBuzzer();
  });

// 4. Función de Actualización (Incremento y Guardado)
const cambiartxtencenderBuzzer = () => {
  const storage = window.localStorage;

  // 1. Incrementar la variable global
  conteoEncenderBuzzer++;

  // 2. Guardar el nuevo valor en localStorage
  // setItem siempre guarda un string, lo cual está bien.
  storage.setItem("conteoEncenderBuzzer", conteoEncenderBuzzer);

  // 3. Actualizar el contenido del elemento HTML
  document.getElementById(
    "conteoEncenderBuzzer"
  ).textContent = `Veces encendido: ${conteoEncenderBuzzer}`;
};

document
  .getElementById("btnApagarBuzzer")
  .addEventListener("click", async () => {
    const response = await fetch("http://10.207.196.227/buzzer/off");
  });

const cambiartxtapagarBuzzer = (e) => {
  const storage = window.localStorage;

  conteoApagarBuzzer++;

  // 2. Guardar el nuevo valor en localStorage
  // setItem siempre guarda un string, lo cual está bien.
  storage.setItem("conteoApagarBuzzer", conteoApagarBuzzer);
  document.getElementById(
    "conteoApagarBuzzer"
  ).textContent = `Veces apagado: ${conteoApagarBuzzer}`;
};

// 3. Boton para OLED
document.getElementById("BtnOled").addEventListener("click", async () => {
  const mensaje = document.getElementById("msjToSend").value;
  const mensajeCodificado = encodeURIComponent(mensaje);
  const response = await fetch(
    `http://10.207.196.227/message?text=${mensajeCodificado}`
  );
});

const cambiartxtoled = (e) => {
  const storage = window.localStorage;
  conteoMsjSend++;

  // 2. Guardar el nuevo valor en localStorage
  // setItem siempre guarda un string, lo cual está bien.
  storage.setItem("conteoMsjSend", conteoMsjSend);
  document.getElementById(
    "conteoMsjSend"
  ).textContent = `Mensajes asignados: ${conteoMsjSend}`;
};

document.getElementById("BtnClearOled").addEventListener("click", async () => {
  const response = await fetch(`http://10.207.196.227/oled/auto`);
});

const cambiartxtclearoled = (e) => {
  const storage = window.localStorage;
  conteoClearOled++;

  // 2. Guardar el nuevo valor en localStorage
  storage.setItem("conteoClearOled", conteoClearOled);
  document.getElementById(
    "conteoClearOled"
  ).textContent = `Veces aclarado: ${conteoClearOled}`;
};

// 4. Botones para controlar brillo de luces led
document.getElementById("btnBrilloUp").addEventListener("click", async () => {
  const response = await fetch("http://10.207.196.227/leds/max");
});

const cambiartxtbrillomaximo = (e) => {
  const storage = window.localStorage;
  conteoBrilloUp++;
  // 2. Guardar el nuevo valor en localStorage
  storage.setItem("conteoBrilloUp", conteoBrilloUp);
  document.getElementById(
    "conteoBrilloUp"
  ).textContent = `Veces iluminado al maximo: ${conteoBrilloUp}`;
};

document.getElementById("btnBrilloDown").addEventListener("click", async () => {
  const response = await fetch("http://10.207.196.227/leds/min");
});

const cambiartxtbrillominimo = (e) => {
  const storage = window.localStorage;
  conteoBrilloDown++;
  // 2. Guardar el nuevo valor en localStorage
  storage.setItem("conteoBrilloDown", conteoBrilloDown);
  document.getElementById(
    "conteoBrilloDown"
  ).textContent = `Veces iluminado al minimo: ${conteoBrilloDown}`;
};

document
  .getElementById("brilloAutomatic")
  .addEventListener("click", async () => {
    const response = await fetch("http://10.207.196.227/leds/auto");
  });

const cambiartxtbrilloaut = (e) => {
  const storage = window.localStorage;
  conteoBrilloAutomatic++;
  // 2. Guardar el nuevo valor en localStorage
  storage.setItem("conteoBrilloAutomatic", conteoBrilloAutomatic);
  document.getElementById(
    "conteoBrilloAutomatic"
  ).textContent = `Veces iluminado en automatico: ${conteoBrilloAutomatic}`;
};

// ==========================================================
// FUNCIÓN: CÁLCULO COMPLETO DE ESTADÍSTICAS Y BINNING
// ==========================================================
function calculateFullStatsAndBinData(dataArray, type) {
  if (dataArray.length === 0)
    return {
      media: 0,
      mediana: 0,
      moda: 0,
      rango: 0,
      min: 0,
      max: 0,
      varianza: 0,
      desvEst: 0,
      binLabels: [],
      binFrequencies: [],
    };

  // --- 1. Ordenar y Cálculos Básicos ---
  const sortedArray = [...dataArray].sort((a, b) => a - b);
  const n = sortedArray.length;
  const sum = dataArray.reduce((acc, val) => acc + val, 0);

  const media = sum / n;
  const min = sortedArray[0];
  const max = sortedArray[n - 1];
  const rango = max - min;

  // --- 2. Mediana ---
  let mediana;
  if (n % 2 === 0) {
    mediana = (sortedArray[n / 2 - 1] + sortedArray[n / 2]) / 2;
  } else {
    mediana = sortedArray[Math.floor(n / 2)];
  }

  // --- 3. Moda ---
  const counts = {};
  let maxCount = 0;
  let moda = [];
  for (const num of dataArray) {
    counts[num] = (counts[num] || 0) + 1;
    if (counts[num] > maxCount) {
      maxCount = counts[num];
    }
  }
  for (const num in counts) {
    if (counts[num] === maxCount) {
      moda.push(parseFloat(num));
    }
  }
  // Si todas son únicas, la moda es 'N/A' o el primer elemento, elegimos 'N/A' si todas tienen frecuencia 1
  if (maxCount <= 1 && n > 0) {
    moda = ["N/A"];
  }

  // --- 4. Varianza y Desviación Estándar ---
  const squaredDifferences = dataArray.map((val) => Math.pow(val - media, 2));
  // Varianza muestral: suma de diferencias cuadradas / (n - 1)
  const varianza =
    squaredDifferences.reduce((acc, val) => acc + val, 0) / (n - 1);
  const desvEst = Math.sqrt(varianza);

  // --- 5. Binning (Histograma) ---
  let bins = [];
  let binLabels = [];

  if (type === "distancia") {
    // Binning para Distancia (Cada 5 cm)
    const BIN_SIZE = 5;
    const MAX_BIN_VAL = 50; // Asumiendo que el sensor HC-SR04 tiene un rango máximo práctico de 50-60cm
    const numBins = Math.ceil(MAX_BIN_VAL / BIN_SIZE);

    bins = new Array(numBins).fill(0);

    for (let i = 0; i < numBins; i++) {
      const lowerBound = i * BIN_SIZE;
      const upperBound = (i + 1) * BIN_SIZE;
      binLabels.push(`${lowerBound}-${upperBound} cm`);

      dataArray.forEach((val) => {
        // Los valores en el borde del bin se cuentan en el bin superior (excepto el máximo)
        if (val >= lowerBound && val < upperBound) {
          bins[i]++;
        } else if (i === numBins - 1 && val >= upperBound) {
          // Captura valores mayores a MAX_BIN_VAL en el último bin
          bins[i]++;
        }
      });
    }
  } else if (type === "luz") {
    // Binning específico para LDR: 0-500 y 500-1200
    bins = [0, 0];
    binLabels = ["0-500", "501-1200"];

    dataArray.forEach((val) => {
      if (val >= 0 && val <= 500) {
        bins[0]++;
      } else if (val > 500 && val <= 1200) {
        bins[1]++;
      }
      // Se ignoran valores fuera del rango 0-1200
    });
  }

  return {
    media: media.toFixed(2),
    mediana: mediana.toFixed(2),
    moda: moda.join(", "),
    rango: rango.toFixed(2),
    min: min.toFixed(2),
    max: max.toFixed(2),
    varianza: varianza.toFixed(2),
    desvEst: desvEst.toFixed(2),
    binLabels,
    binFrequencies: bins,
  };
}

// ==========================================================
// FUNCIÓN PRINCIPAL: OBTENER DATOS
// ==========================================================
async function fetchSensorData() {
  try {
    const response = await fetch(URL_API);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // Limpiar arrays antes de procesar nuevos datos
    fechas = [];
    distancias = [];
    luz = [];

    // Procesar cada entrada (feed)
    data.feeds.forEach((feed) => {
      fechas.push(feed.created_at);
      // Asegura que solo se usen números válidos
      const dist = parseFloat(feed.field1);
      const light = parseFloat(feed.field2);

      if (!isNaN(dist)) distancias.push(dist);
      if (!isNaN(light)) luz.push(light);
    });

    // Obtener estadísticas y datos binned
    const statsDistancia = calculateFullStatsAndBinData(
      distancias,
      "distancia"
    );
    const statsLuz = calculateFullStatsAndBinData(luz, "luz");

    // 1. Mostrar Estadísticas Completas
    document.getElementById("statsContainer").innerHTML = `
            <div class="stats-box">
                <h3>Distancia (cm)</h3>
                <p>Media: <strong>${statsDistancia.media}</strong></p>
                <p>Mediana: <strong>${statsDistancia.mediana}</strong></p>
                <p>Moda: <strong>${statsDistancia.moda}</strong></p>
                <p>Desviación Estándar: <strong>${statsDistancia.desvEst}</strong></p>
                <p>Varianza: <strong>${statsDistancia.varianza}</strong></p>
                <p>Rango: <strong>${statsDistancia.rango}</strong></p>
                <p>Mínimo: <strong>${statsDistancia.min}</strong></p>
                <p>Máximo: <strong>${statsDistancia.max}</strong></p>
            </div>
            <div class="stats-box">
                <h3>Luz (Mapeada)</h3>
                <p>Media: <strong>${statsLuz.media}</strong></p>
                <p>Mediana: <strong>${statsLuz.mediana}</strong></p>
                <p>Moda: <strong>${statsLuz.moda}</strong></p>
                <p>Desviación Estándar: <strong>${statsLuz.desvEst}</strong></p>
                <p>Varianza: <strong>${statsLuz.varianza}</strong></p>
                <p>Rango: <strong>${statsLuz.rango}</strong></p>
                <p>Mínimo: <strong>${statsLuz.min}</strong></p>
                <p>Máximo: <strong>${statsLuz.max}</strong></p>
            </div>
            `;

    // 2. Llamar a las funciones de dibujo/actualización
    drawDistanceChart();
    drawLightChart();
    drawHistogramaDistancia(
      statsDistancia.binLabels,
      statsDistancia.binFrequencies
    );
    drawHistogramaLuz(statsLuz.binLabels, statsLuz.binFrequencies);
  } catch (error) {
    console.error("Error al obtener datos de ThingSpeak:", error);
    document.querySelector("h1").innerText =
      "🔴 ERROR: No se pudieron cargar los datos (Ver consola).";
  }
}

// ==========================================================
// FUNCIÓN: DIBUJAR/ACTUALIZAR GRÁFICO DE DISTANCIA (Línea)
// ==========================================================
function drawDistanceChart() {
  const ctx = document.getElementById("chartDistancia").getContext("2d");

  if (chartDistanciaInstance) {
    chartDistanciaInstance.data.labels = fechas;
    chartDistanciaInstance.data.datasets[0].data = distancias;
    chartDistanciaInstance.update();
  } else {
    chartDistanciaInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: fechas,
        datasets: [
          {
            label: "Distancia (cm)",
            data: distancias,
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderWidth: 2,
            tension: 0.4,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: "time",
            time: {
              unit: "minute",
            },
            title: { display: true, text: "Tiempo" },
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: "Distancia (cm)" },
          },
        },
      },
    });
  }
}

// ==========================================================
// FUNCIÓN: DIBUJAR/ACTUALIZAR HISTOGRAMA DE DISTANCIA
// ==========================================================
function drawHistogramaDistancia(labels, frequencies) {
  const ctx = document
    .getElementById("chartHistogramaDistancia")
    .getContext("2d");

  if (chartHistogramaDistanciaInstance) {
    chartHistogramaDistanciaInstance.data.labels = labels;
    chartHistogramaDistanciaInstance.data.datasets[0].data = frequencies;
    chartHistogramaDistanciaInstance.update();
  } else {
    chartHistogramaDistanciaInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Frecuencia de Medidas (Distancia)",
            data: frequencies,
            backgroundColor: "rgba(75, 192, 192, 0.8)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
            barPercentage: 1.0,
            categoryPercentage: 1.0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { display: true, text: "Rango de Distancia (cm)" },
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: "Número de Lecturas" },
          },
        },
      },
    });
  }
}

// ==========================================================
// FUNCIÓN: DIBUJAR/ACTUALIZAR GRÁFICO DE LUZ (Línea)
// ==========================================================
function drawLightChart() {
  const ctx = document.getElementById("chartLuz").getContext("2d");

  if (chartLuzInstance) {
    chartLuzInstance.data.labels = fechas;
    chartLuzInstance.data.datasets[0].data = luz;
    chartLuzInstance.update();
  } else {
    chartLuzInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: fechas,
        datasets: [
          {
            label: "Luz Mapeada (0-1000)",
            data: luz,
            borderColor: "rgba(255, 159, 64, 1)",
            backgroundColor: "rgba(255, 159, 64, 0.2)",
            borderWidth: 2,
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: "time",
            time: {
              unit: "minute",
            },
            title: { display: true, text: "Tiempo" },
          },
          y: {
            beginAtZero: true,
            max: 1000,
            title: { display: true, text: "Nivel de Luz" },
          },
        },
      },
    });
  }
}

// ==========================================================
// FUNCIÓN: DIBUJAR/ACTUALIZAR HISTOGRAMA DE LUZ
// ==========================================================
function drawHistogramaLuz(labels, frequencies) {
  const ctx = document.getElementById("chartHistogramaLuz").getContext("2d");

  if (chartHistogramaLuzInstance) {
    chartHistogramaLuzInstance.data.labels = labels;
    chartHistogramaLuzInstance.data.datasets[0].data = frequencies;
    chartHistogramaLuzInstance.update();
  } else {
    chartHistogramaLuzInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Frecuencia de Medidas (LDR)",
            data: frequencies,
            backgroundColor: "rgba(255, 159, 64, 0.8)",
            borderColor: "rgba(255, 159, 64, 1)",
            borderWidth: 1,
            barPercentage: 0.9,
            categoryPercentage: 0.9,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: "Rango de Luz (Mapeado)" } },
          y: {
            beginAtZero: true,
            title: { display: true, text: "Número de Lecturas" },
          },
        },
      },
    });
  }
}

// ==========================================================
// INICIO Y ACTUALIZACIÓN (TIEMPO REAL)
// ==========================================================

// 1. Obtiene y dibuja los datos iniciales al cargar la página
fetchSensorData();

// 2. Configura la actualización continua (cada 30 segundos)
setInterval(fetchSensorData, 30000);
