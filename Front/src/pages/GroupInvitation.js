// src/pages/GroupInvitationsPage.js
import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from 'reactstrap';

// Obtener la URL base desde las variables de entorno
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const GroupInvitation = () => {
  const { user, isAuthenticated } = useAuth0();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(null); // Para controlar qué invitación se está procesando

  // Función para obtener invitaciones pendientes
  const fetchPendingInvitations = async () => {
    if (!isAuthenticated || !user?.email) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Obteniendo invitaciones pendientes...');
      
      const response = await fetch(`${API_BASE_URL}/groups/grupos/pending_invitations/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_email: user.email
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      const invitationsData = await response.json();
      console.log('✅ Invitaciones obtenidas:', invitationsData);

      setInvitations(invitationsData || []);

    } catch (error) {
      console.error('❌ Error obteniendo invitaciones:', error);
      setError('Error al cargar las invitaciones. Intenta recargar la página.');
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para aceptar invitación
  const acceptInvitation = async (groupId) => {
    try {
      setProcessing(groupId);
      console.log(`🔄 Aceptando invitación al grupo ${groupId}`);
      
      const response = await fetch(`${API_BASE_URL}/groups/grupos/${groupId}/accept_invitation/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_email: user?.email
        })
      });

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Invitación aceptada:', result);

      // Actualizar lista de invitaciones
      await fetchPendingInvitations();
      
      alert('¡Invitación aceptada! Ahora eres miembro del grupo.');

    } catch (error) {
      console.error('❌ Error aceptando invitación:', error);
      alert('Error al aceptar la invitación. Intenta nuevamente.');
    } finally {
      setProcessing(null);
    }
  };

  // ✅ NUEVA FUNCIÓN: Rechazar invitación
  const rejectInvitation = async (groupId) => {
    if (!window.confirm('¿Estás seguro de que quieres rechazar esta invitación?')) {
      return;
    }

    try {
      setProcessing(groupId);
      console.log(`🔄 Rechazando invitación al grupo ${groupId}`);
      
      const response = await fetch(`${API_BASE_URL}/groups/grupos/${groupId}/reject_invitation/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_email: user?.email
        })
      });

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Invitación rechazada:', result);

      // Actualizar lista de invitaciones
      await fetchPendingInvitations();
      
      alert('Invitación rechazada.');

    } catch (error) {
      console.error('❌ Error rechazando invitación:', error);
      alert('Error al rechazar la invitación. Intenta nuevamente.');
    } finally {
      setProcessing(null);
    }
  };

  // Cargar invitaciones cuando el usuario se autentique
  useEffect(() => {
    if (isAuthenticated) {
      fetchPendingInvitations();
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    return (
      <Container className="my-5">
        <Row>
          <Col>
            <Alert color="warning" className="text-center">
              <h4> Inicia sesión</h4>
              <p>Debes iniciar sesión para ver tus invitaciones.</p>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="my-4">
      {/* Header de la página */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h2 mb-1" style={{ color: '#2e7d32', fontWeight: '700' }}>
                 Mis Invitaciones
              </h1>
              <p className="text-muted mb-0">
                Gestiona las invitaciones a grupos que has recibido
              </p>
            </div>
            <Badge color="warning" pill className="fs-6 px-3 py-2">
              {invitations.length} pendientes
            </Badge>
          </div>
          <hr className="mt-3" />
        </Col>
      </Row>

      {/* Estado de carga */}
      {loading && (
        <Row>
          <Col className="text-center py-5">
            <Spinner color="success" size="lg" />
            <p className="mt-3 text-muted">Cargando tus invitaciones...</p>
          </Col>
        </Row>
      )}

      {/* Mensaje de error */}
      {error && (
        <Row>
          <Col>
            <Alert color="danger">
              <h5>❌ Error</h5>
              <p className="mb-0">{error}</p>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Lista de invitaciones */}
      {!loading && !error && (
        <Row>
          {invitations.length === 0 ? (
            <Col>
              <Card className="p-5 text-center border-dashed">
                <div className="mb-4">
                  <i className="fa fa-envelope-open fa-4x text-muted mb-3"></i>
                  <h4 className="text-muted">No tienes invitaciones pendientes</h4>
                  <p className="text-muted mb-4">
                    Cuando recibas invitaciones a grupos, aparecerán aquí
                  </p>
                </div>
              </Card>
            </Col>
          ) : (
            invitations.map((invitation) => (
              <Col md={6} lg={4} key={invitation.id} className="mb-4">
                <Card className="h-100 shadow-sm border-warning">
                  <div className="p-4">
                    {/* Header de la tarjeta */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <h5 className="card-title mb-1" style={{ color: '#2e7d32' }}>
                          {invitation.grupo_nombre}
                        </h5>
                        <Badge color="warning">Invitación</Badge>
                      </div>
                      <small className="text-muted">
                        Te invitaron a unirte a este grupo
                      </small>
                    </div>

                    {/* Información del grupo */}
                    <div className="mb-3">
                      <p className="card-text text-muted small mb-2">
                        {invitation.grupo_descripcion || 'Sin descripción'}
                      </p>
                      
                      <div className="d-flex justify-content-between text-sm text-muted mb-1">
                        <span>Invitado por:</span>
                        <span>{invitation.creador_nombre || invitation.grupo?.creador?.correo}</span>
                      </div>
                      
                      <div className="d-flex justify-content-between text-sm text-muted mb-1">
                        <span>Rol ofrecido:</span>
                        <Badge color="info">{invitation.rol}</Badge>
                      </div>
                      
                      <div className="d-flex justify-content-between text-sm text-muted">
                        <span>Fecha invitación:</span>
                        <span>{new Date().toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="d-grid gap-2">
                      <Button 
                        color="success" 
                        size="sm"
                        onClick={() => acceptInvitation(invitation.grupo)}
                        disabled={processing === invitation.grupo}
                      >
                        {processing === invitation.grupo ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <i className="fa fa-check me-2"></i>
                            Aceptar Invitación
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        color="outline-danger" 
                        size="sm"
                        onClick={() => rejectInvitation(invitation.grupo)}
                        disabled={processing === invitation.grupo}
                      >
                        <i className="fa fa-times me-2"></i>
                        Rechazar Invitación
                      </Button>
                    </div>
                  </div>
                </Card>
              </Col>
            ))
          )}
        </Row>
      )}
    </Container>
  );
};

export default GroupInvitation;