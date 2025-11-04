// auth.js

// --- UTILITY FUNCTION for displaying alerts ---
function showAlert(elementId, message, type) {
    const alertContainer = document.getElementById(elementId);
    if (alertContainer) {
        // Clear previous alerts
        alertContainer.innerHTML = '';
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`; // e.g., 'alert-error', 'alert-success'
        alertDiv.textContent = message;
        alertContainer.appendChild(alertDiv);
        
        // Optional: auto-hide the alert after a few seconds
        setTimeout(() => {
            if (alertDiv) {
                alertDiv.style.opacity = '0';
                setTimeout(() => alertDiv.remove(), 500);
            }
        }, 4000);
    } else {
        console.warn(`Alert container with id '${elementId}' not found.`);
    }
}


// --- FIREBASE AUTH LISTENER ---
// This runs on every page that includes this script.
// It checks the user's login status and updates the UI accordingly.
auth.onAuthStateChanged(async (user) => {
    const userDependentElements = document.querySelectorAll('.user-dependent');
    const guestDependentElements = document.querySelectorAll('.guest-dependent');
    const userAvatarElements = document.querySelectorAll('.user-avatar');
    
    if (user) {
        // User is signed in.
        // Hide elements meant for guests (e.g., Login/Sign Up buttons)
        guestDependentElements.forEach(el => el.style.display = 'none');
        // Show elements for logged-in users (e.g., Dashboard link, user menu)
        userDependentElements.forEach(el => el.style.display = 'flex');

        try {
            // Fetch the user's data from the Firestore 'users' collection
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                // Update all avatar images on the page with the user's photoURL
                userAvatarElements.forEach(avatar => {
                    if (userData.photoURL) {
                        avatar.src = userData.photoURL;
                    } else {
                        // Use a default avatar if no photoURL is set
                        avatar.src = 'default-avatar.png';
                    }
                });
            } else {
                 console.log("User document not found in Firestore.");
                 // Fallback for avatars if Firestore doc is missing
                 userAvatarElements.forEach(avatar => avatar.src = 'default-avatar.png');
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }

    } else {
        // User is signed out.
        // Show guest elements
        guestDependentElements.forEach(el => el.style.display = 'flex');
        // Hide user-specific elements
        userDependentElements.forEach(el => el.style.display = 'none');
    }
});


// --- GLOBAL EVENT LISTENERS (run once the DOM is loaded) ---
document.addEventListener('DOMContentLoaded', () => {
    
    // Logic for toggling the user dropdown menu
    document.body.addEventListener('click', (e) => {
        const userMenu = e.target.closest('.user-menu');
        if (userMenu) {
            // If the click is inside a .user-menu, toggle its dropdown
            const dropdown = userMenu.querySelector('.dropdown');
            if (dropdown) {
                dropdown.classList.toggle('active');
            }
        } else {
            // If the click is anywhere else, close all active dropdowns
            document.querySelectorAll('.dropdown.active').forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
    });

    // Logout Button functionality
    // Using event delegation on the body to catch clicks on any logout button
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('.logoutBtn')) {
            e.preventDefault();
            auth.signOut().then(() => {
                console.log('User signed out successfully.');
                // Redirect to the homepage after sign-out
                window.location.href = 'index.html';
            }).catch(error => {
                console.error('Sign out error:', error);
            });
        }
    });
});
