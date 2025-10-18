export const StarRatingGenerator = ({ rating }) => {
    const stars = [];

    for (let i = 0; i < rating; i++) {
        stars.push(<i className="fa text-success fa-star" key={i}></i>);
    }

    return (
        <>
            {stars}
        </>
    );
};