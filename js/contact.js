// EmailJS Configuration

(function() {
    const PUBLIC_KEY = 'fvP3NsksJt5YUn4JI';
    
    const SERVICE_ID = 'service_pbuvfcd';
    
    const TEMPLATE_ID = 'template_gzsl61r';

    // Initialize EmailJS
    emailjs.init(PUBLIC_KEY);

    const contactForm = document.getElementById('contact-form');
    const submitBtn = contactForm.querySelector('button[type="submit"]');

    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Disable button and show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        // Get form data
        const fromName = document.getElementById('name').value;
        const fromEmail = document.getElementById('email').value;
        const message = document.getElementById('message').value;
        
        // My email
        const myEmail = 'michael.penner97@web.de';

        // Data for emailjs
        const EmailData = {
            from_name: fromName,
            from_email: fromEmail,
            message: message,
            my_email: myEmail
        };

        // Send email to ME
        emailjs.send(SERVICE_ID, TEMPLATE_ID, EmailData)
            .then(function(response) {
                // Both emails sent successfully
                alert('Message sent successfully! A confirmation has been sent to your email address.');
                contactForm.reset();
            })
            .catch(function(error) {
                console.error('EmailJS Error:', error);
                alert('Error sending message. Please try again.');
            })
            .finally(function() {
                submitBtn.disabled = false;
                const lang = document.body.getAttribute('data-current-lang') || 'en';
                const langAttr = submitBtn.getAttribute('data-' + lang);
                submitBtn.textContent = langAttr || 'Send message';
            });
    });
})();
