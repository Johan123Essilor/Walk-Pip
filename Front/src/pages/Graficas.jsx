import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import sensorService from '../services/sensorService';

// Importar componentes de gráficas (usaremos Chart.js o similar)
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

const Graficas = () => {
    const [heartHistory, setHeartHistory] = useState([]);
    const [walkHistory, setWalkHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState('1h'); // 1h, 6h, 24h
    const [lastUpdate, setLastUpdate] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchChartData = useCallback(async () => {
        try {
            setRefreshing(true);
            setError(null);

            console.log('🔄 Actualizando gráficas...');
            // Llamamos a los endpoints base sin usar `latest` ni `session`
            const [heartResponse, walkResponse] = await Promise.all([
                sensorService.getHeartHistory(),
                sensorService.getWalkHistory()
            ]);

            // Invertir orden para mostrar de antiguo a reciente en gráfica
            const hr = (Array.isArray(heartResponse) ? [...heartResponse] : []);
            const wk = (Array.isArray(walkResponse) ? [...walkResponse] : []);

            // Backend devuelve normalmente más recientes primero; queremos ordenar de antiguo -> reciente
            if (hr.length > 1) hr.reverse();
            if (wk.length > 1) wk.reverse();

            setHeartHistory(hr);
            setWalkHistory(wk);
            setLastUpdate(new Date().toLocaleTimeString('es-ES'));

            console.log('✅ Gráficas actualizadas');
        } catch (err) {
            console.error('❌ Error fetching chart data:', err);
            setError(err.message || 'Error al cargar datos');
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    }, [timeRange]);

    useEffect(() => {
        fetchChartData();
        // Actualizar cada 2 segundos en lugar de 5
        const intervalId = setInterval(fetchChartData, 2000);
        return () => clearInterval(intervalId);
    }, [fetchChartData]);

    // Normalizar datos para gráficas a partir de los endpoints base
    // Mostrar solo los 10 registros más recientes para evitar sobrecarga visual
    const recentHeart = Array.isArray(heartHistory) ? heartHistory.slice(-10) : [];
    const recentWalk = Array.isArray(walkHistory) ? walkHistory.slice(-10) : [];

    const ritmoCardiacoData = recentHeart && recentHeart.length > 0
        ? recentHeart.map(item => {
            // El endpoint de corazón devuelve { fecha: 'YYYY-MM-DD', hora: 'HH:MM:SS' }
            // o en algunos casos hora con T. Normalizamos a una etiqueta legible.
            let label = 'N/A';
            if (item.hora && item.hora.includes('T')) {
                // si ya es ISO
                const d = new Date(item.hora);
                label = d.toLocaleTimeString('es-ES');
            } else if (item.fecha && item.hora) {
                const iso = `${item.fecha}T${item.hora}`;
                const d = new Date(iso);
                if (!isNaN(d)) label = d.toLocaleTimeString('es-ES');
                else label = `${item.fecha} ${item.hora}`;
            } else if (item.hora) {
                label = item.hora;
            } else if (item.fecha) {
                label = item.fecha;
            }

            return {
                hora: label,
                ritmo: item.ritmo_cardiaco || 0,
                oxigenacion: parseFloat(item.oxigenacion) || 0
            };
        })
        : [];

    const actividadData = recentWalk && recentWalk.length > 0
        ? recentWalk.map(item => {
            // El endpoint de caminata devuelve 'hora' en formato ISO. Convertimos a hora local legible.
            let label = 'N/A';
            if (item.hora) {
                try {
                    const d = new Date(item.hora);
                    if (!isNaN(d)) label = d.toLocaleTimeString('es-ES');
                    else label = item.hora;
                } catch (e) {
                    label = item.hora;
                }
            }

            return {
                hora: label,
                pasos: item.pasos || 0,
                velocidad: parseFloat(item.velocidad_promedio) || 0,
                calorias: parseFloat(item.calorias_quemadas) || 0
            };
        })
        : [];

    const colores = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando gráficas...</span>
                </div>
                <span className="ms-2">Cargando gráficas...</span>
            </div>
        );
    }

    if (error && heartHistory.length === 0 && walkHistory.length === 0) {
        return (
            <div className="container-fluid mt-4">
                <div className="alert alert-warning" role="alert">
                    <h4 className="alert-heading">⚠️ Sin datos disponibles</h4>
                    <p>{error || 'No hay datos de métricas disponibles. Por favor, inicia una sesión de actividad primero.'}</p>
                    <hr />
                    <p className="mb-0">
                        <Link to="/" className="btn btn-outline-primary btn-sm">
                            ← Volver al Dashboard
                        </Link>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            {/* Header */}
            <div className="row mb-4">
                <div className="col">
                    <h1 className="h2">📈 Gráficas de Métricas (Tiempo Real)</h1>
                    <p className="text-muted">
                        Análisis detallado y evolución temporal
                        {lastUpdate && (
                            <span className="ms-3" style={{ fontSize: '0.9rem', color: '#666' }}>
                                {refreshing ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Actualizando...
                                    </>
                                ) : (
                                    <>
                                        ✅ Última actualización: <strong>{lastUpdate}</strong>
                                    </>
                                )}
                            </span>
                        )}
                    </p>
                </div>
                <div className="col-auto">
                    <Link to="/" className="btn btn-outline-primary">
                        ← Volver al Dashboard
                    </Link>
                </div>
            </div>

            {/* Controles de tiempo */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            <div className="btn-group" role="group">
                                <button
                                    type="button"
                                    className={`btn btn-outline-primary ${timeRange === '1h' ? 'active' : ''}`}
                                    onClick={() => setTimeRange('1h')}
                                >
                                    1 Hora
                                </button>
                                <button
                                    type="button"
                                    className={`btn btn-outline-primary ${timeRange === '6h' ? 'active' : ''}`}
                                    onClick={() => setTimeRange('6h')}
                                >
                                    6 Horas
                                </button>
                                <button
                                    type="button"
                                    className={`btn btn-outline-primary ${timeRange === '24h' ? 'active' : ''}`}
                                    onClick={() => setTimeRange('24h')}
                                >
                                    24 Horas
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gráficas de Salud Cardíaca */}
            <div className="row mb-4">
                <div className="col-md-6 mb-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-primary text-white">
                            <h5 className="card-title mb-0">❤️ Ritmo Cardíaco</h5>
                        </div>
                        <div className="card-body">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={ritmoCardiacoData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="hora" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="ritmo"
                                        stroke="#ff6b6b"
                                        strokeWidth={2}
                                        name="Ritmo (bpm)"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="col-md-6 mb-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-success text-white">
                            <h5 className="card-title mb-0">🫁 Oxigenación</h5>
                        </div>
                        <div className="card-body">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={ritmoCardiacoData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="hora" />
                                    <YAxis domain={[80, 100]} />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="oxigenacion"
                                        stroke="#4ecdc4"
                                        strokeWidth={2}
                                        name="Oxigenación (%)"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gráficas de Actividad */}
            <div className="row mb-4">
                <div className="col-md-6 mb-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-warning text-white">
                            <h5 className="card-title mb-0">🚶 Pasos por Hora</h5>
                        </div>
                        <div className="card-body">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={actividadData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="hora" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar
                                        dataKey="pasos"
                                        fill="#ffd166"
                                        name="Pasos"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="col-md-6 mb-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-info text-white">
                            <h5 className="card-title mb-0">🔥 Calorías Quemadas</h5>
                        </div>
                        <div className="card-body">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={actividadData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="hora" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="calorias"
                                        stroke="#ef476f"
                                        strokeWidth={2}
                                        name="Calorías"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gráfica combinada */}
            <div className="row">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-secondary text-white">
                            <h5 className="card-title mb-0">📊 Resumen de Actividad</h5>
                        </div>
                        <div className="card-body">
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={actividadData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="hora" />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="pasos"
                                        stroke="#ffd166"
                                        strokeWidth={2}
                                        name="Pasos"
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="velocidad"
                                        stroke="#118ab2"
                                        strokeWidth={2}
                                        name="Velocidad (km/h)"
                                    />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="calorias"
                                        stroke="#ef476f"
                                        strokeWidth={2}
                                        name="Calorías"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Graficas;