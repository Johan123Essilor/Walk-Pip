import { Card, CardImg, CardTitle, CardImgOverlay } from "reactstrap";
import { Link } from "react-router-dom";

const TrailCard = ({ trail }) => {
    const { id, images, fullName } = trail;
    
    return (
        <Link to={`/trail-directory/${id}`}>
            <Card className='image-container'>
                <CardImg
                    top
                    src={images[0]?.url}
                    alt={images[0]?.altText}
                />
                <CardImgOverlay>
                    <CardTitle className='fs-5 text-black'>
                        {fullName}
                    </CardTitle>
                </CardImgOverlay>
            </Card>
        </Link>
    )
}

export default TrailCard