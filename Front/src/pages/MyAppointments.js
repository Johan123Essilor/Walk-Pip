// src/pages/MyAppointments.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Spinner, Alert } from 'reactstrap';
import { useAuth0 } from '@auth0/auth0-react';
import EditReturnTimeModal from '../components/EditReturnTimeModal';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const MyAppointments = () => {
  const { user, isAuthenticated } = useAuth0();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchAppointments = async () => {
    if (!user?.email) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Hacer ambas llamadas en paralelo
      const [appointmentsResponse, returnTimesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/trail/agendar/mis-citas/?user_email=${user.email}`),
        fetch(`${API_BASE_URL}/users/horario-retorno/?user_email=${user.email}`)
      ]);
      
      if (appointmentsResponse.ok && returnTimesResponse.ok) {
        const appointmentsData = await appointmentsResponse.json();
        const returnTimesData = await returnTimesResponse.json();
        
        // Combinar citas con sus horarios de retorno
        const appointmentsWithReturnTimes = appointmentsData.map(appointment => {
          const returnTime = returnTimesData.find(rt => rt.cita === appointment.id);
          return {
            ...appointment,
            horario_retorno: returnTime || null
          };
        });
        
        setAppointments(appointmentsWithReturnTimes);
      } else {
        throw new Error('Error al cargar citas');
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('No se pudieron cargar las citas');
    } finally {
      setLoading(false);
    }
  };

  // SOLUCIÓN: Solo un useEffect
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchAppointments();
    }
  }, [isAuthenticated, user]); // Solo se ejecuta cuando user o isAuthenticated cambian

  const handleEditReturnTime = (appointment) => {
    setEditingAppointment(appointment);
    setShowEditModal(true);
  };

  const handleUpdateSuccess = () => {
    fetchAppointments(); // Recargar datos solo cuando sea necesario
    setShowEditModal(false);
    setEditingAppointment(null);
  };

  if (!isAuthenticated) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <h2>Mis Citas</h2>
          <p>Por favor inicia sesión para ver tus citas.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">
              <i className="fa fa-calendar me-2 text-primary"></i>
              Mis Citas Agendadas
            </h2>
            <Button color="primary" onClick={fetchAppointments} disabled={loading}>
              <i className="fa fa-refresh me-1"></i>
              Actualizar
            </Button>
          </div>

          {loading && (
            <div className="text-center py-4">
              <Spinner color="primary" />
              <p className="mt-2">Cargando citas...</p>
            </div>
          )}

          {error && (
            <Alert color="danger">
              <h5>
                <i className="fa fa-exclamation-triangle me-2"></i>
                Error
              </h5>
              {error}
              <div className="mt-2">
                <Button color="danger" size="sm" onClick={fetchAppointments}>
                  Reintentar
                </Button>
              </div>
            </Alert>
          )}

          {!loading && appointments.length === 0 && (
            <Card className="p-5 text-center">
              <div className="mb-4">
                <i className="fa fa-calendar-times fa-3x text-muted mb-3"></i>
                <h4 className="text-muted">No tienes citas agendadas</h4>
                <p className="text-muted">
                  Visita el directorio de rutas para agendar tu primera cita.
                </p>
              </div>
              <Button color="success" href="/list-routes">
                <i className="fa fa-compass me-2"></i>
                Explorar Rutas
              </Button>
            </Card>
          )}

          {!loading && appointments.length > 0 && (
            <Card>
              <div className="p-3 border-bottom bg-light">
                <h5 className="mb-0">
                  <i className="fa fa-list me-2 text-primary"></i>
                  Citas ({appointments.length})
                </h5>
              </div>
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Ruta</th>
                      <th>Fecha</th>
                      <th>Hora Inicio</th>
                      <th>Hora Retorno</th>
                      <th>Duración</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td>
                          <div>
                            <strong className="d-block">{appointment.ruta_nombre}</strong>
                            <small className="text-muted">
                              Dificultad: {appointment.ruta_dificultad}
                            </small>
                          </div>
                        </td>
                        <td>
                          {new Date(appointment.fecha_visita).toLocaleDateString('es-MX', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </td>
                        <td>
                          {new Date(appointment.fecha_visita).toLocaleTimeString('es-MX', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td>
                          {appointment.horario_retorno ? (
                            <Badge color="success" className="fs-6">
                              {appointment.horario_retorno.hora_retorno}
                            </Badge>
                          ) : (
                            <Badge color="warning" className="fs-6">No registrado</Badge>
                          )}
                        </td>
                        <td>
                          {appointment.horario_retorno && 
                           appointment.horario_retorno.hora_inicio && 
                           appointment.horario_retorno.hora_retorno ? (
                            <span className="fw-bold text-primary">
                              {calculateDuration(
                                appointment.horario_retorno.hora_inicio,
                                appointment.horario_retorno.hora_retorno
                              )}
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          <Button
                            size="sm"
                            color="outline-primary"
                            onClick={() => handleEditReturnTime(appointment)}
                            title={appointment.horario_retorno ? 'Editar horario' : 'Agregar horario de retorno'}
                          >
                            <i className="fa fa-clock me-1"></i>
                            {appointment.horario_retorno ? 'Editar' : 'Agregar'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card>
          )}
        </Col>
      </Row>

      {/* Modal para editar horario */}
      {editingAppointment && (
        <EditReturnTimeModal
          isOpen={showEditModal}
          toggle={() => {
            setShowEditModal(false);
            setEditingAppointment(null);
          }}
          appointment={editingAppointment}
          userEmail={user.email}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </Container>
  );
};

// Función auxiliar para calcular duración
const calculateDuration = (startTime, endTime) => {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  let totalMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
  
  // Manejar caso donde la hora de retorno es del día siguiente
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60; // Agregar 24 horas en minutos
  }
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
};

export default MyAppointments;