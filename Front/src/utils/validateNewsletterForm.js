export const validateNewsletterForm = (values) => {
    const { email } = values;
    
    const errors = {};

    if (!email.includes('@')) {
        errors.email = 'Email should contain a @';
    } else if (!email.includes('.')) {
        errors.email = 'Email must end in .com, .net, .mac, etc.';
    }
    
    return errors;
};