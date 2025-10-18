import { Col, Row } from 'reactstrap';

const GoogleMapContact = () => {
  return (
    <>
        <Row>
            <div className="ratio ratio-4x3">
            <iframe
                title='GoogleMap'
                src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d5565.563206684309!2d-117.94749171819291!3d33.959033215501734!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sus!4v1684521129490!5m2!1sen!2sus"
                style={{ border: '1px', borderStyle: 'solid', borderColor: '#ccc', borderRadius: '5px' }}
                allowfullscreen=""
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
            </div>
        </Row>
        <div className='d-flex justify-content-center align-items-center'>
            <Row className='row-content align-items-center'>
                <Col md='5'>
                    <h5>Our Address</h5>
                    <address>
                        1234 Random St
                        <br />
                        La Habra Heights, CA 90631
                        <br />
                        U.S.A.
                    </address>
                </Col>
                <Col>
                    <a
                        role='button'
                        className='btn btn-link'
                        href='tel:+9166229065'
                    >
                        <i className='fa fa-phone' /> (916) 622-9065
                    </a>
                    <br />
                    <a
                        role='button'
                        className='btn btn-link'
                        href='mailto:tyler.varzeas@gmail.com'
                    >
                        <i className='fa fa-envelope-o' /> tyler.varzeas@gmail.com
                    </a>
                </Col>
            </Row>
        </div>
    </>
  )
}

export default GoogleMapContact;