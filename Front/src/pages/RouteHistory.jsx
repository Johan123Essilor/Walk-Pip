// src/pages/RouteHistory.js
import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Table, Badge, 
  Spinner, Alert, Button, Form, FormGroup, Label, Input 
} from 'reactstrap';
import UpdateRouteResult from '../components/UpdateRouteResult';
import { useAuth0 } from '@auth0/auth0-react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const RouteHistory = () => {
  const { user, isAuthenticated } = useAuth0();
  const [historial, setHistorial] = useState([]);
  const [filteredHistorial, setFilteredHistorial] = useState([]);
  const [rutas, setRutas] = useState({}); 
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updatingHistorial, setUpdatingHistorial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    resultado: '',
    satisfaccion: '',
    search: ''
  });

 // Obtener todas las rutas disponibles
  const fetchRutas = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/trail/rutas/`);
      if (response.ok) {
        const data = await response.json();
        // Crear un objeto mapeando ID -> datos de ruta
        const rutasMap = {};
        data.forEach(ruta => {
          rutasMap[ruta.id] = ruta;
        });
        setRutas(rutasMap);
        return rutasMap;
      }
      return {};
    } catch (err) {
      console.error('Error fetching routes:', err);
      return {};
    }
  };

  // Obtener historial del usuario y combinar con datos de rutas
  const fetchHistorial = async () => {
    if (!user?.email) return;
    try {
      setLoading(true);
      setError(null);
      
      // Obtener historial y rutas en paralelo
      const [historialResponse, rutasMap] = await Promise.all([
        fetch(`${API_BASE_URL}/trail/historial-rutas/mi-historial/?user_email=${user.email}`),
        fetchRutas()
      ]);
      
      if (historialResponse.ok) {
        const historialData = await historialResponse.json();
        
        // Combinar historial con datos de rutas
        const historialCompleto = historialData.map(item => ({
          ...item,
          ruta: rutasMap[item.ruta] || { nombre: 'Ruta no disponible' }
        }));
        
        setHistorial(historialCompleto);
        setFilteredHistorial(historialCompleto);
        console.log('Historial obtenido:', historialCompleto);
      } else {
        throw new Error('Error al cargar el historial');
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('No se pudo cargar el historial de rutas');
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  useEffect(() => {
    let filtered = historial;

    // Filtro por resultado
    if (filters.resultado) {
      filtered = filtered.filter(item => 
        item.resultado?.toLowerCase() === filters.resultado.toLowerCase()
      );
    }

    // Filtro por satisfacción
    if (filters.satisfaccion) {
      filtered = filtered.filter(item => 
        item.satisfaccion?.toLowerCase() === filters.satisfaccion.toLowerCase()
      );
    }

    // Filtro por búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.ruta?.nombre?.toLowerCase().includes(searchLower) ||
        item.descripcion?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredHistorial(filtered);
  }, [filters, historial]);

  // Cargar datos al montar el componente
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchHistorial();
    }
  }, [isAuthenticated, user]);

  // Función para obtener badge color según resultado
  const getResultadoBadge = (resultado) => {
    switch (resultado?.toLowerCase()) {
      case 'completada':
      case 'éxito':
      case 'exito':
        return 'success';
      case 'incompleta':
      case 'fracaso':
        return 'danger';
      case 'pendiente':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  // Función para obtener badge color según satisfacción
  const getSatisfaccionBadge = (satisfaccion) => {
    switch (satisfaccion?.toLowerCase()) {
      case 'muy satisfecho':
      case 'excelente':
        return 'success';
      case 'satisfecho':
      case 'bueno':
        return 'info';
      case 'neutral':
        return 'warning';
      case 'insatisfecho':
      case 'malo':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // Función para formatear duración
  const formatDuracion = (duracion) => {
    if (!duracion) return '-';
    
    // Si es un string de timedelta de Django (ej: "04:30:00")
    if (typeof duracion === 'string') {
      const [hours, minutes] = duracion.split(':');
      return `${hours}h ${minutes}m`;
    }
    
    return duracion;
  };

  // Función para formatear fecha
  const formatFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Función para manejar la actualización
const handleUpdateResult = (historialItem) => {
  setUpdatingHistorial(historialItem);
  setShowUpdateModal(true);
};

// Función cuando se actualiza exitosamente
const handleUpdateSuccess = (updatedData) => {
  console.log('Historial actualizado:', updatedData);
  fetchHistorial(); // Recargar los datos
  setShowUpdateModal(false);
  setUpdatingHistorial(null);
};

  if (!isAuthenticated) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <h2>Historial de Rutas</h2>
          <p>Por favor inicia sesión para ver tu historial.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">
                <i className="fa fa-history me-2 text-success"></i>
                Mi Historial de Rutas
              </h2>
              <p className="text-muted mb-0">
                Revisa todas las rutas que has completado
              </p>
            </div>
            <Button color="success" onClick={fetchHistorial} disabled={loading}>
              <i className="fa fa-refresh me-1"></i>
              Actualizar
            </Button>
          </div>

          {/* Estadísticas rápidas */}
          {!loading && historial.length > 0 && (
            <Row className="mb-4">
              <Col md={3}>
                <Card className="p-3 text-center bg-light">
                  <h4 className="text-success mb-1">{historial.length}</h4>
                  <small className="text-muted">Total de Rutas</small>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="p-3 text-center bg-light">
                  <h4 className="text-success mb-1">
                    {historial.filter(h => h.resultado?.toLowerCase() === 'completada').length}
                  </h4>
                  <small className="text-muted">Completadas</small>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="p-3 text-center bg-light">
                  <h4 className="text-success mb-1">
                    {historial.filter(h => h.satisfaccion?.toLowerCase() === 'muy satisfecho').length}
                  </h4>
                  <small className="text-muted">Muy Satisfechas</small>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="p-3 text-center bg-light">
                  <h4 className="text-success mb-1">
                    {new Set(historial.map(h => h.ruta?.id)).size}
                  </h4>
                  <small className="text-muted">Rutas Únicas</small>
                </Card>
              </Col>
            </Row>
          )}

          {/* Filtros */}
          <Card className="p-3 mb-4">
            <h5 className="mb-3">
              <i className="fa fa-filter me-2 text-success"></i>
              Filtros
            </h5>
            <Form>
              <Row>
                <Col md={4}>
                  <FormGroup>
                    <Label for="search" className="fw-bold">Buscar ruta</Label>
                    <Input
                      type="text"
                      id="search"
                      placeholder="Nombre de la ruta..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                  </FormGroup>
                </Col>
                <Col md={4}>
                  <FormGroup>
                    <Label for="resultado" className="fw-bold">Resultado</Label>
                    <Input
                      type="select"
                      id="resultado"
                      value={filters.resultado}
                      onChange={(e) => setFilters(prev => ({ ...prev, resultado: e.target.value }))}
                    >
                      <option value="">Todos los resultados</option>
                      <option value="completada">Completada</option>
                      <option value="incompleta">Incompleta</option>
                      <option value="pendiente">Pendiente</option>
                    </Input>
                  </FormGroup>
                </Col>
                <Col md={4}>
                  <FormGroup>
                    <Label for="satisfaccion" className="fw-bold">Satisfacción</Label>
                    <Input
                      type="select"
                      id="satisfaccion"
                      value={filters.satisfaccion}
                      onChange={(e) => setFilters(prev => ({ ...prev, satisfaccion: e.target.value }))}
                    >
                      <option value="">Todas</option>
                      <option value="muy satisfecho">Muy Satisfecho</option>
                      <option value="satisfecho">Satisfecho</option>
                      <option value="neutral">Neutral</option>
                      <option value="insatisfecho">Insatisfecho</option>
                    </Input>
                  </FormGroup>
                </Col>
              </Row>
            </Form>
          </Card>

          {/* Loading */}
          {loading && (
            <div className="text-center py-5">
              <Spinner color="success" size="lg" />
              <p className="mt-3">Cargando tu historial...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <Alert color="danger">
              <h5>
                <i className="fa fa-exclamation-triangle me-2"></i>
                Error
              </h5>
              {error}
              <div className="mt-2">
                <Button color="danger" size="sm" onClick={fetchHistorial}>
                  Reintentar
                </Button>
              </div>
            </Alert>
          )}

          {/* Sin historial */}
          {!loading && historial.length === 0 && (
            <Card className="p-5 text-center">
              <div className="mb-4">
                <i className="fa fa-map-signs fa-3x text-muted mb-3"></i>
                <h4 className="text-muted">Aún no tienes historial</h4>
                <p className="text-muted">
                  Completa algunas rutas para ver tu historial aquí.
                </p>
              </div>
              <Button color="success" href="/list-routes">
                <i className="fa fa-compass me-2"></i>
                Explorar Rutas
              </Button>
            </Card>
          )}

          {/* Tabla de historial */}
          {!loading && filteredHistorial.length > 0 && (
            <Card>
              <div className="p-3 border-bottom">
                <h5 className="mb-0">
                  <i className="fa fa-list me-2 text-success"></i>
                  Rutas Realizadas ({filteredHistorial.length})
                </h5>
              </div>
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Ruta</th>
                      <th>Fecha</th>
                      <th>Duración</th>
                      <th>Resultado</th>
                      <th>Satisfacción</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistorial.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div>
                            <strong className="d-block">{item.ruta?.nombre || 'Ruta no disponible'}</strong>
                            {item.descripcion && (
                              <small className="text-muted">
                                {item.descripcion.length > 50 
                                  ? `${item.descripcion.substring(0, 50)}...` 
                                  : item.descripcion
                                }
                              </small>
                            )}
                          </div>
                        </td>
                        <td>
                          <small className="text-muted">
                            {formatFecha(item.fecha)}
                          </small>
                        </td>
                        <td>
                          <Badge color="info" className="fs-6">
                            {formatDuracion(item.tiempo_duracion)}
                          </Badge>
                        </td>
                        <td>
                          <Badge color={getResultadoBadge(item.resultado)} className="fs-6">
                            {item.resultado || 'No especificado'}
                          </Badge>
                        </td>
                        <td>
                          <Badge color={getSatisfaccionBadge(item.satisfaccion)} className="fs-6">
                            {item.satisfaccion || 'No evaluado'}
                          </Badge>
                        </td>
                      <td>
                      <Button
                        size="sm"
                        color="outline-primary"
                        onClick={() => handleUpdateResult(item)}
                        title="Evaluar esta ruta"
                      >
                        <i className="fa fa-star me-1"></i>
                        Evaluar
                      </Button>
                    </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card>
          )}

          {/* Sin resultados de filtros */}
          {!loading && historial.length > 0 && filteredHistorial.length === 0 && (
            <Card className="p-4 text-center">
              <h5 className="text-muted">No hay resultados para los filtros aplicados</h5>
              <Button 
                color="outline-success" 
                onClick={() => setFilters({ resultado: '', satisfaccion: '', search: '' })}
              >
                Limpiar filtros
              </Button>
            </Card>
          )}
        </Col>
      </Row>
      {updatingHistorial && (
  <UpdateRouteResult
    isOpen={showUpdateModal}
    toggle={() => {
      setShowUpdateModal(false);
      setUpdatingHistorial(null);
    }}
    historialItem={updatingHistorial}
    userEmail={user?.email}
    onSuccess={handleUpdateSuccess}
  />
)}
    </Container>
    
  );
};

export default RouteHistory;