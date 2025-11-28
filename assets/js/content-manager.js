// Content Manager - Gestionnaire de Contenu VIP
console.log('📝 Chargement du gestionnaire de contenu...');

class ContentManager {
    constructor() {
        this.posts = [];
        this.gallery = [];
        this.testimonials = [];
        this.currentSection = 'posts';
        this.init();
    }

    async init() {
        console.log('🚀 Initialisation content manager...');
        await this.loadContent();
        this.loadPosts();
        console.log('✅ Content manager initialisé');
    }

    async loadContent() {
        try {
            if (!window.firebaseDB) return;

            // Charger les posts
            const postsRef = window.dbRef(window.firebaseDB, 'content/posts');
            const postsSnapshot = await window.dbGet(postsRef);
            if (postsSnapshot.exists()) {
                this.posts = Object.entries(postsSnapshot.val()).map(([id, data]) => ({ id, ...data }));
            }

            // Charger la galerie
            const galleryRef = window.dbRef(window.firebaseDB, 'content/gallery');
            const gallerySnapshot = await window.dbGet(galleryRef);
            if (gallerySnapshot.exists()) {
                this.gallery = Object.entries(gallerySnapshot.val()).map(([id, data]) => ({ id, ...data }));
            }

            // Charger les témoignages
            const testimonialsRef = window.dbRef(window.firebaseDB, 'content/testimonials');
            const testimonialsSnapshot = await window.dbGet(testimonialsRef);
            if (testimonialsSnapshot.exists()) {
                this.testimonials = Object.entries(testimonialsSnapshot.val()).map(([id, data]) => ({ id, ...data }));
            }

            console.log(`📊 Contenu chargé: ${this.posts.length} posts, ${this.gallery.length} images, ${this.testimonials.length} témoignages`);
        } catch (error) {
            console.error('❌ Erreur chargement contenu:', error);
        }
    }

    showPosts() {
        this.hideAllSections();
        document.getElementById('postsSection').style.display = 'block';
        this.updateNavigation('posts');
        this.currentSection = 'posts';
        this.loadPosts();
    }

    showGallery() {
        this.hideAllSections();
        document.getElementById('gallerySection').style.display = 'block';
        this.updateNavigation('gallery');
        this.currentSection = 'gallery';
        this.loadGallery();
    }

    showTestimonials() {
        this.hideAllSections();
        document.getElementById('testimonialsSection').style.display = 'block';
        this.updateNavigation('testimonials');
        this.currentSection = 'testimonials';
        this.loadTestimonials();
    }

    hideAllSections() {
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });
    }

    updateNavigation(activeSection) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`a[href="#${activeSection}"]`).classList.add('active');
    }

    loadPosts() {
        const grid = document.getElementById('postsGrid');
        if (!grid) return;

        grid.innerHTML = '';

        if (this.posts.length === 0) {
            grid.innerHTML = '<div class="empty-state">Aucun article. Créez votre premier post !</div>';
            return;
        }

        this.posts.forEach(post => {
            const card = document.createElement('div');
            card.className = 'post-card';
            card.innerHTML = `
                <div class="post-header">
                    <h3 style="text-align: center; margin: 0 0 8px 0; font-size: 0.95rem; line-height: 1.2;">${post.title}</h3>
                </div>
                <div class="post-image" style="text-align: center; margin: 8px 0;">
                    ${post.image ? `<img src="${post.image}" alt="${post.title}" style="max-width: 100%; height: auto; border-radius: 6px; object-fit: cover;">` : '<div class="no-image"><i class="fas fa-image"></i></div>'}
                </div>
                <div class="post-content">
                    <p style="margin: 8px 0; font-size: 0.8rem; color: #666; line-height: 1.3;">${post.excerpt || post.content.substring(0, 80)}...</p>
                    <div class="post-meta" style="font-size: 0.75rem; margin: 8px 0;">
                        <span><i class="fas fa-calendar"></i> ${new Date(post.createdAt).toLocaleDateString()}</span>
                        <span><i class="fas fa-eye"></i> ${post.views || 0}</span>
                    </div>
                </div>
                <div class="post-actions">
                    <button class="btn-small primary" onclick="contentManager.editPost('${post.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-small secondary" onclick="contentManager.previewPost('${post.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-small danger" onclick="contentManager.deletePost('${post.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    loadGallery() {
        const grid = document.getElementById('galleryGrid');
        if (!grid) return;

        grid.innerHTML = '';

        if (this.gallery.length === 0) {
            grid.innerHTML = '<div class="empty-state">Aucune image. Uploadez votre première image !</div>';
            return;
        }

        this.gallery.forEach(image => {
            const card = document.createElement('div');
            card.className = 'gallery-card';
            card.innerHTML = `
                <div class="gallery-image">
                    <img src="${image.url}" alt="${image.title}">
                </div>
                <div class="gallery-info">
                    <h4>${image.title}</h4>
                    <p>${image.description || 'Aucune description'}</p>
                    <div class="gallery-actions">
                        <button class="btn-small primary" onclick="contentManager.editImage('${image.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-small secondary" onclick="contentManager.copyImageUrl('${image.url}')">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn-small danger" onclick="contentManager.deleteImage('${image.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    loadTestimonials() {
        const grid = document.getElementById('testimonialsGrid');
        if (!grid) return;

        grid.innerHTML = '';

        if (this.testimonials.length === 0) {
            grid.innerHTML = '<div class="empty-state">Aucun témoignage. Ajoutez le premier !</div>';
            return;
        }

        this.testimonials.forEach(testimonial => {
            const card = document.createElement('div');
            card.className = 'testimonial-card';
            card.innerHTML = `
                <div class="testimonial-content">
                    <div class="testimonial-text">
                        <i class="fas fa-quote-left"></i>
                        <p>${testimonial.content}</p>
                    </div>
                    <div class="testimonial-author">
                        ${testimonial.avatar ? `<img src="${testimonial.avatar}" alt="${testimonial.name}">` : '<div class="avatar-placeholder"><i class="fas fa-user"></i></div>'}
                        <div class="author-info">
                            <h4>${testimonial.name}</h4>
                            <span>${testimonial.title || 'Trader VIP'}</span>
                            <div class="rating">
                                ${'★'.repeat(testimonial.rating || 5)}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="testimonial-actions">
                    <button class="btn-small primary" onclick="contentManager.editTestimonial('${testimonial.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-small danger" onclick="contentManager.deleteTestimonial('${testimonial.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    createPost() {
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <h3>Créer un Nouveau Post</h3>
            <div class="content-form">
                <div class="form-group">
                    <label>Titre:</label>
                    <input type="text" id="postTitle" placeholder="Titre de l'article">
                </div>
                <div class="form-group">
                    <label>Image (optionnelle - max 1MB):</label>
                    <input type="file" id="postImage" accept="image/*" onchange="contentManager.previewImage(this, 'postImagePreview')">
                    <div id="postImagePreview" class="image-preview"></div>
                </div>
                <div class="form-group">
                    <label>Contenu:</label>
                    <textarea id="postContent" rows="10" placeholder="Contenu de l'article..."></textarea>
                </div>
                <div class="form-group">
                    <label>Catégorie:</label>
                    <select id="postCategory">
                        <option value="trading">Trading</option>
                        <option value="analyse">Analyse</option>
                        <option value="education">Éducation</option>
                        <option value="news">Actualités</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button class="btn-primary" onclick="contentManager.savePost()">Publier</button>
                    <button class="btn-secondary" onclick="contentManager.closeModal()">Annuler</button>
                </div>
            </div>
        `;
        this.showModal();
    }

    async savePost() {
        const title = document.getElementById('postTitle').value;
        const content = document.getElementById('postContent').value;
        const category = document.getElementById('postCategory').value;
        const imageFile = document.getElementById('postImage').files[0];

        if (!title || !content) {
            this.showNotification('Titre et contenu requis', 'error');
            return;
        }

        try {
            let imageUrl = null;
            if (imageFile) {
                imageUrl = await this.uploadImageFile(imageFile, 'posts');
            }

            const postId = 'post_' + Date.now();
            const postData = {
                title,
                content,
                category,
                image: imageUrl,
                excerpt: content.substring(0, 150),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                author: window.firebaseAuth.currentUser.email,
                views: 0,
                published: true
            };

            const postRef = window.dbRef(window.firebaseDB, `content/posts/${postId}`);
            await window.dbSet(postRef, postData);

            this.showNotification('Post publié avec succès!', 'success');
            this.closeModal();
            await this.loadContent();
            this.loadPosts();
        } catch (error) {
            console.error('Erreur sauvegarde post:', error);
            this.showNotification('Erreur lors de la publication', 'error');
        }
    }

    uploadImage() {
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <h3>Upload Image</h3>
            <div class="content-form">
                <div class="form-group">
                    <label>Sélectionner une image (max 1MB):</label>
                    <input type="file" id="uploadImageFile" accept="image/*" onchange="contentManager.previewImage(this, 'uploadImagePreview')">
                    <div id="uploadImagePreview" class="image-preview"></div>
                </div>
                <div class="form-group">
                    <label>Titre:</label>
                    <input type="text" id="imageTitle" placeholder="Titre de l'image">
                </div>
                <div class="form-group">
                    <label>Description:</label>
                    <textarea id="imageDescription" rows="3" placeholder="Description de l'image..."></textarea>
                </div>
                <div class="form-actions">
                    <button class="btn-primary" onclick="contentManager.saveImage()">Upload</button>
                    <button class="btn-secondary" onclick="contentManager.closeModal()">Annuler</button>
                </div>
            </div>
        `;
        this.showModal();
    }

    async saveImage() {
        const imageFile = document.getElementById('uploadImageFile').files[0];
        const title = document.getElementById('imageTitle').value;
        const description = document.getElementById('imageDescription').value;

        if (!imageFile) {
            this.showNotification('Veuillez sélectionner une image', 'error');
            return;
        }

        try {
            const imageUrl = await this.uploadImageFile(imageFile, 'gallery');
            
            const imageId = 'img_' + Date.now();
            const imageData = {
                title: title || imageFile.name,
                description,
                url: imageUrl,
                filename: imageFile.name,
                size: imageFile.size,
                type: imageFile.type,
                uploadedAt: new Date().toISOString(),
                uploadedBy: window.firebaseAuth.currentUser.email
            };

            const imageRef = window.dbRef(window.firebaseDB, `content/gallery/${imageId}`);
            await window.dbSet(imageRef, imageData);

            this.showNotification('Image uploadée avec succès!', 'success');
            this.closeModal();
            await this.loadContent();
            this.loadGallery();
        } catch (error) {
            console.error('Erreur upload image:', error);
            this.showNotification('Erreur lors de l\'upload', 'error');
        }
    }

    addTestimonial() {
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <h3>Ajouter un Témoignage</h3>
            <div class="content-form">
                <div class="form-group">
                    <label>Nom du client:</label>
                    <input type="text" id="testimonialName" placeholder="Nom du client">
                </div>
                <div class="form-group">
                    <label>Titre/Profession:</label>
                    <input type="text" id="testimonialTitle" placeholder="Ex: Trader Professionnel">
                </div>
                <div class="form-group">
                    <label>Avatar (optionnel - max 1MB):</label>
                    <input type="file" id="testimonialAvatar" accept="image/*" onchange="contentManager.previewImage(this, 'avatarPreview')">
                    <div id="avatarPreview" class="image-preview"></div>
                </div>
                <div class="form-group">
                    <label>Témoignage:</label>
                    <textarea id="testimonialContent" rows="5" placeholder="Le témoignage du client..."></textarea>
                </div>
                <div class="form-group">
                    <label>Note (1-5 étoiles):</label>
                    <select id="testimonialRating">
                        <option value="5">5 étoiles</option>
                        <option value="4">4 étoiles</option>
                        <option value="3">3 étoiles</option>
                        <option value="2">2 étoiles</option>
                        <option value="1">1 étoile</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button class="btn-primary" onclick="contentManager.saveTestimonial()">Ajouter</button>
                    <button class="btn-secondary" onclick="contentManager.closeModal()">Annuler</button>
                </div>
            </div>
        `;
        this.showModal();
    }

    async saveTestimonial() {
        const name = document.getElementById('testimonialName').value;
        const title = document.getElementById('testimonialTitle').value;
        const content = document.getElementById('testimonialContent').value;
        const rating = document.getElementById('testimonialRating').value;
        const avatarFile = document.getElementById('testimonialAvatar').files[0];

        if (!name || !content) {
            this.showNotification('Nom et témoignage requis', 'error');
            return;
        }

        try {
            let avatarUrl = null;
            if (avatarFile) {
                avatarUrl = await this.uploadImageFile(avatarFile, 'avatars');
            }

            const testimonialId = 'testimonial_' + Date.now();
            const testimonialData = {
                name,
                title: title || 'Trader VIP',
                content,
                rating: parseInt(rating),
                avatar: avatarUrl,
                createdAt: new Date().toISOString(),
                approved: true
            };

            const testimonialRef = window.dbRef(window.firebaseDB, `content/testimonials/${testimonialId}`);
            await window.dbSet(testimonialRef, testimonialData);

            this.showNotification('Témoignage ajouté avec succès!', 'success');
            this.closeModal();
            await this.loadContent();
            this.loadTestimonials();
        } catch (error) {
            console.error('Erreur sauvegarde témoignage:', error);
            this.showNotification('Erreur lors de l\'ajout', 'error');
        }
    }

    async uploadImageFile(file, folder) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                resolve(e.target.result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    previewImage(input, previewId) {
        const preview = document.getElementById(previewId);
        if (input.files && input.files[0]) {
            const file = input.files[0];
            
            // Vérifier la taille (augmentée à 5MB pour qualité)
            if (file.size > 5 * 1024 * 1024) {
                preview.innerHTML = '<div style="color: #ff4444; padding: 1rem; background: rgba(255,68,68,0.1); border-radius: 8px;">Image trop volumineuse (max 5MB)</div>';
                input.value = '';
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px;">`;
            };
            reader.readAsDataURL(file);
        }
    }

    copyImageUrl(url) {
        navigator.clipboard.writeText(url).then(() => {
            this.showNotification('URL copiée dans le presse-papiers!', 'success');
        });
    }

    editHomePage() {
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <h3>Éditer la Page d'Accueil</h3>
            <div class="content-form">
                <div class="form-group">
                    <label>Titre Principal:</label>
                    <input type="text" id="homeTitle" placeholder="Misterpips">
                </div>
                <div class="form-group">
                    <label>Sous-titre:</label>
                    <input type="text" id="homeSubtitle" placeholder="Trading Professionnel">
                </div>
                <div class="form-group">
                    <label>Description:</label>
                    <textarea id="homeDescription" rows="3" placeholder="Rejoignez notre communauté VIP..."></textarea>
                </div>
                <div class="form-group">
                    <label>Texte Bouton Principal:</label>
                    <input type="text" id="homeBtnText" placeholder="Accéder à l'Espace VIP">
                </div>
                <div class="form-actions">
                    <button class="btn-primary" onclick="contentManager.saveHomePage()">Sauvegarder</button>
                    <button class="btn-secondary" onclick="contentManager.closeModal()">Annuler</button>
                </div>
            </div>
        `;
        this.loadHomePageData();
        this.showModal();
    }

    async loadHomePageData() {
        try {
            const homeRef = window.dbRef(window.firebaseDB, 'siteContent/home');
            const snapshot = await window.dbGet(homeRef);
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                document.getElementById('homeTitle').value = data.title || 'Misterpips';
                document.getElementById('homeSubtitle').value = data.subtitle || 'Trading Professionnel';
                document.getElementById('homeDescription').value = data.description || 'Rejoignez notre communauté VIP et accédez aux outils de trading les plus avancés';
                document.getElementById('homeBtnText').value = data.btnText || 'Accéder à l\'Espace VIP';
            }
        } catch (error) {
            console.error('Erreur chargement page accueil:', error);
        }
    }

    async saveHomePage() {
        const title = document.getElementById('homeTitle').value;
        const subtitle = document.getElementById('homeSubtitle').value;
        const description = document.getElementById('homeDescription').value;
        const btnText = document.getElementById('homeBtnText').value;

        if (!title || !subtitle) {
            this.showNotification('Titre et sous-titre requis', 'error');
            return;
        }

        try {
            const homeData = {
                title,
                subtitle,
                description,
                btnText,
                updatedAt: new Date().toISOString()
            };

            const homeRef = window.dbRef(window.firebaseDB, 'siteContent/home');
            await window.dbSet(homeRef, homeData);

            this.showNotification('Page d\'accueil mise à jour!', 'success');
            this.closeModal();
        } catch (error) {
            console.error('Erreur sauvegarde page accueil:', error);
            this.showNotification('Erreur lors de la sauvegarde', 'error');
        }
    }

    editAboutPage() {
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <h3>Éditer la Section À Propos</h3>
            <div class="content-form">
                <div class="form-group">
                    <label>Titre:</label>
                    <input type="text" id="aboutTitle" placeholder="À propos de Misterpips">
                </div>
                <div class="form-group">
                    <label>Description:</label>
                    <textarea id="aboutDesc" rows="5" placeholder="Plateforme de trading professionnelle..."></textarea>
                </div>
                <div class="form-actions">
                    <button class="btn-primary" onclick="contentManager.saveAboutPage()">Sauvegarder</button>
                    <button class="btn-secondary" onclick="contentManager.closeModal()">Annuler</button>
                </div>
            </div>
        `;
        this.loadAboutPageData();
        this.showModal();
    }

    async loadAboutPageData() {
        try {
            const aboutRef = window.dbRef(window.firebaseDB, 'siteContent/about');
            const snapshot = await window.dbGet(aboutRef);
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                document.getElementById('aboutTitle').value = data.title || 'À propos de Misterpips';
                document.getElementById('aboutDesc').value = data.description || 'Plateforme de trading professionnelle dédiée aux traders sérieux qui souhaitent améliorer leurs performances et rejoindre une communauté d\'élite.';
            }
        } catch (error) {
            console.error('Erreur chargement page about:', error);
        }
    }

    async saveAboutPage() {
        const title = document.getElementById('aboutTitle').value;
        const description = document.getElementById('aboutDesc').value;

        if (!title || !description) {
            this.showNotification('Titre et description requis', 'error');
            return;
        }

        try {
            const aboutData = {
                title,
                description,
                updatedAt: new Date().toISOString()
            };

            const aboutRef = window.dbRef(window.firebaseDB, 'siteContent/about');
            await window.dbSet(aboutRef, aboutData);

            this.showNotification('Section À propos mise à jour!', 'success');
            this.closeModal();
        } catch (error) {
            console.error('Erreur sauvegarde about:', error);
            this.showNotification('Erreur lors de la sauvegarde', 'error');
        }
    }

    previewSite() {
        window.open('index.html', '_blank');
    }

    async deletePost(postId) {
        if (!confirm('Supprimer cet article ?')) return;

        try {
            const postRef = window.dbRef(window.firebaseDB, `content/posts/${postId}`);
            await window.dbSet(postRef, null);
            
            this.showNotification('Article supprimé', 'success');
            await this.loadContent();
            this.loadPosts();
        } catch (error) {
            console.error('Erreur suppression:', error);
            this.showNotification('Erreur lors de la suppression', 'error');
        }
    }

    async deleteImage(imageId) {
        if (!confirm('Supprimer cette image ?')) return;

        try {
            const imageRef = window.dbRef(window.firebaseDB, `content/gallery/${imageId}`);
            await window.dbSet(imageRef, null);
            
            this.showNotification('Image supprimée', 'success');
            await this.loadContent();
            this.loadGallery();
        } catch (error) {
            console.error('Erreur suppression:', error);
            this.showNotification('Erreur lors de la suppression', 'error');
        }
    }

    async deleteTestimonial(testimonialId) {
        if (!confirm('Supprimer ce témoignage ?')) return;

        try {
            const testimonialRef = window.dbRef(window.firebaseDB, `content/testimonials/${testimonialId}`);
            await window.dbSet(testimonialRef, null);
            
            this.showNotification('Témoignage supprimé', 'success');
            await this.loadContent();
            this.loadTestimonials();
        } catch (error) {
            console.error('Erreur suppression:', error);
            this.showNotification('Erreur lors de la suppression', 'error');
        }
    }

    showModal() {
        document.getElementById('contentModal').style.display = 'flex';
    }

    closeModal() {
        document.getElementById('contentModal').style.display = 'none';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    getNotificationColor(type) {
        const colors = {
            success: 'linear-gradient(135deg, #44ff44, #28a745)',
            error: 'linear-gradient(135deg, #ff4444, #dc3545)',
            warning: 'linear-gradient(135deg, #ffaa00, #ffc107)',
            info: 'linear-gradient(135deg, #00d4ff, #17a2b8)'
        };
        return colors[type] || colors.info;
    }

    async logout() {
        try {
            if (window.firebaseAuth && window.signOut) {
                await window.signOut(window.firebaseAuth);
            }
            sessionStorage.clear();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Erreur déconnexion:', error);
            window.location.href = 'index.html';
        }
    }
}

// Initialisation
let contentManager;

function initializeContentManager() {
    console.log('📝 Démarrage content manager...');
    try {
        contentManager = new ContentManager();
        window.contentManager = contentManager;
        console.log('✅ Content manager créé');
    } catch (error) {
        console.error('❌ Erreur création content manager:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeContentManager);
} else {
    setTimeout(initializeContentManager, 100);
}

console.log('📝 Script content manager chargé avec succès');