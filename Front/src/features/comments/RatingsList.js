import COMMENTS from "../../app/shared/COMMENTS";
import Rating from "./Rating";

const Ratings = () => {
    const comments = COMMENTS;
    console.log(comments)

    if (comments && comments.length > 0) {
        return (
            <div>
                {comments.map((comment) => {
                    return <Rating key={comment.id} comment={comment} />
                })}
            </div>
        );
    }
    return (
        <div>
            There are no ratings for this trail yet.
        </div>
    );
};

export default Ratings;