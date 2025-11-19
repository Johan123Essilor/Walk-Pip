import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { rutasService } from '../services';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css'; // Importar los iconos

export const RutasSenderismo = () => {
    // Estado para controlar la vista (cards o lista)
    const navigate = useNavigate();
    const [vista, setVista] = useState('cards');
    const [rutas, setRutas] = useState([]);
    const [allRutas, setAllRutas] = useState([]); // copia completa para filtrar localmente
    const [searchQuery, setSearchQuery] = useState('');
    const debounceRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Cargar rutas al montar el componente
    useEffect(() => {
        cargarRutas();
    }, []);

    const cargarRutas = async () => {
        try {
            setLoading(true);
            setError(null);

            // Ejemplo con filtros
            const filtros = {
                dificultad: 'media',
                ordenar: 'nombre'
            };

            const datosRutas = await rutasService.getRutas(filtros);
            const parsedRutas = datosRutas.map(ruta => ({
                //...ruta,
                id: ruta.id,
                nombre: ruta.descripcion,
                ubicacion: ruta.descripcion,
                distancia: "15 km",
                duracion: "30 min",
                dificultad: ruta.nivel_experiencia,
                descripcion: ruta.descripcion,
                imagen: ruta.imagen || 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400', // Imagen por defecto si no hay
                altitud: "800 m",
                tipo: "Circular",
                lat: parseFloat(ruta.lat) || 25.6345,
                lon: parseFloat(ruta.lon) || -100.5528
            }));
            setRutas(parsedRutas);
            setAllRutas(parsedRutas);
        } catch (err) {
            setError(err.message);
            console.error('Error cargando rutas:', err);
        } finally {
            setLoading(false);
        }
    };

    // Filtrar rutas por nombre (case-insensitive) usando la copia completa `allRutas`
    const filterRutasByName = (query) => {
        try {
            if (!query || typeof query !== 'string') return allRutas;
            const q = query.trim().toLowerCase();
            if (q === '') return allRutas;
            return allRutas.filter(r => (r.nombre || '').toString().toLowerCase().includes(q));
        } catch (err) {
            console.error('Error en filterRutasByName:', err);
            return allRutas;
        }
    };
    // Función para buscar rutas
    const buscarRutas = async (query) => {
        try {
            setLoading(true);
            // Intentar usar el servicio si existe; si falla, usar filtrado local
            if (rutasService && typeof rutasService.searchRutas === 'function') {
                try {
                    const resultados = await rutasService.searchRutas(query);
                    // Si el servicio devuelve resultados válidos, úsalos
                    if (Array.isArray(resultados)) {
                        setRutas(resultados);
                        return;
                    }
                } catch (svcErr) {
                    console.warn('rutasService.searchRutas falló, usando filtro local:', svcErr);
                }
            }

            // Fallback: filtrar en el cliente usando la copia completa
            const resultadosLocal = filterRutasByName(query);
            setRutas(resultadosLocal);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Función para obtener la clase de color según la dificultad
    const getColorDificultad = (dificultad) => {
        switch (dificultad.toLowerCase()) {
            case '1':
                return 'success';
            case '2':
                return 'warning';
            case '3':
                return 'danger';
            default:
                return 'secondary';
        }
    };

    const parsedDificultad = (dificultad) => {
        switch (dificultad.toLowerCase()) {
            case '1':
                return 'Facil';
            case '2':
                return 'Media';
            case '3':
                return 'Dificil';
            default:
                return 'Desconocida';
        }
    };

    // Navegar a TrailDirectory con lat/lon al hacer doble clic
    const handleCardDoubleClick = (ruta) => {
        navigate(`/trail-directory?lat=${ruta.lat}&lon=${ruta.lon}&id=${ruta.id}`);
    };

    if (loading) {
        return (
            <div className="container mt-4">
                <div className="d-flex justify-content-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                </div>
            </div>
        );
    }


    if (error) {
        return (
            <div className="container mt-4">
                <div className="alert alert-danger" role="alert">
                    <h4 className="alert-heading">Error</h4>
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={cargarRutas}>
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4 min-vh-100">

            {/* Header con búsqueda */}
            <div className="row mb-4">
                <div className="col">
                    <h1 className="text-center text-primary">Rutas de Senderismo</h1>

                    {/* Barra de búsqueda */}
                    <div className="input-group mb-3">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Buscar rutas..."
                            value={searchQuery}
                            onChange={(e) => {
                                const v = e.target.value;
                                setSearchQuery(v);
                                // Filtrado instantáneo en cliente
                                setRutas(filterRutasByName(v));

                                // Debounced backend search (opcional)
                                if (debounceRef.current) clearTimeout(debounceRef.current);
                                debounceRef.current = setTimeout(() => {
                                    if (v.trim() !== '') buscarRutas(v);
                                }, 700);
                            }}
                        />
                        <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => buscarRutas(searchQuery)}
                        >
                            Buscar
                        </button>
                    </div>
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
                        <div key={ruta.id} className="col-lg-6 col-xl-4 mb-4" onDoubleClick={() => handleCardDoubleClick(ruta)}>
                            <div className="card h-100 shadow-sm" style={{ cursor: 'pointer' }}>
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
                                            {parsedDificultad(ruta.dificultad)}
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
                        <div key={ruta.id} className="list-group-item list-group-item-action" onDoubleClick={() => handleCardDoubleClick(ruta)} style={{ cursor: 'pointer' }}>
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
                                            {parsedDificultad(ruta.dificultad)}
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