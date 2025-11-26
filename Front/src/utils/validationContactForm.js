export const validateContactForm = (values) => {
    const { firstName, lastName, phoneNum, email, feedback } = values;
    
    const errors = {};

    if (!firstName) {
        errors.firstName = 'Required';
    } else if (firstName.length < 2) {
        errors.firstName = 'First name must be at least 2 characters.';
    } else if (firstName.length > 15) {
        errors.firstName = 'First name must be 15 characters or less.';
    }

    if (!lastName) {
        errors.lastName = 'Required';
    } else if (lastName.length < 2) {
        errors.lastName = 'Last name must be at least 2 characters.';
    }

    const reg = /^\d+$/;
    if (!phoneNum) {
        errors.phoneNum = 'Required';
    } else if (!reg.test(phoneNum)) {
        errors.phoneNum = 'The phone number should contain only numbers.';
    } else if (phoneNum.length > 10 || phoneNum.length < 10) {
        errors.phoneNum = 'A 10-digit phone number is required.'
    }

    if (!email.includes('@')) {
        errors.email = 'Email should contain a @';
    } else if (!email.includes('.')) {
        errors.email = 'Email must end in .com, .net, .mac, etc.';
    }

    if (!feedback) {
        errors.feedback = "Don't be shy, tell us your thoughts!";
    }

    return errors;
};