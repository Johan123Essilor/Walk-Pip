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
            const [heartResponse, walkResponse] = await Promise.all([
                sensorService.getHeartHistory(timeRange),
                sensorService.getWalkHistory(timeRange)
            ]);

            // Invertir orden para mostrar de antiguo a reciente en gráfica
            setHeartHistory(heartResponse.reverse ? heartResponse.reverse() : heartResponse);
            setWalkHistory(walkResponse.reverse ? walkResponse.reverse() : walkResponse);
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

    // Datos de ejemplo para las gráficas (debes adaptar según tu API)
    const ritmoCardiacoData = heartHistory && heartHistory.length > 0
        ? heartHistory.map(item => ({
            hora: item.hora || item.fecha || 'N/A',
            ritmo: item.ritmo_cardiaco || 0,
            oxigenacion: parseFloat(item.oxigenacion) || 0
        }))
        : [];

    const actividadData = walkHistory && walkHistory.length > 0
        ? walkHistory.map(item => ({
            hora: item.hora || 'N/A',
            pasos: item.pasos || 0,
            velocidad: parseFloat(item.velocidad_promedio) || 0,
            calorias: parseFloat(item.calorias_quemadas) || 0
        }))
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