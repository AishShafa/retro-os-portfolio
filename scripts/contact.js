(function () {
  'use strict';

  var form = document.getElementById('f');
  if (!form) return;

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var subject = encodeURIComponent('Message from ' + form.elements.n.value);
    var body = encodeURIComponent(
      form.elements.m.value + '\n\n' +
      'Name: ' + form.elements.n.value + '\n' +
      'Email: ' + form.elements.e.value + '\n' +
      'Company: ' + (form.elements.company.value || 'Not provided') + '\n' +
      'What they need: ' + (form.elements.need.value || 'Not provided')
    );
    window.location.href = 'mailto:aishathshafaofficial@gmail.com?subject=' + subject + '&body=' + body;
  });
})();
