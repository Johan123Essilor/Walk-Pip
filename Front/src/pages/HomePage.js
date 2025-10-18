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
            <h2>Newsletter</h2>
            <p >Sign up today for our newsletter and stay up-to-date with our latest updates</p>
            </Col>
            <Col className='text-center'>
              <NewsletterSignup />
            </Col>
          </Row>
        </Container>
      </div>

      <div>
        <FeaturedTrails />
      </div>

      <div>
        <Container className='py-3 mb-5'>
          <Row className='justify-content-center align-items-center mx-auto gap-5'>
            <Col md={6} className='text-center'>
              <img src={exploreImage} alt='explore' className='img-fluid d-none d-md-block' />
            </Col>
            <Col>
              <h1>About Us</h1>
              <p className='lead'>Click the button to learn more about who we are, and what we stand for!</p>
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