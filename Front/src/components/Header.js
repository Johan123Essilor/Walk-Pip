// src/components/Header.js
import { useState } from 'react';
import {
    Navbar,
    NavbarBrand,
    Collapse,
    NavbarToggler,
    Nav,
    NavItem,
} from 'reactstrap';
import { NavLink } from 'react-router-dom';
import FindMyTrailLogo from '../app/assets/img/logo_transparent.png';
import { useAuth0 } from '@auth0/auth0-react';
import LoginButton from './LoginButton';
import LogoutButton from './LogoutButton';
import { useUserSync } from '../hooks/useUserSync'; // Importar el hook

const Header = () => {
    const [ menuOpen, setMenuOpen ] = useState(false);
    const { user, isAuthenticated } = useAuth0();
    const { isSyncing, syncError, djangoUser } = useUserSync(); // Usar el hook

    // Para debuggear
    console.log('Header - Sincronización:', { isSyncing, syncError, djangoUser });

    return (
        <Navbar dark expand='lg' className='p-0'>
            <NavbarBrand className='ms-5 d-flex align-items-center justify-content-center' href='/'>
                <img src={FindMyTrailLogo} alt='Find My Trail logo' className='float-start' />
            </NavbarBrand>

            <NavbarToggler onClick={() => setMenuOpen(!menuOpen)} />
            <Collapse isOpen={menuOpen} navbar>
                <Nav className='ms-auto' navbar>
                    <NavItem>
                        <NavLink className='nav-link' to='/'>
                            <i className='fa fa-home fa-lg' /> Home
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink className='nav-link' to='/trail-directory'>
                            <i className='fa fa-list fa-lg' /> Rutas
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink className='nav-link' to='/safety'>
                            <i className='fa fa-shield fa-lg' /> Seguridad
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink className='nav-link' to='/about-us'>
                            <i className='fa fa-info fa-lg' /> Nosotros 
                        </NavLink>
                    </NavItem>
                    {/* <NavItem>
                        <NavLink className='nav-link' to='/contact-us'>
                            <i className='fa fa-address-card fa-lg' /> Contacto
                        </NavLink>
                    </NavItem> */}
                    <NavItem className='text-end'>
                        {isAuthenticated ? (
                            <div className='btn-group mx-3'>
                                <a 
                                    className='dropdown-toggle d-flex align-items-center' 
                                    href='/user-profile' 
                                    role='button' 
                                    data-bs-toggle='dropdown' 
                                    data-bs-display='static' 
                                    aria-expanded='false'
                                >
                                    {/* Indicador de sincronización */}
                                    {isSyncing && (
                                        <div className="spinner-border spinner-border-sm text-light me-2" role="status">
                                            <span className="visually-hidden">Sincronizando...</span>
                                        </div>
                                    )}
                                    <img 
                                        src={user.picture} 
                                        alt={user.name} 
                                        className='nav-user-img img-fluid rounded mx-3' 
                                    />
                                    {/* Indicador de estado de sincronización */}
                                    {djangoUser && !isSyncing && (
                                        <span className="badge bg-success me-2" title="Sincronizado con BD">✓</span>
                                    )}
                                    {syncError && !isSyncing && (
                                        <span className="badge bg-warning me-2" title="Error de sincronización">⚠</span>
                                    )}
                                </a>

                                <ul className='dropdown-menu bg-success dropdown-menu-lg-end text-center p-2'>
                                    <li className='my-2'>
                                        <a className='dropdown-item' href='/user-profile'>
                                            <i className='fa fa-user fa-lg'/> Perfil
                                        </a>
                                    </li>
                                    <li>
                                        <div className="dropdown-item-text small">
                                            {djangoUser ? (
                                                <span className="text-success">✓ Sincronizado</span>
                                            ) : isSyncing ? (
                                                <span className="text-warning">Sincronizando...</span>
                                            ) : (
                                                <span className="text-warning">No sincronizado</span>
                                            )}
                                        </div>
                                    </li>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li><LogoutButton /></li>
                                </ul>
                            </div>
                        ) : <LoginButton />}
                    </NavItem>
                </Nav>
            </Collapse>

            {/* Alerta de error de sincronización */}
            {syncError && (
                <div 
                    className="alert alert-warning alert-dismissible fade show m-0 rounded-0 position-fixed w-100" 
                    style={{zIndex: 9999, top: '76px'}}
                    role="alert"
                >
                    <strong>Error de sincronización:</strong> {syncError}
                    <button 
                        type="button" 
                        className="btn-close" 
                        data-bs-dismiss="alert"
                        onClick={() => window.location.reload()}
                    ></button>
                </div>
            )}
        </Navbar>
    )
}

export default Header