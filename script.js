/* ============================================
   مركز الأفق الطبي - Al-Afaq Medical Center
   JavaScript Functionality
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functions
    initNavbar();
    initMobileMenu();
    initAnalysisCards();
    initDoctorFilter();
    initBookingForms();
    initDatePickers();
    smoothScroll();
});

/* ============================================
   NAVBAR SCROLL EFFECT
   ============================================ */
function initNavbar() {
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

/* ============================================
   MOBILE MENU TOGGLE
   ============================================ */
function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');

            // Change icon
            const icon = menuToggle.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });

        // Close menu when clicking on a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                navLinks.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            });
        });
    }
}

/* ============================================
   ANALYSIS CARDS SELECTION
   ============================================ */
function initAnalysisCards() {
    const analysisCards = document.querySelectorAll('.analysis-card');
    const analysisTypeSelect = document.getElementById('analysisType');

    analysisCards.forEach(card => {
        const selectBtn = card.querySelector('.btn-select');

        if (selectBtn) {
            selectBtn.addEventListener('click', function() {
                // Get the analysis type from data attribute
                const analysisType = card.dataset.type;
                
                // Redirect to booking page with analysis type
                window.location.href = 'analysis-booking.html?type=' + analysisType;
            });
        }
    });
}

// Global function for analysis selection (called from onclick)
function selectAnalysis(type) {
    window.location.href = 'analysis-booking.html?type=' + type;
}

/* ============================================
   DOCTOR FILTER BY SPECIALTY
   ============================================ */
function initDoctorFilter() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const doctorCards = document.querySelectorAll('.doctor-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));

            // Add active class to clicked button
            button.classList.add('active');

            // Get specialty
            const specialty = button.dataset.specialty;

            // Filter doctor cards
            doctorCards.forEach(card => {
                if (specialty === 'all' || card.dataset.specialty === specialty) {
                    card.classList.remove('hidden');
                    card.style.animation = 'fadeInUp 0.5s ease forwards';
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });

    // Initialize doctor booking buttons
    const bookButtons = document.querySelectorAll('.btn-book-doctor');

    bookButtons.forEach(button => {
        button.addEventListener('click', function() {
            const doctorName = button.dataset.doctor;
            const doctorSelect = document.getElementById('doctorSelect');

            if (doctorSelect) {
                doctorSelect.value = doctorName;
                doctorSelect.focus();

                // Scroll to booking form
                const bookingSection = document.getElementById('booking');
                if (bookingSection) {
                    bookingSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
}

/* ============================================
   BOOKING FORMS HANDLING
   ============================================ */
function initBookingForms() {
    // Analysis Booking Form
    const analysisForm = document.getElementById('analysisBookingForm');
    if (analysisForm) {
        analysisForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleBookingSubmit(analysisForm, 'تحليل');
        });
    }

    // Doctor Booking Form
    const doctorForm = document.getElementById('doctorBookingForm');
    if (doctorForm) {
        doctorForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleBookingSubmit(doctorForm, 'طبيب');
        });
    }
}

function handleBookingSubmit(form, type) {
    // Get form data
    const formData = new FormData(form);
    const data = {
        name: formData.get('patientName'),
        phone: formData.get('patientPhone'),
        age: formData.get('patientAge') || '',
        type: type,
        date: formData.get('bookingDate'),
        time: formData.get('bookingTime'),
        service: type === 'تحليل' ? formData.get('analysisType') : formData.get('doctorSelect'),
        notes: type === 'تحليل' ? formData.get('notes') : formData.get('symptoms'),
        status: 'confirmed',
        createdAt: new Date().toISOString()
    };

    // Validate required fields
    if (!data.name || !data.phone || !data.date || !data.time) {
        showAlert('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }

    // For doctor booking, service is required
    if (type === 'طبيب' && !data.service) {
        showAlert('يرجى اختيار الطبيب', 'error');
        return;
    }

    // Validate phone number
    if (!validatePhone(data.phone)) {
        showAlert('يرجى إدخال رقم هاتف صحيح', 'error');
        return;
    }

    // Validate age for analysis booking
    if (type === 'تحليل') {
        if (!data.age || data.age < 1 || data.age > 150) {
            showAlert('يرجى إدخال عمر صحيح', 'error');
            return;
        }
    }

    // Validate date is not in the past
    const selectedDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
        showAlert('يرجى اختيار تاريخ مستقبلي', 'error');
        return;
    }

    // Save to localStorage for admin panel
    saveBookingToStorage(data);

    // Show success modal instead of redirecting to admin
    showSuccessModal(data);

    // Reset form
    form.reset();
}

function saveBookingToStorage(data) {
    const bookings = JSON.parse(localStorage.getItem('medicalBookings') || '[]');
    bookings.push(data);
    localStorage.setItem('medicalBookings', JSON.stringify(bookings));
    console.log('✅ تم حفظ الحجز بنجاح');
}

function validatePhone(phone) {
    // Egyptian phone number format - starts with 01 and has 11 digits
    const egyptianPhone = /^01[0-9]{9}$/;
    return egyptianPhone.test(phone);
}

function showAlert(message, type) {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <i class="fa-solid fa-${type === 'error' ? 'circle-exclamation' : 'circle-check'}"></i>
        <span>${message}</span>
    `;

    // Add styles
    alert.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        padding: 15px 25px;
        background: ${type === 'error' ? '#e74c3c' : '#27ae60'};
        color: white;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 3000;
        animation: fadeInUp 0.3s ease;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    `;

    document.body.appendChild(alert);

    // Remove after 3 seconds
    setTimeout(() => {
        alert.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

function showSuccessModal(data) {
    const modal = document.getElementById('successModal');
    const bookingDetails = document.getElementById('bookingDetails');

    if (modal && bookingDetails) {
        // Format the date
        const date = new Date(data.date);
        const formattedDate = date.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Get service name
        let serviceName = data.service;
        if (data.type === 'تحليل') {
            const analysisNames = {
                'blood': 'تحليل الدم',
                'urine': 'تحليل البول',
                'hormones': 'تحليل الهرمونات',
                'vitamins': 'تحليل الفيتامينات',
                'allergy': 'تحليل الحساسية',
                'genetic': 'التحليل الوراثي'
            };
            serviceName = analysisNames[data.service] || data.service;
        }

        bookingDetails.innerHTML = `
            <p><strong>الاسم:</strong> ${data.name}</p>
            <p><strong>رقم الهاتف:</strong> ${data.phone}</p>
            <p><strong>${data.type === 'تحليل' ? 'نوع التحليل' : 'الطبيب'}:</strong> ${serviceName}</p>
            <p><strong>التاريخ:</strong> ${formattedDate}</p>
            <p><strong>الوقت:</strong> ${formatTime(data.time)}</p>
        `;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    if (hour < 12) {
        return `${hour}:${minutes} صباحاً`;
    } else if (hour === 12) {
        return `${hour}:${minutes} ظهراً`;
    } else {
        return `${hour - 12}:${minutes} مساءً`;
    }
}

// Close modal function (global)
window.closeModal = function() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
};

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('successModal');
    if (modal && modal.classList.contains('active')) {
        if (e.target === modal) {
            closeModal();
        }
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

/* ============================================
   DATE PICKER CONFIGURATION
   ============================================ */
function initDatePickers() {
    const dateInputs = document.querySelectorAll('input[type="date"]');

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const minDate = `${year}-${month}-${day}`;

    dateInputs.forEach(input => {
        input.min = minDate;

        // Also set max date to 3 months from now
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 3);
        const maxYear = maxDate.getFullYear();
        const maxMonth = String(maxDate.getMonth() + 1).padStart(2, '0');
        const maxDay = String(maxDate.getDate()).padStart(2, '0');
        input.max = `${maxYear}-${maxMonth}-${maxDay}`;
    });
}

/* ============================================
   SMOOTH SCROLL
   ============================================ */
function smoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
}

/* ============================================
   ADDITIONAL ANIMATIONS
   ============================================ */
// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
`;
document.head.appendChild(style);

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements with animation
document.querySelectorAll('.service-card, .analysis-card, .doctor-card, .contact-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

console.log('✅ مركز الأفق الطبي - تم تحميل الموقع بنجاح');