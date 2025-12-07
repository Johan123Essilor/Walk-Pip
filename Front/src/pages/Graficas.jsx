// Graficas.jsx - Versión SIN EFECTOS HOVER
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

    const fetchData = async () => {
        try {
            const data = await sensorService.getDashboardData();

            setCorazonData(data.corazon);
            setCaminataData(data.caminata);
            setResumen(data.resumen);
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
            {/* Header SIMPLIFICADO - Sin botón */}
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
                    </p>
                </div>
            </div>

            {/* Resumen de Totales - SIN HOVER NI EFECTOS */}
            <div className="row mb-4">
                <div className="col-md-3 col-6 mb-3">
                    <div className="card text-center border-primary"
                        style={{
                            boxShadow: 'none',
                            border: '2px solid #007bff',
                            transition: 'none',
                            transform: 'none'
                        }}>
                        <div className="card-body" style={{ pointerEvents: 'none' }}>
                            <h2 className="text-primary">❤️</h2>
                            <h5>Ritmo Cardíaco</h5>
                            <h3 className="text-primary">
                                {resumen.corazon?.ultimo_ritmo || 0} <small>bpm</small>
                            </h3>
                            <small className="text-muted">
                                Promedio: {Math.round(resumen.corazon?.promedio_ritmo || 0)} bpm
                            </small>
                        </div>
                    </div>
                </div>

                <div className="col-md-3 col-6 mb-3">
                    <div className="card text-center border-success"
                        style={{
                            boxShadow: 'none',
                            border: '2px solid #28a745',
                            transition: 'none',
                            transform: 'none'
                        }}>
                        <div className="card-body" style={{ pointerEvents: 'none' }}>
                            <h2 className="text-success">🫁</h2>
                            <h5>Oxigenación</h5>
                            <h3 className="text-success">
                                {resumen.corazon?.ultima_oxigenacion || 0} <small>%</small>
                            </h3>
                            <small className="text-muted">
                                Promedio: {Math.round(resumen.corazon?.promedio_oxigenacion || 0)}%
                            </small>
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
                                        <YAxis domain={[50, 120]} />
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

            {/* Información adicional - ESTILO SIMPLE */}
            {/* <div className="row mt-4">
                <div className="col-12">
                    <div className="border rounded p-3" style={{
                        background: '#e7f1ff',
                        borderColor: '#cfe2ff',
                        pointerEvents: 'none'
                    }}>
                        <h6>📊 Información del Sistema</h6>
                        <ul className="mb-0" style={{ marginLeft: '20px' }}>
                            <li>Mostrando las últimas 10 métricas de cada sensor</li>
                            <li>Actualización automática cada 3 segundos</li>
                            <li>Totales acumulados desde el inicio de la sesión</li>
                            <li>Datos en tiempo real desde sensores MAX30105 y MPU6050</li>
                        </ul>
                    </div>
                </div>
            </div> */}
        </div>
    );
};

export default Graficas;