import FoundersCards from '../features/about/FoundersCards';
import missionStatement from '../app/assets/img/mission-statement.svg'
import whyUs from '../app/assets/img/why-us.svg'
import { Container, Row, Col } from 'reactstrap';

const AboutPage = () => {
    return (
        <div>
            <div className='mb-5 p-4'>
                <h1 className='fw-bold'>Nosotros</h1>
                <p className='lead fst-italic'>Un poco de informacion sobre los miembros</p>
                {/* <hr /> */}
            </div>
            <div>
                <h3 className='text-center fw-bold pb-2 fst-italic fw-bold h1 mx-auto w-50'>Miembros</h3>
                <hr className='mx-auto w-50' />
                <FoundersCards />
            </div>
            <Container>
                <Row className='my-4 p-3 gap-3 align-items-center'>
                    <Col md={6} className='d-none d-md-block'>
                        <img className='img-fluid' src={missionStatement} alt='Mission Statement'></img>
                    </Col>
                    <Col className='8'>
                        <h1>Mision</h1>
                        <p className='lead'>En Walk-Pip, nuestra misión es ayudarte a descubrir los mejores lugares para hacer senderismo en México.Queremos que cada usuario pueda explorar nuevas rutas, compartir sus experiencias y encontrar el destino ideal para su próxima aventura al aire libre. Nuestra aplicación te ofrece información actualizada, reseñas reales de otros excursionistas y detalles de cada sendero para que elijas el que más se adapte a ti. Ya sea que busques una caminata tranquila o un reto entre montañas, Walk-Pip es tu compañero ideal para explorar México paso a paso.</p>
                    </Col>
                </Row>
                <Row className='my-4 p-3 gap-3 align-items-center'>
                    {/* <Col>
                        <h1>Why Choose Us?</h1>
                        <p className='lead'>Find My Trail provides the user with awesome, thrilling, and breath-taking experiences they have never experienced before when discovering the best hiking trails around. We go out of our way to ensure this one-of-a-kind experience and the safety information necessary to come back from your hike the same way you left for it!</p>
                        <div className='text-md-start text-center'>
                            <h3>Learn more about how to get in touch with us!</h3>
                            <a href='/contact-us' className='btn btn-success'>Contact Us</a>
                        </div>
                    </Col> */}
                    {/* <Col md={6} className='d-none d-md-block'>
                        <img className='img-fluid' src={whyUs} alt='Why choose us'></img>
                    </Col> */}
                </Row>
            </Container>
        </div>
    );
};

export default AboutPage;