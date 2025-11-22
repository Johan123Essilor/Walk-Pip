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
      const response = await fetch(`${API_BASE_URL}/trail/agendar/mis-citas/?user_email=${user.email}`);
      
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
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

  const fetchReturnTimes = async () => {
    if (!user?.email) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/horario-retorno/?user_email=${user.email}`);
      
      if (response.ok) {
        const returnTimes = await response.json();
        
        // Combinar citas con sus horarios de retorno
        const appointmentsWithReturnTimes = appointments.map(appointment => {
          const returnTime = returnTimes.find(rt => rt.cita === appointment.id);
          return {
            ...appointment,
            horario_retorno: returnTime || null
          };
        });
        
        setAppointments(appointmentsWithReturnTimes);
      }
    } catch (err) {
      console.error('Error fetching return times:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchAppointments();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (appointments.length > 0) {
      fetchReturnTimes();
    }
  }, [appointments]);

  const handleEditReturnTime = (appointment) => {
    setEditingAppointment(appointment);
    setShowEditModal(true);
  };

  const handleUpdateSuccess = () => {
    fetchAppointments(); // Recargar datos
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
          <h2 className="mb-4">
            <i className="fa fa-calendar me-2"></i>
            Mis Citas Agendadas
          </h2>

          {loading && (
            <div className="text-center">
              <Spinner color="primary" />
              <p className="mt-2">Cargando citas...</p>
            </div>
          )}

          {error && (
            <Alert color="danger">
              {error}
              <Button color="link" onClick={fetchAppointments}>Reintentar</Button>
            </Alert>
          )}

          {!loading && appointments.length === 0 && (
            <Card className="p-4 text-center">
              <h4 className="text-muted">No tienes citas agendadas</h4>
              <p>Visita el directorio de rutas para agendar tu primera cita.</p>
              <Button color="success" href="/list-routes">
                Explorar Rutas
              </Button>
            </Card>
          )}

          {!loading && appointments.length > 0 && (
            <Card>
              <Table responsive>
                <thead>
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
                        <strong>{appointment.ruta_nombre}</strong>
                        <br />
                        <small className="text-muted">{appointment.ruta_dificultad}</small>
                      </td>
                      <td>
                        {new Date(appointment.fecha_visita).toLocaleDateString('es-MX')}
                      </td>
                      <td>
                        {new Date(appointment.fecha_visita).toLocaleTimeString('es-MX', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td>
                        {appointment.horario_retorno ? (
                          <Badge color="success">
                            {appointment.horario_retorno.hora_retorno}
                          </Badge>
                        ) : (
                          <Badge color="warning">No registrado</Badge>
                        )}
                      </td>
                      <td>
                        {appointment.horario_retorno && 
                         appointment.horario_retorno.hora_inicio && 
                         appointment.horario_retorno.hora_retorno ? (
                          <span className="fw-bold">
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
                        >
                          <i className="fa fa-edit me-1"></i>
                          {appointment.horario_retorno ? 'Editar' : 'Agregar'} Horario
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
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