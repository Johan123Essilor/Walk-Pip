import Comment from "./Comment";
// import { selectCommentsByTrailId } from "./commentsSlice";
import COMMENTS from "../../app/shared/COMMENTS";

const CommentsList = () => {
    const comments = COMMENTS;

    if (comments && comments.length > 0) {
        return (
            <div>
                {comments.map((comment) => {
                    return <Comment key={comment.id} comment={comment} />
                })}
            </div>
        );
    }
    return (
        <div>
            There are no comments for this trail yet.
        </div>
    );
};

export default CommentsList;