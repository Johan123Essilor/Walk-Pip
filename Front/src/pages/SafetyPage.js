import trailSafety from '../app/assets/img/trail-safety.jpg';
import SafetyAccordian from '../features/safety/safetyAccordian';
import { Container, Row, Col } from 'reactstrap';

const SafetyPage = () => {

    return (
        <div>
            <div className='mb-5 p-4 text-center text-md-start'>
                <h1 className='fw-bold'>Trail Safety</h1>
                <p className='lead fst-italic'>Some helpful safety tips to keep you secure in your hike</p>
                <p className='fw-bold'>
                    All information presented on this page can be found at the{" "}
                    <a 
                        href='https://www.nps.gov/articles/hiking-safety.htm#:~:text=Let%20the%20slowest%20hiker%20set,you%20are%20there%20to%20help.'
                        target='_blank'
                        rel='noreferrer'
                        className='text-decoration-none text-warning'
                    >
                        National Park Service
                    </a>{" "}
                    website.
                </p>
                <hr />
            </div>
            <Container className='my-3'>
                <Row className='gap-3 align-items-center justify-content-center text-center my-3'>
                    <Col md={6}>
                        <img className='img-fluid rounded-3' alt='Trail Safety' src={trailSafety}/>
                    </Col>
                    <Col>
                        <h2 className='h1 text-success fw-bold'>Always Remember to Stay Safe!</h2>
                        <p className='lead'>Below you will find a list of useful tips to stay safe while hiking with Find My Trail:</p>
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