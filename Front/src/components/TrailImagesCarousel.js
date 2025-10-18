import { useState } from 'react';

const TrailImagesCarousel = ({ trail }) => {
    const { images } = trail;

    const [ activeIndex, setActiveIndex ] = useState(0);

    return (
        <div id="carouselIndicators" className="carousel slide" data-bs-ride="carousel">
            <div className="carousel-indicators">
                {images.map((image, index) => {
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
                            <div className='image-container'>
                                <img 
                                    className='d-block mw-100 mh-100'
                                    src={image.url}
                                    alt={image.altText}
                                    style={{ objectFit: 'cover', maxHeight: '100%', maxWidth: '100%' }}
                                />
                            </div>
                        </div>
                    );
                    }
                )}
            </div>
            <button className="carousel-control-prev" type="button" data-bs-target="#carouselIndicators" data-bs-slide="prev">
                <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Previous</span>
            </button>
            <button className="carousel-control-next" type="button" data-bs-target="#carouselIndicators" data-bs-slide="next">
                <span className="carousel-control-next-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Next</span>
            </button>
        </div>
    );
};

export default TrailImagesCarousel;