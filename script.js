// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    
    // --- STATE MANAGEMENT ---
    let users = [];
    let works = [];
    let currentUser = null;
    let currentViewMode = 'grid'; // 'grid' or 'table'

    // --- DOM ELEMENTS ---
    const loadingSpinner = document.getElementById('loading-spinner');
    const authSection = document.getElementById('auth-section');
    const loginBtn = document.getElementById('login-btn');
    const userMenu = document.getElementById('user-menu');
    const adminPanelBtn = document.getElementById('admin-panel-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const welcomeUser = document.getElementById('welcome-user');

    const homeView = document.getElementById('home-view');
    const detailsView = document.getElementById('details-view');
    const adminView = document.getElementById('admin-view');
    const teacherView = document.getElementById('teacher-view');
    
    const dashboardContainer = document.getElementById('dashboard');
    const filtersContainer = document.getElementById('filters');
    const searchInput = document.getElementById('search-input');
    const viewToggle = document.getElementById('view-toggle');
    const gridViewBtn = document.getElementById('grid-view-btn');
    const tableViewBtn = document.getElementById('table-view-btn');
    const worksDisplay = document.getElementById('works-display');
    const noResults = document.getElementById('no-results');

    // Modals
    const loginForm = document.getElementById('login-form');
    const userForm = document.getElementById('user-form');
    const workForm = document.getElementById('work-form');
    const profileForm = document.getElementById('profile-form');
    
    const workModal = new bootstrap.Modal(document.getElementById('workModal'));
    const userModal = new bootstrap.Modal(document.getElementById('userModal'));
    const imagePreviewModal = new bootstrap.Modal(document.getElementById('imagePreviewModal'));


    // --- HELPER FUNCTIONS ---
    const showLoading = () => loadingSpinner.classList.add('show');
    const hideLoading = () => loadingSpinner.classList.remove('show');

    const showToast = (message, type = 'success') => {
        const toastContainer = document.querySelector('.toast-container');
        const toastId = 'toast-' + Date.now();
        const toastIcon = type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill';
        const toastBg = type === 'success' ? 'bg-success' : 'bg-danger';

        const toastHTML = `
            <div id="${toastId}" class="toast align-items-center text-white ${toastBg} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="bi bi-${toastIcon} me-2"></i> ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>`;
        toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
        toast.show();
        toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove());
    };

    const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

    const saveData = () => {
        localStorage.setItem('portfolio_users', JSON.stringify(users));
        localStorage.setItem('portfolio_works', JSON.stringify(works));
    };

    const loadData = () => {
        users = JSON.parse(localStorage.getItem('portfolio_users')) || [];
        works = JSON.parse(localStorage.getItem('portfolio_works')) || [];
        currentUser = JSON.parse(sessionStorage.getItem('portfolio_currentUser'));

        // Create default admin if no users exist
        if (users.length === 0) {
            users.push({
                id: generateId(),
                fullName: 'ผู้ดูแลระบบ',
                username: 'admin',
                password: '123', // In a real app, hash this!
                role: 'admin'
            });
            showToast('สร้างบัญชีผู้ดูแลระบบเริ่มต้น (admin/123)', 'success');
            saveData();
        }
    };
    
    const showView = (viewName) => {
        [homeView, detailsView, adminView, teacherView].forEach(v => v.classList.add('d-none'));
        document.getElementById(`${viewName}-view`).classList.remove('d-none');
        window.scrollTo(0, 0);
    };

    // --- RENDER FUNCTIONS ---
    
    const renderDashboard = () => {
        const total = works.length;
        const executive = works.filter(w => w.category === 'ผู้บริหาร').length;
        const teacher = works.filter(w => w.category === 'ครูและบุคลากร').length;
        const student = works.filter(w => w.category === 'นักเรียน').length;

        dashboardContainer.innerHTML = `
            <div class="col-md-3">
                <div class="dashboard-card" style="background: var(--theme-gradient-1);">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="stat-number">${total}</div>
                            <div class="stat-title">ผลงานทั้งหมด</div>
                        </div>
                        <div class="icon"><i class="bi bi-collection"></i></div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="dashboard-card" style="background: var(--theme-gradient-4);">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="stat-number">${executive}</div>
                            <div class="stat-title">ผลงานผู้บริหาร</div>
                        </div>
                        <div class="icon"><i class="bi bi-person-video3"></i></div>
                    </div>
                </div>
            </div>
             <div class="col-md-3">
                <div class="dashboard-card" style="background: var(--theme-gradient-2);">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="stat-number">${teacher}</div>
                            <div class="stat-title">ผลงานครูและบุคลากร</div>
                        </div>
                        <div class="icon"><i class="bi bi-person-workspace"></i></div>
                    </div>
                </div>
            </div>
             <div class="col-md-3">
                <div class="dashboard-card" style="background: var(--theme-gradient-3);">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="stat-number">${student}</div>
                            <div class="stat-title">ผลงานนักเรียน</div>
                        </div>
                        <div class="icon"><i class="bi bi-mortarboard"></i></div>
                    </div>
                </div>
            </div>
        `;
    };

    const renderFilters = () => {
        const categories = ['ทั้งหมด', 'ผู้บริหาร', 'ครูและบุคลากร', 'นักเรียน'];
        const gradients = ['var(--theme-gradient-1)', 'var(--theme-gradient-4)', 'var(--theme-gradient-2)', 'var(--theme-gradient-3)'];
        filtersContainer.innerHTML = categories.map((cat, index) => {
            const count = cat === 'ทั้งหมด' ? works.length : works.filter(w => w.category === cat).length;
            const activeClass = cat === 'ทั้งหมด' ? 'active' : '';
            return `<button class="btn filter-badge ${activeClass}" data-filter="${cat}" style="background:${gradients[index]}">
                        ${cat} <span class="badge bg-light text-dark ms-1">${count}</span>
                    </button>`;
        }).join('');
    };

    const renderWorks = (filteredWorks = works) => {
        if (filteredWorks.length === 0) {
            worksDisplay.innerHTML = '';
            noResults.classList.remove('d-none');
            return;
        }
        noResults.classList.add('d-none');
        
        const worksHTML = filteredWorks.map(work => {
             const avgRating = work.ratings.length ? (work.ratings.reduce((acc, r) => acc + r.score, 0) / work.ratings.length).toFixed(1) : '0.0';
             const userLiked = currentUser && work.likes.includes(currentUser.id);
             
             const starsHTML = Array(5).fill(0).map((_, i) => 
                `<i class="bi ${i < Math.round(avgRating) ? 'bi-star-fill' : 'bi-star'}" data-work-id="${work.id}" data-score="${i + 1}"></i>`
             ).join('');
             
            if (currentViewMode === 'grid') {
                return `
                    <div class="col-md-4 col-lg-3 mb-4">
                        <div class="card work-card shadow-sm h-100">
                            <img src="${work.coverImage || 'https://via.placeholder.com/400x300.png?text=No+Image'}" class="card-img-top" alt="${work.title}">
                            <div class="card-body pb-0">
                                <span class="badge bg-category-${work.category.replace(/\s/g, '-')} mb-2">${work.category}</span>
                                <h5 class="card-title">${work.title}</h5>
                                <p class="card-author mb-2"><i class="bi bi-person-fill me-1"></i> ${work.author}</p>
                            </div>
                            <div class="card-footer d-flex justify-content-between align-items-center">
                                <div class="d-flex align-items-center gap-3">
                                    <span class="btn-icon" title="Views"><i class="bi bi-eye-fill me-1"></i> ${work.views}</span>
                                    <span class="btn-icon like-btn" data-work-id="${work.id}" title="Like">
                                        <i class="bi ${userLiked ? 'bi-heart-fill' : 'bi-heart'} me-1"></i> <span class="like-count">${work.likes.length}</span>
                                    </span>
                                    <span class="btn-icon star-rating" title="Rating: ${avgRating}">
                                        ${starsHTML}
                                    </span>
                                </div>
                                <button class="btn btn-sm btn-outline-primary view-details-btn" data-work-id="${work.id}">
                                    <i class="bi bi-box-arrow-up-right"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            } else { // Table view
                return `
                    <tr>
                        <td><img src="${work.coverImage || 'https://via.placeholder.com/100x75.png?text=No+Image'}" style="width:100px; height:75px; object-fit: cover; border-radius: 5px;"></td>
                        <td>${work.title}</td>
                        <td>${work.author}</td>
                        <td><span class="badge bg-category-${work.category.replace(/\s/g, '-')}">${work.category}</span></td>
                        <td><i class="bi bi-eye-fill me-1"></i> ${work.views}</td>
                        <td><i class="bi bi-heart-fill me-1" style="color:var(--theme-dark-danger);"></i> ${work.likes.length}</td>
                        <td><i class="bi bi-star-fill me-1" style="color:var(--theme-warning);"></i> ${avgRating}</td>
                        <td><button class="btn btn-sm btn-outline-primary view-details-btn" data-work-id="${work.id}">ดูรายละเอียด</button></td>
                    </tr>
                `;
            }
        }).join('');

        if (currentViewMode === 'grid') {
            worksDisplay.innerHTML = `<div class="row">${worksHTML}</div>`;
        } else {
             worksDisplay.innerHTML = `
                <div class="card shadow-sm">
                    <div class="table-responsive">
                        <table class="table table-hover table-striped mb-0">
                            <thead>
                                <tr>
                                    <th>หน้าปก</th>
                                    <th>ชื่อผลงาน</th>
                                    <th>เจ้าของผลงาน</th>
                                    <th>ประเภท</th>
                                    <th>เข้าชม</th>
                                    <th>ไลค์</th>
                                    <th>คะแนน</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>${worksHTML}</tbody>
                        </table>
                    </div>
                </div>
            `;
        }
    };
    
    const renderDetails = (workId) => {
        const work = works.find(w => w.id === workId);
        if (!work) {
            showView('home');
            showToast('ไม่พบผลงานที่ต้องการ', 'error');
            return;
        }

        // Increment views
        work.views++;
        saveData();

        const avgRating = work.ratings.length ? (work.ratings.reduce((acc, r) => acc + r.score, 0) / work.ratings.length).toFixed(1) : '0.0';
        const userLiked = currentUser && work.likes.includes(currentUser.id);
        const starsHTML = Array(5).fill(0).map((_, i) => 
            `<i class="bi ${i < Math.round(avgRating) ? 'bi-star-fill' : 'bi-star'}" data-work-id="${work.id}" data-score="${i + 1}"></i>`
        ).join('');
        
        const albumHTML = work.albumImages.map((img, index) => 
            `<div class="col-4 col-md-3 col-lg-2 mb-3">
                <img src="${img}" class="img-fluid album-img shadow-sm" alt="Album image ${index + 1}" data-bs-toggle="modal" data-bs-target="#imagePreviewModal" data-work-id="${work.id}" data-index="${index}">
            </div>`
        ).join('');

        detailsView.innerHTML = `
            <div class="card shadow-lg">
                <div class="card-body p-lg-5">
                     <button class="btn btn-outline-secondary mb-4" onclick="document.dispatchEvent(new Event('showHome'))"><i class="bi bi-arrow-left me-1"></i> กลับหน้าแรก</button>
                    <div class="row">
                        <div class="col-lg-7 mb-4">
                            <img src="${work.coverImage || 'https://via.placeholder.com/800x600.png?text=No+Image'}" class="img-fluid details-cover-img shadow" alt="${work.title}">
                        </div>
                        <div class="col-lg-5">
                            <span class="badge bg-category-${work.category.replace(/\s/g, '-')} mb-2 fs-6">${work.category}</span>
                            <h1 class="display-6 fw-bold">${work.title}</h1>
                            <p class="lead text-muted"><i class="bi bi-person-fill me-2"></i>${work.author}</p>
                            <hr>
                            <div class="d-flex align-items-center gap-4 fs-5 mb-4">
                                <span><i class="bi bi-eye-fill me-1"></i> ${work.views}</span>
                                <span class="like-btn" data-work-id="${work.id}">
                                    <i class="bi ${userLiked ? 'bi-heart-fill' : 'bi-heart'} me-1"></i> <span class="like-count">${work.likes.length}</span>
                                </span>
                                <span class="star-rating" style="cursor:pointer;">
                                    ${starsHTML}
                                    <span class="ms-2 text-muted">(${avgRating})</span>
                                </span>
                            </div>
                            <h5 class="mt-4">คำอธิบาย</h5>
                            <p>${work.description.replace(/\n/g, '<br>')}</p>
                        </div>
                    </div>
                    ${albumHTML.length > 0 ? `
                        <hr class="my-4">
                        <h4 class="mb-3">อัลบั้มรูปภาพ</h4>
                        <div class="row">${albumHTML}</div>` : ''}
                </div>
            </div>
        `;
        showView('details');
    };
    
    const renderAdminUsers = () => {
        const tableContainer = document.getElementById('admin-users-table');
        const tableHTML = `
            <table class="table table-bordered table-striped">
                <thead>
                    <tr>
                        <th>ชื่อ-นามสกุล</th>
                        <th>Username</th>
                        <th>Role</th>
                        <th>จัดการ</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.fullName}</td>
                            <td>${user.username}</td>
                            <td><span class="badge bg-${user.role === 'admin' ? 'danger' : 'secondary'}">${user.role}</span></td>
                            <td>
                                <button class="btn btn-sm btn-warning edit-user-btn" data-user-id="${user.id}"><i class="bi bi-pencil-fill"></i></button>
                                ${user.role !== 'admin' || users.filter(u => u.role === 'admin').length > 1 ? 
                                `<button class="btn btn-sm btn-danger delete-user-btn" data-user-id="${user.id}"><i class="bi bi-trash-fill"></i></button>` : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        tableContainer.innerHTML = tableHTML;
    };
    
    const renderAdminWorks = (worksToRender, tableId) => {
        const tableContainer = document.getElementById(tableId);
        const canManageAll = currentUser && currentUser.role === 'admin';

        const tableHTML = `
            <table class="table table-bordered table-striped">
                <thead>
                    <tr>
                        <th>หน้าปก</th>
                        <th>ชื่อผลงาน</th>
                        ${canManageAll ? '<th>เจ้าของผลงาน</th>' : ''}
                        <th>ประเภท</th>
                        <th>จัดการ</th>
                    </tr>
                </thead>
                <tbody>
                    ${worksToRender.map(work => `
                        <tr>
                            <td><img src="${work.coverImage || 'https://via.placeholder.com/80x60.png?text=N/A'}" style="width:80px; height:60px; object-fit:cover;"></td>
                            <td>${work.title}</td>
                            ${canManageAll ? `<td>${work.author}</td>` : ''}
                            <td><span class="badge bg-category-${work.category.replace(/\s/g, '-')}">${work.category}</span></td>
                            <td>
                                <button class="btn btn-sm btn-warning edit-work-btn" data-work-id="${work.id}"><i class="bi bi-pencil-fill"></i></button>
                                <button class="btn btn-sm btn-danger delete-work-btn" data-work-id="${work.id}"><i class="bi bi-trash-fill"></i></button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        tableContainer.innerHTML = tableHTML;
    };


    // --- EVENT HANDLERS ---
    
    const handleFilterAndSearch = () => {
        const filter = document.querySelector('.filter-badge.active')?.dataset.filter || 'ทั้งหมด';
        const searchTerm = searchInput.value.toLowerCase();

        let filteredWorks = works;

        if (filter !== 'ทั้งหมด') {
            filteredWorks = filteredWorks.filter(w => w.category === filter);
        }

        if (searchTerm) {
            filteredWorks = filteredWorks.filter(w => w.title.toLowerCase().includes(searchTerm));
        }

        renderWorks(filteredWorks);
    };

    const handleLogin = (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;
        
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            currentUser = { id: user.id, fullName: user.fullName, username: user.username, role: user.role };
            sessionStorage.setItem('portfolio_currentUser', JSON.stringify(currentUser));
            bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
            loginForm.reset();
            updateUI();
            showToast(`ยินดีต้อนรับ, ${currentUser.fullName}`);
        } else {
            showToast('Username หรือ Password ไม่ถูกต้อง', 'error');
        }
    };

    const handleLogout = () => {
        currentUser = null;
        sessionStorage.removeItem('portfolio_currentUser');
        updateUI();
        showView('home');
    };
    
    const handleUserFormSubmit = (e) => {
        e.preventDefault();
        const id = document.getElementById('userId').value;
        const fullName = document.getElementById('user-fullName').value;
        const username = document.getElementById('user-username').value;
        let password = document.getElementById('user-password').value;
        const role = document.getElementById('user-role').value;

        if (id) { // Editing
            const userIndex = users.findIndex(u => u.id === id);
            if (userIndex > -1) {
                users[userIndex].fullName = fullName;
                users[userIndex].username = username;
                users[userIndex].role = role;
                if (password) {
                    users[userIndex].password = password;
                }
            }
        } else { // Adding
            users.push({ id: generateId(), fullName, username, password, role });
        }
        
        saveData();
        renderAdminUsers();
        userModal.hide();
        showToast('บันทึกข้อมูลผู้ใช้สำเร็จ');
    };

    const handleWorkFormSubmit = async (e) => {
        e.preventDefault();
        showLoading();
        
        const id = document.getElementById('workId').value;
        const author = document.getElementById('work-author').value;
        const title = document.getElementById('work-title').value;
        const category = document.getElementById('work-category').value;
        const description = document.getElementById('work-description').value;
        const coverFileInput = document.getElementById('work-cover');
        const albumFilesInput = document.getElementById('work-album');
        
        const readImageAsBase64 = (file, onProgress) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
                if(onProgress) reader.onprogress = onProgress;
                reader.readAsDataURL(file);
            });
        };
        
        let coverImage = document.getElementById('cover-preview').src;
        if (coverFileInput.files[0]) {
            coverImage = await readImageAsBase64(coverFileInput.files[0]);
        }

        const progressContainer = document.getElementById('upload-progress-container');
        progressContainer.innerHTML = '';
        let albumImages = [];
        if(id) { // If editing, get existing album
            const existingWork = works.find(w => w.id === id);
            albumImages = existingWork ? [...existingWork.albumImages] : [];
        }

        if (albumFilesInput.files.length > 0) {
             for(let i = 0; i < albumFilesInput.files.length; i++) {
                const file = albumFilesInput.files[i];
                const progressId = `progress-${i}`;
                progressContainer.innerHTML += `
                    <div class="progress mb-2" style="height: 20px;">
                        <div id="${progressId}" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 0%;">${file.name}</div>
                    </div>`;
                 const base64Image = await readImageAsBase64(file, (event) => {
                     if (event.lengthComputable) {
                         const percentComplete = (event.loaded / event.total) * 100;
                         document.getElementById(progressId).style.width = percentComplete + '%';
                     }
                 });
                 albumImages.push(base64Image);
             }
        }

        if (id) { // Editing
            const workIndex = works.findIndex(w => w.id === id);
            if (workIndex > -1) {
                works[workIndex] = { ...works[workIndex], author, title, category, description, coverImage, albumImages };
            }
        } else { // Adding
            works.unshift({ 
                id: generateId(), 
                author, title, category, description, coverImage, albumImages, 
                userId: currentUser.id,
                views: 0, 
                likes: [], 
                ratings: [] 
            });
        }

        setTimeout(() => { // Simulate delay for user to see progress bar
            saveData();
            updateDashboardAndFilters();
            if (currentUser.role === 'admin') renderAdminWorks(works, 'admin-works-table');
            if (currentUser.role === 'teacher') renderAdminWorks(works.filter(w => w.userId === currentUser.id), 'teacher-works-table');
            workModal.hide();
            hideLoading();
            showToast('บันทึกข้อมูลผลงานสำเร็จ');
        }, 500);
    };

    const handleInteraction = (e) => {
        const target = e.target;
        const workId = target.closest('[data-work-id]')?.dataset.workId;
        if (!workId) return;

        const work = works.find(w => w.id === workId);
        if(!work) return;

        // Like button
        if(target.closest('.like-btn')) {
            if(!currentUser) {
                showToast('กรุณาเข้าสู่ระบบเพื่อกดไลค์', 'error');
                return;
            }
            const likeIndex = work.likes.indexOf(currentUser.id);
            if (likeIndex > -1) {
                work.likes.splice(likeIndex, 1);
            } else {
                work.likes.push(currentUser.id);
            }
            saveData();
            updateUI(); // Re-render everything to update counts and icons
            if(!homeView.classList.contains('d-none')) {
                handleFilterAndSearch();
            } else {
                renderDetails(workId);
            }
        }

        // Star rating
        if(target.closest('.star-rating') && target.hasAttribute('data-score')) {
            if(!currentUser) {
                showToast('กรุณาเข้าสู่ระบบเพื่อให้คะแนน', 'error');
                return;
            }
            const score = parseInt(target.dataset.score);
            const existingRatingIndex = work.ratings.findIndex(r => r.userId === currentUser.id);

            if (existingRatingIndex > -1) {
                work.ratings[existingRatingIndex].score = score;
            } else {
                work.ratings.push({ userId: currentUser.id, score: score });
            }
            saveData();
            showToast(`คุณให้คะแนน ${score} ดาว`);
            if(!homeView.classList.contains('d-none')) {
                handleFilterAndSearch();
            } else {
                renderDetails(workId);
            }
        }
    };
    
    // --- UI UPDATE & INITIALIZATION ---
    
    const updateDashboardAndFilters = () => {
        renderDashboard();
        renderFilters();
    };

    const updateUI = () => {
        if (currentUser) {
            loginBtn.classList.add('d-none');
            userMenu.classList.remove('d-none');
            welcomeUser.textContent = `สวัสดี, ${currentUser.fullName}`;
            
            if (currentUser.role === 'admin' || currentUser.role === 'teacher') {
                adminPanelBtn.classList.remove('d-none');
            } else {
                adminPanelBtn.classList.add('d-none');
            }

        } else {
            loginBtn.classList.remove('d-none');
            userMenu.classList.add('d-none');
        }
        handleFilterAndSearch();
    };

    const init = () => {
        showLoading();
        loadData();
        updateDashboardAndFilters();
        updateUI();
        attachEventListeners();
        hideLoading();
    };
    
    // --- ATTACH EVENT LISTENERS ---
    
    function attachEventListeners() {
        loginForm.addEventListener('submit', handleLogin);
        logoutBtn.addEventListener('click', handleLogout);
        userForm.addEventListener('submit', handleUserFormSubmit);
        workForm.addEventListener('submit', handleWorkFormSubmit);
        profileForm.addEventListener('submit', handleProfileUpdate);

        searchInput.addEventListener('input', handleFilterAndSearch);
        
        filtersContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-badge')) {
                document.querySelectorAll('.filter-badge').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                handleFilterAndSearch();
            }
        });

        gridViewBtn.addEventListener('click', () => {
            currentViewMode = 'grid';
            gridViewBtn.classList.add('active');
            tableViewBtn.classList.remove('active');
            handleFilterAndSearch();
        });

        tableViewBtn.addEventListener('click', () => {
            currentViewMode = 'table';
            tableViewBtn.classList.add('active');
            gridViewBtn.classList.remove('active');
            handleFilterAndSearch();
        });
        
        adminPanelBtn.addEventListener('click', () => {
            if (currentUser.role === 'admin') {
                renderAdminUsers();
                renderAdminWorks(works, 'admin-works-table');
                showView('admin');
            } else if (currentUser.role === 'teacher') {
                const userWorks = works.filter(w => w.userId === currentUser.id);
                renderAdminWorks(userWorks, 'teacher-works-table');
                
                // Populate profile form
                document.getElementById('profile-fullName').value = currentUser.fullName;
                document.getElementById('profile-username').value = currentUser.username;
                document.getElementById('profile-password').value = '';

                showView('teacher');
            }
        });

        document.addEventListener('showHome', () => {
            updateDashboardAndFilters();
            handleFilterAndSearch();
            showView('home');
        });
        
        // Dynamic content event delegation
        document.body.addEventListener('click', (e) => {
            handleInteraction(e);

            // View Details
            if(e.target.closest('.view-details-btn')) {
                const workId = e.target.closest('.view-details-btn').dataset.workId;
                renderDetails(workId);
            }
            
            // Edit User
            if(e.target.closest('.edit-user-btn')) {
                const userId = e.target.closest('.edit-user-btn').dataset.userId;
                prepareUserModal(userId);
                userModal.show();
            }

            // Delete User
            if(e.target.closest('.delete-user-btn')) {
                const userId = e.target.closest('.delete-user-btn').dataset.userId;
                Swal.fire({
                    title: 'ต้องการลบผู้ใช้?',
                    text: "การกระทำนี้ไม่สามารถย้อนกลับได้!",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'ใช่, ลบเลย!',
                    cancelButtonText: 'ยกเลิก'
                }).then((result) => {
                    if (result.isConfirmed) {
                        users = users.filter(u => u.id !== userId);
                        saveData();
                        renderAdminUsers();
                        Swal.fire('ลบแล้ว!', 'ผู้ใช้ถูกลบเรียบร้อย', 'success');
                    }
                });
            }
            
            // Edit Work
            if(e.target.closest('.edit-work-btn')) {
                const workId = e.target.closest('.edit-work-btn').dataset.workId;
                prepareWorkModal(workId);
                workModal.show();
            }
            
             // Delete Work
            if(e.target.closest('.delete-work-btn')) {
                const workId = e.target.closest('.delete-work-btn').dataset.workId;
                 Swal.fire({
                    title: 'ต้องการลบผลงานนี้?',
                    text: "ข้อมูลผลงานจะถูกลบอย่างถาวร!",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'ใช่, ลบเลย!',
                    cancelButtonText: 'ยกเลิก'
                }).then((result) => {
                    if (result.isConfirmed) {
                        works = works.filter(w => w.id !== workId);
                        saveData();
                        updateDashboardAndFilters();
                        handleFilterAndSearch(); // Update home view if visible
                        // Update admin/teacher view
                        if (currentUser.role === 'admin') renderAdminWorks(works, 'admin-works-table');
                        if (currentUser.role === 'teacher') renderAdminWorks(works.filter(w => w.userId === currentUser.id), 'teacher-works-table');
                        Swal.fire('ลบแล้ว!', 'ผลงานถูกลบเรียบร้อย', 'success');
                    }
                });
            }
        });
        
        // Image Preview Modal Logic
        document.getElementById('imagePreviewModal').addEventListener('show.bs.modal', function (event) {
            const triggerElement = event.relatedTarget;
            const workId = triggerElement.dataset.workId;
            let currentIndex = parseInt(triggerElement.dataset.index);
            const work = works.find(w => w.id === workId);
            const album = work.albumImages;
            const previewImage = document.getElementById('previewImage');
            
            const updateImage = (index) => {
                previewImage.src = album[index];
                currentIndex = index;
            };
            
            updateImage(currentIndex);

            document.getElementById('prevImageBtn').onclick = () => {
                const newIndex = (currentIndex - 1 + album.length) % album.length;
                updateImage(newIndex);
            };
            
            document.getElementById('nextImageBtn').onclick = () => {
                const newIndex = (currentIndex + 1) % album.length;
                updateImage(newIndex);
            };
        });
        
        document.getElementById('work-cover').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const preview = document.getElementById('cover-preview');
                    preview.src = event.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // --- MODAL PREPARATION ---
    window.prepareUserModal = (userId = null) => {
        userForm.reset();
        document.getElementById('userId').value = '';
        document.getElementById('user-password').removeAttribute('required');

        if (userId) {
            const user = users.find(u => u.id === userId);
            document.getElementById('userModalLabel').textContent = 'แก้ไขผู้ใช้งาน';
            document.getElementById('userId').value = user.id;
            document.getElementById('user-fullName').value = user.fullName;
            document.getElementById('user-username').value = user.username;
            document.getElementById('user-role').value = user.role;
        } else {
            document.getElementById('userModalLabel').textContent = 'เพิ่มผู้ใช้งานใหม่';
            document.getElementById('user-password').setAttribute('required', 'required');
        }
    };
    
     window.prepareWorkModal = (workId = null) => {
        workForm.reset();
        document.getElementById('workId').value = '';
        document.getElementById('cover-preview').style.display = 'none';
        document.getElementById('upload-progress-container').innerHTML = '';
        document.getElementById('work-cover').value = '';
        document.getElementById('work-album').value = '';
        
        if (workId) {
            const work = works.find(w => w.id === workId);
            document.getElementById('workModalLabel').textContent = 'แก้ไขผลงาน';
            document.getElementById('workId').value = work.id;
            document.getElementById('work-author').value = work.author;
            document.getElementById('work-title').value = work.title;
            document.getElementById('work-category').value = work.category;
            document.getElementById('work-description').value = work.description;
            if (work.coverImage) {
                 const preview = document.getElementById('cover-preview');
                 preview.src = work.coverImage;
                 preview.style.display = 'block';
            }
        } else {
            document.getElementById('workModalLabel').textContent = 'เพิ่มผลงานใหม่';
            // Set default author if teacher is logged in
            if (currentUser && currentUser.role === 'teacher') {
                document.getElementById('work-author').value = currentUser.fullName;
            }
        }
    };
    
    function handleProfileUpdate(e) {
        e.preventDefault();
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex > -1) {
            users[userIndex].fullName = document.getElementById('profile-fullName').value;
            users[userIndex].username = document.getElementById('profile-username').value;
            const newPassword = document.getElementById('profile-password').value;
            if(newPassword) {
                users[userIndex].password = newPassword;
            }
            
            // Update current user session
            currentUser.fullName = users[userIndex].fullName;
            currentUser.username = users[userIndex].username;
            sessionStorage.setItem('portfolio_currentUser', JSON.stringify(currentUser));
            
            saveData();
            updateUI();
            showToast('อัปเดตข้อมูลส่วนตัวสำเร็จ');
        } else {
            showToast('เกิดข้อผิดพลาดในการอัปเดต', 'error');
        }
    }


    // --- Start the application ---
    init();

});
