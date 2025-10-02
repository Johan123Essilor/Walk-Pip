// Variables para simulación en tiempo real

let datosOficinista = [];
let etiquetasOficinista = [];
let ritmoActualOficinista = 75;
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
            ritmoActualOficinista = Math.floor(Math.random() * 31) + 170; // sube repentinamente
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

function calcularPresionYOxigenacionOficinista(ritmo) {
    let sistolica, diastolica, oxigeno;

    // Presión arterial según el ritmo
    if (ritmo < 80) { // reposo
        sistolica = Math.floor(110 + Math.random() * 10); // 110–119
        diastolica = Math.floor(70 + Math.random() * 5);  // 70–74
    } else if (ritmo < 120) { // caminata ligera
        sistolica = Math.floor(120 + Math.random() * 10); // 120–129
        diastolica = Math.floor(75 + Math.random() * 10); // 75–84
    } else if (ritmo < 160) { // actividad intensa
        sistolica = Math.floor(130 + Math.random() * 15); // 130–144
        diastolica = Math.floor(80 + Math.random() * 10); // 80–89
    } else { // susto / estrés extremo
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
        eventoActual = 'reposo';
    }

    // Simulación de ritmo cardiaco
    if (window.sustoActivo && window.sustoActivo > 0) {
        // Si el evento susto está activo, baja gradualmente
        ritmoActualOficinista -= Math.floor(Math.random() * 4) + 2; // baja entre 2 y 5 lpm por tick
        window.sustoActivo--;
        if (window.sustoActivo === 0) {
            // Al terminar, regresa a rango de senderismo
            rngMin = 110;
            rngMax = 140;
        }
    } else {
        if (ritmoActualOficinista < rngMin) {
            ritmoActualOficinista += 1;
        } else if (ritmoActualOficinista > rngMax) {
            ritmoActualOficinista -= 1;
        } else {
            const cambio = Math.floor(Math.random() * 5) - 2;
            let nuevo = ritmoActualOficinista + cambio;
            if (nuevo < rngMin) nuevo = rngMin;
            if (nuevo > rngMax) nuevo = rngMax;
            ritmoActualOficinista = nuevo;
        }
    }

    // **Aquí llamamos a la función y obtenemos las variables**
    const { sistolica, diastolica, oxigeno } = calcularPresionYOxigenacionOficinista(ritmoActualOficinista);

 presion = `${sistolica}/${diastolica}`;
     oxigenacion= oxigeno;

    enviarMetrica(19, ritmoActualOficinista, sistolica, diastolica, oxigeno); // sessionId fijo en 20 para este ejemplo

    // Guardar datos para la gráfica
    etiquetasOficinista.push(ahora.toLocaleTimeString());
    datosOficinista.push(ritmoActualOficinista);
    if (etiquetasOficinista.length > mxPuntos) {
        etiquetasOficinista = etiquetasOficinista.slice(-mxPuntos);
        datosOficinista = datosOficinista.slice(-mxPuntos);
    }

    // Mostrar evento y latidos en el HTML
    const eventoElem = document.getElementById('eventoActual');
    if (eventoElem) {
        eventoElem.textContent = `Evento: ${eventoActual || '--'} | Latidos: ${ritmoActualOficinista} lpm`;
    }

    // Actualizar gráfica
    actualizarGraficaOficinista();
}

    function enviarMetrica(sessionId, ritmoActualOficinista, sistolica, diastolica, oxigeno) {
    fetch("http://127.0.0.1:8000/api/metrica-corazon/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            session: 19,                      // el id de SessionActividad
            ritmo_cardiaco: ritmoActualOficinista,                   // el ritmo actual
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

