// Script principal - Page d'accueil
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Misterpips App initialisée');
    
    // Éléments DOM
    const loginModal = document.getElementById('loginModal');
    const loginBtn = document.getElementById('loginBtn');
    const accessVip = document.getElementById('accessVip');
    const modalClose = document.querySelector('.modal-close');
    const loginForm = document.getElementById('loginForm');
    const contactSupport = document.getElementById('contactSupport');
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');

    // Navigation smooth scroll
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('.main-header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Mettre à jour les liens actifs
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });

    // Mobile menu toggle
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('mobile-active');
            this.classList.toggle('active');
        });
    }

    // Ouvrir modal de connexion
    function openLoginModal() {
        loginModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    // Fermer modal
    function closeLoginModal() {
        loginModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', openLoginModal);
    }

    if (accessVip) {
        accessVip.addEventListener('click', openLoginModal);
    }

    if (modalClose) {
        modalClose.addEventListener('click', closeLoginModal);
    }

    // Fermer modal en cliquant à l'extérieur
    loginModal.addEventListener('click', function(e) {
        if (e.target === loginModal) {
            closeLoginModal();
        }
    });

    // Fermer modal avec Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && loginModal.style.display === 'flex') {
            closeLoginModal();
        }
    });

    // Formulaire de connexion
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            
            if (!email || !password) {
                showNotification('Veuillez remplir tous les champs', 'error');
                return;
            }

            // Désactiver le bouton pendant la connexion
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';

            try {
                const result = await window.firebaseAuth.signInWithEmailAndPassword(
                    window.firebaseAuth.auth, 
                    email, 
                    password
                );
                
                if (result.user) {
                    // Sauvegarder les informations de session
                    sessionStorage.setItem('firebaseUID', result.user.uid);
                    sessionStorage.setItem('userEmail', result.user.email);
                    sessionStorage.setItem('authenticated', 'true');
                    
                    // Sauvegarder les données utilisateur
                    const userRef = window.dbRef(window.firebaseDB, `users/${result.user.uid}`);
                    const userSnapshot = await window.dbGet(userRef);
                    
                    const isFirstLogin = !userSnapshot.exists() || !userSnapshot.val().hasLoggedIn;
                    
                    await window.dbSet(userRef, {
                        email: result.user.email,
                        isVIP: true,
                        plan: 'VIP',
                        hasLoggedIn: true,
                        lastLogin: new Date().toISOString()
                    });
                    
                    if (isFirstLogin) {
                        showNotification('FÉLICITATIONS ! Bienvenue dans la famille VIP - Misterpips', 'success');
                    } else {
                        showNotification('Connexion réussie ! Redirection...', 'success');
                    }
                    
                    // Redirection vers l'espace VIP
                    setTimeout(() => {
                        window.location.href = 'vip-space.html';
                    }, 1500);
                }
                
            } catch (error) {
                console.error('Erreur connexion:', error);
                let errorMessage = 'Erreur de connexion';
                
                switch(error.code) {
                    case 'auth/user-not-found':
                        errorMessage = 'Utilisateur non trouvé';
                        break;
                    case 'auth/wrong-password':
                        errorMessage = 'Mot de passe incorrect';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Email invalide';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Trop de tentatives, réessayez plus tard';
                        break;
                    default:
                        errorMessage = 'Identifiants incorrects';
                }
                
                showNotification(errorMessage, 'error');
            } finally {
                // Réactiver le bouton
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
            }
        });
    }

    // Contact support
    if (contactSupport) {
        contactSupport.addEventListener('click', function() {
            if (confirm('Pour devenir membre VIP, contactez notre support sur Telegram @misterpips_support\n\nVoulez-vous ouvrir Telegram maintenant ?')) {
                window.open('https://t.me/misterpips_support', '_blank');
            }
        });
    }

    // Fonction pour afficher les notifications
    function showNotification(message, type = 'info') {
        // Supprimer les notifications existantes
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notif => notif.remove());
        
        // Créer la nouvelle notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        // Styles
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${getNotificationColor(type)};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
            z-index: 9999;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 400px;
            font-weight: 500;
        `;
        
        // Ajouter au DOM
        document.body.appendChild(notification);
        
        // Animation d'entrée
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Bouton de fermeture
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            removeNotification(notification);
        });
        
        // Suppression automatique
        setTimeout(() => {
            removeNotification(notification);
        }, type === 'success' ? 4000 : 3000);
    }

    function removeNotification(notification) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    function getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    function getNotificationColor(type) {
        const colors = {
            success: 'linear-gradient(135deg, #44ff44, #28a745)',
            error: 'linear-gradient(135deg, #ff4444, #dc3545)',
            warning: 'linear-gradient(135deg, #ffaa00, #ffc107)',
            info: 'linear-gradient(135deg, #00d4ff, #17a2b8)'
        };
        return colors[type] || colors.info;
    }

    // Gestion du scroll pour la navigation
    let lastScrollTop = 0;
    const header = document.querySelector('.main-header');
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Header hide/show on scroll
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        lastScrollTop = scrollTop;
        
        // Active section highlighting
        const sections = document.querySelectorAll('section[id]');
        const headerHeight = header.offsetHeight;
        
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - headerHeight - 50;
            const sectionHeight = section.clientHeight;
            if (scrollTop >= sectionTop && scrollTop < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // Animations au scroll
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

    // Observer les éléments à animer
    const animatedElements = document.querySelectorAll('.feature-card, .contact-card, .stat-card');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Vérifier si l'utilisateur est déjà connecté
    const isAuthenticated = sessionStorage.getItem('authenticated');
    if (isAuthenticated === 'true') {
        // Optionnel: rediriger automatiquement vers l'espace VIP
        // window.location.href = 'vip-space.html';
    }

    console.log('✅ Scripts principaux chargés');
});