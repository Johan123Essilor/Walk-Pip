// Variables Adolescente
let datosAdolescente = [];
let etiquetasAdolescente = [];
let ritmoAdolescente = 55; // pulso inicial típico
let rngMinAd = 40;
let rngMaxAd = 60;
let adolescenteChart = null;
const mxPuntosAd = 12;

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
        eventoElem.textContent = `Evento: Adolescente | Latidos: ${ritmoAdolescente} lpm`;
    }

    actualizarGraficaAdolescente();
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
    eventoAdolescente = "Adolescente";

    actualizarGraficaAdolescente();
    setInterval(generarRitmoAdolescente, 1000);
});
