// src/components/ProfileOnboarding.js
import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, CardBody, Form, FormGroup, Label, Input, 
  Button, Alert, Spinner, Badge 
} from 'reactstrap';
import { useAuth0 } from '@auth0/auth0-react';

// Obtener la URL base desde las variables de entorno
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const ProfileOnboarding = ({ onComplete }) => {
  const { user } = useAuth0();
  const [formData, setFormData] = useState({
    peso: '',
    altura: '',
    detalle: ''
  });
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [conditions, setConditions] = useState([]);
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
          setConditions(data);
        }
      } catch (err) {
        console.error('Error cargando condiciones:', err);
      }
    };
    fetchConditions();
  }, []);

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
    
    if (!formData.peso || !formData.altura) {
      setError('Por favor completa los campos requeridos ( peso, altura)');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // 1. Guardar datos de salud
      const saludResponse = await fetch(`${API_BASE_URL}/users/salud/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_email: user.email,
          peso: parseFloat(formData.peso),
          altura: parseFloat(formData.altura),
          detalle: formData.detalle || ''
        })
      });

      if (!saludResponse.ok) {
        const errorData = await saludResponse.json();
        throw new Error(errorData.error || 'Error guardando datos de salud');
      }

      // 2. Guardar condiciones médicas seleccionadas usando el nuevo endpoint
      if (selectedConditions.length > 0) {
        for (const conditionId of selectedConditions) {
          const usuarioCondicionResponse = await fetch(`${API_BASE_URL}/users/usuario-condiciones/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_email: user.email,
              condicion_id: conditionId
            })
          });

          if (!usuarioCondicionResponse.ok) {
            console.warn('Error guardando condición:', conditionId);
            const errorData = await usuarioCondicionResponse.json();
            console.error('Detalles del error:', errorData);
          } else {
            console.log(' Condición guardada:', conditionId);
          }
        }
      }

      setSuccess('¡Perfil de salud completado exitosamente!');
      
      // Esperar un poco y luego notificar completado
      setTimeout(() => {
        console.log(' Notificando completado del onboarding');
        onComplete();
      }, 1500);

    } catch (err) {
      console.error('Error completando perfil:', err);
      setError(err.message || 'Error al guardar los datos. Por favor intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="my-5" style={{ minHeight: '80vh' }}>
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-lg border-0">
            <CardBody className="p-5">
              <div className="text-center mb-4">
                <h2 className="text-success mb-3">¡Completa tu Perfil de Salud! </h2>
                <p className="text-muted">
                  Esta información nos ayuda a recomendarte rutas seguras y personalizadas
                </p>
                <Badge color="light" className="text-dark">
                  Usuario: {user?.email}
                </Badge>
              </div>

              {error && <Alert color="danger">{error}</Alert>}
              {success && <Alert color="success">{success}</Alert>}

              <Form onSubmit={handleSubmit}>
                {/* Información Básica de Salud */}
                <div className="mb-4">
                  <h5 className="text-success mb-3"> Información Básica</h5>
                  <Row>
                    <Col md={4}>
                    </Col>
                    <Col md={4}>
                      <FormGroup>
                        <Label for="peso" className="fw-bold">Peso (kg) *</Label>
                        <Input
                          type="number"
                          name="peso"
                          id="peso"
                          placeholder="Ej: 70"
                          value={formData.peso}
                          onChange={handleInputChange}
                          min="1"
                          step="0.1"
                          required
                        />
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup>
                        <Label for="altura" className="fw-bold">Altura (m) *</Label>
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
                          required
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
                      placeholder="Alergias, medicamentos, condiciones especiales, etc..."
                      value={formData.detalle}
                      onChange={handleInputChange}
                      rows="3"
                    />
                  </FormGroup>
                </div>

                {/* Condiciones Médicas */}
                <div className="mb-4">
                  <h5 className="text-success mb-3">Condiciones Médicas (Opcional)</h5>
                  
                  {conditions.length > 0 ? (
                    <Row>
                      {conditions.map(condition => (
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

                {/* Botón de envío */}
                <div className="text-center">
                  <Button 
                    color="success" 
                    size="lg"
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2"
                  >
                    {submitting ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Guardando...
                      </>
                    ) : (
                      'Completar Perfil'
                    )}
                  </Button>
                </div>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProfileOnboarding;
