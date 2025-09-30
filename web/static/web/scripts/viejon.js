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
            nombre: 'Reposo/sueño',
            probabilidad: 0.4,
            efecto: () => {
                rngMin = 65;
                rngMax = 72;
            }
        },
        {
            nombre: 'Actividad ligera',
            probabilidad: 0.2,
            efecto: () => {
                rngMin = 80;
                rngMax = 90;
            }
        },
        {
            nombre: 'Caminata corta',
            probabilidad: 0.3,
            efecto: () => {
                rngMin = 100;
                rngMax = 110;
            }
        },
        {
            nombre: 'Caminata larga',
            probabilidad: 0.1,
            efecto: () => {
                rngMin = 105;
                rngMax = 120;
                ritmoActual = Math.floor(Math.random() * 31) + 105;
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
