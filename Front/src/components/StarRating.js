const StarRating = ({ rating, onRatingChange, editable = false, size = "md" }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const sizeMap = {
    sm: '16px',
    md: '20px',
    lg: '24px'
  };

  const iconSize = sizeMap[size] || '20px';

  const handleStarClick = (starValue) => {
    if (editable && onRatingChange) {
      onRatingChange(starValue);
    }
  };

  const renderStar = (index, type) => {
    const starClass = type === 'full' ? 'fa fa-star' : 
                     type === 'half' ? 'fa fa-star-half-alt' : 
                     'fa fa-star-o';
    const color = type === 'empty' ? '#ddd' : '#ffc107';
    
    return (
      <span
        key={index}
        onClick={() => handleStarClick(index + 1)}
        style={{
          cursor: editable ? 'pointer' : 'default',
          color: color,
          marginRight: '4px',
          transition: 'color 0.2s ease',
          fontSize: iconSize,
          display: 'inline-block'
        }}
        onMouseEnter={(e) => {
          if (editable) e.target.style.color = '#ffc107';
        }}
        onMouseLeave={(e) => {
          if (editable) e.target.style.color = color;
        }}
      >
        <i className={starClass} />
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {[...Array(fullStars)].map((_, i) => renderStar(i, 'full'))}
      {hasHalfStar && renderStar(fullStars, 'half')}
      {[...Array(emptyStars)].map((_, i) => 
        renderStar(fullStars + (hasHalfStar ? 1 : 0) + i, 'empty')
      )}
    </div>
  );
};

export default StarRating;