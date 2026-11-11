(function () {
  'use strict';

  var form = document.getElementById('f');
  if (!form) return;

  var status = document.getElementById('form-status');
  var submitButton = form.querySelector('[type="submit"]');

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var payload = Object.fromEntries(new FormData(form).entries());
    payload._subject = 'Portfolio message from ' + payload.name;
    payload._replyto = payload.email;

    submitButton.disabled = true;
    status.textContent = 'Sending your message...';

    fetch('https://formsubmit.co/ajax/aishathshafaofficial@gmail.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        return response.json().then(function (result) {
          if (!response.ok || (result.success !== true && result.success !== 'true')) {
            throw new Error(result.message || 'The form service rejected the message.');
          }
          status.textContent = 'Your message has been submitted. Thank you!';
          form.reset();
        });
      })
      .catch(function (error) {
        console.error('Contact form submission failed:', error);
        status.textContent = 'Your message could not be sent. Please try again or email aishathshafaofficial@gmail.com.';
      })
      .finally(function () {
        submitButton.disabled = false;
      });
  });
})();
