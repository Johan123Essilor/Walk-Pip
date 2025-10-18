const Pagination = ({ cardsPerPage, totalCards, currentPage, paginate }) => {
    // Calculate the total number of pages
    const totalPages = Math.ceil(totalCards / cardsPerPage);

    // Generate an array of page numbers
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    return (
        <nav>
            <ul className="pagination justify-content-center">
                {pageNumbers.map((number) => (
                    <li key={number} className="page-item">
                        <button
                            className={`page-link${currentPage === number ? ' active' : ''}`}
                            onClick={() => paginate(number)}
                        >
                            {number}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default Pagination;