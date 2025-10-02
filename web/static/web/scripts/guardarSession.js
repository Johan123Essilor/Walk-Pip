// static/web/scripts/guardarSession.js

// --- Función para obtener CSRF token ---
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
const csrftoken = getCookie('csrftoken');

// --- Variables globales ---
let activeSessionId = null;

// --- Modal sesión ---
const sessionButton = document.getElementById("sessionButton");
const sessionModal = document.getElementById("sessionModal");
const closeModal = document.getElementById("closeModal");
const sessionForm = document.getElementById("sessionForm");

// --- Modal métricas ---
const metricaModal = document.getElementById("metricaModal");
const closeMetrica = document.getElementById("closeMetrica");
const metricaForm = document.getElementById("metricaForm");

// --- Abrir modal de nueva sesión ---
sessionButton.onclick = () => {
    if (activeSessionId) {
        // Si hay sesión activa, abrir modal de métricas para terminar
        metricaModal.style.display = "block";
    } else {
        // Abrir modal de inicio de sesión
        sessionModal.style.display = "block";
    }
};

// --- Cerrar modales ---
closeModal.onclick = () => sessionModal.style.display = "none";
closeMetrica.onclick = () => metricaModal.style.display = "none";

// --- Crear nueva sesión ---
sessionForm.onsubmit = async (e) => {
    e.preventDefault();

    const usuarioId = localStorage.getItem("usuario_id");
    if (!usuarioId) {
        alert("⚠️ Debes iniciar sesión primero.");
        return;
    }

    const datosSesion = {
        usuario: usuarioId,
        cita: document.getElementById("cita").value || null,
        ubicacion_inicial: document.getElementById("ubicacion_inicial").value,
        ubicacion_final: document.getElementById("ubicacion_final").value || null,
        ruta: document.getElementById("ruta").value
    };

    try {
        const res = await fetch("http://127.0.0.1:8000/api/session-actividades/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrftoken
            },
            body: JSON.stringify(datosSesion)
        });

        const data = await res.json();
        if (res.ok) {
            alert("✅ Sesión iniciada correctamente.");
            sessionModal.style.display = "none";
            sessionForm.reset();

            activeSessionId = data.ID;
            sessionButton.textContent = "Terminar Sesión";

            // Toggle session en backend
            await fetch("http://127.0.0.1:8000/api/usuarios/toggle_session/", {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-CSRFToken": csrftoken },
                credentials: "include",
                body: JSON.stringify({ activo: true })
            });

        } else {
            console.error("Error al iniciar sesión:", data);
            alert("❌ " + JSON.stringify(data));
        }
    } catch (err) {
        console.error("Error de red:", err);
        alert("❌ Error de conexión con el servidor");
    }
};

// --- Guardar métricas y terminar sesión ---
metricaForm.onsubmit = async (e) => {
    e.preventDefault();

    const usuarioId = localStorage.getItem("usuario_id");
    if (!usuarioId || !activeSessionId) {
        alert("⚠️ No hay sesión activa.");
        return;
    }

    const datosMetrica = {
        km_recorridos: document.getElementById("km_recorridos").value,
        pasos: document.getElementById("pasos").value,
        tiempo_actividad: document.getElementById("tiempo_actividad").value,
        velocidad_promedio: document.getElementById("velocidad_promedio").value,
        calorias_quemadas: document.getElementById("calorias_quemadas").value,
        session: activeSessionId
    };

    try {
        // 1️⃣ Guardar métricas
        const resMetrica = await fetch("http://127.0.0.1:8000/api/metrica-caminata/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrftoken
            },
            body: JSON.stringify(datosMetrica)
        });

        const dataMetrica = await resMetrica.json();
        if (!resMetrica.ok) {
            console.error("Error en métricas:", dataMetrica);
            alert("❌ Error al guardar métricas");
            return;
        }

        // 2️⃣ Terminar sesión
        const res = await fetch(`http://127.0.0.1:8000/api/session-actividades/${activeSessionId}/terminar/`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrftoken
            }
        });

        const data = await res.json();
        if (res.ok) {
            alert("✅ Sesión finalizada y métricas guardadas.");
            activeSessionId = null;
            sessionButton.textContent = "Iniciar Sesión";
            metricaModal.style.display = "none";

            // Toggle session en backend
            await fetch("http://127.0.0.1:8000/api/usuarios/toggle_session/", {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-CSRFToken": csrftoken },
                credentials: "include",
                body: JSON.stringify({ activo: false })
            });
        } else {
            console.error("Error al finalizar sesión:", data);
            alert("❌ Error al finalizar sesión");
        }

    } catch (err) {
        console.error("Error de red:", err);
        alert("❌ Error de conexión con el servidor");
    }
};

// --- Verificar si hay sesión activa al cargar ---
async function verificarSesionActiva() {
    const usuarioId = localStorage.getItem("usuario_id");
    if (!usuarioId) return;

    try {
        const res = await fetch("http://127.0.0.1:8000/api/usuarios/session_status/", {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });
        const data = await res.json();
        if (res.ok && data.ultima_session) {
            activeSessionId = data.ultima_session.ID;
            sessionButton.textContent = "Terminar Sesión";
        } else {
            activeSessionId = null;
            sessionButton.textContent = "Iniciar Sesión";
        }
    } catch (err) {
        console.error("Error al consultar sesión activa:", err);
    }
}

// --- Ejecutar al cargar la página ---
window.addEventListener('DOMContentLoaded', verificarSesionActiva);
