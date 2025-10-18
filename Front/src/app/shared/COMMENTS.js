const generateFakeComments = (numberOfComments) => {
    const comments = [];

    for (let i = 0; i < numberOfComments; i++) {
        const comment = {
        id: i,
        trailId: i % 10, // Assuming there are 10 trails in total, you can adjust this based on your actual trail data
        rating: Math.floor(Math.random() * 5) + 1,
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        author: 'John Doe',
        date: '2023-05-17T12:00Z',
        };

        comments.push(comment);
    }

    return comments;
};

const COMMENTS = generateFakeComments(5); // Generate 20 fake comments

export default COMMENTS;