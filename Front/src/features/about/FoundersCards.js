import { useState } from 'react';
import { Container, Row, Col } from 'reactstrap';
import johanLozoya from '../../app/assets/img/johan.jpeg';
import Yael from '../../app/assets/img/yael.jpeg';
import Alma from '../../app/assets/img/alma.jpeg';

const FoundersCards = () => {
    const [ activeIndex, setActiveIndex ] = useState(0);

    const founderCards = [
        {
            id: 1,
            name: 'Johan Lozoya',
            title: 'Mera Maquina',
            img: johanLozoya,
            description: 'Desarrollador de software con una pasión por la creación de aplicaciones web innovadoras y funcionales.'
        },
        {
            id: 2,
            name: 'Yael Contreras',
            title: 'Maistro 1',
            img: Yael,
            description: "Levanta castillos y domina el arte de la programación."
        },
        {
            id: 3,
            name: 'Alma Diaz',
            title: 'Jefe e equipo',
            img: Alma,
            description: 'Patrona del equipo, siempre lista para apoyar y guiar en cada paso del desarrollo.'
        }
    ]
    
    return (
        <Container>
            <Row className='justify-content-center mb-5'>
                    {founderCards.map(({ id, name, title, img, description }) => {
                        return (
                            <>
                                <Col lg={4} key={id}  className='d-none d-lg-block'>
                                    <div className="card border shadow">
                                        <img src={img} className="card-img-top w-100 h-100" alt={name} />
                                        <div className="card-body">
                                            <h5 className='fw-bold'>{name}</h5>
                                            <h5 className='fst-italic text-secondary'>{title}</h5>
                                            <p className="card-text">{description}</p>
                                        </div>
                                    </div>
                                </Col>
                            </>
                        )
                    })}
                    <Col xs={8} className='d-block d-lg-none mb-5'>
                        <div id="carouselCaptions" className="carousel slide" data-bs-ride="carousel">
                            <div className="carousel-indicators">
                                {founderCards.map((founder, index) => {
                                    return (
                                        <button
                                            key={index}
                                            type="button"
                                            data-bs-target="#carouselIndicators"
                                            data-bs-slide-to={index}
                                            className={activeIndex === index ? 'active' : ''}
                                            aria-current={activeIndex === index ? 'true' : 'false'}
                                            aria-label={`Slide ${index + 1}`}
                                            onClick={() => setActiveIndex(index)}
                                        />
                                    )}
                                )}
                            </div>
                            <div className="carousel-inner">
                                {founderCards.map(({ id, name, title, img }, index) => {
                                    return (
                                        <div key={id} className={`carousel-item${activeIndex === index ? ' active' : ''}`}>
                                            <img 
                                                src={img} 
                                                className="d-block w-100" 
                                                alt={name}
                                                style={{ 
                                                    objectFit: 'cover', 
                                                    maxHeight: '100%', 
                                                    maxWidth: '100%',
                                                }}    
                                            />
                                            <div 
                                                className="carousel-caption"
                                                style={{
                                                    background: 'rgba(0, 0, 0, 0.4)', 
                                                    borderRadius: '10px', 
                                                    padding: '10px'
                                                }
                                            }>
                                                <h5>{name}</h5>
                                                <p>{title}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            <button 
                                className="carousel-control-prev" 
                                type="button" 
                                data-bs-target="#carouselCaptions" 
                                data-bs-slide="prev"
                            >
                                <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                                <span className="visually-hidden">Previous</span>
                            </button>
                            <button 
                                className="carousel-control-next" 
                                type="button" 
                                data-bs-target="#carouselCaptions" 
                                data-bs-slide="next"
                            >
                                <span className="carousel-control-next-icon" aria-hidden="true"></span>
                                <span className="visually-hidden">Next</span>
                            </button>
                        </div>
                    </Col>
            </Row>
        </Container>
    );
};

export default FoundersCards;