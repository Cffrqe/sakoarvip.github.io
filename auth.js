// auth.js

// --- UTILITY FUNCTIONS ---
function showAlert(elementId, message, type) {
    const alertDiv = document.getElementById(elementId);
    if (alertDiv) {
        alertDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
        setTimeout(() => alertDiv.innerHTML = '', 4000);
    }
}

// --- FIREBASE AUTH LISTENER ---
// This runs on every page, checks login status, and updates the UI.
auth.onAuthStateChanged(async (user) => {
    const userDependentElements = document.querySelectorAll('.user-dependent');
    const guestDependentElements = document.querySelectorAll('.guest-dependent');
    const userAvatarElements = document.querySelectorAll('.user-avatar');
    
    if (user) {
        // User is signed in.
        guestDependentElements.forEach(el => el.style.display = 'none');
        userDependentElements.forEach(el => el.style.display = 'flex');

        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            userAvatarElements.forEach(avatar => {
                if(userData.photoURL) {
                    avatar.src = userData.photoURL;
                } else {
                    avatar.src = 'default-avatar.png'; // Make sure you have a default avatar image
                }
            });
        }
    } else {
        // User is signed out.
        guestDependentElements.forEach(el => el.style.display = 'flex');
        userDependentElements.forEach(el => el.style.display = 'none');
    }
});


// --- GLOBAL EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    // Dropdown toggle
    document.body.addEventListener('click', (e) => {
        const userMenu = e.target.closest('.user-menu');
        if (userMenu) {
            userMenu.querySelector('.dropdown')?.classList.toggle('active');
        } else {
            document.querySelectorAll('.dropdown.active').forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
    });

    // Logout Button
    document.querySelectorAll('.logoutBtn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            auth.signOut().then(() => {
                window.location.href = 'index.html';
            });
        });
    });
});
