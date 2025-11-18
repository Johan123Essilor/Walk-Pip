import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css'; // Importar los iconos

export const RutasSenderismo = () => {
    // Estado para controlar la vista (cards o lista)
    const [vista, setVista] = useState('cards');

    // Datos de ejemplo de rutas de senderismo
    const [rutas, setRutas] = useState([
        {
            id: 1,
            nombre: 'Ruta del Cares',
            ubicacion: 'Picos de Europa, Asturias',
            distancia: '12 km',
            duracion: '4-5 horas',
            dificultad: 'Media',
            descripcion: 'Conocida como la "Garganta Divina", es una de las rutas más espectaculares de los Picos de Europa.',
            imagen: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400',
            altitud: '800 m',
            tipo: 'Lineal'
        },
        {
            id: 2,
            nombre: 'Camino de Santiago Francés',
            ubicacion: 'Pirineos a Santiago de Compostela',
            distancia: '780 km',
            duracion: '30-35 días',
            dificultad: 'Alta',
            descripcion: 'La ruta más famosa del Camino de Santiago, llena de historia y paisajes variados.',
            imagen: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400',
            altitud: '1400 m',
            tipo: 'Lineal'
        },
        {
            id: 3,
            nombre: 'Ruta Circular Lagos de Covadonga',
            ubicacion: 'Parque Nacional Picos de Europa',
            distancia: '8 km',
            duracion: '3 horas',
            dificultad: 'Fácil',
            descripcion: 'Paseo circular alrededor de los famosos lagos Enol y Ercina.',
            imagen: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400',
            altitud: '1100 m',
            tipo: 'Circular'
        },
        {
            id: 4,
            nombre: 'Subida al Mulhacén',
            ubicacion: 'Sierra Nevada, Granada',
            distancia: '15 km',
            duracion: '6-7 horas',
            dificultad: 'Alta',
            descripcion: 'Ascensión al pico más alto de la península ibérica con vistas espectaculares.',
            imagen: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400',
            altitud: '3479 m',
            tipo: 'Circular'
        }
    ]);

    // Función para obtener la clase de color según la dificultad
    const getColorDificultad = (dificultad) => {
        switch (dificultad.toLowerCase()) {
            case 'fácil':
                return 'success';
            case 'media':
                return 'warning';
            case 'alta':
                return 'danger';
            default:
                return 'secondary';
        }
    };

    return (
        <div className="container mt-4 min-vh-100">
            {/* Header */}
            <div className="row mb-4">
                <div className="col">
                    <h1 className="text-center text-primary">Rutas de Senderismo</h1>
                    <p className="text-center text-muted">
                        Descubre las mejores rutas para disfrutar de la naturaleza
                    </p>
                </div>
            </div>

            {/* Controles de vista */}
            <div className="row mb-4">
                <div className="col d-flex justify-content-between align-items-center">
                    <span className="fw-bold">Total: {rutas.length} rutas</span>
                    <div className="btn-group">
                        <button
                            className={`btn ${vista === 'cards' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setVista('cards')}
                        >
                            <i className="bi bi-grid-fill"></i> Cards
                        </button>
                        <button
                            className={`btn ${vista === 'lista' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setVista('lista')}
                        >
                            <i className="bi bi-list-ul"></i> Lista
                        </button>
                    </div>
                </div>
            </div>

            {/* Vista en Cards */}
            {vista === 'cards' && (
                <div className="row">
                    {rutas.map((ruta) => (
                        <div key={ruta.id} className="col-lg-6 col-xl-4 mb-4">
                            <div className="card h-100 shadow-sm">
                                <img
                                    src={ruta.imagen}
                                    className="card-img-top"
                                    alt={ruta.nombre}
                                    style={{ height: '200px', objectFit: 'cover' }}
                                />
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <h5 className="card-title text-primary">{ruta.nombre}</h5>
                                        <span className={`badge bg-${getColorDificultad(ruta.dificultad)}`}>
                                            {ruta.dificultad}
                                        </span>
                                    </div>
                                    <p className="card-text text-muted small">{ruta.descripcion}</p>

                                    <div className="mt-3">
                                        <div className="row text-center">
                                            <div className="col-4">
                                                <small className="text-muted">Distancia</small>
                                                <div className="fw-bold">{ruta.distancia}</div>
                                            </div>
                                            <div className="col-4">
                                                <small className="text-muted">Duración</small>
                                                <div className="fw-bold">{ruta.duracion}</div>
                                            </div>
                                            <div className="col-4">
                                                <small className="text-muted">Altitud</small>
                                                <div className="fw-bold">{ruta.altitud}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-footer bg-transparent">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <small className="text-muted">
                                            <i className="bi bi-geo-alt"></i> {ruta.ubicacion}
                                        </small>
                                        <span className="badge bg-info">{ruta.tipo}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Vista en Lista */}
            {vista === 'lista' && (
                <div className="list-group">
                    {rutas.map((ruta) => (
                        <div key={ruta.id} className="list-group-item list-group-item-action">
                            <div className="row align-items-center">
                                <div className="col-md-2">
                                    <img
                                        src={ruta.imagen}
                                        alt={ruta.nombre}
                                        className="img-fluid rounded"
                                        style={{ height: '100px', width: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <h5 className="mb-1 text-primary">{ruta.nombre}</h5>
                                        <span className={`badge bg-${getColorDificultad(ruta.dificultad)}`}>
                                            {ruta.dificultad}
                                        </span>
                                    </div>
                                    <p className="mb-1 text-muted small">{ruta.descripcion}</p>
                                    <small className="text-muted">
                                        <i className="bi bi-geo-alt"></i> {ruta.ubicacion}
                                    </small>
                                </div>
                                <div className="col-md-4">
                                    <div className="row text-center">
                                        <div className="col-4">
                                            <small className="text-muted d-block">Distancia</small>
                                            <span className="fw-bold">{ruta.distancia}</span>
                                        </div>
                                        <div className="col-4">
                                            <small className="text-muted d-block">Duración</small>
                                            <span className="fw-bold">{ruta.duracion}</span>
                                        </div>
                                        <div className="col-4">
                                            <small className="text-muted d-block">Tipo</small>
                                            <span className="badge bg-info">{ruta.tipo}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Estilos adicionales */}
            <style jsx>{`
        .card {
          transition: transform 0.2s;
        }
        .card:hover {
          transform: translateY(-5px);
        }
        .list-group-item:hover {
          background-color: #f8f9fa;
        }
      `}</style>
        </div>
    );
};