// src/pages/MyGroupsPage.js
import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from 'reactstrap';
import { Link } from 'react-router-dom';

// Obtener la URL base desde las variables de entorno
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const MyGroups = () => {
  const { user, isAuthenticated } = useAuth0();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [groupMembers, setGroupMembers] = useState({});
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Función para obtener grupos del usuario
  const fetchUserGroups = async () => {
    if (!isAuthenticated || !user?.email) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log(' Obteniendo grupos del usuario...');
      
      const response = await fetch(`${API_BASE_URL}/groups/grupos/?user_email=${user.email}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      const groupsData = await response.json();
      console.log(' Grupos obtenidos:', groupsData);

      setGroups(groupsData || []);

      // Obtener miembros para cada grupo
      if (groupsData && groupsData.length > 0) {
        groupsData.forEach(group => {
          fetchGroupMembers(group.id);
        });
      }

    } catch (error) {
      console.error(' Error obteniendo grupos:', error);
      setError('Error al cargar los grupos. Intenta recargar la página.');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener miembros de un grupo
  const fetchGroupMembers = async (groupId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/groups/grupos/${groupId}/members/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_email: user?.email
        })
      });

      if (response.ok) {
        const membersData = await response.json();
        setGroupMembers(prev => ({
          ...prev,
          [groupId]: membersData
        }));
      }
    } catch (error) {
      console.error(`❌ Error obteniendo miembros del grupo ${groupId}:`, error);
    }
  };

  // Función para obtener usuarios disponibles
  const fetchAvailableUsers = async () => {
    try {
      setLoadingUsers(true);
      console.log('🔄 Obteniendo usuarios disponibles...');
      
      const response = await fetch(`${API_BASE_URL}/users/`);
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      const usersData = await response.json();
      console.log('✅ Usuarios obtenidos:', usersData);
      
      // Procesar usuarios (misma lógica que antes)
      let usersList = [];
      if (Array.isArray(usersData)) {
        usersList = usersData;
      } else if (usersData && typeof usersData === 'object' && usersData.results) {
        usersList = usersData.results;
      } else if (usersData && typeof usersData === 'object') {
        usersList = [usersData];
      }
      
      const filteredUsers = usersList.filter(u => 
        u.email !== user?.email && u.correo !== user?.email
      );
      
      setAvailableUsers(filteredUsers || []);

    } catch (error) {
      console.error('❌ Error obteniendo usuarios:', error);
      setAvailableUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Función para crear nuevo grupo
  const createNewGroup = async (groupData) => {
    try {
      console.log('🔄 Creando nuevo grupo:', groupData);
      
      const response = await fetch(`${API_BASE_URL}/groups/grupos/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...groupData,
          user_email: user?.email
        })
      });

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      const newGroup = await response.json();
      console.log('✅ Grupo creado:', newGroup);

      // Actualizar la lista de grupos
      await fetchUserGroups();
      
      setShowCreateForm(false);
      
      return newGroup;

    } catch (error) {
      console.error('❌ Error creando grupo:', error);
      throw error;
    }
  };

  // Función para invitar usuario a grupo
  const inviteUserToGroup = async (groupId, userToInvite) => {
    try {
      const userEmail = userToInvite.correo || userToInvite.email;
      console.log(`🔄 Invitando usuario ${userEmail} al grupo ${groupId}`);
      
      const response = await fetch(`${API_BASE_URL}/groups/grupos/${groupId}/invite-multiple/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_email: user?.email,
          usuarios_ids: [userToInvite.id],
          rol: 'Miembro'
        })
      });

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Usuario invitado:', result);

      // Actualizar miembros del grupo
      await fetchGroupMembers(groupId);
      
      return result;

    } catch (error) {
      console.error('❌ Error invitando usuario:', error);
      throw error;
    }
  };

  // Función para eliminar grupo
  const deleteGroup = async (groupId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este grupo? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/groups/grupos/${groupId}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_email: user?.email
        })
      });

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      console.log('✅ Grupo eliminado');
      
      // Actualizar lista de grupos
      await fetchUserGroups();

    } catch (error) {
      console.error('❌ Error eliminando grupo:', error);
      alert('Error al eliminar el grupo. Solo el creador puede eliminarlo.');
    }
  };

  // Cargar grupos cuando el usuario se autentique
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserGroups();
    }
  }, [isAuthenticated, user]);

  // Función para gestionar miembros de un grupo
  const manageGroupMembers = async (group) => {
    setSelectedGroup(group);
    await fetchAvailableUsers();
    setShowMembersModal(true);
  };

  if (!isAuthenticated) {
    return (
      <Container className="my-5">
        <Row>
          <Col>
            <Alert color="warning" className="text-center">
              <h4>🔐 Inicia sesión</h4>
              <p>Debes iniciar sesión para ver y gestionar tus grupos.</p>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="my-4">
      {/* Header de la página */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h2 mb-1" style={{ color: '#2e7d32', fontWeight: '700' }}>
                👥 Mis Grupos
              </h1>
              <p className="text-muted mb-0">
                Gestiona tus grupos de senderismo y organiza salidas con amigos
              </p>
            </div>
            <Button 
              color="success" 
              onClick={() => setShowCreateForm(true)}
              className="px-4"
            >
              <i className="fa fa-plus me-2"></i>
              Crear Nuevo Grupo
            </Button>
          </div>
          <hr className="mt-3" />
        </Col>
      </Row>

      {/* Estado de carga */}
      {loading && (
        <Row>
          <Col className="text-center py-5">
            <Spinner color="success" size="lg" />
            <p className="mt-3 text-muted">Cargando tus grupos...</p>
          </Col>
        </Row>
      )}

      {/* Mensaje de error */}
      {error && (
        <Row>
          <Col>
            <Alert color="danger">
              <h5>❌ Error</h5>
              <p className="mb-0">{error}</p>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Lista de grupos */}
      {!loading && !error && (
        <Row>
          {groups.length === 0 ? (
            <Col>
              <Card className="p-5 text-center border-dashed">
                <div className="mb-4">
                  <i className="fa fa-users fa-4x text-muted mb-3"></i>
                  <h4 className="text-muted">No tienes grupos aún</h4>
                  <p className="text-muted mb-4">
                    Crea tu primer grupo para organizar salidas de senderismo con amigos
                  </p>
                  <Button 
                    color="success" 
                    size="lg"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <i className="fa fa-plus me-2"></i>
                    Crear Mi Primer Grupo
                  </Button>
                </div>
              </Card>
            </Col>
          ) : (
            groups.map(group => (
              <Col md={6} lg={4} key={group.id} className="mb-4">
                <Card className="h-100 shadow-sm border-0">
                  <div className="p-4">
                    {/* Header de la tarjeta */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5 className="card-title mb-1" style={{ color: '#2e7d32' }}>
                          {group.nombre}
                        </h5>
                        {group.creador?.correo === user?.email && (
                          <Badge color="success" className="mb-2">
                            <i className="fa fa-crown me-1"></i>
                            Creador
                          </Badge>
                        )}
                      </div>
                      <div className="dropdown">
                        <button 
                          className="btn btn-sm btn-outline-secondary border-0"
                          type="button"
                          data-bs-toggle="dropdown"
                        >
                          <i className="fa fa-ellipsis-v"></i>
                        </button>
                        <ul className="dropdown-menu">
                          <li>
                            <button 
                              className="dropdown-item"
                              onClick={() => manageGroupMembers(group)}
                            >
                              <i className="fa fa-user-plus me-2"></i>
                              Gestionar Miembros
                            </button>
                          </li>
                          <li>
                            <button 
                              className="dropdown-item text-danger"
                              onClick={() => deleteGroup(group.id)}
                            >
                              <i className="fa fa-trash me-2"></i>
                              Eliminar Grupo
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Descripción */}
                    <p className="card-text text-muted small mb-3">
                      {group.descripcion || 'Sin descripción'}
                    </p>

                    {/* Información del grupo */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between text-sm text-muted mb-1">
                        <span>Miembros:</span>
                        <span>
                          {groupMembers[group.id] ? groupMembers[group.id].length : '0'}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between text-sm text-muted mb-1">
                        <span>Creado por:</span>
                        <span>{group.creador_nombre || group.creador?.correo}</span>
                      </div>
                      <div className="d-flex justify-content-between text-sm text-muted">
                        <span>Fecha creación:</span>
                        <span>{new Date(group.fecha_creacion).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="d-grid gap-2">
                      <Button 
                        color="outline-success" 
                        size="sm"
                        onClick={() => manageGroupMembers(group)}
                      >
                        <i className="fa fa-users me-2"></i>
                        Gestionar Miembros
                      </Button>
                      <Button 
                        color="outline-primary" 
                        size="sm"
                        onClick={() => {
                          // Redirigir a TrailDirectory con este grupo seleccionado
                          window.location.href = '/list-routes';
                        }}
                      >
                        <i className="fa fa-map me-2"></i>
                        Usar en Ruta
                      </Button>
                    </div>
                  </div>
                </Card>
              </Col>
            ))
          )}
        </Row>
      )}

      {/* Modal para crear grupo */}
      {showCreateForm && (
        <CreateGroupModal
          onSubmit={createNewGroup}
          onCancel={() => setShowCreateForm(false)}
          userEmail={user?.email}
        />
      )}

      {/* Modal para gestionar miembros */}
      {showMembersModal && selectedGroup && (
        <GroupMembersModal
          group={selectedGroup}
          availableUsers={availableUsers}
          loadingUsers={loadingUsers}
          currentMembers={groupMembers[selectedGroup.id] || []}
          onInviteUser={inviteUserToGroup}
          onClose={() => {
            setShowMembersModal(false);
            setSelectedGroup(null);
          }}
          onMembersUpdate={() => fetchGroupMembers(selectedGroup.id)}
        />
      )}
    </Container>
  );
};

// Componente Modal para Crear Grupo
const CreateGroupModal = ({ onSubmit, onCancel, userEmail }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      setError('El nombre del grupo es requerido');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit(formData);
    } catch (err) {
      setError('Error al crear el grupo. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Crear Nuevo Grupo</h5>
            <button type="button" className="btn-close" onClick={onCancel}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger">{error}</div>
              )}
              <div className="mb-3">
                <label htmlFor="nombre" className="form-label">
                  Nombre del Grupo *
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Grupo Senderismo Monterrey"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="descripcion" className="form-label">
                  Descripción
                </label>
                <textarea
                  className="form-control"
                  id="descripcion"
                  rows="3"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Describe el propósito de tu grupo..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onCancel}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? 'Creando...' : 'Crear Grupo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Componente Modal para Gestionar Miembros
const GroupMembersModal = ({ 
  group, 
  availableUsers, 
  loadingUsers, 
  currentMembers, 
  onInviteUser, 
  onClose,
  onMembersUpdate 
}) => {
  const [invitingUser, setInvitingUser] = useState(null);

  const handleInviteUser = async (userToInvite) => {
    try {
      setInvitingUser(userToInvite.id);
      await onInviteUser(group.id, userToInvite);
      await onMembersUpdate();
    } catch (error) {
      alert('Error al invitar usuario');
    } finally {
      setInvitingUser(null);
    }
  };

  const isUserAlreadyMember = (user) => {
    return currentMembers.some(member => 
      member.usuario?.correo === (user.correo || user.email) ||
      member.usuario?.email === (user.correo || user.email)
    );
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              Gestionar Miembros - {group.nombre}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            
            {/* Miembros actuales */}
            <div className="mb-4">
              <h6>Miembros del Grupo ({currentMembers.length})</h6>
              {currentMembers.length === 0 ? (
                <p className="text-muted">No hay miembros en este grupo aún.</p>
              ) : (
                <div className="list-group">
                  {currentMembers.map((member, index) => (
                    <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{member.usuario_nombre || member.usuario_correo || member.usuario?.email}</strong>
                        <br />
                        <small className="text-muted">{member.usuario_correo || member.usuario?.email}</small>
                        <br />
                        <Badge color={member.rol === 'Creador' ? 'success' : 'primary'} className="mt-1">
                          {member.rol}
                        </Badge>
                      </div>
                      <div>
                        {member.aceptado ? (
                          <Badge color="success">Aceptado</Badge>
                        ) : (
                          <Badge color="warning">Invitación pendiente</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Invitar nuevos miembros */}
            <div>
              <h6>Invitar Nuevos Miembros</h6>
              {loadingUsers ? (
                <div className="text-center py-3">
                  <Spinner size="sm" color="success" />
                  <span className="ms-2">Cargando usuarios...</span>
                </div>
              ) : availableUsers.length === 0 ? (
                <p className="text-muted">No hay usuarios disponibles para invitar.</p>
              ) : (
                <div className="list-group">
                  {availableUsers.map((user, index) => {
                    const isAlreadyMember = isUserAlreadyMember(user);
                    const isInviting = invitingUser === user.id;

                    return (
                      <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{user.nombre || user.username || 'Usuario'}</strong>
                          <br />
                          <small className="text-muted">{user.correo || user.email}</small>
                        </div>
                        <button
                          className={`btn btn-sm ${isAlreadyMember ? 'btn-outline-secondary' : 'btn-success'}`}
                          onClick={() => handleInviteUser(user)}
                          disabled={isAlreadyMember || isInviting}
                        >
                          {isInviting ? (
                            <>
                              <Spinner size="sm" className="me-1" />
                              Invitando...
                            </>
                          ) : isAlreadyMember ? (
                            'Ya es miembro'
                          ) : (
                            'Invitar'
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyGroups;