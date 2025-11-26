// Variables Adolescente
let datosAdolescente = [];
let etiquetasAdolescente = [];
let ritmoAdolescente = 55; // pulso inicial típico
let rngMinAd = 40;
let rngMaxAd = 60;
let adolescenteChart = null;
const mxPuntosAd = 12;
let presion = null;
let oxigenacion = null;

// Estructura de eventos para el adolescente
const eventosAdolescente = [
    {
        nombre: 'caminar',
        probabilidad: 0.5,
        efecto: () => {
            rngMinAd = 60;
            rngMaxAd = 100;
        }
    },
    {
        nombre: 'reposo',
        probabilidad: 0.3,
        efecto: () => {
            rngMinAd = 40;
            rngMaxAd = 60;
        }
    },
    {
        nombre: 'correr',
        probabilidad: 0.2,
        efecto: () => {
            rngMinAd = 100;
            rngMaxAd = 140;
        }
    },
    {
        nombre: 'susto',
        probabilidad: 0.1,
        efecto: () => {
            rngMinAd = 160;
            rngMaxAd = 190;
            ritmoAdolescente += Math.floor(Math.random() * 40) + 20; // sube repentinamente
            window.sustoActivoAd = 10; // 10 segundos de bajada gradual
        }
    }
];

let eventoAdolescente = null;

function seleccionarEventoAdolescente() {
    const rand = Math.random();
    let acumulado = 0;
    for (const evento of eventosAdolescente) {
        acumulado += evento.probabilidad;
        if (rand < acumulado) {
            evento.efecto();
            eventoAdolescente = evento.nombre;
            return;
        }
    }
    eventosAdolescente[1].efecto(); // por defecto, reposo
    eventoAdolescente = 'reposo';
}

function calcularPresionYOxigenacionAdolescente(ritmo) {
    let sistolica, diastolica, oxigeno;

    // Presión basada en ritmo
    if (ritmo < 60) { // reposo
        sistolica = Math.floor(110 + Math.random() * 10); // 110–119
        diastolica = Math.floor(70 + Math.random() * 5);  // 70–74
    } else if (ritmo < 100) { // actividad ligera
        sistolica = Math.floor(120 + Math.random() * 10); // 120–129
        diastolica = Math.floor(75 + Math.random() * 10); // 75–84
    } else if (ritmo < 160) { // ejercicio intenso
        sistolica = Math.floor(130 + Math.random() * 15); // 130–144
        diastolica = Math.floor(80 + Math.random() * 10); // 80–89
    } else { // susto o estrés extremo
        sistolica = Math.floor(150 + Math.random() * 30); // 150–180
        diastolica = Math.floor(90 + Math.random() * 10); // 90–99
    }

    // Saturación de oxígeno
    if (ritmo < 160) {
        oxigeno = Math.floor(95 + Math.random() * 5); // 95–99%
    } else {
        oxigeno = Math.floor(92 + Math.random() * 3); // 92–94%
    }

    return { sistolica, diastolica, oxigeno };
}

function generarRitmoAdolescente() {
    const ahora = new Date();

    // Selección de evento cada minuto o primera vez
    if (ahora.getSeconds() === 0 || eventoAdolescente === null) {
        seleccionarEventoAdolescente();
    }

    // Control del susto (descenso rápido)
    if (window.sustoActivoAd && window.sustoActivoAd > 0) {
    ritmoAdolescente -= Math.floor(Math.random() * 6) + 4; // baja entre 4–10 lpm por tick
    window.sustoActivoAd--;
    } else {
        // Simulación normal de ritmo cardiaco
        if (ritmoAdolescente < rngMinAd) {
            ritmoAdolescente += 2;
        } else if (ritmoAdolescente > rngMaxAd) {
            ritmoAdolescente -= 2;
        } else {
            const cambio = Math.floor(Math.random() * 7) - 3; // variación -3 a +3
            let nuevo = ritmoAdolescente + cambio;
            if (nuevo < rngMinAd) nuevo = rngMinAd;
            if (nuevo > rngMaxAd) nuevo = rngMaxAd;
            ritmoAdolescente = nuevo;
        }
    }

     // **Aquí llamamos a la función y obtenemos las variables**
    const { sistolica, diastolica, oxigeno } = calcularPresionYOxigenacionAdolescente(ritmoAdolescente);

     // Aquí ya puedes calcular la presión como string o número
    presion = `${sistolica}/${diastolica}`;
     oxigenacion= oxigeno;
   
     enviarMetricaAdolescente(18, ritmoAdolescente, sistolica, diastolica, oxigeno); // sessionId fijo 
    // Guardar datos
    etiquetasAdolescente.push(ahora.toLocaleTimeString());
    datosAdolescente.push(ritmoAdolescente);
    if (etiquetasAdolescente.length > mxPuntosAd) {
        etiquetasAdolescente = etiquetasAdolescente.slice(-mxPuntosAd);
        datosAdolescente = datosAdolescente.slice(-mxPuntosAd);
    }

    // Mostrar evento
    const eventoElem = document.getElementById('eventoAdolescente');
    if (eventoElem) {
        eventoElem.textContent = `Evento:  ${eventoAdolescente} | Latidos: ${ritmoAdolescente} lpm`;
    }

    actualizarGraficaAdolescente();
}

    function enviarMetricaAdolescente(sessionId, ritmoAdolescente, sistolica, diastolica, oxigeno) {
    fetch("http://127.0.0.1:8000/api/metrica-corazon/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            session: 18,                      // el id de SessionActividad
            ritmo_cardiaco: ritmoAdolescente,                   // el ritmo actual
            presion: parseFloat(`${sistolica}.${diastolica}`), // o guárdala como string si prefieres
            oxigenacion: oxigeno,
            fecha_hora: new Date().toISOString()     // ISO para DRF
        })
    })
    .then(res => {
        if (!res.ok) throw new Error("Error al enviar datos");
        return res.json();
    })
    .then(data => {
        console.log("Métrica guardada:", data);
    })
    .catch(err => {
        console.error("Error al enviar métrica:", err);
    });
}

function actualizarGraficaAdolescente() {
    const canvas = document.getElementById('grafica-adolescente');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!adolescenteChart) {
        adolescenteChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: etiquetasAdolescente,
                datasets: [{
                    label: 'Ritmo Cardíaco Adolescente',
                    data: datosAdolescente,
                    borderColor: 'purple',
                    backgroundColor: 'rgba(128, 0, 128, 0.2)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                    pointBackgroundColor: 'purple',
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true },
                    title: { display: true, text: 'Simulación Ritmo Cardíaco Adolescente' }
                },
                scales: {
                    y: {
                        min: 30,
                        max: 210,
                        title: { display: true, text: 'Latidos por minuto (lpm)' }
                    },
                    x: {
                        title: { display: true, text: 'Hora del día' }
                    }
                }
            }
        });
    } else {
        adolescenteChart.data.labels = etiquetasAdolescente;
        adolescenteChart.data.datasets[0].data = datosAdolescente;
        adolescenteChart.update();
    }
}

// Iniciar simulación
window.addEventListener('DOMContentLoaded', () => {
    // Forzar primer estado: reposo
    rngMinAd = 40;
    rngMaxAd = 60;
     // Seleccionar un primer evento al arrancar
    seleccionarEventoAdolescente();

    // Mostrar primer estado correctamente
    generarRitmoAdolescente();
    setInterval(generarRitmoAdolescente, 1000);
});
