// src/components/ReturnTimeModal.js
import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Alert, Spinner, FormGroup, Label, Input } from 'reactstrap';
import emergencyContactService from '../services/emergencyContactService';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const ReturnTimeModal = ({ isOpen, toggle, citaId, userEmail, onSuccess, appointmentDateTime }) => {
  const [startTime, setStartTime] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cargar contactos de emergencia cuando se abre el modal
  useEffect(() => {
    if (isOpen && userEmail) {
      fetchEmergencyContacts();
    }
  }, [isOpen, userEmail]);

  // Extraer la hora de la fecha de la cita si está disponible
  const getDefaultStartTime = () => {
    if (appointmentDateTime) {
      const date = new Date(appointmentDateTime);
      return date.toTimeString().slice(0, 5);
    }
    return '';
  };

  // Función para obtener contactos de emergencia usando el servicio
  const fetchEmergencyContacts = async () => {
    try {
      setLoadingContacts(true);
      console.log('🔄 Obteniendo contactos de emergencia...');
      
      const contactsData = await emergencyContactService.getEmergencyContacts(userEmail);
      console.log('✅ Contactos obtenidos:', contactsData);
      
      setEmergencyContacts(contactsData || []);

    } catch (error) {
      console.error('❌ Error obteniendo contactos:', error);
      setError('No se pudieron cargar los contactos de emergencia');
      setEmergencyContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  // Manejar selección de contacto (solo uno)
  const handleContactSelect = (contactId) => {
    setSelectedContact(contactId);
  };

  const handleSubmit = async () => {
    if (!startTime) {
      setError('Por favor selecciona una hora de inicio');
      return;
    }

    if (!returnTime) {
      setError('Por favor selecciona una hora de retorno');
      return;
    }

    if (startTime >= returnTime) {
      setError('La hora de retorno debe ser posterior a la hora de inicio');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Crear el horario de retorno
      const response = await fetch(`${API_BASE_URL}/users/horario-retorno/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cita: citaId,
          hora_inicio: startTime,
          hora_retorno: returnTime,
          contacto: selectedContact, // ✅ CORREGIDO: 'contacto' en lugar de 'contacto_id'
          user_email: userEmail
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar horario de retorno');
      }

      const result = await response.json();
      setSuccess('¡Horario de retorno guardado exitosamente!');
      
      // Mostrar mensaje personalizado
      const selectedContactInfo = emergencyContacts.find(c => c.id === selectedContact);
      const contactMessage = selectedContact 
        ? `Se notificará a ${selectedContactInfo?.nombre_contacto} si no regresas a tiempo.`
        : 'No se seleccionó ningún contacto de emergencia para notificar.';
      
      alert(`Cita guardada exitosamente. ${contactMessage}`);
      
      // Notificar al componente padre
      setTimeout(() => {
        onSuccess(result);
        toggle();
        setStartTime('');
        setReturnTime('');
        setSelectedContact(null);
      }, 1500);

    } catch (err) {
      console.error('Error guardando horario de retorno:', err);
      setError(err.message || 'Error al guardar el horario de retorno');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStartTime('');
    setReturnTime('');
    setSelectedContact(null);
    setError('');
    setSuccess('');
    toggle();
  };

  return (
    <Modal isOpen={isOpen} toggle={handleClose} size="lg">
      <ModalHeader toggle={handleClose}>
        <i className="fa fa-clock me-2"></i>
        Registrar Horarios de la Ruta
      </ModalHeader>
      <ModalBody>
        {error && <Alert color="danger">{error}</Alert>}
        {success && <Alert color="success">{success}</Alert>}

        {/* Sección de horarios */}
        <div className="row mb-4">
          <div className="col-md-6 mb-3">
            <label htmlFor="startTime" className="form-label fw-bold">
              Hora de inicio *
            </label>
            <input
              type="time"
              id="startTime"
              className="form-control"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={submitting}
            />
            <div className="form-text">
              Hora en que comenzarás la ruta
            </div>
          </div>

          <div className="col-md-6 mb-3">
            <label htmlFor="returnTime" className="form-label fw-bold">
              Hora estimada de retorno *
            </label>
            <input
              type="time"
              id="returnTime"
              className="form-control"
              value={returnTime}
              onChange={(e) => setReturnTime(e.target.value)}
              disabled={submitting}
            />
            <div className="form-text">
              Hora en que planeas regresar
            </div>
          </div>
        </div>

        {/* Mostrar duración estimada */}
        {startTime && returnTime && (
          <div className="alert alert-info mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <span>
                <i className="fa fa-calendar me-2"></i>
                <strong>Duración estimada:</strong>
              </span>
              <span className="fw-bold">
                {calculateDuration(startTime, returnTime)}
              </span>
            </div>
          </div>
        )}

        {/* Sección de contactos de emergencia - SOLO UNO */}
        <div className="mb-4">
          <h6 className="mb-3">
            <i className="fa fa-address-book me-2"></i>
            Contacto de Emergencia
          </h6>

          {loadingContacts ? (
            <div className="text-center py-3">
              <Spinner size="sm" color="primary" />
              <span className="ms-2">Cargando contactos...</span>
            </div>
          ) : emergencyContacts.length === 0 ? (
            <Alert color="warning">
              <i className="fa fa-exclamation-triangle me-2"></i>
              No tienes contactos de emergencia registrados. 
              <br />
              <small>
                Agrega contactos en tu perfil para recibir notificaciones de seguridad.
              </small>
            </Alert>
          ) : (
            <div className="contacts-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {emergencyContacts.map((contact) => (
                <FormGroup check key={contact.id} className="mb-2 p-2 border rounded">
                  <Label check className="w-100">
                    <Input
                      type="radio"
                      name="emergencyContact"
                      checked={selectedContact === contact.id}
                      onChange={() => handleContactSelect(contact.id)}
                      disabled={submitting}
                    />
                    <div className="ms-2">
                      <strong>{contact.nombre_contacto}</strong>
                      <br />
                      <small className="text-muted">
                        {contact.telefono} 
                        {contact.parentesco && ` • ${contact.parentesco}`}
                        {contact.correo && ` • ${contact.correo}`}
                      </small>
                    </div>
                  </Label>
                </FormGroup>
              ))}
            </div>
          )}

          {selectedContact && (
            <div className="mt-2">
              <small className="text-success">
                <i className="fa fa-check-circle me-1"></i>
                Contacto seleccionado para notificación
              </small>
            </div>
          )}

          {/* Opción para no seleccionar contacto */}
          <FormGroup check className="mt-3 p-2 border rounded">
            <Label check className="w-100">
              <Input
                type="radio"
                name="emergencyContact"
                checked={selectedContact === null}
                onChange={() => setSelectedContact(null)}
                disabled={submitting}
              />
              <div className="ms-2">
                <strong>No seleccionar contacto de emergencia</strong>
                <br />
                <small className="text-muted">
                  No recibirás notificaciones de seguridad en esta ruta
                </small>
              </div>
            </Label>
          </FormGroup>
        </div>

        {/* Información adicional */}
        <div className="alert alert-info">
          <small>
            <i className="fa fa-info-circle me-2"></i>
            <strong>Sistema de seguridad:</strong> Si no registras tu retorno antes de la hora estimada, 
            se enviará una notificación automática al contacto seleccionado.
          </small>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={handleClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button 
          color="success" 
          onClick={handleSubmit}
          disabled={submitting || !startTime || !returnTime}
        >
          {submitting ? (
            <>
              <Spinner size="sm" className="me-2" />
              Guardando...
            </>
          ) : (
            <>
              <i className="fa fa-save me-2"></i>
              Guardar Horarios
            </>
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

// Función para calcular la duración entre dos horas
const calculateDuration = (startTime, endTime) => {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  let totalMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
  
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
  }
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours === 0) {
    return `${minutes} minutos`;
  } else if (minutes === 0) {
    return `${hours} horas`;
  } else {
    return `${hours}h ${minutes}m`;
  }
};

export default ReturnTimeModal;