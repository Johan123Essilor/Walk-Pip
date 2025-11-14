import { useState, useEffect } from 'react';
import { Card, CardBody, Form, FormGroup, Label, Input, Button, Alert, Spinner, Badge } from 'reactstrap';
import { useAuth0 } from '@auth0/auth0-react';
import StarRating from '../components/StarRating';

const ReviewsSection = ({ trailId, trailName }) => {
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    comentario: '',
    dificultad: 'media'
  });

  const { user, isAuthenticated, loginWithRedirect } = useAuth0();

  // Obtener todas las reseñas de la ruta
  const fetchReviews = async () => {
    if (!trailId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/users/reviews/?ruta=${trailId}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar reseñas');
      }
      
      const reviewsData = await response.json();
      setReviews(reviewsData);
      
      // Buscar si el usuario actual ya tiene una reseña
      if (isAuthenticated && user?.email) {
        const userRev = reviewsData.find(review => 
          review.usuario_correo === user.email
        );
        setUserReview(userRev || null);
        
        // Si ya tiene reseña, pre-cargar el formulario
        if (userRev) {
          setReviewForm({
            rating: userRev.puntuacion,
            comentario: userRev.comentario,
            dificultad: userRev.estado || 'media'
          });
        }
      }
      
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('No se pudieron cargar las reseñas');
    } finally {
      setLoading(false);
    }
  };

  // Obtener reseñas del usuario actual
  const fetchUserReviews = async () => {
    if (!isAuthenticated || !user?.email) return;
    
    try {
      const response = await fetch('http://localhost:8000/users/reviews/mis_reviews/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_email: user.email
        })
      });

      if (response.ok) {
        const userReviews = await response.json();
        // Encontrar la reseña para esta ruta específica
        const reviewForThisTrail = userReviews.find(review => review.ruta === trailId);
        setUserReview(reviewForThisTrail || null);
        
        if (reviewForThisTrail) {
          setReviewForm({
            rating: reviewForThisTrail.puntuacion,
            comentario: reviewForThisTrail.comentario,
            dificultad: reviewForThisTrail.estado || 'media'
          });
        }
      }
    } catch (err) {
      console.error('Error fetching user reviews:', err);
    }
  };

  // Enviar nueva reseña - ACTUALIZADO para usar user_email
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      loginWithRedirect();
      return;
    }

    if (reviewForm.rating === 0) {
      setError('Por favor selecciona una calificación');
      return;
    }

    if (!reviewForm.comentario.trim()) {
      setError('Por favor escribe un comentario');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const method = userReview ? 'PUT' : 'POST';
      const url = userReview 
        ? `http://localhost:8000/users/reviews/${userReview.id}/`
        : 'http://localhost:8000/users/reviews/';

      // ✅ PAYLOAD ACTUALIZADO - usa user_email igual que CitaViewSet
      const reviewData = {
        ruta: trailId,
        puntuacion: reviewForm.rating,
        comentario: reviewForm.comentario.trim(),
        estado: reviewForm.dificultad,
        user_email: user.email // ← ✅ CAMBIADO de 'email' a 'user_email'
      };

      console.log('📤 Enviando reseña:', reviewData);

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error del backend:', errorData);
        throw new Error(errorData.error || errorData.detail || JSON.stringify(errorData));
      }

      const result = await response.json();
      console.log('✅ Reseña guardada:', result);
      
      setSuccess(userReview ? '✅ Reseña actualizada' : '✅ Reseña publicada');
      setUserReview(result);
      
      // Recargar todas las reseñas
      await fetchReviews();
      
      // Reset form si es nueva reseña
      if (!userReview) {
        setReviewForm({
          rating: 0,
          comentario: '',
          dificultad: 'media'
        });
      }
      
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err.message || 'Error al enviar la reseña');
    } finally {
      setSubmitting(false);
    }
  };

  // Eliminar reseña - ACTUALIZADO para usar user_email
  const handleDeleteReview = async () => {
    if (!userReview || !window.confirm('¿Estás seguro de que quieres eliminar tu reseña?')) {
      return;
    }

    setSubmitting(true);
    try {
      // Para DELETE, necesitamos enviar el user_email en el body
      const deleteData = {
        user_email: user.email // ← ✅ CAMBIADO de 'email' a 'user_email'
      };

      const response = await fetch(`http://localhost:8000/users/reviews/${userReview.id}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(deleteData)
      });

      if (!response.ok) {
        throw new Error('Error al eliminar reseña');
      }

      setSuccess('🗑️ Reseña eliminada');
      setUserReview(null);
      setReviewForm({
        rating: 0,
        comentario: '',
        dificultad: 'media'
      });
      
      await fetchReviews();
      
    } catch (err) {
      console.error('Error deleting review:', err);
      setError('Error al eliminar la reseña');
    } finally {
      setSubmitting(false);
    }
  };

  // Calificación promedio
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, review) => sum + review.puntuacion, 0) / reviews.length).toFixed(1)
    : 0;

  // Cargar reseñas cuando cambie la ruta o autenticación
  useEffect(() => {
    fetchReviews();
    if (isAuthenticated) {
      fetchUserReviews();
    }
  }, [trailId, isAuthenticated, user]);

  return (
    <div className="reviews-section" style={{ marginTop: '2rem' }}>
      {/* Header de reseñas */}
      <div className="reviews-header" style={{ 
        borderBottom: '2px solid #e9ecef',
        paddingBottom: '1rem',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ 
          fontFamily: 'Kalam, cursive',
          color: '#388e3c',
          marginBottom: '0.5rem'
        }}>
          Reseñas de {trailName}
        </h3>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2e7d32' }}>
              {averageRating}
            </span>
            <span style={{ color: '#666', marginLeft: '0.5rem' }}>/5.0</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <StarRating rating={parseFloat(averageRating)} size="lg" />
            <span style={{ color: '#666', marginLeft: '0.5rem' }}>
              ({reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'})
            </span>
          </div>
        </div>
      </div>

      {/* Formulario de reseña */}
      {isAuthenticated ? (
        <Card style={{ marginBottom: '2rem', border: '1px solid #e9ecef' }}>
          <CardBody>
            <h5 style={{ 
              color: '#2e7d32',
              marginBottom: '1rem',
              fontWeight: '600'
            }}>
              {userReview ? 'Editar tu reseña' : 'Escribe tu reseña'}
            </h5>
            
            {error && <Alert color="danger">{error}</Alert>}
            {success && <Alert color="success">{success}</Alert>}
            
            <Form onSubmit={handleSubmitReview}>
              {/* Calificación con estrellas */}
              <FormGroup>
                <Label for="rating" style={{ fontWeight: '600' }}>
                  Calificación *
                </Label>
                <div style={{ marginBottom: '1rem' }}>
                  <StarRating 
                    rating={reviewForm.rating}
                    onRatingChange={(rating) => setReviewForm(prev => ({ ...prev, rating }))}
                    editable={true}
                  />
                </div>
              </FormGroup>

              {/* Dificultad */}
              <FormGroup>
                <Label for="dificultad" style={{ fontWeight: '600' }}>
                  Nivel de dificultad
                </Label>
                <Input
                  type="select"
                  id="dificultad"
                  value={reviewForm.dificultad}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, dificultad: e.target.value }))}
                  style={{ border: '2px solid #e9ecef', borderRadius: '8px' }}
                >
                  <option value="facil">Fácil</option>
                  <option value="media">Media</option>
                  <option value="dificil">Difícil</option>
                  <option value="extrema">Extrema</option>
                </Input>
              </FormGroup>

              {/* Comentario */}
              <FormGroup>
                <Label for="comentario" style={{ fontWeight: '600' }}>
                  Comentario *
                </Label>
                <Input
                  type="textarea"
                  id="comentario"
                  rows="4"
                  placeholder="Comparte tu experiencia en esta ruta..."
                  value={reviewForm.comentario}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, comentario: e.target.value }))}
                  style={{ 
                    border: '2px solid #e9ecef', 
                    borderRadius: '8px',
                    resize: 'vertical'
                  }}
                />
              </FormGroup>

              {/* Botones */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Button 
                  color="success" 
                  type="submit"
                  disabled={submitting || reviewForm.rating === 0 || !reviewForm.comentario.trim()}
                  style={{ 
                    borderRadius: '8px',
                    fontWeight: '600',
                    minWidth: '120px'
                  }}
                >
                  {submitting ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      {userReview ? 'Actualizando...' : 'Publicando...'}
                    </>
                  ) : (
                    userReview ? 'Actualizar reseña' : 'Publicar reseña'
                  )}
                </Button>
                
                {userReview && (
                  <Button 
                    color="outline-danger"
                    type="button"
                    onClick={handleDeleteReview}
                    disabled={submitting}
                    style={{ 
                      borderRadius: '8px',
                      fontWeight: '600'
                    }}
                  >
                    Eliminar reseña
                  </Button>
                )}
              </div>
            </Form>
          </CardBody>
        </Card>
      ) : (
        <Card style={{ marginBottom: '2rem', border: '1px dashed #e9ecef' }}>
          <CardBody style={{ textAlign: 'center', padding: '2rem' }}>
            <h5 style={{ color: '#666', marginBottom: '1rem' }}>
              Inicia sesión para escribir una reseña
            </h5>
            <Button 
              color="success"
              onClick={loginWithRedirect}
              style={{ borderRadius: '8px', fontWeight: '600' }}
            >
              Iniciar Sesión
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Lista de reseñas - CORREGIDO */}
      <div className="reviews-list">
        <h5 style={{ 
          color: '#2e7d32',
          marginBottom: '1rem',
          fontWeight: '600'
        }}>
          Reseñas de la comunidad
        </h5>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Spinner color="success" />
            <p style={{ color: '#666', marginTop: '1rem' }}>Cargando reseñas...</p>
          </div>
        ) : reviews.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reviews.map((review) => (
              <Card key={review.id} style={{ border: '1px solid #e9ecef' }}>
                <CardBody>
                  {/* Header de la reseña - CORREGIDO */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '0.75rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <strong style={{ color: '#2e7d32' }}>
                          {review.usuario_nombre || review.usuario_correo || 'Usuario'}
                        </strong>
                        {review.usuario_correo === user?.email && (
                          <Badge color="success" style={{ fontSize: '0.7rem' }}>
                            Tú
                          </Badge>
                        )}
                      </div>
                      <StarRating rating={review.puntuacion} size="sm" /> {/* ← CORREGIDO: puntuacion */}
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        {new Date(review.fecha).toLocaleDateString('es-MX')} {/* ← CORREGIDO: fecha */}
                      </div>
                      {review.estado && ( /* ← CORREGIDO: estado */
                        <Badge 
                          color={
                            review.estado === 'facil' ? 'success' :
                            review.estado === 'media' ? 'warning' :
                            review.estado === 'dificil' ? 'danger' : 'dark'
                          }
                          style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}
                        >
                          {review.estado.charAt(0).toUpperCase() + review.estado.slice(1)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Comentario */}
                  <p style={{ 
                    margin: 0, 
                    color: '#333',
                    lineHeight: '1.5'
                  }}>
                    {review.comentario}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <Card style={{ border: '1px dashed #e9ecef' }}>
            <CardBody style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              <p style={{ margin: 0, fontStyle: 'italic' }}>
                Aún no hay reseñas para esta ruta. ¡Sé el primero en compartir tu experiencia!
              </p>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReviewsSection;