// Graficas.jsx - Versión MEJORADA con alertas visibles
import React, { useState, useEffect } from 'react';
import sensorService from '../services/sensorService';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const Graficas = () => {
    const [corazonData, setCorazonData] = useState([]);
    const [caminataData, setCaminataData] = useState([]);
    const [resumen, setResumen] = useState({});
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [alertas, setAlertas] = useState([]);
    const [totalAlertasNoLeidas, setTotalAlertasNoLeidas] = useState(0);
    const [mostrarTodasAlertas, setMostrarTodasAlertas] = useState(false);

    const fetchData = async () => {
        try {
            const data = await sensorService.getDashboardData();

            setCorazonData(data.corazon);
            setCaminataData(data.caminata);
            setResumen(data.resumen);
            setAlertas(data.alertas || []);
            setTotalAlertasNoLeidas(data.totalAlertasNoLeidas || 0);
            setLastUpdate(new Date().toLocaleTimeString('es-ES'));

        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Actualizar cada 3 segundos
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, []);

    // Función para marcar alertas como leídas
    const marcarAlertasLeidas = async () => {
        try {
            await sensorService.marcarAlertasLeidas();
            // Actualizar estado local
            setAlertas(prev => prev.map(alerta => ({ ...alerta, leida: true })));
            setTotalAlertasNoLeidas(0);
        } catch (error) {
            console.error('Error marcando alertas:', error);
        }
    };

    // Filtrar alertas por tipo
    const alertasRitmoAlto = alertas.filter(a => a.tipo === 'ritmo_alto');
    const alertasRitmoBajo = alertas.filter(a => a.tipo === 'ritmo_bajo');
    const alertasOxigenacion = alertas.filter(a => a.tipo === 'oxigenacion_baja');
    const alertasInformativas = alertas.filter(a => a.tipo === 'info');

    // Preparar datos para gráficas
    const graficaCorazon = corazonData.map(item => ({
        hora: item.hora ? item.hora.split(':')[0] + ':' + item.hora.split(':')[1] : '--:--',
        ritmo: item.ritmo_cardiaco || 0,
        oxigenacion: item.oxigenacion || 0
    })).reverse();

    const graficaPasos = caminataData.map(item => ({
        hora: item.timestamp ? new Date(item.timestamp).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        }) : '--:--',
        pasos: item.pasos || 0,
        km: item.km_recorridos || 0
    })).reverse();

    // Obtener el valor actual de ritmo cardíaco para mostrar alerta visual
    const ritmoActual = resumen.corazon?.ultimo_ritmo || 0;
    const oxigenacionActual = resumen.corazon?.ultima_oxigenacion || 0;

    // Determinar estado del ritmo cardíaco
    const getEstadoRitmo = () => {
        if (ritmoActual > 180) return { tipo: 'critico', texto: 'CRÍTICO', color: 'dark' };
        if (ritmoActual > 160) return { tipo: 'alto', texto: 'ALTO', color: 'danger' };
        if (ritmoActual < 50) return { tipo: 'bajo', texto: 'BAJO', color: 'warning' };
        if (ritmoActual >= 110 && ritmoActual <= 140) return { tipo: 'optimo', texto: 'ÓPTIMO', color: 'success' };
        return { tipo: 'normal', texto: 'NORMAL', color: 'info' };
    };

    // Determinar estado de oxigenación
    const getEstadoOxigenacion = () => {
        if (oxigenacionActual < 90) return { tipo: 'critico', texto: 'CRÍTICO', color: 'dark' };
        if (oxigenacionActual < 92) return { tipo: 'bajo', texto: 'BAJO', color: 'danger' };
        if (oxigenacionActual >= 95) return { tipo: 'optimo', texto: 'ÓPTIMO', color: 'success' };
        return { tipo: 'normal', texto: 'NORMAL', color: 'info' };
    };

    const estadoRitmo = getEstadoRitmo();
    const estadoOxigenacion = getEstadoOxigenacion();

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
                <span className="ms-2">Cargando métricas...</span>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            {/* Header con indicador de alertas */}
            <div className="row mb-4">
                <div className="col-12">
                    <h1 className="h2 text-center">📈 Métricas en Tiempo Real</h1>
                    <p className="text-muted text-center">
                        Últimos 10 registros | Actualización cada 3 segundos
                        {lastUpdate && (
                            <span className="ms-2 text-success">
                                ✅ {lastUpdate}
                            </span>
                        )}
                        {totalAlertasNoLeidas > 0 && (
                            <span className="ms-2 badge bg-danger">
                                🚨 {totalAlertasNoLeidas} alerta{totalAlertasNoLeidas !== 1 ? 's' : ''}
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* SECCIÓN DE ALERTAS - Mejor organizada */}
            {alertas.length > 0 && (
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card"
                            style={{
                                boxShadow: 'none',
                                border: '2px solid #dc3545',
                                transition: 'none',
                                transform: 'none'
                            }}
                        >
                            <div className="card-header bg-danger text-white d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <span className="me-2">🚨</span>
                                    Alertas de Monitoreo
                                    <span className="badge bg-light text-danger ms-2">{alertas.length}</span>
                                </h5>
                                <div>
                                    <button
                                        className="btn btn-sm btn-light me-2"
                                        onClick={() => setMostrarTodasAlertas(!mostrarTodasAlertas)}
                                    >
                                        {mostrarTodasAlertas ? 'Ver menos' : 'Ver todas'}
                                    </button>
                                    <button
                                        className="btn btn-sm btn-light"
                                        onClick={marcarAlertasLeidas}
                                    >
                                        Marcar como leídas
                                    </button>
                                </div>
                            </div>
                            <div className="card-body">
                                {/* Resumen de tipos de alertas */}
                                <div className="row mb-3">
                                    {alertasRitmoAlto.length > 0 && (
                                        <div className="col-auto">
                                            <span className="badge bg-danger me-2">
                                                ❤️‍🔥 {alertasRitmoAlto.length} Ritmo Alto
                                            </span>
                                        </div>
                                    )}
                                    {alertasRitmoBajo.length > 0 && (
                                        <div className="col-auto">
                                            <span className="badge bg-warning me-2">
                                                💙 {alertasRitmoBajo.length} Ritmo Bajo
                                            </span>
                                        </div>
                                    )}
                                    {alertasOxigenacion.length > 0 && (
                                        <div className="col-auto">
                                            <span className="badge bg-dark me-2">
                                                🫁 {alertasOxigenacion.length} Oxigenación
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Lista de alertas */}
                                <div className="row">
                                    {(mostrarTodasAlertas ? alertas : alertas.slice(0, 4)).map((alerta, index) => (
                                        <div className="col-md-6 col-lg-3 mb-3" key={alerta.id || index}>
                                            <div className={`alert alert-${alerta.color} border-${alerta.color} h-100`}>
                                                <div className="d-flex">
                                                    <div className="me-2 fs-5">{alerta.icono}</div>
                                                    <div style={{ flex: 1 }}>
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <strong>{alerta.tipo_display}</strong>
                                                            <span className={`badge bg-${alerta.color === 'dark' ? 'light text-dark' : alerta.color}`}>
                                                                {alerta.severidad}
                                                            </span>
                                                        </div>
                                                        <div className="small mt-1">{alerta.mensaje}</div>
                                                        <div className="text-muted mt-2">
                                                            <small>
                                                                {new Date(alerta.fecha_hora).toLocaleTimeString('es-ES', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {alertas.length > 4 && !mostrarTodasAlertas && (
                                    <div className="text-center mt-2">
                                        <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => setMostrarTodasAlertas(true)}
                                        >
                                            Ver {alertas.length - 4} alertas más
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Resumen de Totales CON INDICADORES DE ESTADO */}
            <div className="row mb-4">
                <div className="col-md-3 col-6 mb-3">
                    <div className={`card text-center border-${estadoRitmo.color}`}
                        style={{
                            boxShadow: 'none',
                            border: `2px solid var(--bs-${estadoRitmo.color})`,
                            transition: 'none',
                            transform: 'none'
                        }}>
                        <div className="card-body" style={{ pointerEvents: 'none' }}>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <h2 className="text-primary">❤️</h2>
                                <span className={`badge bg-${estadoRitmo.color}`}>
                                    {estadoRitmo.texto}
                                </span>
                            </div>
                            <h5>Ritmo Cardíaco</h5>
                            <h3 className="text-primary">
                                {ritmoActual} <small>bpm</small>
                            </h3>
                            <small className="text-muted">
                                Promedio: {Math.round(resumen.corazon?.promedio_ritmo || 0)} bpm
                            </small>
                            {estadoRitmo.tipo === 'alto' && (
                                <div className="mt-2">
                                    <small className="text-danger">
                                        ⚠️ Considere disminuir el ritmo
                                    </small>
                                </div>
                            )}
                            {estadoRitmo.tipo === 'bajo' && (
                                <div className="mt-2">
                                    <small className="text-warning">
                                        ⚠️ Verifique fatiga o deshidratación
                                    </small>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-md-3 col-6 mb-3">
                    <div className={`card text-center border-${estadoOxigenacion.color}`}
                        style={{
                            boxShadow: 'none',
                            border: `2px solid var(--bs-${estadoOxigenacion.color})`,
                            transition: 'none',
                            transform: 'none'
                        }}>
                        <div className="card-body" style={{ pointerEvents: 'none' }}>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <h2 className="text-success">🫁</h2>
                                <span className={`badge bg-${estadoOxigenacion.color}`}>
                                    {estadoOxigenacion.texto}
                                </span>
                            </div>
                            <h5>Oxigenación</h5>
                            <h3 className="text-success">
                                {oxigenacionActual} <small>%</small>
                            </h3>
                            <small className="text-muted">
                                Promedio: {Math.round(resumen.corazon?.promedio_oxigenacion || 0)}%
                            </small>
                            {estadoOxigenacion.tipo === 'bajo' && (
                                <div className="mt-2">
                                    <small className="text-danger">
                                        ⚠️ Considere descansar y respirar profundamente
                                    </small>
                                </div>
                            )}
                            {estadoOxigenacion.tipo === 'critico' && (
                                <div className="mt-2">
                                    <small className="text-dark">
                                        ⚠️ ¡Busque aire fresco inmediatamente!
                                    </small>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-md-3 col-6 mb-3">
                    <div className="card text-center border-warning"
                        style={{
                            boxShadow: 'none',
                            border: '2px solid #ffc107',
                            transition: 'none',
                            transform: 'none'
                        }}>
                        <div className="card-body" style={{ pointerEvents: 'none' }}>
                            <h2 className="text-warning">👣</h2>
                            <h5>Pasos Totales</h5>
                            <h3 className="text-warning">
                                {resumen.caminata?.total_pasos?.toLocaleString() || 0}
                            </h3>
                            <small className="text-muted">
                                Últimos: {resumen.caminata?.ultimos_pasos || 0} pasos
                            </small>
                        </div>
                    </div>
                </div>

                <div className="col-md-3 col-6 mb-3">
                    <div className="card text-center border-danger"
                        style={{
                            boxShadow: 'none',
                            border: '2px solid #dc3545',
                            transition: 'none',
                            transform: 'none'
                        }}>
                        <div className="card-body" style={{ pointerEvents: 'none' }}>
                            <h2 className="text-danger">🔥</h2>
                            <h5>Calorías</h5>
                            <h3 className="text-danger">
                                {Math.round(resumen.caminata?.total_calorias || 0)} <small>kcal</small>
                            </h3>
                            <small className="text-muted">
                                Últimas: {Math.round(resumen.caminata?.ultimas_calorias || 0)} kcal
                            </small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Resto del código se mantiene igual */}
            {/* Gráficas de Corazón - SIN HOVER NI EFECTOS */}
            <div className="row mb-4">
                <div className="col-md-6 mb-3">
                    <div className="card"
                        style={{
                            boxShadow: 'none',
                            border: '1px solid #dee2e6',
                            transition: 'none',
                            transform: 'none'
                        }}>
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">❤️ Ritmo Cardíaco (Últimas 10 mediciones)</h5>
                        </div>
                        <div className="card-body" style={{ pointerEvents: 'none' }}>
                            {graficaCorazon.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={graficaCorazon}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="hora" />
                                        <YAxis domain={[50, 180]} />
                                        <Tooltip />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="ritmo"
                                            stroke="#ff6b6b"
                                            strokeWidth={2}
                                            name="Ritmo (bpm)"
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-center py-5">
                                    <p className="text-muted">No hay datos de ritmo cardíaco</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-md-6 mb-3">
                    <div className="card"
                        style={{
                            boxShadow: 'none',
                            border: '1px solid #dee2e6',
                            transition: 'none',
                            transform: 'none'
                        }}>
                        <div className="card-header bg-success text-white">
                            <h5 className="mb-0">🫁 Oxigenación (Últimas 10 mediciones)</h5>
                        </div>
                        <div className="card-body" style={{ pointerEvents: 'none' }}>
                            {graficaCorazon.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={graficaCorazon}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="hora" />
                                        <YAxis domain={[85, 100]} />
                                        <Tooltip />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="oxigenacion"
                                            stroke="#4ecdc4"
                                            strokeWidth={2}
                                            name="Oxigenación (%)"
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-center py-5">
                                    <p className="text-muted">No hay datos de oxigenación</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Gráfica de Pasos y Distancia - SIN HOVER NI EFECTOS */}
            <div className="row">
                <div className="col-12">
                    <div className="card"
                        style={{
                            boxShadow: 'none',
                            border: '1px solid #dee2e6',
                            transition: 'none',
                            transform: 'none'
                        }}>
                        <div className="card-header bg-warning text-white">
                            <h5 className="mb-0">🚶 Actividad - Pasos y Distancia (Últimos 10 registros)</h5>
                        </div>
                        <div className="card-body" style={{ pointerEvents: 'none' }}>
                            {graficaPasos.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={graficaPasos}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="hora" />
                                        <YAxis yAxisId="left" label={{ value: 'Pasos', angle: -90, position: 'insideLeft' }} />
                                        <YAxis yAxisId="right" orientation="right" label={{ value: 'Km', angle: 90, position: 'insideRight' }} />
                                        <Tooltip />
                                        <Legend />
                                        <Line
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="pasos"
                                            stroke="#ffd166"
                                            strokeWidth={2}
                                            name="Pasos"
                                            dot={false}
                                        />
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="km"
                                            stroke="#06d6a0"
                                            strokeWidth={2}
                                            name="Km Recorridos"
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-center py-5">
                                    <p className="text-muted">No hay datos de actividad</p>
                                </div>
                            )}
                        </div>
                        <div className="card-footer" style={{
                            background: '#f8f9fa',
                            borderTop: '1px solid #dee2e6',
                            pointerEvents: 'none'
                        }}>
                            <div className="row text-center">
                                <div className="col-md-4">
                                    <h4 className="text-warning">
                                        {resumen.caminata?.total_pasos?.toLocaleString() || 0}
                                    </h4>
                                    <small className="text-muted">Pasos Totales</small>
                                </div>
                                <div className="col-md-4">
                                    <h4 className="text-success">
                                        {Math.round(resumen.caminata?.total_km || 0)} km
                                    </h4>
                                    <small className="text-muted">Distancia Total</small>
                                </div>
                                <div className="col-md-4">
                                    <h4 className="text-danger">
                                        {Math.round(resumen.caminata?.total_calorias || 0)} kcal
                                    </h4>
                                    <small className="text-muted">Calorías Totales</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Graficas;