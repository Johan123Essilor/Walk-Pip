import jumbotronImage1 from '../app/assets/img/jumbotron/jumbotronImage1.jpg';
import jumbotronImage2 from '../app/assets/img/jumbotron/jumbotronImage2.jpg';
import jumbotronImage3 from '../app/assets/img/jumbotron/jumbotronImage3.jpg';
import jumbotronImage4 from '../app/assets/img/jumbotron/jumbotronImage4.jpg';
import jumbotronImage5 from '../app/assets/img/jumbotron/jumbotronImage5.jpg';
import { useState } from 'react';

const JumbotronCarousel = () => {
    const images = [
        jumbotronImage1,
        jumbotronImage2,
        jumbotronImage3,
        jumbotronImage4,
        jumbotronImage5
    ]

    const [ activeIndex, setActiveIndex ] = useState(0);

    return (
        <div id="fullscreenCarousel" className="carousel slide" data-bs-ride="carousel">
            <div className="carousel-indicators">
                {images.map((image, index) => {
                    return (
                        <button
                            key={index}
                            type="button"
                            data-bs-target="#fullscreenCarousel"
                            data-bs-slide-to={index}
                            className={activeIndex === index ? 'active' : ''}
                            aria-current={activeIndex === index ? 'true' : 'false'}
                            aria-label={`Slide ${index + 1}`}
                            onClick={() => setActiveIndex(index)}
                        />
                    );
                }
            )}
            </div>
            <div className="carousel-inner">
                {images.map((image, index) => {
                    return (
                        <div
                            key={index}
                            className={`carousel-item${activeIndex === index ? ' active' : ''}`}
                        >
                            <img 
                                className='d-block w-100 carousel-image'
                                src={image}
                                alt='Jumbotron slides'
                            />
                        </div>
                    );
                    }
                )}
            </div>
            <div className='mb-5 p-4 text-center carousel-text-overlay'>
               <h1 className='fw-bold'>Walk-Pip</h1>
               <p className='lead fst-italic'>La Aventura Espera</p>
               <hr />
            </div>
            <button className="carousel-control-prev" type="button" data-bs-target="#fullscreenCarousel" data-bs-slide="prev">
                <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Previous</span>
            </button>
            <button className="carousel-control-next" type="button" data-bs-target="#fullscreenCarousel" data-bs-slide="next">
                <span className="carousel-control-next-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Next</span>
            </button>
        </div>
    );
};

export default JumbotronCarousel;