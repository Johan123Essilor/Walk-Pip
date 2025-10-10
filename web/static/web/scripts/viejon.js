const ViejonSim = (() => {
    let dviejon = [];
    let etviejon = [];
    let ritmoActual = 75;
    let rngMin = 75;
    let rngMax = 82;
    let viejonch = null;
    const mxPuntos = 12;

    let viejoeven = null;
    let eventoDuracion = 0;  // contador en segundos

    const eventosSenderismo = [
        {
            nombre: 'Reposo',
            probabilidad: 0.4,
            efecto: () => {
                rngMin = 65;
                rngMax = 72;
            }
        },
        {
            nombre: 'Caminar',
            probabilidad: 0.2,
            efecto: () => {
                rngMin = 80;
                rngMax = 90;
            }
        },
        {
            nombre: 'Correr',
            probabilidad: 0.3,
            efecto: () => {
                rngMin = 100;
                rngMax = 110;
            }
        },
        {
            nombre: 'Susto',
            probabilidad: 0.1,
            efecto: () => {
                rngMin = 120;
                rngMax = 150;
                ritmoActual = Math.floor(Math.random() * 30) + 120;
                window.sustoActivo = 10;
            }
        }
    ];

    function seleccionarEventoSenderismo() {
        const rand = Math.random();
        let acumulado = 0;
        for (const evento of eventosSenderismo) {
            acumulado += evento.probabilidad;
            if (rand < acumulado) {
                evento.efecto();
                viejoeven = evento.nombre;
                return;
            }
        }

        // fallback 50/50 Reposo / Caminata corta
        if (Math.random() < 0.5) {
            eventosSenderismo[0].efecto();
            viejoeven = 'Reposo';
        } else {
            eventosSenderismo[2].efecto();
            viejoeven = 'Caminata corta';
        }
    }

    function calcularPresionYOxigenacionViejon(ritmo) {
    let sistolica, diastolica, oxigeno;

    // --- Presión arterial basada en ritmo (ajustada a adultos mayores) ---
    if (ritmo < 70) { // reposo/sueño
        sistolica = Math.floor(120 + Math.random() * 10); // 120–129
        diastolica = Math.floor(70 + Math.random() * 8);  // 70–77
    } else if (ritmo < 100) { // actividad ligera
        sistolica = Math.floor(130 + Math.random() * 15); // 130–144
        diastolica = Math.floor(75 + Math.random() * 10); // 75–84
    } else if (ritmo < 140) { // caminata corta / esfuerzo moderado
        sistolica = Math.floor(140 + Math.random() * 20); // 140–159
        diastolica = Math.floor(80 + Math.random() * 10); // 80–89
    } else { // caminata larga o estrés
        sistolica = Math.floor(160 + Math.random() * 20); // 160–179
        diastolica = Math.floor(90 + Math.random() * 15); // 90–104
    }

    // --- Saturación de oxígeno (típicamente más baja en adultos mayores) ---
    if (ritmo < 140) {
        oxigeno = Math.floor(93 + Math.random() * 4); // 93–96%
    } else {
        oxigeno = Math.floor(90 + Math.random() * 3); // 90–92%
    }

    return { sistolica, diastolica, oxigeno };
}


    function generarRitmoViejon() {
        const ahora = new Date();

        // Aumentar duración del evento
        eventoDuracion++;

        // Si no hay evento o ya pasaron 2 min (120 segundos)
        if (viejoeven === null || eventoDuracion >= 120) {
            seleccionarEventoSenderismo();
            eventoDuracion = 0;
        }

        // --- Ajustar ritmo cardiaco ---
        if (window.sustoActivo && window.sustoActivo > 0) {
            ritmoActual -= Math.floor(Math.random() * 4) + 2;
            window.sustoActivo--;
            if (window.sustoActivo === 0) {
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

        const { sistolica, diastolica, oxigeno } = calcularPresionYOxigenacionViejon(ritmoActual);
          // Aquí ya puedes calcular la presión como string o número
    presion = `${sistolica}/${diastolica}`;
     oxigenacion= oxigeno;

     enviarMetricaViejon(20, ritmoActual, sistolica, diastolica, oxigeno); // sessionId fijo en 20 para este ejemplo

        // Guardar datos
        const hora = ahora.toLocaleTimeString();
        etviejon.push(hora);
        dviejon.push(ritmoActual);

        if (etviejon.length > mxPuntos) {
            etviejon = etviejon.slice(-mxPuntos);
            dviejon = dviejon.slice(-mxPuntos);
        }

        const eventoElem = document.getElementById('viejoeven');
        if (eventoElem) {
            eventoElem.textContent = `Evento: ${viejoeven || '--'} | Latidos: ${ritmoActual} lpm`;
        }

        actualizarGraficaViejon();
    }

    function enviarMetricaViejon(sessionId, ritmoActual, sistolica, diastolica, oxigeno) {
    fetch("http://127.0.0.1:8000/api/metrica-corazon/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            session: 20,                      // el id de SessionActividad
            ritmo_cardiaco: ritmoActual,                   // el ritmo actual
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

    function actualizarGraficaViejon() {
        const canvas = document.getElementById('viejon_grf');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!viejonch) {
            viejonch = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: etviejon,
                    datasets: [{
                        label: 'Ritmo Cardíaco Viejo',
                        data: dviejon,
                        borderColor: 'green',
                        backgroundColor: 'rgba(3, 36, 13, 0.1)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 3,
                        pointBackgroundColor: 'green',
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: true },
                        title: { display: true, text: 'Simulación Ritmo Cardíaco Viejo' }
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
            viejonch.data.labels = etviejon;
            viejonch.data.datasets[0].data = dviejon;
            viejonch.update();
        }
    }

    return { iniciar: generarRitmoViejon };
})();

window.addEventListener('DOMContentLoaded', () => {
    ViejonSim.iniciar();
    setInterval(ViejonSim.iniciar, 1000);
});
