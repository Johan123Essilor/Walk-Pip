import { useState } from 'react';

const CreateGroupForm = ({ onSubmit, onCancel, userEmail }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      setError('El nombre del grupo es obligatorio');
      return;
    }

    if (formData.nombre.length < 3) {
      setError('El nombre debe tener al menos 3 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err.message || 'Error al crear el grupo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '16px',
          fontSize: '0.9rem',
          border: '1px solid #ef5350'
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block',
          marginBottom: '6px',
          fontWeight: '600',
          color: '#1b1b1b',
          fontSize: '0.9rem'
        }}>
          Nombre del grupo *
        </label>        <input
          type="text"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          placeholder="Ej: Senderistas Monterrey"
          required
          maxLength={50}
          style={{
            width: '100%',
            padding: '10px',
            border: '2px solid #e0e0e0',
            borderRadius: '6px',
            fontSize: '0.9rem',
            outline: 'none',
            transition: 'border-color 0.3s ease'
          }}
          onFocus={(e) => e.target.style.borderColor = '#2e7d32'}
          onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block',
          marginBottom: '6px',
          fontWeight: '600',
          color: '#1b1b1b',
          fontSize: '0.9rem'
        }}>
          Descripción
        </label>        <textarea
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          placeholder="Describe brevemente el grupo y sus objetivos..."
          rows={3}
          maxLength={200}
          style={{
            width: '100%',
            padding: '10px',
            border: '2px solid #e0e0e0',
            borderRadius: '6px',
            fontSize: '0.9rem',
            outline: 'none',
            transition: 'border-color 0.3s ease',
            resize: 'vertical'
          }}
          onFocus={(e) => e.target.style.borderColor = '#2e7d32'}
          onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
        />      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end'
      }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          style={{
            backgroundColor: 'transparent',
            color: '#666',
            border: '1px solid #ccc',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '0.9rem',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = '#f5f5f5';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = 'transparent';
            }
          }}
        >
          Cancelar
        </button>
        
        <button
          type="submit"
          disabled={loading || !formData.nombre.trim()}
          style={{            backgroundColor: loading || !formData.nombre.trim() ? '#ccc' : '#2e7d32',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: (loading || !formData.nombre.trim()) ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '0.9rem',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}          onMouseEnter={(e) => {
            if (!loading && formData.nombre.trim()) {
              e.target.style.backgroundColor = '#1b5e20';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && formData.nombre.trim()) {
              e.target.style.backgroundColor = '#2e7d32';
            }
          }}
        >
          {loading && (
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid transparent',
              borderTop: '2px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          )}
          {loading ? 'Creando...' : 'Crear grupo'}
        </button>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  );
};

export default CreateGroupForm;
