function generateRandomCode(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function formatDateForBackend(dateString) {
    // Convert YYYY-MM-DD to YYYYMMDD format + add time (assuming 10:00)
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}1000`; // Adding 1000 for 10:00 AM
}

function updateGeneratedCodes() {
    const role = document.getElementById('regCodeRole').value;
    const email = document.getElementById('regCodeEmail').value;
    const expiry = document.getElementById('regCodeExpiry').value;
    const count = parseInt(document.getElementById('regCodeCount').value) || 1;
    const submitBtn = document.getElementById('submitRegCodeBtn');
    if (count > 1) {
        document.getElementById('regCodeEmail').disabled = true;
        document.getElementById('regCodeEmail').value = '';
        document.getElementById('regCodeEmail').placeholder = 'Email not applicable for multiple codes';
    } else if (count === 1) {
        document.getElementById('regCodeEmail').disabled = false;
        document.getElementById('regCodeEmail').placeholder = 'Enter email (optional)';
    }
    if (!role || !expiry || count < 1) {
        submitBtn.disabled = true;
        document.getElementById('generatedCodePreview').innerHTML = '';
        return;
    }

    const preview = document.getElementById('generatedCodePreview');
    const hiddenInput = document.getElementById('registrationCodesInput');
    const registrationCodes = [];

    preview.innerHTML = '';

    for (let i = 0; i < count; i++) {
        const code = generateRandomCode();
        
        // Create the object structure you want
        const codeObject = {
            role: role,
            expiration_date: formatDateForBackend(expiry),
            code: code
        };

        // Add email if provided
        if (email && email.trim() !== '') {
            codeObject.email = email.trim();
        }

        registrationCodes.push(codeObject);

        // Display the code in preview
        const strong = document.createElement('strong');
        strong.classList.add('px-1');
        strong.textContent = code;
        preview.appendChild(strong);
    }

    // Store the array of objects in the hidden input
    hiddenInput.value = JSON.stringify(registrationCodes);
    submitBtn.disabled = false;
}

// Add event listeners
document.getElementById('regCodeRole').addEventListener('change', updateGeneratedCodes);
document.getElementById('regCodeEmail').addEventListener('input', updateGeneratedCodes);
document.getElementById('regCodeExpiry').addEventListener('change', updateGeneratedCodes);
document.getElementById('regCodeCount').addEventListener('input', updateGeneratedCodes);

// Reset form when modal is closed
document.getElementById('createNewRegCodeButtonModal').addEventListener('hidden.bs.modal', function () {
    document.getElementById('createRegistrationCodeForm').reset();
    document.getElementById('generatedCodePreview').innerHTML = '';
    document.getElementById('registrationCodesInput').value = '';
    document.getElementById('submitRegCodeBtn').disabled = true;
});

let selectedUserId = '';
let currentAction = '';

function openUserActionModal(button) {
    selectedUserId = button.dataset.userId;
    currentAction = button.dataset.action;
    const username = button.dataset.username;

    document.getElementById('userUIDDisplay').textContent = selectedUserId;
    document.getElementById('usernameDisplay').textContent = username;
    document.getElementById('confirmUsername').value = '';
    document.getElementById('punishmentReason').value = '';
    document.getElementById('punishmentDuration').value = '';
    document.getElementById('userActionType').textContent = currentAction.charAt(0).toUpperCase() + currentAction.slice(1);
    document.getElementById('confirmUserActionBtn').disabled = true;

    // Show/hide duration input only for 'suspend' or 'ban' actions
    const durationGroup = document.getElementById('punishmentDurationGroup');
    if (currentAction === 'suspend' || currentAction === 'ban') {
        durationGroup.style.display = 'block';
    } else {
        durationGroup.style.display = 'none';
    }

    const modal = new bootstrap.Modal(document.getElementById('manageUserModal'));
    modal.show();
}

// Enable the confirm button only when the correct UID is typed
document.getElementById('confirmUsername').addEventListener('input', function () {
    const expectedUsername = document.getElementById('usernameDisplay').textContent.trim();
    const typed = this.value.trim();
    document.getElementById('confirmUserActionBtn').disabled = typed !== expectedUsername;
});

// Handle confirm click
document.getElementById('confirmUserActionBtn').addEventListener('click', async function () {
    try {
        const reason = document.getElementById('punishmentReason').value.trim();
        let duration = null;
        if (currentAction === 'suspend' || currentAction === 'ban') {
            duration = parseInt(document.getElementById('punishmentDuration').value, 10);
            if (isNaN(duration) || duration <= 0) {
                alert('Please enter a valid duration in days.');
                return;
            }
        }

        const payload = {
            userId: selectedUserId,
            reason,
        };

        if (duration !== null) {
            payload.durationDays = duration;
        }

        const res = await fetch(`/superuser/users/${currentAction}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            location.reload();
        } else {
            alert(`Failed to ${currentAction} user.`);
        }
    } catch (err) {
        console.error(err);
        alert('An error occurred.');
    }
});
