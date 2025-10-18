import { useState } from "react";
import { Formik, Field, Form, ErrorMessage } from 'formik';
import { Button, Modal, ModalHeader, ModalBody, FormGroup, Label, ModalFooter } from 'reactstrap';
import { validateNewsletterForm } from '../utils/validateNewsletterForm';

const NewsletterSignup = () => {
    const [ newsletterModalOpen, setNewsletterModalOpen ] = useState(false);
    const [ thankYouModalOpen, setThankYouModalOpen ] = useState(false);

    const handleSubmit = () => {
        setNewsletterModalOpen(false);
        setThankYouModalOpen(true);
    }

    return (
        <>
            <Button
                outline
                onClick={() => setNewsletterModalOpen(true)}
                style={{ color: 'white', border: '1px solid black', backgroundColor: '#252525' }}
            >
                <i className='fa fa-sign-in fa-lg' /> Sign up
            </Button>

            <Modal isOpen={newsletterModalOpen}>
                <ModalHeader toggle={() => setNewsletterModalOpen(false)}>Sign up for our Newsletter</ModalHeader>
                <ModalBody>
                    <Formik
                        initialValues={{
                            email: '',
                        }}
                        onSubmit={handleSubmit}
                        validate={validateNewsletterForm}
                    >
                        <Form>
                            <FormGroup>
                                <Label htmlFor='email'>Email Address</Label>
                                <Field 
                                    id='nameemail'
                                    name='email'
                                    placeholder='Email Address'
                                    className='form-control'
                                />
                                <ErrorMessage name='email'>
                                {(msg) => <p className="text-danger">{msg}</p>}
                                </ErrorMessage>
                            </FormGroup>
                            <Button type='submit' color='primary'>Sign Up</Button>
                        </Form>
                    </Formik>
                </ModalBody>
            </Modal>
            <Modal isOpen={thankYouModalOpen}>
                <ModalHeader toggle={() => setNewsletterModalOpen(false)}>Thank you for signing up</ModalHeader>
                <ModalBody>
                    <p>We look forward to sending you our latest updates!</p>
                </ModalBody>
                <ModalFooter>
                    <Button color='dark' onClick={() => setThankYouModalOpen(false)}>
                        Close
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
};
export default NewsletterSignup;