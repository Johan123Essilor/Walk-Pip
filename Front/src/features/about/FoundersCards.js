import { useState } from 'react';
import { Container, Row, Col } from 'reactstrap';
import tylerVarzeas from '../../app/assets/img/tyler-varzeas-medium.jpeg';
import marissaVarzeas from '../../app/assets/img/marissa-varzeas-medium.jpeg';
import chrisParry from '../../app/assets/img/chris-parry-medium.jpeg';

const FoundersCards = () => {
    const [ activeIndex, setActiveIndex ] = useState(0);

    const founderCards = [
        {
            id: 1,
            name: 'Tyler Varzeas',
            title: 'Founder',
            img: tylerVarzeas,
            description: 'Tyler Varzeas is the CEO, CFO, and MFG of Find My Trail. He has been developing and improving Find My Trail since 2023.'
        },
        {
            id: 2,
            name: 'Marissa Varzeas',
            title: 'Co-Founder',
            img: marissaVarzeas,
            description: "Marissa and Tyler Varzeas have been married over a year and are each other's number one supporters through it all."
        },
        {
            id: 3,
            name: 'Chris Parry',
            title: 'Co-Founder',
            img: chrisParry,
            description: 'Chris Parry is the long-time best friend of Tyler Varzeas and has been working with the company since 2023.'
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