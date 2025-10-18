import { Card, CardText, CardTitle, CardBody, Col } from "reactstrap";

const TrailDetail = ({ trail }) => {
    const { fullName, description } = trail;

    return (
        <Col>
            <Card md='5' className='p-3 text-center'>
                <CardTitle>
                    <h2>{fullName}</h2>
                </CardTitle>
                <CardBody className='text-start'>
                    <CardText className="lead">{description}</CardText>    
                </CardBody>
            </Card>
        </Col>
    );
};

export default TrailDetail;