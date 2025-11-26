import JumbotronCarousel from "../components/JumbotronCarousel";
import NewsletterSignup from "../components/NewsletterSignup";
import FeaturedTrails from "../features/trails/FeaturedTrails";
import exploreImage from "../app/assets/img/explore.svg"
import { Container, Row, Col } from 'reactstrap';

const HomePage = () => {
  return (
    <div>
      <JumbotronCarousel />

      <div className='bg-success text-white'>
        <Container className='py-3 mb-5'>
          <Row className='justify-content-center align-items-center mx-auto'>
            <Col md={8} className='text-md-start text-center'>
              <h2>Walk-Pip</h2>
              <p style={{ fontSize: '1.1rem', margin: 0 }}>Encuentra tu ruta ideal</p>
            </Col>
          </Row>
        </Container>
      </div>

      <div>
        <Container className='py-3 mb-5'>
          <Row className='justify-content-center align-items-center mx-auto gap-5'>
            <Col md={6} className='text-center'>
              <img src={exploreImage} alt='explore' className='img-fluid d-none d-md-block' />
            </Col>
            <Col>
              <h1>Nosotros</h1>
              <p className='lead'>
                ¡Haz clic en el botón para saber más sobre quiénes somos!
              </p>
              <a href='/about-us' className='btn btn-success btn-lg'>
                Learn More
              </a>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  )
}

export default HomePage;