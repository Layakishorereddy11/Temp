// Initialize key variables
let currentUser = null;
let userStats = null;
let userApplications = [];
let friends = [];
let leaderboardData = [];
let applicationsChart = null;
let chartRange = 14; // Default chart range (14 days)

// DOM elements
const dashboardContainer = document.getElementById('dashboard-container');
const onboardingContainer = document.getElementById('onboarding-container');
const loadingSpinner = document.getElementById('loading-spinner');
const errorToast = document.getElementById('error-toast');
const errorMessage = document.getElementById('error-message');

// Chart data
let chartData = {
    labels: [],
    datasets: [{
        label: 'Applications',
        data: [],
        backgroundColor: 'rgba(0, 102, 255, 0.2)',
        borderColor: 'rgba(0, 102, 255, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#FFF',
        pointBorderColor: 'rgba(0, 102, 255, 1)',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
    }]
};

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Firebase Auth
    initFirebaseAuth();
    
    // Add event listeners
    setupEventListeners();
});

/**
 * Initialize Firebase Auth and set up auth state observer
 */
function initFirebaseAuth() {
    // Set up the Firebase auth state observer
    firebase.auth().onAuthStateChanged(handleAuthStateChanged);
}

/**
 * Handle changes in authentication state
 * @param {Object} user - Firebase user object
 */
function handleAuthStateChanged(user) {
    if (user) {
        // User is signed in
        currentUser = user;
        hideLoadingSpinner();
        
        // Check if user has data in Firestore
        checkUserData(user.uid).then(hasData => {
            if (hasData) {
                // User has data, show dashboard
                hideOnboarding();
                showDashboard();
                loadDashboardData();
            } else {
                // New user, show onboarding
                hideDashboard();
                showOnboarding();
            }
        }).catch(error => {
            showError(`Error checking user data: ${error.message}`);
        });
    } else {
        // User is signed out
        currentUser = null;
        userStats = null;
        
        // Show onboarding for authentication
        hideDashboard();
        showOnboarding();
        hideLoadingSpinner();
    }
}

/**
 * Check if user has data in Firestore
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Whether user has data
 */
async function checkUserData(userId) {
    try {
        const db = firebase.firestore();
        const userDoc = await db.collection('users').doc(userId).get();
        return userDoc.exists;
    } catch (error) {
        console.error('Error checking user data:', error);
        return false;
    }
}

/**
 * Load all dashboard data from Firestore
 */
async function loadDashboardData() {
    try {
        if (!currentUser) return;
        
        showLoadingState();
        
        // Load user stats
        await loadUserStats();
        
        // Load applications
        await loadApplications();
        
        // Load friends
        await loadFriends();
        
        // Load leaderboard
        await loadLeaderboard();
        
        // Update UI
        updateDashboardUI();
        
        hideLoadingState();
    } catch (error) {
        hideLoadingState();
        showError(`Error loading dashboard data: ${error.message}`);
    }
}

/**
 * Load user statistics from Firestore
 */
async function loadUserStats() {
    try {
        const db = firebase.firestore();
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        
        if (userDoc.exists) {
            userStats = userDoc.data();
            
            // Update sidebar user info
            document.getElementById('sidebar-user-name').textContent = userStats.displayName || currentUser.displayName || 'User';
            document.getElementById('sidebar-user-email').textContent = currentUser.email || '';
            
            // Set avatar if available
            if (currentUser.photoURL) {
                document.getElementById('sidebar-user-avatar').src = currentUser.photoURL;
            }
            
            // Update stats cards
            updateStatsCards();
        } else {
            showError('User data not found');
        }
    } catch (error) {
        console.error('Error loading user stats:', error);
        throw error;
    }
}

/**
 * Load user applications from Firestore
 */
async function loadApplications() {
    try {
        const db = firebase.firestore();
        const applicationsSnapshot = await db.collection('users')
            .doc(currentUser.uid)
            .collection('applications')
            .orderBy('timestamp', 'desc')
            .limit(50) // Increased limit to have more data for different chart ranges
            .get();
        
        userApplications = [];
        applicationsSnapshot.forEach(doc => {
            const application = doc.data();
            application.id = doc.id;
            userApplications.push(application);
        });
        
        // Update recent applications display
        updateRecentApplications();
        
        // Prepare data for charts
        prepareChartData(chartRange);
    } catch (error) {
        console.error('Error loading applications:', error);
        throw error;
    }
}

/**
 * Load user's friends from Firestore
 */
async function loadFriends() {
    try {
        const db = firebase.firestore();
        // Get user's friends list
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        const userData = userDoc.data();
        
        if (!userData.friends || userData.friends.length === 0) {
            // No friends yet
            friends = [];
            updateFriendsUI();
            return;
        }
        
        // Fetch friend data
        const friendPromises = userData.friends.map(async friendId => {
            const friendDoc = await db.collection('users').doc(friendId).get();
            if (friendDoc.exists) {
                const friendData = friendDoc.data();
                return {
                    id: friendId,
                    name: friendData.displayName,
                    email: friendData.email,
                    photoURL: friendData.photoURL,
                    streak: friendData.streak || 0
                };
            }
            return null;
        });
        
        friends = (await Promise.all(friendPromises)).filter(friend => friend !== null);
        
        // Sort friends by streak
        friends.sort((a, b) => b.streak - a.streak);
        
        // Update UI
        updateFriendsUI();
    } catch (error) {
        console.error('Error loading friends:', error);
        throw error;
    }
}

/**
 * Load leaderboard data from Firestore
 */
async function loadLeaderboard() {
    try {
        const db = firebase.firestore();
        // Get top users by streak
        const leaderboardSnapshot = await db.collection('users')
            .orderBy('streak', 'desc')
            .limit(10)
            .get();
        
        leaderboardData = [];
        leaderboardSnapshot.forEach(doc => {
            const userData = doc.data();
            leaderboardData.push({
                id: doc.id,
                name: userData.displayName,
                photoURL: userData.photoURL,
                streak: userData.streak || 0
            });
        });
        
        // Update leaderboard UI
        updateLeaderboardUI();
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        throw error;
    }
}

/**
 * Update the stats cards with user statistics
 */
function updateStatsCards() {
    if (!userStats) return;
    
    // Today's applications count
    const todayCount = userStats.todayCount || 0;
    document.getElementById('today-count').textContent = todayCount;
    
    // Update progress bar for today's goal
    const todayProgress = document.getElementById('today-progress');
    const progressPercentage = Math.min(100, (todayCount / 20) * 100);
    todayProgress.style.width = `${progressPercentage}%`;
    
    // Add color based on progress
    if (progressPercentage >= 100) {
        todayProgress.style.backgroundColor = '#37C667'; // Success color
    } else if (progressPercentage >= 50) {
        todayProgress.style.backgroundColor = '#FF9500'; // Warning color
    } else {
        todayProgress.style.backgroundColor = '#0066FF'; // Primary color
    }
    
    // Current streak
    const streak = userStats.streak || 0;
    document.getElementById('streak-count').textContent = streak;
    
    // Total applications
    const totalApplications = userStats.totalApplications || 0;
    document.getElementById('total-count').textContent = totalApplications;
    
    // Add animation to numbers
    animateCounter('today-count', todayCount);
    animateCounter('streak-count', streak);
    animateCounter('total-count', totalApplications);
}

/**
 * Animate counter from 0 to target value
 * @param {string} elementId - Element ID to animate
 * @param {number} targetValue - Target value to animate to
 */
function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    const duration = 1000; // 1 second
    const startTime = performance.now();
    const startValue = 0;
    
    function updateValue(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuad = progress => 1 - (1 - progress) * (1 - progress);
        const easedProgress = easeOutQuad(progress);
        
        const currentValue = Math.floor(startValue + (targetValue - startValue) * easedProgress);
        element.textContent = currentValue;
        
        if (progress < 1) {
            requestAnimationFrame(updateValue);
        }
    }
    
    requestAnimationFrame(updateValue);
}

/**
 * Update the recent applications display
 */
function updateRecentApplications() {
    const container = document.getElementById('recent-apps-container');
    container.innerHTML = '';
    
    if (userApplications.length === 0) {
        container.innerHTML = '<div class="no-data">No recent applications found</div>';
        return;
    }
    
    userApplications.slice(0, 6).forEach(app => {
        const date = new Date(app.timestamp.seconds * 1000);
        const formattedDate = date.toLocaleDateString();
        
        const appElement = document.createElement('div');
        appElement.className = 'app-item';
        appElement.innerHTML = `
            <div class="app-title">${app.title || 'Untitled Job'}</div>
            <div class="app-url">${app.url || 'No URL'}</div>
            <div class="app-date">${formattedDate}</div>
        `;
        
        container.appendChild(appElement);
    });
}

/**
 * Update the friends list in the sidebar
 */
function updateFriendsUI() {
    const container = document.getElementById('friends-container');
    container.innerHTML = '';
    
    if (friends.length === 0) {
        container.innerHTML = `
            <div class="friend-item">
                <div class="friend-avatar"></div>
                <div class="friend-name">No friends yet</div>
            </div>
        `;
        return;
    }
    
    friends.forEach(friend => {
        const friendElement = document.createElement('div');
        friendElement.className = 'friend-item';
        friendElement.dataset.id = friend.id;
        friendElement.innerHTML = `
            <div class="friend-avatar" style="background-image: url('${friend.photoURL || 'images/avatar-placeholder.png'}')"></div>
            <div class="friend-name">${friend.name}</div>
            <div class="friend-streak">${friend.streak}🔥</div>
        `;
        
        friendElement.addEventListener('click', () => {
            showFriendProfile(friend);
        });
        
        container.appendChild(friendElement);
    });
}

/**
 * Update the leaderboard display
 */
function updateLeaderboardUI() {
    const container = document.getElementById('leaderboard-container');
    container.innerHTML = '';
    
    if (leaderboardData.length === 0) {
        container.innerHTML = '<div class="no-data">No leaderboard data available</div>';
        return;
    }
    
    leaderboardData.forEach((user, index) => {
        const userElement = document.createElement('div');
        userElement.className = 'leaderboard-item';
        userElement.innerHTML = `
            <div class="leaderboard-rank">${index + 1}</div>
            <div class="leaderboard-avatar" style="background-image: url('${user.photoURL || 'images/avatar-placeholder.png'}')"></div>
            <div class="leaderboard-name">${user.name}</div>
            <div class="leaderboard-streak">${user.streak}🔥</div>
        `;
        
        container.appendChild(userElement);
    });
}

/**
 * Show a friend's profile
 * @param {Object} friend - Friend data
 */
function showFriendProfile(friend) {
    // To be implemented
    console.log('Showing friend profile:', friend);
}

/**
 * Prepare data for the applications history chart
 * @param {number} days - Number of days to show in the chart
 */
function prepareChartData(days) {
    // Group applications by date
    const appsByDate = {};
    
    // Get the last X days
    const today = new Date();
    const dates = [];
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
        dates.push(dateString);
        appsByDate[dateString] = 0;
    }
    
    // Count applications for each date
    userApplications.forEach(app => {
        const date = new Date(app.timestamp.seconds * 1000);
        const dateString = date.toISOString().split('T')[0];
        
        if (appsByDate[dateString] !== undefined) {
            appsByDate[dateString]++;
        }
    });
    
    // Prepare chart data
    chartData.labels = dates.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    });
    
    chartData.datasets[0].data = dates.map(date => appsByDate[date]);
    
    // Render chart
    renderApplicationsChart();
}

/**
 * Render the applications history chart
 */
function renderApplicationsChart() {
    const chartCanvas = document.getElementById('applications-history-chart');
    
    if (applicationsChart) {
        applicationsChart.destroy();
    }
    
    const ctx = chartCanvas.getContext('2d');
    
    // Create gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(0, 102, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 102, 255, 0.0)');
    chartData.datasets[0].backgroundColor = gradient;
    
    applicationsChart = new Chart(chartCanvas, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        font: {
                            family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                            size: 11
                        },
                        color: '#6E6E73'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        font: {
                            family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                            size: 11
                        },
                        color: '#6E6E73'
                    },
                    grid: {
                        display: false,
                        drawBorder: false
                    }
                }
            },
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: '#FFF',
                    titleColor: '#1D1D1F',
                    bodyColor: '#6E6E73',
                    borderColor: '#E5E5E7',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    titleFont: {
                        family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                        size: 14,
                        weight: 600
                    },
                    bodyFont: {
                        family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y + ' applications';
                            }
                            return label;
                        }
                    }
                },
                legend: {
                    display: false
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            elements: {
                line: {
                    tension: 0.4
                }
            }
        }
    });
}

/**
 * Update the entire dashboard UI
 */
function updateDashboardUI() {
    updateStatsCards();
    updateRecentApplications();
    updateFriendsUI();
    updateLeaderboardUI();
    renderApplicationsChart();
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Refresh data button
    const refreshBtn = document.getElementById('refresh-data-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadDashboardData);
    }
    
    // Invite friend button
    const inviteBtn = document.getElementById('invite-friend-btn');
    if (inviteBtn) {
        inviteBtn.addEventListener('click', inviteFriend);
    }
    
    // Menu items
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all items
            menuItems.forEach(i => i.classList.remove('active'));
            // Add active class to clicked item
            item.classList.add('active');
            
            // Handle tab switching - to be implemented
            const tab = item.dataset.tab;
            console.log('Switching to tab:', tab);
        });
    });
    
    // Onboarding form navigation
    setupOnboardingForms();
    
    // Chart range options
    const chartOptions = document.querySelectorAll('.chart-option');
    if (chartOptions.length > 0) {
        chartOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove active class from all options
                chartOptions.forEach(opt => opt.classList.remove('active'));
                // Add active class to clicked option
                option.classList.add('active');
                
                // Get range value and update chart
                const range = option.dataset.range;
                if (range === 'all') {
                    // Show all applications (up to 50 from the query)
                    prepareChartData(50);
                } else {
                    chartRange = parseInt(range, 10);
                    prepareChartData(chartRange);
                }
            });
        });
    }
    
    // Add friend button
    const addFriendBtn = document.getElementById('add-friend-btn');
    if (addFriendBtn) {
        addFriendBtn.addEventListener('click', () => {
            // Reuse the invite friend functionality
            inviteFriend();
        });
    }
    
    // View all applications button
    const viewAllAppsBtn = document.getElementById('view-all-apps');
    if (viewAllAppsBtn) {
        viewAllAppsBtn.addEventListener('click', () => {
            // Find the applications menu item and click it
            const applicationsMenuItem = document.querySelector('.menu-item[data-tab="applications"]');
            if (applicationsMenuItem) {
                applicationsMenuItem.click();
            }
        });
    }
}

/**
 * Setup onboarding forms and navigation
 */
function setupOnboardingForms() {
    // Step navigation
    const step1Next = document.getElementById('step-1-next');
    const step2Prev = document.getElementById('step-2-prev');
    const step2Next = document.getElementById('step-2-next');
    
    if (step1Next) {
        step1Next.addEventListener('click', () => {
            showOnboardingStep(2);
        });
    }
    
    if (step2Prev) {
        step2Prev.addEventListener('click', () => {
            showOnboardingStep(1);
        });
    }
    
    if (step2Next) {
        step2Next.addEventListener('click', () => {
            showOnboardingStep(3);
        });
    }
    
    // Form switching
    const showLoginLink = document.getElementById('show-login');
    const showSignupLink = document.getElementById('show-signup');
    const signupForm = document.getElementById('onboarding-signup-form');
    const loginForm = document.getElementById('onboarding-login-form');
    
    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            signupForm.style.display = 'none';
            loginForm.style.display = 'block';
        });
    }
    
    if (showSignupLink) {
        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.style.display = 'none';
            signupForm.style.display = 'block';
        });
    }
    
    // Form submissions
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Google authentication
    const googleSignup = document.getElementById('google-signup');
    const googleSignin = document.getElementById('google-signin');
    
    if (googleSignup) {
        googleSignup.addEventListener('click', handleGoogleAuth);
    }
    
    if (googleSignin) {
        googleSignin.addEventListener('click', handleGoogleAuth);
    }
}

/**
 * Show a specific onboarding step
 * @param {number} stepNumber - Step number to show
 */
function showOnboardingStep(stepNumber) {
    const steps = document.querySelectorAll('.onboarding-step');
    steps.forEach(step => {
        step.classList.remove('active');
        if (parseInt(step.dataset.step) === stepNumber) {
            step.classList.add('active');
        }
    });
}

/**
 * Handle signup form submission
 * @param {Event} event - Form submit event
 */
async function handleSignup(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('signup-name');
    const emailInput = document.getElementById('signup-email');
    const passwordInput = document.getElementById('signup-password');
    
    if (!nameInput.value || !emailInput.value || !passwordInput.value) {
        showError('Please fill in all fields');
        return;
    }
    
    try {
        // Create user with email and password
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(
            emailInput.value,
            passwordInput.value
        );
        
        // Update profile
        await userCredential.user.updateProfile({
            displayName: nameInput.value
        });
        
        // Create initial user data
        await createUserData(userCredential.user.uid, {
            displayName: nameInput.value,
            email: emailInput.value,
            streak: 0,
            todayCount: 0,
            totalApplications: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Clear form
        nameInput.value = '';
        emailInput.value = '';
        passwordInput.value = '';
    } catch (error) {
        showError(`Signup error: ${error.message}`);
    }
}

/**
 * Handle login form submission
 * @param {Event} event - Form submit event
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    
    if (!emailInput.value || !passwordInput.value) {
        showError('Please fill in all fields');
        return;
    }
    
    try {
        // Sign in with email and password
        await firebase.auth().signInWithEmailAndPassword(
            emailInput.value,
            passwordInput.value
        );
        
        // Clear form
        emailInput.value = '';
        passwordInput.value = '';
    } catch (error) {
        showError(`Login error: ${error.message}`);
    }
}

/**
 * Handle Google authentication
 */
async function handleGoogleAuth() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await firebase.auth().signInWithPopup(provider);
        
        // Check if this is a new user
        const isNewUser = result.additionalUserInfo.isNewUser;
        
        if (isNewUser) {
            // Create initial user data
            await createUserData(result.user.uid, {
                displayName: result.user.displayName,
                email: result.user.email,
                photoURL: result.user.photoURL,
                streak: 0,
                todayCount: 0,
                totalApplications: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    } catch (error) {
        showError(`Google auth error: ${error.message}`);
    }
}

/**
 * Create initial user data in Firestore
 * @param {string} userId - User ID
 * @param {Object} userData - User data
 */
async function createUserData(userId, userData) {
    try {
        const db = firebase.firestore();
        await db.collection('users').doc(userId).set(userData);
    } catch (error) {
        console.error('Error creating user data:', error);
        throw error;
    }
}

/**
 * Invite a friend (to be implemented)
 */
function inviteFriend() {
    // TO DO: Implement friend invitation
    alert('Friend invitation feature coming soon!');
}

/**
 * Show the onboarding container
 */
function showOnboarding() {
    if (onboardingContainer) {
        onboardingContainer.style.display = 'flex';
    }
}

/**
 * Hide the onboarding container
 */
function hideOnboarding() {
    if (onboardingContainer) {
        onboardingContainer.style.display = 'none';
    }
}

/**
 * Show the dashboard container
 */
function showDashboard() {
    if (dashboardContainer) {
        dashboardContainer.style.display = 'flex';
    }
}

/**
 * Hide the dashboard container
 */
function hideDashboard() {
    if (dashboardContainer) {
        dashboardContainer.style.display = 'none';
    }
}

/**
 * Show the loading spinner
 */
function showLoadingSpinner() {
    if (loadingSpinner) {
        loadingSpinner.style.display = 'flex';
    }
}

/**
 * Hide the loading spinner
 */
function hideLoadingSpinner() {
    if (loadingSpinner) {
        loadingSpinner.style.display = 'none';
    }
}

/**
 * Show loading state for dashboard data
 */
function showLoadingState() {
    // To be implemented with more granular loading indicators
}

/**
 * Hide loading state for dashboard data
 */
function hideLoadingState() {
    // To be implemented with more granular loading indicators
}

/**
 * Show an error message toast
 * @param {string} msg - Error message to display
 */
function showError(msg) {
    if (errorToast && errorMessage) {
        errorMessage.textContent = msg;
        errorToast.classList.add('visible');
        
        // Hide after 3 seconds
        setTimeout(() => {
            errorToast.classList.remove('visible');
        }, 3000);
    } else {
        console.error(msg);
    }
} 