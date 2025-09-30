// Variables para simulación en tiempo real

let datosOficinista = [];
let etiquetasOficinista = [];
let ritmoActual = 75;
let rngMin = 60;
let rngMax = 80;
let oficinistaChart = null;
const mxPuntos = 12;

// Estructura de eventos para la caminata
const eventosSenderismo = [
    {
        nombre: 'caminar',
        probabilidad: 0.5,
        efecto: () => {
            rngMin = 110;
            rngMax = 140;
        }
    },
    {
        nombre: 'parada',
        probabilidad: 0.3,
        efecto: () => {
            rngMin = 80;
            rngMax = 100;
        }
    },
    {
        nombre: 'correr',
        probabilidad: 0.2,
        efecto: () => {
            rngMin = 140;
            rngMax = 170;
        }
    },
    {
        nombre: 'susto',
        probabilidad: 0.1,
        efecto: () => {
            rngMin = 160;
            rngMax = 190;
            ritmoActual = Math.floor(Math.random() * 31) + 170; // sube repentinamente
            window.sustoActivo = 10; // 10 segundos de bajada gradual
        }
    }
];

let eventoActual = null;

function seleccionarEventoSenderismo() {
    // Selecciona un evento random según la probabilidad
    const rand = Math.random();
    let acumulado = 0;
    for (const evento of eventosSenderismo) {
        acumulado += evento.probabilidad;
        if (rand < acumulado) {
            evento.efecto();
            eventoActual = evento.nombre;
            return;
        }
    }
    // Por defecto, caminar
    eventosSenderismo[0].efecto();
    eventoActual = eventosSenderismo[0].nombre;
}

function generarRitmoOficinista() {
    // Obtener hora actual
    const ahora = new Date();
    const hora = ahora.getHours();

    // Si está en horario de senderismo, selecciona evento random cada minuto
    if (hora >= 18 && hora < 19) {
        if (ahora.getSeconds() === 0 || eventoActual === null) {
            seleccionarEventoSenderismo();
        }
    } else {
        rngMin = 60;
        rngMax = 80;
        eventoActual = 'oficina';
    }

    // Simulación de ritmo cardiaco
    if (window.sustoActivo && window.sustoActivo > 0) {
        // Si el evento susto está activo, baja gradualmente
        ritmoActual -= Math.floor(Math.random() * 4) + 2; // baja entre 2 y 5 lpm por tick
        window.sustoActivo--;
        if (window.sustoActivo === 0) {
            // Al terminar, regresa a rango de senderismo
            rngMin = 110;
            rngMax = 140;
        }
    } else {
        if (ritmoActual < rngMin) {
            ritmoActual += 1;
        } else if (ritmoActual > rngMax) {
            ritmoActual -= 1;
        } else {
            const cambio = Math.floor(Math.random() * 5) - 2;
            let nuevo = ritmoActual + cambio;
            if (nuevo < rngMin) nuevo = rngMin;
            if (nuevo > rngMax) nuevo = rngMax;
            ritmoActual = nuevo;
        }
    }

    // Guardar datos para la gráfica
    etiquetasOficinista.push(ahora.toLocaleTimeString());
    datosOficinista.push(ritmoActual);
    if (etiquetasOficinista.length > mxPuntos) {
        etiquetasOficinista = etiquetasOficinista.slice(-mxPuntos);
        datosOficinista = datosOficinista.slice(-mxPuntos);
    }

    // Mostrar evento y latidos en el HTML
    const eventoElem = document.getElementById('eventoActual');
    if (eventoElem) {
        eventoElem.textContent = `Evento: ${eventoActual || '--'} | Latidos: ${ritmoActual} lpm`;
    }

    // Actualizar gráfica
    actualizarGraficaOficinista();
}

function actualizarGraficaOficinista() {
    const canvas = document.getElementById('grafica-oficinista');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!oficinistaChart) {
        oficinistaChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: etiquetasOficinista,
                datasets: [{
                    label: 'Ritmo Cardíaco Oficinista',
                    data: datosOficinista,
                    borderColor: 'blue',
                    backgroundColor: 'rgba(0, 0, 255, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                    pointBackgroundColor: 'blue',
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true },
                    title: { display: true, text: 'Simulación Ritmo Cardíaco Oficinista' }
                },
                scales: {
                    y: {
                        min: 50,
                        max: 200,
                        title: { display: true, text: 'Latidos por minuto (lpm)' }
                    },
                    x: {
                        title: { display: true, text: 'Hora del día' }
                    }
                }
            }
        });
    } else {
        oficinistaChart.data.labels = etiquetasOficinista;
        oficinistaChart.data.datasets[0].data = datosOficinista;
        oficinistaChart.update();
    }
}

// Iniciar simulación automática cada segundo
window.addEventListener('DOMContentLoaded', () => {
    actualizarGraficaOficinista();
    setInterval(generarRitmoOficinista, 1000);
});

