// src/pages/UserProfile.js
import { useAuth0 } from "@auth0/auth0-react";
import { useUserSync } from '../hooks/useUserSync';
import LoginButton from "../components/LoginButton";

const UserProfile = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const { isSyncing, syncError, djangoUser } = useUserSync();

  if (isLoading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-2">Cargando información de usuario...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="card">
              <div className="card-body">
                <h2>No has iniciado sesión</h2>
                <p className="text-muted">Por favor inicia sesión para ver tu perfil</p>
                <LoginButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-header bg-success text-white">
              <h3 className="mb-0">
                <i className="fa fa-user me-2"></i>
                Mi Perfil
              </h3>
            </div>
            
            <div className="card-body">
              {/* Estado de sincronización */}
              {isSyncing && (
                <div className="alert alert-info d-flex align-items-center">
                  <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                  Sincronizando con la base de datos...
                </div>
              )}

              {syncError && (
                <div className="alert alert-warning">
                  <strong>
                    <i className="fa fa-exclamation-triangle me-2"></i>
                    Error de sincronización:
                  </strong>
                  <p className="mb-0 mt-1">{syncError}</p>
                  <button 
                    className="btn btn-sm btn-outline-warning mt-2"
                    onClick={() => window.location.reload()}
                  >
                    Reintentar
                  </button>
                </div>
              )}

              <div className="row">
                {/* Columna izquierda - Avatar e info básica */}
                <div className="col-md-4 text-center border-end">
                  <img 
                    src={user.picture} 
                    alt={user.name} 
                    className="img-fluid rounded-circle mb-3 shadow"
                    style={{ 
                      width: '150px', 
                      height: '150px', 
                      objectFit: 'cover' 
                    }}
                  />
                  <h4 className="text-success">{user.name}</h4>
                  <p className="text-muted">{user.email}</p>
                  
                  {/* Estado de sincronización con BD */}
                </div>

                {/* Columna derecha - Información detallada */}
                <div className="col-md-8">
                  <h5 className="border-bottom pb-2">
                    <i className="fa fa-id-card me-2"></i>
                    Información de Autenticación
                  </h5>
                  
                  <div className="table-responsive">
                    <table className="table table-sm table-borderless">
                      <tbody>
                        <tr>
                          <td className="fw-bold" style={{width: '140px'}}>Email:</td>
                          <td>{user.email}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">Nombre completo:</td>
                          <td>{user.name}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">Verificado:</td>
                          <td>
                            {user.email_verified ? (
                              <span className="badge bg-success">
                                <i className="fa fa-check me-1"></i>
                                Sí
                              </span>
                            ) : (
                              <span className="badge bg-warning">
                                <i className="fa fa-times me-1"></i>
                                No
                              </span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;