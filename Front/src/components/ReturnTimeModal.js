// src/components/ReturnTimeModal.js
import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Alert, Spinner } from 'reactstrap';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const ReturnTimeModal = ({ isOpen, toggle, citaId, userEmail, onSuccess, appointmentDateTime }) => {
  const [startTime, setStartTime] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Extraer la hora de la fecha de la cita si está disponible
  const getDefaultStartTime = () => {
    if (appointmentDateTime) {
      const date = new Date(appointmentDateTime);
      return date.toTimeString().slice(0, 5); // Formato HH:MM
    }
    return '';
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
          user_email: userEmail
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar horario de retorno');
      }

      const result = await response.json();
      setSuccess('¡Horario de retorno guardado exitosamente!');
      
      // Notificar al componente padre
      setTimeout(() => {
        onSuccess(result);
        toggle();
        setStartTime('');
        setReturnTime('');
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
    setError('');
    setSuccess('');
    toggle();
  };

  return (
    <Modal isOpen={isOpen} toggle={handleClose}>
      <ModalHeader toggle={handleClose}>
        <i className="fa fa-clock me-2"></i>
        Registrar Horarios de la Ruta
      </ModalHeader>
      <ModalBody>
        {error && <Alert color="danger">{error}</Alert>}
        {success && <Alert color="success">{success}</Alert>}

        <div className="row">
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
          <div className="alert alert-info">
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

        <div className="alert alert-info">
          <small>
            <i className="fa fa-info-circle me-2"></i>
            Esta información nos ayuda a calcular la duración de tu actividad 
            y mejorar nuestras recomendaciones futuras.
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
            'Guardar Horarios'
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
    totalMinutes += 24 * 60; // Si cruza la medianoche
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