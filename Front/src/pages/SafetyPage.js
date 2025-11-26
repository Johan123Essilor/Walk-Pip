import trailSafety from '../app/assets/img/trail-safety.jpg';
import SafetyAccordian from '../features/safety/safetyAccordian';
import { Container, Row, Col } from 'reactstrap';

const SafetyPage = () => {

    return (
        <div>
            <div className='mb-5 p-4 text-center text-md-start'>
                <h1 className='fw-bold'>Seguridad en el Sendero</h1>
                <p className='lead fst-italic'>Algunos consejos útiles de seguridad para mantenerte protegido durante tu caminata</p>
                <p className='fw-bold'>
                    Toda la información presentada en esta página puede encontrarse en el sitio web del{" "}
                    <a 
                        href='https://www.nps.gov/articles/hiking-safety.htm#:~:text=Let%20the%20slowest%20hiker%20set,you%20are%20there%20to%20help.'
                        target='_blank'
                        rel='noreferrer'
                        className='text-decoration-none text-warning'
                    >
                        Servicio de Parques Nacionales (National Park Service)
                    </a>{" "}.
                </p>
                <hr />
            </div>
            <Container className='my-3'>
                <Row className='gap-3 align-items-center justify-content-center text-center my-3'>
                    <Col md={6}>
                        <img className='img-fluid rounded-3' alt='Seguridad en el Sendero' src={trailSafety}/>
                    </Col>
                    <Col>
                        <h2 className='h1 text-success fw-bold'>¡Recuerda siempre mantenerte seguro!</h2>
                        <p className='lead'>
                            A continuación encontrarás una lista de consejos útiles para mantenerte seguro mientras haces senderismo con Find My Trail:
                        </p>
                    </Col>
                </Row>
                <Row className='justify-content-center'>
                    <Col md={10}>
                        <SafetyAccordian />
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default SafetyPage;
