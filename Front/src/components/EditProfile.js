import React, { useState, useEffect } from 'react';
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
  Form, FormGroup, Label, Input, Button, Alert, Spinner,
  Row, Col, Badge
} from 'reactstrap';
import { useAuth0 } from '@auth0/auth0-react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const EditProfile = ({ isOpen, toggle, userData, healthData, medicalConditions, onUpdate }) => {
  const { user } = useAuth0();
  const [formData, setFormData] = useState({
    edad: '',
    peso: '',
    altura: '',
    detalle: ''
  });
  const [availableConditions, setAvailableConditions] = useState([]);
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cargar condiciones médicas disponibles
  useEffect(() => {
    const fetchConditions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users/condicion/`);
        if (response.ok) {
          const data = await response.json();
          setAvailableConditions(data);
        }
      } catch (err) {
        console.error('Error cargando condiciones:', err);
      }
    };
    fetchConditions();
  }, []);

  // Inicializar form data cuando se abra el modal
  useEffect(() => {
    if (isOpen) {
      setFormData({
        edad: userData?.edad || '',
        peso: healthData?.peso || '',
        altura: healthData?.altura || '',
        detalle: healthData?.detalle || ''
      });
      setSelectedConditions(medicalConditions.map(mc => mc.condicion_id));
      setError('');
      setSuccess('');
    }
  }, [isOpen, userData, healthData, medicalConditions]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConditionToggle = (conditionId) => {
    setSelectedConditions(prev => 
      prev.includes(conditionId) 
        ? prev.filter(id => id !== conditionId)
        : [...prev, conditionId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // 1. Actualizar datos de usuario (edad)
      if (userData?.id) {
        const userResponse = await fetch(`${API_BASE_URL}/users/perfil/${userData.id}/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...userData,
            edad: formData.edad ? parseInt(formData.edad) : null,
            user_email: user.email
          })
        });

        if (!userResponse.ok) {
          throw new Error('Error actualizando datos de usuario');
        }
      }

      // 2. Actualizar datos de salud
      if (healthData?.id) {
        const saludResponse = await fetch(`${API_BASE_URL}/users/salud/${healthData.id}/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            peso: formData.peso ? parseFloat(formData.peso) : null,
            altura: formData.altura ? parseFloat(formData.altura) : null,
            detalle: formData.detalle,
            user_email: user.email
          })
        });

        if (!saludResponse.ok) {
          throw new Error('Error actualizando datos de salud');
        }
      } else {
        // Crear nuevo registro de salud si no existe
        const saludResponse = await fetch(`${API_BASE_URL}/users/salud/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            peso: formData.peso ? parseFloat(formData.peso) : null,
            altura: formData.altura ? parseFloat(formData.altura) : null,
            detalle: formData.detalle,
            user_email: user.email
          })
        });

        if (!saludResponse.ok) {
          throw new Error('Error creando datos de salud');
        }
      }

      // 3. Actualizar condiciones médicas
      // Primero eliminar todas las condiciones existentes
      if (medicalConditions.length > 0) {
        for (const condition of medicalConditions) {
          await fetch(`${API_BASE_URL}/users/usuario-condiciones/${condition.id}/`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_email: user.email
            })
          });
        }
      }

      // Luego agregar las nuevas condiciones seleccionadas
      if (selectedConditions.length > 0) {
        for (const conditionId of selectedConditions) {
          await fetch(`${API_BASE_URL}/users/usuario-condiciones/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_email: user.email,
              condicion: conditionId
            })
          });
        }
      }

      setSuccess('¡Perfil actualizado exitosamente!');
      
      // Notificar al componente padre y cerrar modal después de un tiempo
      setTimeout(() => {
        onUpdate();
        toggle();
      }, 1500);

    } catch (err) {
      console.error('Error actualizando perfil:', err);
      setError(err.message || 'Error al actualizar los datos');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg">
      <ModalHeader toggle={toggle}>
        <i className="fa fa-edit me-2"></i>
        Editar Perfil
      </ModalHeader>
      
      <Form onSubmit={handleSubmit}>
        <ModalBody>
          {error && <Alert color="danger">{error}</Alert>}
          {success && <Alert color="success">{success}</Alert>}

          <Row>
            <Col md={6}>
              <h6 className="text-success mb-3">Información Personal</h6>
              <FormGroup>
                <Label for="edad" className="fw-bold">Edad</Label>
                <Input
                  type="number"
                  name="edad"
                  id="edad"
                  placeholder="Tu edad"
                  value={formData.edad}
                  onChange={handleInputChange}
                  min="1"
                  max="120"
                />
              </FormGroup>
            </Col>
            
            <Col md={6}>
              <h6 className="text-success mb-3">Salud</h6>
              <FormGroup>
                <Label for="peso" className="fw-bold">Peso (kg)</Label>
                <Input
                  type="number"
                  name="peso"
                  id="peso"
                  placeholder="Ej: 70"
                  value={formData.peso}
                  onChange={handleInputChange}
                  min="1"
                  step="0.1"
                />
              </FormGroup>
              
              <FormGroup>
                <Label for="altura" className="fw-bold">Altura (m)</Label>
                <Input
                  type="number"
                  name="altura"
                  id="altura"
                  placeholder="Ej: 1.75"
                  value={formData.altura}
                  onChange={handleInputChange}
                  min="0.5"
                  max="2.5"
                  step="0.01"
                />
              </FormGroup>
            </Col>
          </Row>

          <FormGroup>
            <Label for="detalle" className="fw-bold">Información adicional de salud</Label>
            <Input
              type="textarea"
              name="detalle"
              id="detalle"
              placeholder="Alergias, medicamentos, condiciones especiales..."
              value={formData.detalle}
              onChange={handleInputChange}
              rows="3"
            />
          </FormGroup>

          {/* Condiciones Médicas */}
          <div className="mt-4">
            <h6 className="text-success mb-3">Condiciones Médicas</h6>
            {availableConditions.length > 0 ? (
              <Row>
                {availableConditions.map(condition => (
                  <Col md={6} key={condition.id} className="mb-2">
                    <div className="form-check">
                      <Input
                        type="checkbox"
                        id={`condition-${condition.id}`}
                        checked={selectedConditions.includes(condition.id)}
                        onChange={() => handleConditionToggle(condition.id)}
                        className="form-check-input"
                      />
                      <Label 
                        htmlFor={`condition-${condition.id}`} 
                        className="form-check-label"
                      >
                        {condition.nombre}
                      </Label>
                    </div>
                  </Col>
                ))}
              </Row>
            ) : (
              <div className="text-center text-muted">
                <Spinner size="sm" className="me-2" />
                Cargando condiciones...
              </div>
            )}
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button color="secondary" onClick={toggle} disabled={submitting}>
            Cancelar
          </Button>
          <Button color="success" type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Spinner size="sm" className="me-2" />
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default EditProfile;