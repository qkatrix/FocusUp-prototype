// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И НАСТРОЙКИ =====
let currentTheme = localStorage.getItem('theme') || 'light';
let tasks = JSON.parse(localStorage.getItem('focusup_tasks')) || [];
let userProfile = JSON.parse(localStorage.getItem('focusup_profile')) || getDefaultProfile();
let appSettings = JSON.parse(localStorage.getItem('focusup_settings')) || getDefaultSettings();
let statistics = JSON.parse(localStorage.getItem('focusup_stats')) || getDefaultStats();

// ===== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ =====
document.addEventListener('DOMContentLoaded', function() {
    // Установка темы
    setTheme(currentTheme);

    // Инициализация темы для кнопки
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
        updateThemeIcon();
    }

    // Загрузка данных для текущей страницы
    loadPageData();

    // Инициализация счетчиков символов
    initCharCounters();

    // Инициализация дат
    initDateInputs();

    // Анимация элементов
    animateElements();
});

// ===== ТЕМА =====
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    currentTheme = theme;
    updateThemeIcon();
}

function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

function updateThemeIcon() {
    const themeIcon = document.querySelector('#theme-toggle i');
    if (themeIcon) {
        themeIcon.className = currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// ===== ОБЩИЕ ФУНКЦИИ =====
function showNotification(message, type = 'success') {
    // Удаляем старые уведомления
    const oldNotifications = document.querySelectorAll('.notification');
    oldNotifications.forEach(n => n.remove());

    // Создаем новое уведомление
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    // Удаляем через 3 секунды
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function confirmAction(message) {
    return confirm(message);
}

// ===== ГЛАВНАЯ СТРАНИЦА =====
function loadPageData() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';

    switch(page) {
        case 'index.html':
            loadHomePageData();
            break;
        case 'tasks.html':
            loadTasksPage();
            break;
        case 'statistics.html':
            loadStatisticsPage();
            break;
        case 'profile.html':
            loadProfilePage();
            break;
        case 'settings.html':
            loadSettingsPage();
            break;
    }
}

function loadHomePageData() {
    // Обновляем статистику на главной
    updateHomeStats();

    // Инициализируем демо-задачи
    initDemoTasks();

    // Загружаем данные профиля
    loadUserProfile();
}

function updateHomeStats() {
    const completedTasks = tasks.filter(task => task.completed).length;
    const currentStreak = calculateCurrentStreak();

    const completedElement = document.getElementById('completed-tasks-count');
    const streakElement = document.getElementById('current-streak');

    if (completedElement) completedElement.textContent = completedTasks;
    if (streakElement) streakElement.textContent = currentStreak;
}

function calculateCurrentStreak() {
    if (tasks.length === 0) return 0;

    const today = new Date().toDateString();
    const completedDates = tasks
        .filter(task => task.completed)
        .map(task => new Date(task.completedAt).toDateString())
        .sort((a, b) => new Date(b) - new Date(a));

    if (completedDates.length === 0) return 0;

    let streak = 1;
    let currentDate = new Date(completedDates[0]);

    for (let i = 1; i < completedDates.length; i++) {
        const prevDate = new Date(currentDate);
        prevDate.setDate(prevDate.getDate() - 1);

        if (completedDates[i] === prevDate.toDateString()) {
            streak++;
            currentDate = prevDate;
        } else {
            break;
        }
    }

    return streak;
}

// ===== ДЕМО-ФУНКЦИИ ДЛЯ ГЛАВНОЙ СТРАНИЦЫ =====
function initDemoTasks() {
    const demoTasks = document.querySelectorAll('.demo-task .task-checkbox');
    demoTasks.forEach(checkbox => {
        checkbox.addEventListener('click', function() {
            toggleDemoTask(this);
        });
    });
}

function toggleDemoTask(element) {
    const icon = element.querySelector('i');
    const taskItem = element.closest('.demo-task');

    if (icon.classList.contains('fa-check-circle')) {
        icon.className = 'far fa-circle';
        taskItem.classList.remove('task-completed');
    } else {
        icon.className = 'fas fa-check-circle';
        taskItem.classList.add('task-completed');
        element.classList.add('pulse');
        setTimeout(() => element.classList.remove('pulse'), 500);
    }
}

function resetDemoTasks() {
    const demoTasks = document.querySelectorAll('.demo-task');
    demoTasks.forEach(task => {
        const checkbox = task.querySelector('.task-checkbox i');
        checkbox.className = 'far fa-circle';
        task.classList.remove('task-completed');
    });
    showNotification('Demo uzdevumi atiestatīti', 'info');
}

function animateDemoProgress() {
    const progressFill = document.getElementById('demo-progress-fill');
    const percentElement = document.getElementById('demo-progress-percent');

    if (progressFill && percentElement) {
        progressFill.style.width = '0%';
        percentElement.textContent = '0%';

        let width = 0;
        const interval = setInterval(() => {
            if (width >= 65) {
                clearInterval(interval);
            } else {
                width++;
                progressFill.style.width = width + '%';
                percentElement.textContent = width + '%';
            }
        }, 20);

        showNotification('Progresa animācija palaista', 'success');
    }
}

// ===== СТРАНИЦА ЗАДАЧ =====
function loadTasksPage() {
    renderTasks();
    updateTaskCounters();
    initTaskSearch();
    initTaskFilters();
}

function addNewTask() {
    const titleInput = document.getElementById('task-title');
    const descriptionInput = document.getElementById('task-description');
    const deadlineInput = document.getElementById('task-deadline');
    const prioritySelect = document.getElementById('task-priority');
    const categorySelect = document.getElementById('task-category');

    const title = titleInput.value.trim();
    if (!title) {
        showNotification('Lūdzu, ievadi uzdevuma nosaukumu', 'error');
        titleInput.focus();
        return;
    }

    const task = {
        id: Date.now(),
        title: title,
        description: descriptionInput.value.trim(),
        deadline: deadlineInput.value || null,
        priority: prioritySelect.value,
        category: categorySelect.value,
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null
    };

    tasks.push(task);
    saveTasks();

    // Очищаем форму
    titleInput.value = '';
    descriptionInput.value = '';
    deadlineInput.value = '';
    prioritySelect.value = 'medium';
    categorySelect.value = 'study';

    // Обновляем интерфейс
    renderTasks();
    updateTaskCounters();
    updateStatistics();

    showNotification('Uzdevums pievienots veiksmīgi', 'success');
}

function renderTasks(filter = 'all', searchTerm = '') {
    const container = document.getElementById('tasks-container');
    if (!container) return;

    let filteredTasks = tasks;

    // Применяем фильтр
    switch(filter) {
        case 'active':
            filteredTasks = tasks.filter(task => !task.completed);
            break;
        case 'completed':
            filteredTasks = tasks.filter(task => task.completed);
            break;
        case 'today':
            const today = new Date().toISOString().split('T')[0];
            filteredTasks = tasks.filter(task => task.deadline === today);
            break;
        case 'high':
            filteredTasks = tasks.filter(task => task.priority === 'high');
            break;
    }

    // Применяем поиск
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredTasks = filteredTasks.filter(task => 
            task.title.toLowerCase().includes(term) ||
            (task.description && task.description.toLowerCase().includes(term))
        );
    }

    if (filteredTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <h3>Nav uzdevumu</h3>
                <p>${filter === 'all' && !searchTerm ? 'Pievieno pirmo uzdevumu, izmantojot formu augšā' : 'Nav atrasts neviens uzdevums'}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredTasks.map(task => `
        <div class="task-item ${task.completed ? 'task-completed' : ''}" data-id="${task.id}">
            <div class="task-checkbox" onclick="toggleTaskCompletion(${task.id})">
                <i class="${task.completed ? 'fas fa-check-circle' : 'far fa-circle'}"></i>
            </div>
            <div class="task-info">
                <h4>${escapeHtml(task.title)}</h4>
                ${task.description ? `<p>${escapeHtml(task.description)}</p>` : ''}
                ${task.deadline ? `<p class="task-deadline"><i class="fas fa-calendar"></i> Termiņš: ${formatDate(task.deadline)}</p>` : ''}
                <div class="task-tags">
                    <span class="task-priority ${task.priority}">${getPriorityText(task.priority)}</span>
                    <span class="task-category ${task.category}">${getCategoryText(task.category)}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-action-btn" onclick="editTask(${task.id})" title="Rediģēt">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="task-action-btn delete" onclick="deleteTask(${task.id})" title="Dzēst">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function toggleTaskCompletion(id) {
    const taskIndex = tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) return;

    tasks[taskIndex].completed = !tasks[taskIndex].completed;
    tasks[taskIndex].completedAt = tasks[taskIndex].completed ? new Date().toISOString() : null;

    saveTasks();
    renderTasks();
    updateTaskCounters();
    updateStatistics();

    showNotification(`Uzdevums ${tasks[taskIndex].completed ? 'atzīmēts kā izpildīts' : 'atjaunots'}`, 'success');
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // В реальном приложении здесь было бы модальное окно редактирования
    const newTitle = prompt('Ievadi jaunu uzdevuma nosaukumu:', task.title);
    if (newTitle !== null && newTitle.trim() !== '') {
        task.title = newTitle.trim();
        task.description = prompt('Ievadi jaunu aprakstu:', task.description || '') || task.description;

        saveTasks();
        renderTasks();
        showNotification('Uzdevums rediģēts veiksmīgi', 'success');
    }
}

function deleteTask(id) {
    if (!confirmAction('Vai tiešām vēlies dzēst šo uzdevumu?')) return;

    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
    updateTaskCounters();
    updateStatistics();

    showNotification('Uzdevums dzēsts veiksmīgi', 'success');
}

function updateTaskCounters() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const activeTasks = totalTasks - completedTasks;

    const totalElement = document.getElementById('total-tasks');
    const completedElement = document.getElementById('completed-tasks');
    const activeElement = document.getElementById('active-tasks');

    if (totalElement) totalElement.textContent = totalTasks;
    if (completedElement) completedElement.textContent = completedTasks;
    if (activeElement) activeElement.textContent = activeTasks;
}

function initTaskSearch() {
    const searchInput = document.getElementById('task-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterTasks();
        });
    }
}

function initTaskFilters() {
    // Уже инициализировано в HTML через onclick
}

function filterTasks() {
    const searchTerm = document.getElementById('task-search')?.value || '';
    const activeFilter = document.querySelector('.filter-btn.active')?.textContent.toLowerCase() || 'all';

    let filter = 'all';
    switch(activeFilter) {
        case 'aktīvie': filter = 'active'; break;
        case 'pabeigtie': filter = 'completed'; break;
        case 'šodien': filter = 'today'; break;
        case 'augsta prioritāte': filter = 'high'; break;
    }

    renderTasks(filter, searchTerm);
}

function changeFilter(filterType) {
    // Обновляем активную кнопку
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Фильтруем задачи
    filterTasks();
}

function markAllAsCompleted() {
    if (!confirmAction('Vai tiešām vēlies atzīmēt visus uzdevumus kā pabeigtus?')) return;

    tasks.forEach(task => {
        if (!task.completed) {
            task.completed = true;
            task.completedAt = new Date().toISOString();
        }
    });

    saveTasks();
    renderTasks();
    updateTaskCounters();
    updateStatistics();

    showNotification('Visi uzdevumi atzīmēti kā pabeigti', 'success');
}

function deleteCompletedTasks() {
    if (!confirmAction('Vai tiešām vēlies dzēst visus pabeigtos uzdevumus?')) return;

    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
    updateTaskCounters();
    updateStatistics();

    showNotification('Pabeigtie uzdevumi dzēsti veiksmīgi', 'success');
}

function exportTasks() {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `focusup_tasks_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    showNotification('Uzdevumi eksportēti veiksmīgi', 'success');
}

function importTasks() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = function(event) {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const importedTasks = JSON.parse(e.target.result);

                if (Array.isArray(importedTasks)) {
                    // Добавляем импортированные задачи к существующим
                    tasks = [...tasks, ...importedTasks.map(task => ({
                        ...task,
                        id: task.id || Date.now() + Math.random()
                    }))];

                    saveTasks();
                    renderTasks();
                    updateTaskCounters();
                    updateStatistics();

                    showNotification(`${importedTasks.length} uzdevumi importēti veiksmīgi`, 'success');
                } else {
                    showNotification('Nepareizs datu formāts', 'error');
                }
            } catch (error) {
                showNotification('Neizdevās ielādēt failu', 'error');
            }
        };

        reader.readAsText(file);
    };

    input.click();
}

// ===== СТРАНИЦА СТАТИСТИКИ =====
function loadStatisticsPage() {
    updateStatistics();
    renderCharts();
    updateAchievements();
}

function updateStatistics() {
    // Сохраняем статистику
    saveStatistics();

    // Обновляем отображение
    updateStatsDisplay();
}

function updateStatsDisplay() {
    const totalCompleted = tasks.filter(task => task.completed).length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
    const currentStreak = calculateCurrentStreak();

    // Обновляем элементы на странице
    const elements = {
        'total-completed': totalCompleted,
        'completion-rate': `${completionRate}%`,
        'current-streak-stat': currentStreak,
        'streak-days': `${currentStreak} dienas`,
        'avg-completion': calculateAverageCompletionTime(),
        'productivity-score': calculateProductivityScore(),

        // Статистика по категориям
        'work-total': countTasksByCategory('work').total,
        'work-completed': countTasksByCategory('work').completed,
        'work-rate': `${countTasksByCategory('work').rate}%`,

        'study-total': countTasksByCategory('study').total,
        'study-completed': countTasksByCategory('study').completed,
        'study-rate': `${countTasksByCategory('study').rate}%`,

        'personal-total': countTasksByCategory('personal').total,
        'personal-completed': countTasksByCategory('personal').completed,
        'personal-rate': `${countTasksByCategory('personal').rate}%`,

        'other-total': countTasksByCategory('other').total,
        'other-completed': countTasksByCategory('other').completed,
        'other-rate': `${countTasksByCategory('other').rate}%`
    };

    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;

            // Анимируем изменение чисел
            if (typeof value === 'number' && element.textContent !== value.toString()) {
                animateNumber(element, parseInt(element.textContent) || 0, value);
            }
        }
    }
}

function animateNumber(element, start, end) {
    let current = start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(20 / (end - start)));

    const timer = setInterval(() => {
        current += increment;
        element.textContent = current;

        if (current === end) {
            clearInterval(timer);
        }
    }, stepTime);
}

function calculateAverageCompletionTime() {
    const completedTasks = tasks.filter(task => task.completed && task.createdAt && task.completedAt);

    if (completedTasks.length === 0) return 0;

    const totalDays = completedTasks.reduce((sum, task) => {
        const created = new Date(task.createdAt);
        const completed = new Date(task.completedAt);
        const diffTime = Math.abs(completed - created);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return sum + diffDays;
    }, 0);

    return Math.round(totalDays / completedTasks.length);
}

function calculateProductivityScore() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const currentStreak = calculateCurrentStreak();

    if (totalTasks === 0) return 0;

    const completionScore = (completedTasks / totalTasks) * 50;
    const streakScore = Math.min(currentStreak * 2, 20);
    const consistencyScore = (completedTasks > 0 ? 30 : 0);

    return Math.min(Math.round(completionScore + streakScore + consistencyScore), 100);
}

function countTasksByCategory(category) {
    const categoryTasks = tasks.filter(task => task.category === category);
    const completed = categoryTasks.filter(task => task.completed).length;
    const total = categoryTasks.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, rate };
}

function renderCharts() {
    // Обновляем столбчатую диаграмму
    updateBarChart();

    // Обновляем круговую диаграмму
    updatePieChart();
}

function updateBarChart() {
    const bars = document.querySelectorAll('.chart-bar[data-value]');
    bars.forEach(bar => {
        const value = parseInt(bar.getAttribute('data-value'));
        const fill = bar.querySelector('.bar-fill');
        if (fill) {
            fill.style.height = value + '%';
        }
    });
}

function updatePieChart() {
    // В реальном приложении здесь была бы динамическая генерация круговой диаграммы
}

function updateAchievements() {
    const completedTasks = tasks.filter(task => task.completed).length;

    // Обновляем прогресс достижений
    const tenTasksProgress = document.getElementById('ten-tasks-progress');
    const streakProgress = document.getElementById('streak-progress');
    const hundredTasksProgress = document.getElementById('hundred-tasks-progress');

    if (tenTasksProgress) tenTasksProgress.textContent = `${Math.min(completedTasks, 10)}/10`;
    if (streakProgress) streakProgress.textContent = `${Math.min(calculateCurrentStreak(), 7)}/7`;
    if (hundredTasksProgress) hundredTasksProgress.textContent = `${Math.min(completedTasks, 100)}/100`;

    // Обновляем дату первого задания
    const firstTask = tasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
    const firstTaskDate = document.getElementById('first-task-date');
    if (firstTaskDate && firstTask) {
        firstTaskDate.textContent = formatDate(firstTask.createdAt.split('T')[0]);
    }
}

function exportStatistics() {
    const statsData = {
        tasks: tasks,
        statistics: statistics,
        profile: userProfile,
        exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(statsData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `focusup_statistics_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    showNotification('Statistika eksportēta veiksmīgi', 'success');
}

function resetStatistics() {
    if (!confirmAction('Vai tiešām vēlies atiestatīt visu statistiku? Šī darbība nevar tikt atcelta.')) return;

    statistics = getDefaultStats();
    saveStatistics();
    updateStatsDisplay();

    showNotification('Statistika atiestatīta veiksmīgi', 'success');
}

function refreshStatistics() {
    updateStatistics();
    showNotification('Statistika atjaunināta', 'success');
}

// ===== СТРАНИЦА ПРОФИЛЯ =====
function loadProfilePage() {
    loadUserProfile();
    initProfileForm();
    initProfileSettings();
}

function loadUserProfile() {
    // Загружаем данные профиля в форму
    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const bioInput = document.getElementById('profile-bio');
    const goalInput = document.getElementById('profile-goal');

    if (nameInput) nameInput.value = userProfile.name || '';
    if (emailInput) emailInput.value = userProfile.email || '';
    if (bioInput) bioInput.value = userProfile.bio || '';
    if (goalInput) goalInput.value = userProfile.dailyGoal || 5;

    // Обновляем отображение
    const usernameDisplay = document.getElementById('username-display');
    const userEmail = document.getElementById('user-email');
    const joinDate = document.getElementById('join-date');
    const userLevel = document.getElementById('user-level');

    if (usernameDisplay) usernameDisplay.textContent = userProfile.name || 'Lietotājs';
    if (userEmail) userEmail.textContent = userProfile.email || 'e-pasts nav iestatīts';
    if (joinDate) joinDate.textContent = userProfile.joinDate ? formatDate(userProfile.joinDate) : '-';
    if (userLevel) userLevel.textContent = userProfile.level || 1;

    // Обновляем аватар
    updateAvatar();
}

function saveProfile() {
    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const bioInput = document.getElementById('profile-bio');
    const goalInput = document.getElementById('profile-goal');

    userProfile.name = nameInput.value.trim();
    userProfile.email = emailInput.value.trim();
    userProfile.bio = bioInput.value.trim();
    userProfile.dailyGoal = parseInt(goalInput.value) || 5;

    // Если это первый раз, устанавливаем дату регистрации
    if (!userProfile.joinDate) {
        userProfile.joinDate = new Date().toISOString().split('T')[0];
    }

    // Обновляем уровень
    updateUserLevel();

    saveUserProfile();
    loadUserProfile();

    showNotification('Profils saglabāts veiksmīgi', 'success');
}

function updateUserLevel() {
    const completedTasks = tasks.filter(task => task.completed).length;
    userProfile.level = Math.min(Math.floor(completedTasks / 10) + 1, 10);
}

function initProfileForm() {
    const bioInput = document.getElementById('profile-bio');
    if (bioInput) {
        bioInput.addEventListener('input', function() {
            updateCharCounter('bio-counter', this.value.length, 500);
        });
    }
}

function initProfileSettings() {
    // Загружаем настройки уведомлений
    const notificationsToggle = document.getElementById('notifications-toggle');
    const weeklyReportToggle = document.getElementById('weekly-report-toggle');
    const publicProfileToggle = document.getElementById('public-profile-toggle');

    if (notificationsToggle) notificationsToggle.checked = userProfile.notifications !== false;
    if (weeklyReportToggle) weeklyReportToggle.checked = userProfile.weeklyReports === true;
    if (publicProfileToggle) publicProfileToggle.checked = userProfile.publicProfile === true;

    // Сохраняем изменения
    [notificationsToggle, weeklyReportToggle, publicProfileToggle].forEach(toggle => {
        if (toggle) {
            toggle.addEventListener('change', function() {
                userProfile.notifications = document.getElementById('notifications-toggle').checked;
                userProfile.weeklyReports = document.getElementById('weekly-report-toggle').checked;
                userProfile.publicProfile = document.getElementById('public-profile-toggle').checked;
                saveUserProfile();
            });
        }
    });
}

function changeAvatar() {
    const avatars = ['fa-user', 'fa-user-astronaut', 'fa-user-ninja', 'fa-user-tie', 'fa-user-graduate'];
    const currentAvatar = userProfile.avatar || 'fa-user';
    const currentIndex = avatars.indexOf(currentAvatar);
    const nextIndex = (currentIndex + 1) % avatars.length;

    userProfile.avatar = avatars[nextIndex];
    saveUserProfile();
    updateAvatar();

    showNotification('Profila bilde mainīta', 'success');
}

function updateAvatar() {
    const avatarElement = document.getElementById('user-avatar');
    if (avatarElement) {
        const icon = userProfile.avatar || 'fa-user';
        avatarElement.innerHTML = `<i class="fas ${icon}"></i>`;
    }
}

function changePassword() {
    const newPassword = prompt('Ievadi jauno paroli (minimāli 6 simboli):');
    if (newPassword && newPassword.length >= 6) {
        userProfile.password = newPassword; // В реальном приложении здесь было бы хэширование
        saveUserProfile();
        showNotification('Parole veiksmīgi mainīta', 'success');
    } else if (newPassword !== null) {
        showNotification('Parolei jābūt vismaz 6 simbolus garai', 'error');
    }
}

function logoutAllDevices() {
    if (confirmAction('Vai tiešām vēlies izrakstīties no visām ierīcēm?')) {
        // В реальном приложении здесь было бы очищение токенов
        showNotification('Veiksmīgi izrakstījies no visām ierīcēm', 'success');
    }
}

function exportUserData() {
    const userData = {
        profile: userProfile,
        tasks: tasks,
        statistics: statistics,
        settings: appSettings,
        exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(userData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `focusup_userdata_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    showNotification('Lietotāja dati eksportēti veiksmīgi', 'success');
}

function resetAccountData() {
    if (!confirmAction('VAI ESAT PARLIEČINĀTS? Šī darbība dzēsīs VISUS jūsu uzdevumus, statistiku un iestatījumus. Šo darbību NEVAR atcelt!')) return;

    // Сбрасываем все данные
    tasks = [];
    statistics = getDefaultStats();
    userProfile = getDefaultProfile();
    appSettings = getDefaultSettings();

    // Сохраняем
    saveAllData();

    // Обновляем интерфейс
    if (window.location.pathname.includes('tasks.html')) {
        renderTasks();
        updateTaskCounters();
    }

    loadUserProfile();

    showNotification('Visi dati atiestatīti veiksmīgi', 'success');
}

function deleteAccount() {
    if (!confirmAction('VAI ESAT ABSOLŪTI PARLIEČINĀTS? Šī darbība IZDZĒSĪS VISU JŪSU KONTU UN VISUS DATUS. Šo darbību NEVAR atcelt!')) return;

    // Очищаем все данные
    localStorage.removeItem('focusup_tasks');
    localStorage.removeItem('focusup_profile');
    localStorage.removeItem('focusup_stats');
    localStorage.removeItem('focusup_settings');
    localStorage.removeItem('theme');

    // Перенаправляем на главную страницу
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);

    showNotification('Konts veiksmīgi izdzēsts. Pāradresē uz sākumlapu...', 'success');
}

// ===== СТРАНИЦА НАСТРОЕК =====
function loadSettingsPage() {
    loadAppSettings();
    initColorPicker();
    initSettingsListeners();
}

function loadAppSettings() {
    // Загружаем настройки темы
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const animationsToggle = document.getElementById('animations');
    const fontSizeSelect = document.getElementById('font-size');
    const startPageSelect = document.getElementById('start-page');

    if (darkModeToggle) darkModeToggle.checked = currentTheme === 'dark';
    if (animationsToggle) animationsToggle.checked = appSettings.animations !== false;
    if (fontSizeSelect) fontSizeSelect.value = appSettings.fontSize || 'medium';
    if (startPageSelect) startPageSelect.value = appSettings.startPage || 'tasks';

    // Загружаем настройки уведомлений
    const taskReminders = document.getElementById('task-reminders');
    const dailySummary = document.getElementById('daily-summary');
    const notificationSound = document.getElementById('notification-sound');
    const autoBackup = document.getElementById('auto-backup');
    const autoSave = document.getElementById('auto-save');

    if (taskReminders) taskReminders.checked = appSettings.taskReminders !== false;
    if (dailySummary) dailySummary.checked = appSettings.dailySummary === true;
    if (notificationSound) notificationSound.checked = appSettings.notificationSound !== false;
    if (autoBackup) autoBackup.checked = appSettings.autoBackup === true;
    if (autoSave) autoSave.checked = appSettings.autoSave !== false;

    // Обновляем информацию о версии
    const appVersion = document.getElementById('app-version');
    if (appVersion) appVersion.textContent = appSettings.version || '1.0.0';
}

function initColorPicker() {
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Убираем активный класс у всех
            colorOptions.forEach(opt => opt.classList.remove('active'));
            // Добавляем активный класс текущему
            this.classList.add('active');

            // Меняем основной цвет
            const newColor = this.getAttribute('data-color');
            changePrimaryColor(newColor);
        });
    });
}

function changePrimaryColor(color) {
    document.documentElement.style.setProperty('--primary-color', color);

    // Вычисляем более темный оттенок
    const darkColor = shadeColor(color, -30);
    document.documentElement.style.setProperty('--primary-dark', darkColor);

    // Сохраняем настройку
    appSettings.primaryColor = color;
    saveAppSettings();
}

function shadeColor(color, percent) {
    let R = parseInt(color.substring(1,3),16);
    let G = parseInt(color.substring(3,5),16);
    let B = parseInt(color.substring(5,7),16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R<255)?R:255;  
    G = (G<255)?G:255;  
    B = (B<255)?B:255;  

    const RR = ((R.toString(16).length===1)?"0"+R.toString(16):R.toString(16));
    const GG = ((G.toString(16).length===1)?"0"+G.toString(16):G.toString(16));
    const BB = ((B.toString(16).length===1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
}

function initSettingsListeners() {
    // Слушатели для переключателей
    const toggles = [
        'dark-mode-toggle',
        'animations',
        'task-reminders',
        'daily-summary',
        'notification-sound',
        'auto-backup',
        'auto-save'
    ];

    toggles.forEach(toggleId => {
        const toggle = document.getElementById(toggleId);
        if (toggle) {
            toggle.addEventListener('change', function() {
                updateSetting(toggleId, this.checked);
            });
        }
    });

    // Слушатели для селектов
    const selects = ['font-size', 'start-page'];
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.addEventListener('change', function() {
                updateSetting(selectId, this.value);
            });
        }
    });
}

function updateSetting(settingId, value) {
    switch(settingId) {
        case 'dark-mode-toggle':
            setTheme(value ? 'dark' : 'light');
            break;
        case 'font-size':
            document.documentElement.style.fontSize = 
                value === 'small' ? '14px' : 
                value === 'large' ? '18px' : '16px';
            appSettings.fontSize = value;
            break;
        case 'animations':
            appSettings.animations = value;
            break;
        case 'task-reminders':
            appSettings.taskReminders = value;
            break;
        case 'daily-summary':
            appSettings.dailySummary = value;
            break;
        case 'notification-sound':
            appSettings.notificationSound = value;
            break;
        case 'auto-backup':
            appSettings.autoBackup = value;
            break;
        case 'auto-save':
            appSettings.autoSave = value;
            break;
        case 'start-page':
            appSettings.startPage = value;
            break;
    }

    saveAppSettings();
}

function exportAllData() {
    const allData = {
        tasks: tasks,
        profile: userProfile,
        statistics: statistics,
        settings: appSettings,
        theme: currentTheme,
        exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(allData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `focusup_alldata_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    showNotification('Visi dati eksportēti veiksmīgi', 'success');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = function(event) {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);

                if (importedData.tasks) {
                    tasks = importedData.tasks;
                    saveTasks();
                }

                if (importedData.profile) {
                    userProfile = { ...userProfile, ...importedData.profile };
                    saveUserProfile();
                }

                if (importedData.settings) {
                    appSettings = { ...appSettings, ...importedData.settings };
                    saveAppSettings();
                }

                if (importedData.theme) {
                    setTheme(importedData.theme);
                }

                // Обновляем интерфейс
                loadPageData();

                showNotification('Dati importēti veiksmīgi', 'success');
            } catch (error) {
                showNotification('Neizdevās ielādēt failu', 'error');
            }
        };

        reader.readAsText(file);
    };

    input.click();
}

function resetToDefaults() {
    if (!confirmAction('Vai tiešām vēlies atjaunot visus iestatījumus uz noklusējumiem?')) return;

    appSettings = getDefaultSettings();
    saveAppSettings();
    loadAppSettings();

    // Сбрасываем тему
    setTheme('light');

    showNotification('Iestatījumi atjaunoti uz noklusējumiem', 'success');
}

function clearAllData() {
    if (!confirmAction('VAI ESAT PARLIEČINĀTS? Šī darbība dzēsīs VISUS jūsu datus, ieskaitot uzdevumus, profilu un iestatījumus!')) return;

    // Очищаем все данные
    localStorage.clear();

    // Перезагружаем страницу
    setTimeout(() => {
        window.location.reload();
    }, 2000);

    showNotification('Visi dati dzēsti. Lapa tiks pārlādēta...', 'success');
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function getDefaultProfile() {
    return {
        name: '',
        email: '',
        bio: '',
        avatar: 'fa-user',
        dailyGoal: 5,
        level: 1,
        joinDate: new Date().toISOString().split('T')[0],
        notifications: true,
        weeklyReports: false,
        publicProfile: false
    };
}

function getDefaultSettings() {
    return {
        version: '1.0.0',
        primaryColor: '#009B77',
        fontSize: 'medium',
        animations: true,
        taskReminders: true,
        dailySummary: false,
        notificationSound: true,
        autoBackup: true,
        autoSave: true,
        startPage: 'tasks'
    };
}

function getDefaultStats() {
    return {
        totalTasks: 0,
        completedTasks: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageCompletionTime: 0,
        productivityScore: 0
    };
}

function saveTasks() {
    localStorage.setItem('focusup_tasks', JSON.stringify(tasks));
}

function saveUserProfile() {
    localStorage.setItem('focusup_profile', JSON.stringify(userProfile));
}

function saveStatistics() {
    statistics = {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(task => task.completed).length,
        currentStreak: calculateCurrentStreak(),
        longestStreak: Math.max(calculateCurrentStreak(), statistics.longestStreak || 0),
        averageCompletionTime: calculateAverageCompletionTime(),
        productivityScore: calculateProductivityScore()
    };

    localStorage.setItem('focusup_stats', JSON.stringify(statistics));
}

function saveAppSettings() {
    localStorage.setItem('focusup_settings', JSON.stringify(appSettings));
}

function saveAllData() {
    saveTasks();
    saveUserProfile();
    saveStatistics();
    saveAppSettings();
}

function initCharCounters() {
    // Счетчики символов для текстовых полей
    const textInputs = document.querySelectorAll('input[type="text"], textarea');
    textInputs.forEach(input => {
        if (input.maxLength > 0) {
            input.addEventListener('input', function() {
                const counterId = this.id + '-counter';
                const counter = document.getElementById(counterId);
                if (counter) {
                    updateCharCounter(counterId, this.value.length, this.maxLength);
                }
            });
        }
    });
}

function updateCharCounter(counterId, currentLength, maxLength) {
    const counter = document.getElementById(counterId);
    if (counter) {
        counter.textContent = `${currentLength}/${maxLength}`;

        // Меняем цвет при приближении к лимиту
        if (currentLength > maxLength * 0.9) {
            counter.style.color = 'var(--danger-color)';
        } else if (currentLength > maxLength * 0.75) {
            counter.style.color = 'var(--warning-color)';
        } else {
            counter.style.color = 'var(--text-secondary)';
        }
    }
}

function initDateInputs() {
    // Устанавливаем минимальную дату - сегодня
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const today = new Date().toISOString().split('T')[0];

    dateInputs.forEach(input => {
        input.min = today;

        // Устанавливаем значение по умолчанию - завтра
        if (!input.value) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            input.value = tomorrow.toISOString().split('T')[0];
        }
    });
}

function formatDate(dateString) {
    if (!dateString) return '-';

    const date = new Date(dateString);
    return date.toLocaleDateString('lv-LV', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function getPriorityText(priority) {
    const texts = {
        'low': 'Zema',
        'medium': 'Vidēja',
        'high': 'Augsta'
    };
    return texts[priority] || priority;
}

function getCategoryText(category) {
    const texts = {
        'work': 'Darbs',
        'study': 'Mācības',
        'personal': 'Personīgi',
        'other': 'Cits'
    };
    return texts[category] || category;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function animateElements() {
    // Анимация появления элементов при загрузке
    const animatedElements = document.querySelectorAll('.hero, .feature-card, .action-card, .demo-card');
    animatedElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';

        setTimeout(() => {
            element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// ===== ГЛОБАЛЬНО ДОСТУПНЫЕ ФУНКЦИИ =====
window.toggleDemoTask = toggleDemoTask;
window.resetDemoTasks = resetDemoTasks;
window.animateDemoProgress = animateDemoProgress;
window.addNewTask = addNewTask;
window.toggleTaskCompletion = toggleTaskCompletion;
window.editTask = editTask;
window.deleteTask = deleteTask;
window.changeFilter = changeFilter;
window.markAllAsCompleted = markAllAsCompleted;
window.deleteCompletedTasks = deleteCompletedTasks;
window.exportTasks = exportTasks;
window.importTasks = importTasks;
window.updateChart = function() {
    // Генерируем случайные значения для демонстрации
    const bars = document.querySelectorAll('.chart-bar[data-value]');
    bars.forEach(bar => {
        const newValue = Math.floor(Math.random() * 50) + 50;
        bar.setAttribute('data-value', newValue);
        const fill = bar.querySelector('.bar-fill');
        if (fill) {
            fill.style.height = newValue + '%';
        }
    });
    showNotification('Diagramma atjaunināta', 'success');
};
window.exportStatistics = exportStatistics;
window.resetStatistics = resetStatistics;
window.refreshStatistics = refreshStatistics;
window.changeAvatar = changeAvatar;
window.saveProfile = saveProfile;
window.changePassword = changePassword;
window.logoutAllDevices = logoutAllDevices;
window.exportUserData = exportUserData;
window.resetAccountData = resetAccountData;
window.deleteAccount = deleteAccount;
window.exportAllData = exportAllData;
window.importData = importData;
window.resetToDefaults = resetToDefaults;
window.clearAllData = clearAllData;