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

// --- Modal ---
const sessionButton = document.getElementById("sessionButton");
const sessionModal = document.getElementById("sessionModal");
const closeModal = document.getElementById("closeModal");
const sessionForm = document.getElementById("sessionForm");

// Abrir modal para iniciar sesión
sessionButton.onclick = () => {
    if (activeSessionId) {
        // Si ya hay sesión activa, termina la sesión
        terminarSesion();
    } else {
        // Si no hay sesión, abre modal para crearla
        sessionModal.style.display = "block";
    }
};

// Cerrar modal
closeModal.onclick = () => {
    sessionModal.style.display = "none";
};

// --- Crear nueva sesión ---
sessionForm.onsubmit = async (e) => {
    e.preventDefault();

    const usuarioId = localStorage.getItem("usuario_id");
    if (!usuarioId) {
        alert("⚠️ Debes iniciar sesión antes de guardar una sesión de actividad.");
        return;
    }

const datosSesion = {
    usuario: usuarioId,
    cita: document.getElementById("cita").value || null,
    ubicacion_inicial: document.getElementById("ubicacion_inicial").value,
    ubicacion_final: document.getElementById("ubicacion_final").value,
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

            // Guardar ID de la sesión activa
            activeSessionId = data.ID;

            // Cambiar botón para terminar sesión
            sessionButton.textContent = "Terminar Sesión";
        } else {
            console.error("Error en respuesta:", data);
            alert("❌ Error al iniciar sesión: " + JSON.stringify(data));
        }

    } catch (err) {
        console.error("Error de red:", err);
        alert("❌ Error de conexión con el servidor");
    }
};

// --- Terminar sesión ---
async function terminarSesion() {
    if (!activeSessionId) {
        alert("⚠️ No hay ninguna sesión activa para terminar.");
        return;
    }

    try {
        const res = await fetch(`http://127.0.0.1:8000/api/session-actividades/${activeSessionId}/terminar/`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrftoken
            }
        });

        const data = await res.json();
        if (res.ok) {
            alert("✅ Sesión finalizada correctamente.");
            activeSessionId = null;

            // Cambiar botón de nuevo a "Iniciar Sesión"
            sessionButton.textContent = "Iniciar Sesión";
        } else {
            console.error("Error en respuesta:", data);
            alert("❌ Error al finalizar sesión: " + JSON.stringify(data));
        }

    } catch (err) {
        console.error("Error de red:", err);
        alert("❌ Error de conexión con el servidor");
    }
}
