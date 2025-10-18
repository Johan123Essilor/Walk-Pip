import { StarRatingGenerator } from "../../utils/StarRatingGenerator";

const Rating = ({ comment }) => {
    const { rating, author } = comment;

    return (
        <div>
            <p>Rating: <span className='fs-3'>{StarRatingGenerator({rating})}</span></p>
            <p>Author: {author}</p>
            <hr />
        </div>
    );
};

export default Rating;