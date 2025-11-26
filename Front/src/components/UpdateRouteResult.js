// src/components/UpdateRouteResultModal.js
import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Form, FormGroup, Label, Input, Alert, Spinner, Row, Col } from 'reactstrap';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const UpdateRouteResult = ({ isOpen, toggle, historialItem, userEmail, onSuccess }) => {
  const [formData, setFormData] = useState({
    resultado: '',
    satisfaccion: '',
    tiempo_real: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cargar datos existentes cuando se abre el modal
  useEffect(() => {
    if (isOpen && historialItem) {
      setFormData({
        resultado: historialItem.resultado || 'completada',
        satisfaccion: historialItem.satisfaccion || '',
        tiempo_real: formatTiempoReal(historialItem.tiempo_duracion) || '',
      });
    }
  }, [isOpen, historialItem]);

  // Función para formatear tiempo de DurationField a HH:MM
  const formatTiempoReal = (tiempoDuracion) => {
    if (!tiempoDuracion) return '';
    
    if (typeof tiempoDuracion === 'string') {
      // Si viene como string "HH:MM:SS" de Django
      const [hours, minutes] = tiempoDuracion.split(':');
      return `${hours}:${minutes}`;
    }
    
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.resultado) {
      setError('Por favor selecciona el resultado de la ruta');
      return;
    }

    if (!formData.satisfaccion) {
      setError('Por favor selecciona tu nivel de satisfacción');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Convertir tiempo_real a formato DurationField de Django
      let tiempoDuracion = null;
      if (formData.tiempo_real) {
        const [hours, minutes] = formData.tiempo_real.split(':').map(Number);
        tiempoDuracion = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
      }

      const updateData = {
        user_email: userEmail,
        resultado: formData.resultado,
        satisfaccion: formData.satisfaccion,
        ...(tiempoDuracion && { tiempo_duracion: tiempoDuracion }),
        ...(formData.notas && { descripcion: formData.notas })
      };

      console.log('📤 Actualizando historial:', updateData);

      const response = await fetch(`${API_BASE_URL}/trail/historial-rutas/${historialItem.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el historial');
      }

      const result = await response.json();
      setSuccess('¡Información de la ruta actualizada exitosamente!');
      
      setTimeout(() => {
        onSuccess(result);
        toggle();
        resetForm();
      }, 1500);

    } catch (err) {
      console.error('Error actualizando historial:', err);
      setError(err.message || 'Error al actualizar la información de la ruta');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      resultado: '',
      satisfaccion: ''
    });
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    resetForm();
    toggle();
  };

  return (
    <Modal isOpen={isOpen} toggle={handleClose} size="lg">
      <ModalHeader toggle={handleClose}>
        <i className="fa fa-edit me-2 text-success"></i>
        Evaluar Ruta Completada
      </ModalHeader>
      <Form onSubmit={handleSubmit}>
        <ModalBody>
          {error && <Alert color="danger">{error}</Alert>}
          {success && <Alert color="success">{success}</Alert>}

          {/* Información de la ruta */}
          {historialItem && (
            <div className="alert alert-info mb-4">
              <h6 className="alert-heading">Ruta completada:</h6>
              <strong className="h5">{historialItem.ruta?.nombre || 'Ruta'}</strong>
              <br />
              <small>
                <i className="fa fa-calendar me-1"></i>
                Fecha: {new Date(historialItem.fecha).toLocaleDateString('es-MX', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </small>
            </div>
          )}

          <Row>
            <Col md={6}>
              <FormGroup>
                <Label for="resultado" className="fw-bold">Resultado *</Label>
                <Input
                  type="select"
                  id="resultado"
                  value={formData.resultado}
                  onChange={(e) => setFormData(prev => ({ ...prev, resultado: e.target.value }))}
                  disabled={submitting}
                >
                  <option value="completada">Completada exitosamente</option>
                  <option value="completada_dificil"> Completada con dificultad</option>
                  <option value="incompleta"> No completada</option>
                  <option value="cancelada"> Cancelada</option>
                </Input>
                <small className="form-text text-muted">
                  ¿Lograste completar la ruta?
                </small>
              </FormGroup>
            </Col>

            <Col md={6}>
              <FormGroup>
                <Label for="satisfaccion" className="fw-bold">Satisfacción *</Label>
                <Input
                  type="select"
                  id="satisfaccion"
                  value={formData.satisfaccion}
                  onChange={(e) => setFormData(prev => ({ ...prev, satisfaccion: e.target.value }))}
                  disabled={submitting}
                  required
                >
                  <option value="">Selecciona tu nivel...</option>
                  <option value="muy_satisfecho"> Muy Satisfecho</option>
                  <option value="satisfecho">Satisfecho</option>
                  <option value="neutral"> Neutral</option>
                  <option value="insatisfecho"> Insatisfecho</option>
                  <option value="muy_insatisfecho"> Muy Insatisfecho</option>
                </Input>
                <small className="form-text text-muted">
                  ¿Qué tan satisfecho estás con la experiencia?
                </small>
              </FormGroup>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <FormGroup>
                <Label for="tiempo_real" className="fw-bold">Tiempo Real (HH:MM)</Label>
                <Input
                  type="text"
                  id="tiempo_real"
                  placeholder="Ej: 02:30, 01:45"
                  value={formData.tiempo_real}
                  onChange={(e) => setFormData(prev => ({ ...prev, tiempo_real: e.target.value }))}
                  disabled={submitting}
                  pattern="[0-9]{1,2}:[0-9]{2}"
                  title="Formato: HH:MM (ej: 02:30)"
                />
                <small className="form-text text-muted">
                  Tiempo real que te tomó completar la ruta
                </small>
              </FormGroup>
            </Col>
          </Row>

          {/* Preview de cómo se verá */}
          {(formData.resultado || formData.satisfaccion) && (
            <div className="alert alert-light border">
              <h6 className="text-success">
                <i className="fa fa-eye me-1"></i>
                Vista previa:
              </h6>
              <div className="d-flex gap-3 flex-wrap">
                {formData.resultado && (
                  <span className={`badge ${
                    formData.resultado.includes('completada') ? 'bg-success' : 
                    formData.resultado.includes('incompleta') ? 'bg-danger' : 'bg-warning'
                  }`}>
                    {formData.resultado.replace('_', ' ')}
                  </span>
                )}
                {formData.satisfaccion && (
                  <span className={`badge ${
                    formData.satisfaccion.includes('muy_satisfecho') ? 'bg-success' :
                    formData.satisfaccion.includes('satisfecho') ? 'bg-info' :
                    formData.satisfaccion.includes('neutral') ? 'bg-warning' : 'bg-danger'
                  }`}>
                    {formData.satisfaccion.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={handleClose} disabled={submitting}>
            <i className="fa fa-times me-1"></i>
            Cancelar
          </Button>
          <Button 
            color="success" 
            type="submit"
            disabled={submitting || !formData.resultado || !formData.satisfaccion}
          >
            {submitting ? (
              <>
                <Spinner size="sm" className="me-2" />
                Guardando...
              </>
            ) : (
              <>
                <i className="fa fa-check me-1"></i>
                Guardar Evaluación
              </>
            )}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default UpdateRouteResult;