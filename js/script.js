const sections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('nav a');
const cursor = document.querySelector('.cursor');
const body = document.body;
const openDialogButton = document.getElementById('contact-button');
const closeDialogButton = document.getElementById('close-dialog');
const dialog = document.getElementById('contact-dialog');
const progressBar = document.getElementById('progress-bar');
const contactForm = document.querySelector('.contact_box');

const showFieldError = (field, message) => {
  let error = field.parentElement.querySelector('.field_error');
  if (!error) {
    error = document.createElement('div');
    error.className = 'field_error';
    field.parentElement.appendChild(error);
  }
  error.textContent = message;
  field.classList.add('invalid');
};

const clearFieldError = (field) => {
  const error = field.parentElement.querySelector('.field_error');
  if (error) {
    error.remove();
  }
  field.classList.remove('invalid');
};

const getFieldErrorMessage = (field) => {
  if (field.validity.valueMissing) {
    return 'Please fill out this field.';
  }
  if (field.type === 'email' && field.validity.typeMismatch) {
    return 'Please enter a valid email address.';
  }
  return 'Please enter a valid value.';
};

const clearFormErrors = () => {
  contactForm.querySelectorAll('.field_error').forEach((error) => error.remove());
  contactForm.querySelectorAll('.invalid').forEach((field) => field.classList.remove('invalid'));
};

const contactFields = contactForm ? Array.from(contactForm.querySelectorAll('input, textarea')) : [];

const addContactFieldListeners = () => {
  contactFields.forEach((field) => {
    field.addEventListener('input', () => {
      if (field.checkValidity()) {
        clearFieldError(field);
      }
    });
  });
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
    }
  });
}, { threshold: 0.15 });


document.querySelectorAll('.about_card, .skill_box, .project_card, .stats').forEach((element) => {
  element.classList.add('hidden');
  observer.observe(element);
});


function updateActiveLink() {
  let currentSection = '';

  sections.forEach((section) => {
    const sectionTop = section.offsetTop - 180;
    if (window.scrollY >= sectionTop) {
      currentSection = section.id;
    }
  });

  navLinks.forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === `#${currentSection}`);
  });
}


function updateProgressBar() {
  if (!progressBar) return;

  const scrollTop = window.scrollY || window.pageYOffset;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const percent = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;

  progressBar.style.width = `${Math.min(percent, 100)}%`;
}


function openDialog() {
  if (!dialog) return;

  dialog.showModal();
  body.style.overflowY = 'hidden';
}


function closeDialog() {
  if (!dialog || !dialog.open) return;

  dialog.close();
  body.style.overflowY = '';
}


function mouseMove() {
  window.addEventListener('mousemove', (event) => {
    cursor.style.left = `${event.clientX - 5}px`;
    cursor.style.top = `${event.clientY - 2}px`;
  });
}

if (openDialogButton) {
  openDialogButton.addEventListener('click', openDialog);
}

if (closeDialogButton) {
  closeDialogButton.addEventListener('click', closeDialog);
}

if (dialog) {
  dialog.addEventListener('click', (event) => {
    const rect = dialog.getBoundingClientRect();
    const clickedOutside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;

    if (clickedOutside) {
      closeDialog();
    }
  });
}

if (contactForm) {
  addContactFieldListeners();
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    clearFormErrors();

    let isValid = true;

    contactFields.forEach((field) => {
      if (!field.checkValidity()) {
        isValid = false;
        showFieldError(field, getFieldErrorMessage(field));
      }
    });

    if (!isValid) {
      const firstErrorField = contactFields.find((field) => !field.checkValidity());
      firstErrorField?.focus();
      return;
    }

    closeDialog();
    contactNotification
  });
}

window.addEventListener('scroll', () => {
  updateActiveLink();
  updateProgressBar();
}, { passive: true });

window.addEventListener('resize', updateProgressBar);

if (cursor && window.matchMedia('(pointer: fine)').matches) {
  window.addEventListener('mousemove', (event) => {
    cursor.style.left = `${event.clientX - 5}px`;
    cursor.style.top = `${event.clientY - 2}px`;
  });
} else if (cursor) {
  cursor.style.display = 'none';
}

updateActiveLink();
updateProgressBar();

console.log(
  `%cWelcome to My %cPortfolio`,

  `color: #3484ee; 
  text-decoration: underline; 
  text-decoration-color: #1d44c4;
  text-decoration-offset: 4px;
  font-size: 40px;
  font-family: sans-serif;
  font-weight: 650;
  letter-spacing: 0.3px;
  margin: 12px;`,

  `background: linear-gradient(135deg, rgb(147, 189, 252), rgb(45, 72, 228));
  border-radius: 10px;
  color: #ffffff;
  padding: 6px 9px;
  font-size: 45px;
  font-family: sans-serif;
  font-weight: 650;
  margin: 0 0 0 12px;
  letter-spacing: 0.4px;`
);