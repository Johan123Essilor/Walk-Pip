// src/pages/UserProfile.js
import { useState, useEffect } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import { useUserSync } from '../hooks/useUserSync';
import LoginButton from "../components/LoginButton";
import EditProfile from '../components/EditProfile';
import AddEmergencyContact from '../components/AddEmergencyContact';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const UserProfile = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const { isSyncing, syncError } = useUserSync();

  // Estados para datos del usuario
  const [userData, setUserData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [medicalConditions, setMedicalConditions] = useState([]);
  const [allConditions, setAllConditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [editModal, setEditModal] = useState(false);

  // Función para cargar datos de usuario (edad)
  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/perfil/?user_email=${user.email}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    } catch (err) {
      console.error('Error fetching user data:', err);
      return null;
    }
  };

  // Función para cargar datos de salud usando POST a mis_datos
  const fetchHealthData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/salud/mis_datos/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_email: user.email
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      } else if (response.status === 404) {
        return null;
      }
      return null;
    } catch (err) {
      console.error('Error fetching health data:', err);
      return null;
    }
  };

  // Función para cargar condiciones médicas del usuario
  const fetchUserConditions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/usuario-condiciones/?user_email=${user.email}`);
      if (response.ok) {
        const userConditions = await response.json();
        return userConditions;
      }
      return [];
    } catch (err) {
      console.error('Error fetching user conditions:', err);
      return [];
    }
  };

  // Función para cargar todas las condiciones médicas disponibles
  const fetchAllConditions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/condicion/`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return [];
    } catch (err) {
      console.error('Error fetching all conditions:', err);
      return [];
    }
  };

  // Función para combinar condiciones del usuario con nombres
  const combineUserConditions = (userConditions, allConditions) => {
    return userConditions.map(userCond => {
      const conditionId = userCond.id || userCond.condicion || userCond.id_condicion;
      const conditionInfo = allConditions.find(cond => cond.id === conditionId);

      return {
        ...userCond,
        condicion_id: conditionId,
        condicion_nombre: conditionInfo ? conditionInfo.nombre : 'Condición desconocida',
        condicion_descripcion: conditionInfo ? conditionInfo.descripcion : ''
      };
    });
  };

  // Función para cargar todos los datos del usuario
  const loadUserData = async () => {
    if (!user?.email) return;

    setLoading(true);
    setDataError(null);

    try {
      // Cargar todas las condiciones disponibles primero
      const allConditionsData = await fetchAllConditions();
      setAllConditions(allConditionsData);

      // Realizar las demás peticiones en paralelo
      const [userDataResult, healthDataResult, userConditionsResult] = await Promise.all([
        fetchUserData(),
        fetchHealthData(),
        fetchUserConditions()
      ]);

      // Combinar condiciones del usuario con sus nombres
      const combinedConditions = combineUserConditions(userConditionsResult, allConditionsData);

      setUserData(userDataResult);
      setHealthData(healthDataResult);
      setMedicalConditions(combinedConditions);

    } catch (err) {
      console.error('Error loading user data:', err);
      setDataError('Error al cargar los datos del usuario. Por favor intenta recargar la página.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos cuando el usuario esté disponible
  useEffect(() => {
    if (user?.email) {
      loadUserData();
    }
  }, [user?.email]);

  const handleUpdate = () => {
    loadUserData();
  };

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
        <div className="col-md-10">
          <div className="card shadow">
            <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
              <h3 className="mb-0">
                <i className="fa fa-user me-2"></i>
                Mi Perfil
              </h3>
              <button
                className="btn btn-light btn-sm"
                onClick={() => setEditModal(true)}
                style={{ transition: 'none' }} // Eliminar transición hover
              >
                <i className="fa fa-edit me-1"></i>
                Editar Datos Medicos
              </button>
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
                    style={{ transition: 'none' }}
                  >
                    Reintentar
                  </button>
                </div>
              )}

              {loading && (
                <div className="text-center py-3">
                  <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">Cargando datos...</span>
                  </div>
                  <p className="mt-2">Cargando información de salud...</p>
                </div>
              )}

              {dataError && (
                <div className="alert alert-danger">
                  <i className="fa fa-exclamation-triangle me-2"></i>
                  {dataError}
                  <button
                    className="btn btn-sm btn-outline-danger mt-2 ms-2"
                    onClick={loadUserData}
                    style={{ transition: 'none' }}
                  >
                    Reintentar
                  </button>
                </div>
              )}

              {!loading && !dataError && (
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
                  </div>

                  {/* Columna derecha - Información detallada */}
                  <div className="col-md-8">
                    <h5 className="border-bottom pb-2 mb-3">
                      <i className="fa fa-id-card me-2"></i>
                      Información Detallada
                    </h5>

                    <div className="row">
                      <div className="col-md-6">
                        <h6 className="text-success">
                          <i className="fa fa-user me-2"></i>
                          Información Personal
                        </h6>
                        <div className="table-responsive">
                          <table className="table table-sm table-borderless">
                            <tbody>
                              <tr>
                                <td className="fw-bold" style={{ width: '100px' }}>Email:</td>
                                <td>{user.email}</td>
                              </tr>
                              <tr>
                                <td className="fw-bold">Nombre:</td>
                                <td>{user.name}</td>
                              </tr>
                              <tr>
                                <td className="fw-bold">Edad:</td>
                                <td>
                                  {userData?.edad ? (
                                    `${userData.edad} años`
                                  ) : (
                                    <span className="text-muted">No especificada</span>
                                  )}
                                </td>
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

                      <div className="col-md-6">
                        <h6 className="text-success">
                          <i className="fa fa-heart me-2"></i>
                          Información de Salud
                        </h6>
                        <div className="table-responsive">
                          <table className="table table-sm table-borderless">
                            <tbody>
                              <tr>
                                <td className="fw-bold" style={{ width: '100px' }}>Peso:</td>
                                <td>
                                  {healthData?.peso ? (
                                    `${healthData.peso} kg`
                                  ) : (
                                    <span className="text-muted">No especificado</span>
                                  )}
                                </td>
                              </tr>
                              <tr>
                                <td className="fw-bold">Altura:</td>
                                <td>
                                  {healthData?.altura ? (
                                    `${healthData.altura} m`
                                  ) : (
                                    <span className="text-muted">No especificada</span>
                                  )}
                                </td>
                              </tr>
                              <tr>
                                <td className="fw-bold">Condiciones:</td>
                                <td>
                                  {medicalConditions.length > 0 ? (
                                    <div>
                                      {medicalConditions.map(mc => (
                                        <span
                                          key={mc.id}
                                          className="badge bg-light text-success me-1 mb-1"
                                          title={mc.condicion_descripcion}
                                          style={{ transition: 'none' }}
                                        >
                                          {mc.condicion_nombre}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-muted">Ninguna registrada</span>
                                  )}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Información adicional de salud */}
                    {healthData?.detalle && (
                      <div className="mt-3">
                        <h6 className="text-success">
                          <i className="fa fa-info-circle me-2"></i>
                          Información Adicional
                        </h6>
                        <div className="card bg-light">
                          <div className="card-body">
                            <p className="mb-0">{healthData.detalle}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Si no hay datos de salud */}
                    {!healthData && !userData?.edad && (
                      <div className="alert alert-info mt-3">
                        <i className="fa fa-info-circle me-2"></i>
                        <strong>Completa tu perfil:</strong> Agrega tu edad e información de salud
                        para obtener recomendaciones personalizadas de rutas.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          {<AddEmergencyContact />}
        </div>
      </div>

      {/* Modal de edición - Pasar también allConditions */}
      <EditProfile
        isOpen={editModal}
        toggle={() => setEditModal(false)}
        userData={userData}
        healthData={healthData}
        medicalConditions={medicalConditions}
        allConditions={allConditions}
        onUpdate={handleUpdate}
      />
    </div>
  );
};

export default UserProfile;