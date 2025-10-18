import { FormatDate } from '../../utils/FormatDate';

const Comment = ({ comment }) => {
    const { text, author, date } = comment;

    return (
        <p>
            {text}
            <br />
            {author} - {FormatDate(date)}
        </p>
    );
};

export default Comment;