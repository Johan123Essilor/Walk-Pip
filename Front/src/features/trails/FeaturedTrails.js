import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { Container } from 'reactstrap';
import { fetchTrails, selectRandomTrails } from './trailsSlice';
import TrailsList from './TrailsList';
import { useEffect } from 'react';

const FeaturedTrails = () => {
    const trails = useSelector(selectRandomTrails(3));
    const dispatch = useDispatch();
    
    useEffect(() => {
        dispatch(fetchTrails({ searchState: ' ' }));
    }, [dispatch]);

    return (
        <Container className='text-center'>
            <h2 className='text-center my-5'>Featured Trails</h2>
            <TrailsList trails={trails} />
        </Container>
    );
};

export default FeaturedTrails;