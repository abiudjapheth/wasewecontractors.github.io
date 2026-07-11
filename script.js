import { registerUser, loginUser as firebaseLogin, logoutUser as firebaseLogout, onAuthStateChangedHandler } from './auth.js';
import { sendContactMessage } from './contact.js';

function setGuestUI() {
  const guestContent = document.getElementById('guest-content');
  const loggedInContent = document.getElementById('logged-in-content');
  const userMenu = document.getElementById('user-menu');
  const registerBtn = document.getElementById('register-btn');
  const loginBtn = document.getElementById('login-btn');

  if (guestContent) guestContent.style.display = 'block';
  if (loggedInContent) loggedInContent.style.display = 'none';
  if (userMenu) userMenu.style.display = 'none';
  if (registerBtn) registerBtn.style.display = 'inline-block';
  if (loginBtn) loginBtn.style.display = 'inline-block';

  const userNameSpan = document.getElementById('user-name');
  const welcomeMessage = document.getElementById('welcome-message');
  if (userNameSpan) userNameSpan.textContent = '';
  if (welcomeMessage) welcomeMessage.textContent = '';
}

function setLoggedInUI(user) {
  const guestContent = document.getElementById('guest-content');
  const loggedInContent = document.getElementById('logged-in-content');
  const userMenu = document.getElementById('user-menu');
  const registerBtn = document.getElementById('register-btn');
  const loginBtn = document.getElementById('login-btn');

  if (guestContent) guestContent.style.display = 'none';
  if (loggedInContent) loggedInContent.style.display = 'block';
  if (userMenu) userMenu.style.display = 'flex';
  if (registerBtn) registerBtn.style.display = 'none';
  if (loginBtn) loginBtn.style.display = 'none';

  const displayName = user.displayName || user.email || 'User';
  const userNameSpan = document.getElementById('user-name');
  const welcomeMessage = document.getElementById('welcome-message');
  if (userNameSpan) userNameSpan.textContent = `Welcome, ${displayName}`;
  if (welcomeMessage) welcomeMessage.textContent = `Welcome, ${displayName}!`;

  const registrationModal = document.getElementById('registration-modal');
  if (registrationModal) registrationModal.style.display = 'none';
  hideLoginModal();
}

function getOrCreateFeedbackElement(form) {
  let feedback = form.querySelector('.form-feedback');
  if (!feedback) {
    feedback = document.createElement('div');
    feedback.className = 'form-feedback';
    feedback.style.marginTop = '12px';
    feedback.style.fontWeight = 'bold';
    form.appendChild(feedback);
  }
  return feedback;
}

function showFormFeedback(form, message, type) {
  const feedback = getOrCreateFeedbackElement(form);
  feedback.textContent = message;
  feedback.style.color = type === 'error' ? '#e74c3c' : '#2ecc71';
}

function createLoginModal() {
  let loginModal = document.getElementById('login-modal');
  if (loginModal) return loginModal;

  loginModal = document.createElement('div');
  loginModal.id = 'login-modal';
  loginModal.className = 'modal';
  loginModal.style.display = 'none';
  loginModal.innerHTML = `
    <div class="modal-content">
      <span class="close-btn" id="login-modal-close">&times;</span>
      <h2>Login to Wasewe Contractors</h2>
      <form id="login-form" class="modal-form">
        <div class="form-group">
          <label for="login-email">Email Address *</label>
          <input type="email" id="login-email" name="login-email" required>
        </div>
        <div class="form-group">
          <label for="login-password">Password *</label>
          <input type="password" id="login-password" name="login-password" required>
        </div>
        <button type="submit" class="register-submit-btn">Login</button>
      </form>
    </div>
  `;
  document.body.appendChild(loginModal);

  const closeBtn = loginModal.querySelector('#login-modal-close');
  closeBtn.addEventListener('click', () => hideLoginModal());

  loginModal.addEventListener('click', (event) => {
    if (event.target === loginModal) {
      hideLoginModal();
    }
  });

  const loginForm = loginModal.querySelector('#login-form');
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = loginForm['login-email'].value.trim();
    const password = loginForm['login-password'].value;

    try {
      await firebaseLogin(email, password);
      showFormFeedback(loginForm, 'Login successful! Redirecting...', 'success');
      loginForm.reset();
      hideLoginModal();
    } catch (error) {
      showFormFeedback(loginForm, error.message, 'error');
    }
  });

  return loginModal;
}

function showLoginModal() {
  const modal = createLoginModal();
  modal.style.display = 'flex';
}

function hideLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) modal.style.display = 'none';
}

function setupHeaderAuthentication() {
  const profileDropdown = document.getElementById('profile-dropdown');
  const loginBtn = document.getElementById('login-btn');

  if (loginBtn && profileDropdown) {
    loginBtn.addEventListener('click', (event) => {
      event.preventDefault();
      showLoginModal();
    });
  }

  if (profileDropdown) {
    window.addEventListener('click', (event) => {
      if (!event.target.closest('#login-btn') && !event.target.closest('#profile-dropdown')) {
        profileDropdown.style.display = 'none';
      }
    });
  }

  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', async (event) => {
      event.preventDefault();
      try {
        await firebaseLogout();
      } catch (error) {
        alert('Logout failed: ' + error.message);
      }
    });
  }
}

function handleContactForm() {
  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = contactForm['name'].value.trim();
    const email = contactForm['email'].value.trim();
    const phone = contactForm['phone'] ? contactForm['phone'].value.trim() : '';
    const service = contactForm['service'] ? contactForm['service'].value : '';
    const message = contactForm['message'].value.trim();

    if (!name || !email || !phone || !message) {
      showFormFeedback(contactForm, 'Please fill in name, email, phone, and message.', 'error');
      return;
    }

    try {
      await sendContactMessage(name, email, message, phone, service);
      showFormFeedback(contactForm, 'Message sent successfully. We will respond shortly.', 'success');
      contactForm.reset();
    } catch (error) {
      showFormFeedback(contactForm, 'Failed to send message: ' + error.message, 'error');
    }
  });
}

function handleRegistrationForm() {
  const registrationForm = document.getElementById('registration-form');
  if (!registrationForm) return;

  registrationForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const fullName = registrationForm['full-name'].value.trim();
    const email = registrationForm['email'].value.trim();
    const password = registrationForm['password'].value;
    const confirmPassword = registrationForm['confirm-password'].value;
    const termsAccepted = registrationForm['terms'].checked;

    if (password !== confirmPassword) {
      showFormFeedback(registrationForm, 'Passwords do not match.', 'error');
      return;
    }

    if (!termsAccepted) {
      showFormFeedback(registrationForm, 'You must agree to the Terms & Conditions.', 'error');
      return;
    }

    try {
      const user = await registerUser(email, password);
      if (user) {
        showFormFeedback(registrationForm, 'Account created! Please verify your email before login.', 'success');
        registrationForm.reset();
      }
    } catch (error) {
      showFormFeedback(registrationForm, 'Registration failed: ' + error.message, 'error');
    }
  });
}

function addRegisterModalBehavior() {
  const registerBtn = document.getElementById('register-btn');
  const modal = document.getElementById('registration-modal');
  const closeBtn = document.querySelector('#registration-modal .close-btn');

  if (registerBtn && modal) {
    registerBtn.addEventListener('click', () => {
      modal.style.display = 'flex';
      const feedback = modal.querySelector('.form-feedback');
      if (feedback) feedback.textContent = '';
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  if (modal) {
    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
  }
}

function openBookingModal(service = 'General') {
  const bookingModal = document.getElementById('booking-modal');
  const bookingService = document.getElementById('booking-service');
  if (bookingService) bookingService.value = service;
  if (bookingModal) bookingModal.style.display = 'flex';
}

function closeBookingModal() {
  const bookingModal = document.getElementById('booking-modal');
  if (bookingModal) bookingModal.style.display = 'none';
}

function setupBookingActions() {
  const bookingButtons = document.querySelectorAll('.book-now-btn');
  bookingButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const service = button.dataset.service || 'General';
      openBookingModal(service);
    });
  });

  const bookingClose = document.getElementById('booking-close-btn');
  if (bookingClose) {
    bookingClose.addEventListener('click', (event) => {
      event.preventDefault();
      closeBookingModal();
    });
  }

  const bookingModal = document.getElementById('booking-modal');
  if (bookingModal) {
    bookingModal.addEventListener('click', (event) => {
      if (event.target === bookingModal) {
        closeBookingModal();
      }
    });
  }

  const bookingForm = document.getElementById('booking-form');
  if (!bookingForm) return;

  bookingForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = bookingForm['name'].value.trim();
    const phone = bookingForm['phone'].value.trim();
    const email = bookingForm['email'].value.trim();
    const service = bookingForm['service'].value.trim();
    const message = bookingForm['message'].value.trim();
    const feedback = document.getElementById('booking-feedback');

    if (!name || !phone || !email || !message) {
      if (feedback) {
        feedback.textContent = 'Please fill name, phone, email and message to proceed.';
        feedback.style.color = '#e74c3c';
      }
      return;
    }

    if (!/^[0-9]+$/.test(phone)) {
      if (feedback) {
        feedback.textContent = 'Phone must contain digits only.';
        feedback.style.color = '#e74c3c';
      }
      return;
    }

    try {
      await sendContactMessage(name, email, message, phone, service);

      if (feedback) {
        feedback.style.color = '#2ecc71';
        feedback.textContent = 'Booking request sent successfully! Our team will contact you shortly.';
      }

      bookingForm.reset();

      setTimeout(() => {
        closeBookingModal();
        if (feedback) feedback.textContent = '';
      }, 2000);
    } catch (error) {
      if (feedback) {
        feedback.style.color = '#e74c3c';
        feedback.textContent = 'Unable to submit booking. Please try again later.';
      }
      console.error('Booking send error:', error);
    }
  });
}

function openToolsModal() {
  const toolsModal = document.getElementById('tools-modal');
  if (toolsModal) toolsModal.style.display = 'flex';
}

function closeToolsModal() {
  const toolsModal = document.getElementById('tools-modal');
  if (toolsModal) toolsModal.style.display = 'none';
}

function setupToolsActions() {
  const toolsButtons = document.querySelectorAll('.access-tools-btn');
  toolsButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      openToolsModal();
    });
  });

  const toolsClose = document.getElementById('tools-close-btn');
  if (toolsClose) {
    toolsClose.addEventListener('click', (event) => {
      event.preventDefault();
      closeToolsModal();
    });
  }

  const toolsModal = document.getElementById('tools-modal');
  if (toolsModal) {
    toolsModal.addEventListener('click', (event) => {
      if (event.target === toolsModal) {
        closeToolsModal();
      }
    });
  }
}

function setupPageInteractions() {
  // Smooth scrolling for anchor navigation on the same page
  document.querySelectorAll('.nav a').forEach((link) => {
    link.addEventListener('click', function (event) {
      const href = this.getAttribute('href');
      if (href && href.startsWith('#')) {
        event.preventDefault();
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  document.querySelectorAll('.profile-tab-btn').forEach((button) => {
    button.addEventListener('click', function () {
      const profileTabBtns = document.querySelectorAll('.profile-tab-btn');
      const profileTabs = document.querySelectorAll('.profile-tab');
      profileTabBtns.forEach((btn) => btn.classList.remove('active'));
      profileTabs.forEach((tab) => tab.classList.remove('active'));
      this.classList.add('active');
      const target = this.dataset.tab;
      const panel = document.getElementById(target);
      if (panel) panel.classList.add('active');
    });
  });

  // About section tab functionality (corrects missing behavior)
  const aboutTabButtons = document.querySelectorAll('.tab-btn');
  const aboutTabContents = document.querySelectorAll('.tab-content');

  function activateAboutTab(tabButton) {
    const tabId = tabButton.dataset.tab;
    if (!tabId) return;

    aboutTabButtons.forEach((btn) => btn.classList.remove('active'));
    aboutTabContents.forEach((section) => {
      section.classList.remove('active');
      section.style.display = 'none';
    });

    tabButton.classList.add('active');
    const targetContent = document.getElementById(tabId);
    if (targetContent) {
      targetContent.classList.add('active');
      targetContent.style.display = 'block';
    }
  }

  aboutTabButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      activateAboutTab(button);
    });
  });

  if (aboutTabButtons.length && aboutTabContents.length) {
    const initial = document.querySelector('.tab-btn.active') || aboutTabButtons[0];
    activateAboutTab(initial);
  }

  const prefOtherCheckbox = document.getElementById('pref-other');
  const prefOtherGroup = document.getElementById('pref-other-group');
  if (prefOtherCheckbox && prefOtherGroup) {
    prefOtherCheckbox.addEventListener('change', () => {
      prefOtherGroup.style.display = prefOtherCheckbox.checked ? 'block' : 'none';
    });
  }

  const serviceTypeSelect = document.getElementById('service-type');
  const otherServiceGroup = document.getElementById('other-service-group');
  if (serviceTypeSelect && otherServiceGroup) {
    serviceTypeSelect.addEventListener('change', () => {
      otherServiceGroup.style.display = serviceTypeSelect.value === 'other' ? 'block' : 'none';
    });
  }

  const filterButtons = document.querySelectorAll('.filter-btn');
  const portfolioItems = document.querySelectorAll('.portfolio-item');
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      filterButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
      const filter = button.dataset.filter;
      portfolioItems.forEach((item) => {
        item.style.display = filter === 'all' || item.dataset.category === filter ? 'block' : 'none';
      });
    });
  });

  // Privacy Policy Modal
  const privacyPolicyLink = document.getElementById('privacy-policy-link');
  const privacyPolicyModal = document.getElementById('privacy-policy-modal');
  const privacyCloseBtn = document.getElementById('privacy-close-btn');
  if (privacyPolicyLink && privacyPolicyModal) {
    privacyPolicyLink.addEventListener('click', (event) => {
      event.preventDefault();
      privacyPolicyModal.style.display = 'flex';
    });
  }
  if (privacyCloseBtn && privacyPolicyModal) {
    privacyCloseBtn.addEventListener('click', () => {
      privacyPolicyModal.style.display = 'none';
    });
  }
  if (privacyPolicyModal) {
    privacyPolicyModal.addEventListener('click', (event) => {
      if (event.target === privacyPolicyModal) {
        privacyPolicyModal.style.display = 'none';
      }
    });
  }

  // Terms and Conditions Modal
  const termsLinks = document.querySelectorAll('.terms-link');
  const termsModal = document.getElementById('terms-modal');
  const termsCloseBtn = document.getElementById('terms-close-btn');
  if (termsLinks.length && termsModal) {
    termsLinks.forEach(link => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        termsModal.style.display = 'flex';
      });
    });
  }
  if (termsCloseBtn && termsModal) {
    termsCloseBtn.addEventListener('click', () => {
      termsModal.style.display = 'none';
    });
  }
  if (termsModal) {
    termsModal.addEventListener('click', (event) => {
      if (event.target === termsModal) {
        termsModal.style.display = 'none';
      }
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  onAuthStateChangedHandler((user) => {
    if (user) {
      setLoggedInUI(user);
    } else {
      setGuestUI();
    }
  });

  setupHeaderAuthentication();
  handleRegistrationForm();
  addRegisterModalBehavior();
  handleContactForm();
  setupBookingActions();
  setupToolsActions();
  setupPageInteractions();
});

