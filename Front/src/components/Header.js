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

const Header = () => {
    const [ menuOpen, setMenuOpen ] = useState(false);
    const { user, isAuthenticated } = useAuth0();

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
                    <NavItem>
                        <NavLink className='nav-link' to='/contact-us'>
                            <i className='fa fa-address-card fa-lg' /> Contacto
                        </NavLink>
                    </NavItem>
                    <NavItem className='text-end'>
                        {isAuthenticated ? (
                            <div className='btn-group mx-3'>
                                <a className='dropdown-toggle' href='/user-profile' role='button' data-bs-toggle='dropdown' data-bs-display='static' aria-expanded='false'>
                                    <img src={user.picture} alt={user.name} className='nav-user-img img-fluid rounded mx-3' />
                                </a>

                                <ul className='dropdown-menu bg-success dropdown-menu-lg-end text-center p-2'>
                                    <li className='my-2'>
                                        <a className='dropdown-item' href='/user-profile'>
                                            <i className='fa fa-user fa-lg'/> Profile
                                        </a>
                                    </li>
                                    <li><LogoutButton /></li>
                                </ul>
                            </div>
                        ) : <LoginButton />}
                    </NavItem>
                </Nav>
            </Collapse>
        </Navbar>
    )
}

export default Header