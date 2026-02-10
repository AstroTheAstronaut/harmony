function updateSchedulePreview() {
    const name = document.getElementById('nameInput').value;
    const type = document.getElementById('typeSelect').value;
    const targetChurch = document.getElementById('targetChurchInput').value;
    const expiry = document.getElementById('expiryDateInput').value;
    
    const submitBtn = document.getElementById('submitScheduleBtn');

    const namePreview = document.getElementById('namePreview');
    const typePreview = document.getElementById('typePreview');
    const targetChurchPreview = document.getElementById('targetChurchPreview');

    const expiryDatePreview = document.getElementById('expiryDatePreview');

    namePreview.textContent = name || 'N/A';
    typePreview.textContent = type || 'N/A';
    targetChurchPreview.textContent = targetChurch || 'N/A';
    expiryDatePreview.textContent = expiry || 'N/A';
    submitBtn.disabled = false;
}

// Listeners
document.getElementById('nameInput').addEventListener('input', updateSchedulePreview);
document.getElementById('typeSelect').addEventListener('change', updateSchedulePreview);
document.getElementById('targetChurchInput').addEventListener('input', updateSchedulePreview);
document.getElementById('expiryDateInput').addEventListener('input', updateSchedulePreview);

// Initial call to set the preview on page load
updateSchedulePreview();

function resetScheduleForm() {
    document.getElementById('nameInput').value = '';
    document.getElementById('typeSelect').value = '';
    document.getElementById('targetChurchInput').value = '';
    document.getElementById('expiryDateInput').value = '';
    updateSchedulePreview();
}

// function pushRequest() {
//     const submitBtn = document.getElementById('submitScheduleBtn');
//     submitBtn.disabled = true;
    
//     payload = {
//         creator_uid : document.getElementById('creatorUidInput').value,
//         type : document.getElementById('typeSelect').value,
//         target_church : document.getElementById('targetChurchInput').value,
//         expiry_date : document.getElementById('expiryDateInput').value,
//         scheduleStatus : 'pending'
//     }

//     fetch('/schedules/create', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(payload)
//     }).then(response => {
//         if (response.ok) {
//             // Close modal and reset form
//             const createModal = bootstrap.Modal.getInstance(document.getElementById('createScheduleModal'));
//             createModal.hide();
//             resetScheduleForm();
//             // Optionally, refresh the page or update the schedule list dynamically
//             location.reload();
//         } else {
//             alert('Failed to create schedule. Please try again.');
//             submitBtn.disabled = false;
//         }
//     }).catch(error => {
//         console.error('Error creating schedule:', error);
//         alert('An error occurred. Please try again.');
//         submitBtn.disabled = false;
//     });
// }

function pushRequest() {
    const submitBtn = document.getElementById('submitScheduleBtn');
    submitBtn.disabled = true;
    
    // Validate that all required elements exist
    const nameInput = document.getElementById('nameInput');
    const creatorUid = document.getElementById('creatorUidInput');
    const typeSelect = document.getElementById('typeSelect');
    const targetChurch = document.getElementById('targetChurchInput');
    const expiryDate = document.getElementById('expiryDateInput');
    
    if (!creatorUid || !typeSelect || !targetChurch || !expiryDate) {
        console.error('One or more form elements not found');
        alert('Form elements missing. Please refresh the page.');
        submitBtn.disabled = false;
        return;
    }
    
    const payload = {
        name: nameInput.value,
        creator_uid: creatorUid.value,
        type: typeSelect.value,
        target_church: targetChurch.value,
        expiry_date: expiryDate.value,
        scheduleStatus: 'pending'
    };
    
    console.log('Sending payload:', payload); // For debugging

    fetch('/schedules/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    }).then(response => {
        console.log('Response status:', response.status);
        if (response.ok) {
            const createModal = bootstrap.Modal.getInstance(document.getElementById('newScheduleModal'));
            if (createModal) {
                createModal.hide();
            }
            resetScheduleForm();
            location.reload();
        } else {
            return response.text().then(text => {
                throw new Error(text || 'Failed to create schedule');
            });
        }
    }).catch(error => {
        console.error('Error creating schedule:', error);
        alert('Error: ' + error.message);
        submitBtn.disabled = false;
    });
}