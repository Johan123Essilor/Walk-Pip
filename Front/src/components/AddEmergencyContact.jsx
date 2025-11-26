// components/AddEmergencyContact.js
import React, { useState, useEffect } from 'react';
import { emergencyContactService } from '../services';
import { useAuth0 } from '@auth0/auth0-react';


const AddEmergencyContact = () => {
    const { user, isAuthenticated } = useAuth0();
    console.log('Authenticated user:', user, isAuthenticated);
    const [contacts, setContacts] = useState([]);
    const [newContact, setNewContact] = useState({
        nombre_contacto: '',
        telefono: '',
        parentesco: '',
        correo: '',
        user_email: user ? user.email : ''
    });
    const [editingIndex, setEditingIndex] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Cargar contactos al montar el componente
    useEffect(() => {
        loadContacts();
    }, []);

    // Cargar contactos desde el servicio
    const loadContacts = async () => {
        try {
            setLoading(true);
            setError(null);

            // Para desarrollo, puedes usar datos mock
            //const data = emergencyContactService.getMockContacts();

            const data = await emergencyContactService.getEmergencyContacts(user ? user.email : null);
            setContacts(data);
        } catch (err) {
            setError(err.message);
            console.error('Error cargando contactos:', err);
        } finally {
            setLoading(false);
        }
    };

    // Manejar cambios en los campos del formulario
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewContact(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Agregar o editar contacto
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setError(null);

            if (editingIndex !== null) {
                // Editar contacto existente
                const contactId = contacts[editingIndex].id;
                console.log('Updating contact ID:', contactId);
                const bodyUpdate = { ...newContact, user_email: user.email };
                await emergencyContactService.updateContact(contactId, bodyUpdate);

                const updatedContacts = [...contacts];
                updatedContacts[editingIndex] = { ...newContact, id: contactId };
                setContacts(updatedContacts);
                setEditingIndex(null);
            } else {
                // Agregar nuevo contacto
                const createdContact = await emergencyContactService.createContact(newContact, user.email);
                setContacts(prev => [...prev, createdContact]);
            }

            // Limpiar formulario
            setNewContact({
                nombre_contacto: '',
                telefono: '',
                parentesco: '',
                correo: ''
            });

        } catch (err) {
            setError(err.message);
            console.error('Error guardando contacto:', err);
        }
    };

    // Eliminar contacto
    const handleDelete = async (index) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este contacto?')) {
            return;
        }

        try {
            const contactId = contacts[index].id;
            await emergencyContactService.deleteContact(contactId);

            const updatedContacts = contacts.filter((_, i) => i !== index);
            setContacts(updatedContacts);
        } catch (err) {
            setError(err.message);
            console.error('Error eliminando contacto:', err);
        }
    };

    // Editar contacto
    const handleEdit = (index) => {
        setNewContact(contacts[index]);
        setEditingIndex(index);
    };

    // Cancelar edición
    const handleCancelEdit = () => {
        setNewContact({
            nombre_contacto: '',
            telefono: '',
            parentesco: '',
            correo: ''
        });
        setEditingIndex(null);
        setError(null);
    };

    if (loading && contacts.length === 0) {
        return (
            <div className="container mt-4">
                <div className="d-flex justify-content-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            {/* Mensaje de error */}
            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <strong>Error:</strong> {error}
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setError(null)}
                    ></button>
                </div>
            )}

            <div className="row">
                <div className="col-md-6">
                    {/* Formulario para agregar/editar contacto */}
                    <div className="card">
                        <div className="card-header">
                            <h5 className="card-title mb-0">
                                {editingIndex !== null ? 'Editar Contacto de Emergencia' : 'Agregar Contacto de Emergencia'}
                            </h5>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="name" className="form-label">
                                        Nombre completo <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="nombre_contacto"
                                        name="nombre_contacto"
                                        value={newContact.nombre_contacto}
                                        onChange={handleInputChange}
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="telefono" className="form-label">
                                        Teléfono <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        className="form-control"
                                        id="telefono"
                                        name="telefono"
                                        value={newContact.telefono}
                                        onChange={handleInputChange}
                                        required
                                        disabled={loading}
                                        placeholder="+1234567890"
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="parentesco" className="form-label">
                                        Parentesco/Relación
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="parentesco"
                                        name="parentesco"
                                        value={newContact.parentesco}
                                        onChange={handleInputChange}
                                        placeholder="Ej: Padre, Madre, Amigo, etc."
                                        disabled={loading}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="correo" className="form-label">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        id="correo"
                                        name="correo"
                                        value={newContact.correo}
                                        onChange={handleInputChange}
                                        disabled={loading}
                                    />
                                </div>

                                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                                    {editingIndex !== null && (
                                        <button
                                            type="button"
                                            className="btn btn-secondary me-md-2"
                                            onClick={handleCancelEdit}
                                            disabled={loading}
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                {editingIndex !== null ? 'Actualizando...' : 'Agregando...'}
                                            </>
                                        ) : (
                                            editingIndex !== null ? 'Actualizar Contacto' : 'Agregar Contacto'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="col-md-6">
                    {/* Lista de contactos */}
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="card-title mb-0">
                                Contactos de Emergencia ({contacts.length})
                            </h5>
                            <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={loadContacts}
                                disabled={loading}
                            >
                                <i className="bi bi-arrow-clockwise"></i>
                            </button>
                        </div>
                        <div className="card-body">
                            {contacts.length === 0 ? (
                                <div className="text-center text-muted py-4">
                                    <i className="bi bi-person-plus fs-1"></i>
                                    <p className="mt-2">No hay contactos de emergencia agregados</p>
                                </div>
                            ) : (
                                <div className="list-group">
                                    {contacts.map((contact, index) => (
                                        <div key={contact.id || index} className="list-group-item">
                                            <div className="d-flex w-100 justify-content-between align-items-start">
                                                <div className="flex-grow-1">
                                                    <h6 className="mb-1">{contact.nombre_contacto}</h6>
                                                    <p className="mb-1">
                                                        <i className="bi bi-telephone-fill text-primary me-2"></i>
                                                        {contact.telefono}
                                                    </p>
                                                    {contact.parentesco && (
                                                        <small className="text-muted">
                                                            <i className="bi bi-people-fill me-2"></i>
                                                            {contact.parentesco}
                                                        </small>
                                                    )}
                                                    {contact.correo && (
                                                        <div>
                                                            <small className="text-muted">
                                                                <i className="bi bi-envelope-fill me-2"></i>
                                                                {contact.correo}
                                                            </small>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="btn-group btn-group-sm">
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-primary"
                                                        onClick={() => handleEdit(index)}
                                                        disabled={loading}
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                    {/* <button
                                                        type="button"
                                                        className="btn btn-outline-danger"
                                                        onClick={() => handleDelete(index)}
                                                        disabled={loading}
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button> */}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddEmergencyContact;