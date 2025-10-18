import { Button, Label, Col, FormGroup } from "reactstrap";
import { Formik, Field, Form, ErrorMessage } from "formik";
import { validateContactForm } from "../utils/validationContactForm";

const ContactForm = () => {
    const handleSubmit = (values, { resetForm }) => {
        console.log('form values: ', values);
        console.log('in JSON format: ', JSON.stringify(values));
        resetForm();
    }

    return (
        <Formik
            initialValues={{
                firstName: '',
                lastName: '',
                phoneNum: '',
                email: '',
                agree: false,
                contactType: '',
                feedback: ''
            }}
            onSubmit={handleSubmit}
            validate={validateContactForm}
        >
            <Form>
                <FormGroup row>
                    <Label htmlFor='firstName' md='4' xs='2'>
                        First Name
                    </Label>
                    <Col md='10' xs='6'>
                        <Field 
                            name='firstName'
                            placeholder='First Name'
                            className='form-control'
                        />
                    </Col>
                    <ErrorMessage name='firstName'>
                        {(msg) => <div className='text-danger'>{msg}</div>}
                    </ErrorMessage>
                </FormGroup>
                <FormGroup row>
                    <Label htmlFor='lastName' md='4' xs='2'>
                        Last Name
                    </Label>
                    <Col md='10' xs='6'>
                        <Field 
                            name='lastName'
                            placeholder='Last Name'
                            className='form-control'
                        />
                    </Col>
                    <ErrorMessage name='lastName'>
                        {(msg) => <div className='text-danger'>{msg}</div>}
                    </ErrorMessage>
                </FormGroup>
                <FormGroup row>
                    <Label htmlFor='phoneNum' md='4' xs='2'>
                        Phone Number
                    </Label>
                    <Col md='10' xs='6'>
                        <Field 
                            name='phoneNum'
                            placeholder='Enter Phone Number'
                            className='form-control'
                        />
                    </Col>
                    <ErrorMessage name='phoneNum'>
                        {(msg) => <div className='text-danger'>{msg}</div>}
                    </ErrorMessage>
                </FormGroup>
                <FormGroup row>
                    <Label htmlFor='email' md='4' xs='2'>
                        Email Address
                    </Label>
                    <Col md='10' xs='6'>
                        <Field
                            name='email'
                            type='email'
                            placeholder='Enter Email Address'
                            className='form-control'
                        />
                    </Col>
                    <ErrorMessage name='email'>
                            {(msg) => <div className='text-danger'>{msg}</div>}
                    </ErrorMessage>
                </FormGroup>
                <FormGroup row>
                    <Label check md='4'>
                        <Field 
                            name='agree'
                            type='checkbox'
                            className='form-check-input'                        
                        />{' '}
                        May we contact you?
                    </Label>
                    <Col md='6' xs='3'>
                        <Field
                            name='contactType'
                            as='select'
                            className='form-control'
                        >
                            <option>By Phone</option>
                            <option>By Email</option>
                        </Field>
                    </Col>            
                </FormGroup>
                <FormGroup row>
                    <Label htmlFor='feedback' md='4' xs='2'>
                        Your Feedback
                    </Label>
                    <Col md='10' xs='7'>
                        <Field 
                            name='feedback'
                            as='textarea'
                            rows='12'
                            className='form-control'
                        />
                    </Col>
                    <ErrorMessage name='feedback'>
                            {(msg) => <div className='text-danger'>{msg}</div>}
                    </ErrorMessage>
                </FormGroup>
                <FormGroup row>
                    <Col md={{ size: 10, offset: 2 }}>
                        <Button type='submit' color='primary'>
                            Send Feedback
                        </Button>
                    </Col>
                </FormGroup>
            </Form>
        </Formik>
    );
};

export default ContactForm;