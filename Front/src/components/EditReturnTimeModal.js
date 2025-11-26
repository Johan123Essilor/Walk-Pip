// src/components/EditReturnTimeModal.js
import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Alert, Spinner, FormGroup, Label, Input } from 'reactstrap';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const EditReturnTimeModal = ({ isOpen, toggle, appointment, userEmail, onSuccess }) => {
  const [startTime, setStartTime] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cargar datos existentes cuando se abra el modal
  useEffect(() => {
    if (isOpen && appointment) {
      if (appointment.horario_retorno) {
        setStartTime(appointment.horario_retorno.hora_inicio || '');
        setReturnTime(appointment.horario_retorno.hora_retorno || '');
      } else {
        // Si no existe horario, usar la hora de la cita como inicio predeterminado
        const appointmentTime = new Date(appointment.fecha_visita);
        setStartTime(appointmentTime.toTimeString().slice(0, 5));
        setReturnTime('');
      }
    }
  }, [isOpen, appointment]);

  const handleSubmit = async () => {
    if (!startTime || !returnTime) {
      setError('Ambas horas son requeridas');
      return;
    }

    if (startTime >= returnTime) {
      setError('La hora de retorno debe ser posterior a la hora de inicio');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const url = appointment.horario_retorno 
        ? `${API_BASE_URL}/users/horario-retorno/${appointment.horario_retorno.id}/`
        : `${API_BASE_URL}/users/horario-retorno/`;

      const method = appointment.horario_retorno ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cita: appointment.id,
          hora_inicio: startTime,
          hora_retorno: returnTime,
          user_email: userEmail
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar horario');
      }

      setSuccess('¡Horario actualizado exitosamente!');
      
      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err) {
      console.error('Error guardando horario:', err);
      setError(err.message || 'Error al guardar el horario');
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
        <i className="fa fa-edit me-2"></i>
        {appointment?.horario_retorno ? 'Editar Horario' : 'Agregar Horario'}
      </ModalHeader>
      <ModalBody>
        {error && <Alert color="danger">{error}</Alert>}
        {success && <Alert color="success">{success}</Alert>}

        <FormGroup>
          <Label for="startTime" className="fw-bold">Hora de inicio *</Label>
          <Input
            type="time"
            id="startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            disabled={submitting}
          />
        </FormGroup>

        <FormGroup>
          <Label for="returnTime" className="fw-bold">Hora de retorno *</Label>
          <Input
            type="time"
            id="returnTime"
            value={returnTime}
            onChange={(e) => setReturnTime(e.target.value)}
            disabled={submitting}
          />
        </FormGroup>

        {startTime && returnTime && (
          <Alert color="info">
            <strong>Duración estimada:</strong> {calculateDuration(startTime, returnTime)}
          </Alert>
        )}
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
            appointment?.horario_retorno ? 'Actualizar' : 'Guardar'
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

const calculateDuration = (startTime, endTime) => {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  let totalMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
  
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

export default EditReturnTimeModal;