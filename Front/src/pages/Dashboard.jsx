import React, { useState, useEffect, useCallback } from 'react';
import { sensorService } from '../services';

const Dashboard = () => {
    const [sensorData, setSensorData] = useState(null);
    const [sessionStats, setSessionStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);

    // Función para cargar datos del sensor
    const fetchSensorData = useCallback(async () => {
        try {
            setError(null);
            const [dataResponse, statsResponse] = await Promise.all([
                sensorService.getLatestSensorData(),
                sensorService.getSessionStats()
            ]);

            setSensorData(dataResponse);
            setSessionStats(statsResponse);
            setLastUpdate(new Date());
        } catch (err) {
            console.error('Error fetching sensor data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Efecto para cargar datos iniciales y configurar intervalo
    useEffect(() => {
        // Cargar datos inmediatamente
        fetchSensorData();

        // Configurar intervalo de actualización cada 2 segundos
        const intervalId = setInterval(fetchSensorData, 2000);

        // Limpiar intervalo al desmontar el componente
        return () => clearInterval(intervalId);
    }, [fetchSensorData]);

    // Función para formatear duración
    const formatDuration = (seconds) => {
        if (!seconds) return '0s';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    };

    // Función para formatear tiempo HH:MM:SS a segundos
    const timeToSeconds = (timeString) => {
        if (!timeString) return 0;
        const [hours, minutes, seconds] = timeString.split(':').map(Number);
        return hours * 3600 + minutes * 60 + seconds;
    };

    // Función para obtener color según el nivel de SpO2
    const getSpO2Color = (spo2) => {
        const value = parseFloat(spo2);
        if (value >= 95) return 'success';
        if (value >= 90) return 'warning';
        if (value >= 85) return 'orange';
        return 'danger';
    };

    // Función para obtener color según ritmo cardíaco
    const getHeartRateColor = (rate) => {
        if (rate >= 100) return 'danger';
        if (rate >= 80) return 'warning';
        return 'success';
    };

    if (loading && !sensorData) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
                <span className="ms-2">Cargando datos del sensor...</span>
            </div>
        );
    }

    if (error && !sensorData) {
        return (
            <div className="alert alert-danger text-center" role="alert">
                <h4 className="alert-heading">Error de conexión</h4>
                <p>{error}</p>
                <button className="btn btn-primary" onClick={fetchSensorData}>
                    Reintentar
                </button>
            </div>
        );
    }

    if (!sensorData || !sensorData.heart || !sensorData.walk) {
        return (
            <div className="alert alert-warning text-center" role="alert">
                No hay datos disponibles del sensor
            </div>
        );
    }

    const { heart, walk } = sensorData;

    return (
        <div className="container-fluid">
            {/* Header del Dashboard */}
            <div className="row mb-4">
                <div className="col">
                    <h1 className="h2">🎯 Dashboard de Monitoreo</h1>
                    <p className="text-muted">
                        Sistema de métricas en tiempo real -
                        {lastUpdate && ` Última actualización: ${lastUpdate.toLocaleTimeString()}`}
                    </p>
                </div>
                <div className="col-auto">
                    {error && (
                        <div className="alert alert-warning alert-dismissible fade show py-2" role="alert">
                            <small>{error}</small>
                            <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tarjetas de Estado Principal */}
            <div className="row mb-4">
                {/* Salud Cardíaca */}
                <div className="col-md-4 mb-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-primary text-white">
                            <h5 className="card-title mb-0">❤️ Salud Cardíaca</h5>
                        </div>
                        <div className="card-body">
                            <div className="row text-center">
                                <div className="col-6">
                                    <h2 className={`text-${getSpO2Color(heart.oxigenacion)}`}>
                                        {parseFloat(heart.oxigenacion).toFixed(1)}%
                                    </h2>
                                    <small className="text-muted">Oxigenación</small>
                                    <div className="mt-2">
                                        <span className={`badge bg-${getSpO2Color(heart.oxigenacion)}`}>
                                            {parseFloat(heart.oxigenacion) >= 95 ? 'EXCELENTE' :
                                                parseFloat(heart.oxigenacion) >= 90 ? 'NORMAL' :
                                                    parseFloat(heart.oxigenacion) >= 85 ? 'BAJO' : 'CRÍTICO'}
                                        </span>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <h2 className={`text-${getHeartRateColor(heart.ritmo_cardiaco)}`}>
                                        {heart.ritmo_cardiaco}
                                    </h2>
                                    <small className="text-muted">Ritmo (bpm)</small>
                                    <div className="mt-2">
                                        <span className="badge bg-secondary">
                                            {heart.fecha} {heart.hora}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-top">
                                <small className="text-muted">Presión arterial:</small>
                                <h5 className="mb-0">{heart.presion}</h5>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actividad Física */}
                <div className="col-md-4 mb-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-success text-white">
                            <h5 className="card-title mb-0">🚶 Actividad Física</h5>
                        </div>
                        <div className="card-body">
                            <div className="text-center mb-3">
                                <h1 className="display-4 text-success">{walk.pasos}</h1>
                                <small className="text-muted">PASOS TOTALES</small>
                            </div>
                            <div className="row text-center">
                                <div className="col-6">
                                    <h5>{parseFloat(walk.km_recorridos).toFixed(2)}</h5>
                                    <small className="text-muted">Kilómetros</small>
                                </div>
                                <div className="col-6">
                                    <h5>{parseFloat(walk.velocidad_promedio).toFixed(1)}</h5>
                                    <small className="text-muted">Velocidad (km/h)</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Calorías y Tiempo */}
                <div className="col-md-4 mb-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-info text-white">
                            <h5 className="card-title mb-0">🔥 Energía</h5>
                        </div>
                        <div className="card-body">
                            <div className="text-center mb-4">
                                <h1 className="display-4 text-warning">{parseFloat(walk.calorias_quemadas).toFixed(0)}</h1>
                                <small className="text-muted">CALORÍAS QUEMADAS</small>
                            </div>
                            <div className="text-center">
                                <h5>{walk.tiempo_actividad}</h5>
                                <small className="text-muted">Tiempo de Actividad</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Estadísticas de Sesión */}
            <div className="row">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-secondary text-white">
                            <h5 className="card-title mb-0">📊 Estadísticas de Sesión</h5>
                        </div>
                        <div className="card-body">
                            {sessionStats ? (
                                <div className="row text-center">
                                    <div className="col-md-2 col-6 mb-3">
                                        <h4 className="text-primary">{sessionStats.data_count}</h4>
                                        <small className="text-muted">Total Datos</small>
                                    </div>
                                    <div className="col-md-2 col-6 mb-3">
                                        <h4 className="text-success">{formatDuration(sessionStats.session_duration)}</h4>
                                        <small className="text-muted">Duración</small>
                                    </div>
                                    <div className="col-md-2 col-6 mb-3">
                                        <h4 className="text-info">{sessionStats.total_pasos}</h4>
                                        <small className="text-muted">Pasos Totales</small>
                                    </div>
                                    <div className="col-md-2 col-6 mb-3">
                                        <h4 className="text-danger">{sessionStats.max_ritmo}</h4>
                                        <small className="text-muted">Ritmo Máx</small>
                                    </div>
                                    <div className="col-md-2 col-6 mb-3">
                                        <h4 className="text-primary">{sessionStats.max_oxigenacion}%</h4>
                                        <small className="text-muted">Oxigenación Máx</small>
                                    </div>
                                    <div className="col-md-2 col-6 mb-3">
                                        <h4 className="text-warning">{sessionStats.min_oxigenacion}%</h4>
                                        <small className="text-muted">Oxigenación Mín</small>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-muted">
                                    <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                    Cargando estadísticas...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Información de Sesión */}
            <div className="row mt-3">
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <h6>📋 Información de la Sesión</h6>
                            <div className="row small">
                                <div className="col-6">
                                    <strong>Sesión ID:</strong> {heart.sesion}
                                </div>
                                <div className="col-6">
                                    <strong>Fecha:</strong> {heart.fecha}
                                </div>
                                <div className="col-6 mt-1">
                                    <strong>Hora:</strong> {heart.hora}
                                </div>
                                <div className="col-6 mt-1">
                                    <strong>Registro ID:</strong> {heart.id}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <h6>🔄 Estado del Sistema</h6>
                            <div className="row small">
                                <div className="col-6">
                                    <span className="badge bg-success">Conectado</span>
                                </div>
                                <div className="col-6">
                                    <strong>Actualización:</strong> Cada 2s
                                </div>
                                <div className="col-12 mt-1">
                                    <small className="text-muted">
                                        Monitoreo activo de métricas de salud y actividad física
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Indicador de carga para actualizaciones */}
            {loading && (
                <div className="position-fixed bottom-0 end-0 m-3">
                    <div className="alert alert-info alert-dismissible fade show" role="alert">
                        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                        Actualizando datos...
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;