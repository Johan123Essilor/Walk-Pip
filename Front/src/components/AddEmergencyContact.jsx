import React, { useState } from 'react';

const AddEmergencyContact = () => {
    const [contacts, setContacts] = useState([]);
    const [newContact, setNewContact] = useState({
        name: '',
        phone: '',
        relationship: '',
        email: ''
    });
    const [editingIndex, setEditingIndex] = useState(null);

    // Manejar cambios en los campos del formulario
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewContact(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Agregar o editar contacto
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!newContact.name || !newContact.phone) {
            alert('Nombre y teléfono son campos obligatorios');
            return;
        }

        if (editingIndex !== null) {
            // Editar contacto existente
            const updatedContacts = [...contacts];
            updatedContacts[editingIndex] = newContact;
            setContacts(updatedContacts);
            setEditingIndex(null);
        } else {
            // Agregar nuevo contacto
            setContacts(prev => [...prev, newContact]);
        }

        // Limpiar formulario
        setNewContact({
            name: '',
            phone: '',
            relationship: '',
            email: ''
        });
    };

    // Eliminar contacto
    const handleDelete = (index) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este contacto?')) {
            const updatedContacts = contacts.filter((_, i) => i !== index);
            setContacts(updatedContacts);
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
            name: '',
            phone: '',
            relationship: '',
            email: ''
        });
        setEditingIndex(null);
    };

    return (
        <div className="container mt-4">
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
                                        id="name"
                                        name="name"
                                        value={newContact.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="phone" className="form-label">
                                        Teléfono <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        className="form-control"
                                        id="phone"
                                        name="phone"
                                        value={newContact.phone}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="relationship" className="form-label">
                                        Parentesco/Relación
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="relationship"
                                        name="relationship"
                                        value={newContact.relationship}
                                        onChange={handleInputChange}
                                        placeholder="Ej: Padre, Madre, Amigo, etc."
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        id="email"
                                        name="email"
                                        value={newContact.email}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                                    {editingIndex !== null && (
                                        <button
                                            type="button"
                                            className="btn btn-secondary me-md-2"
                                            onClick={handleCancelEdit}
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                    <button type="submit" className="btn btn-primary">
                                        {editingIndex !== null ? 'Actualizar Contacto' : 'Agregar Contacto'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="col-md-6">
                    {/* Lista de contactos */}
                    <div className="card">
                        <div className="card-header">
                            <h5 className="card-title mb-0">
                                Contactos de Emergencia ({contacts.length})
                            </h5>
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
                                        <div key={index} className="list-group-item">
                                            <div className="d-flex w-100 justify-content-between align-items-start">
                                                <div className="flex-grow-1">
                                                    <h6 className="mb-1">{contact.name}</h6>
                                                    <p className="mb-1">
                                                        <i className="bi bi-telephone-fill text-primary me-2"></i>
                                                        {contact.phone}
                                                    </p>
                                                    {contact.relationship && (
                                                        <small className="text-muted">
                                                            <i className="bi bi-people-fill me-2"></i>
                                                            {contact.relationship}
                                                        </small>
                                                    )}
                                                    {contact.email && (
                                                        <div>
                                                            <small className="text-muted">
                                                                <i className="bi bi-envelope-fill me-2"></i>
                                                                {contact.email}
                                                            </small>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="btn-group btn-group-sm">
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-primary"
                                                        onClick={() => handleEdit(index)}
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-danger"
                                                        onClick={() => handleDelete(index)}
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>
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