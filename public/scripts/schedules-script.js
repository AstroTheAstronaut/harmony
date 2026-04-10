// function updateSchedulePreview() {
//     const name = document.getElementById('nameInput').value;
//     const type = document.getElementById('typeSelect').value;
//     const targetChurch = document.getElementById('targetChurchInput').value;
//     const expiry = document.getElementById('expiryDateInput').value;
//     const visibility = document.getElementById('visibilitySelect').value;
//     const description = document.getElementById('descriptionInput').value;
//     const biblePassage = document.getElementById('biblePassageInput').value;
//     
//     const submitBtn = document.getElementById('submitScheduleBtn');
//
//     const namePreview = document.getElementById('namePreview');
//     const typePreview = document.getElementById('typePreview');
//     const targetChurchPreview = document.getElementById('targetChurchPreview');
//     const expiryDatePreview = document.getElementById('expiryDatePreview');
//     const visibilityPreview = document.getElementById('visibilityPreview');
//
//     namePreview.textContent = name || 'N/A';
//     typePreview.textContent = type || 'N/A';
//     targetChurchPreview.textContent = targetChurch || 'N/A';
//     expiryDatePreview.textContent = expiry || 'N/A';
//     // Assuming visibility is either 'public' or 'private', we can format it nicely
//     if (visibility === 'public') {
//         visibilityPreview.textContent = 'Public';
//     } else if (visibility === 'private') {
//         visibilityPreview.textContent = 'Private';
//     } else {
//         visibilityPreview.textContent = 'N/A';
//     }
//     submitBtn.disabled = false;
// }

// // Listeners for preview (disabled)
// document.getElementById('nameInput').addEventListener('input', updateSchedulePreview);
// document.getElementById('typeSelect').addEventListener('change', updateSchedulePreview);
// document.getElementById('targetChurchInput').addEventListener('input', updateSchedulePreview);
// document.getElementById('expiryDateInput').addEventListener('input', updateSchedulePreview);
// document.getElementById('visibilitySelect').addEventListener('change', updateSchedulePreview);
// document.getElementById('descriptionInput').addEventListener('input', updateSchedulePreview);
// document.getElementById('biblePassageInput').addEventListener('input', updateSchedulePreview);

// // Initial call to set the preview on page load (disabled)
// updateSchedulePreview();

function resetScheduleForm() {
    document.getElementById('nameInput').value = '';
    document.getElementById('typeSelect').value = '';
    document.getElementById('targetChurchInput').value = '';
    document.getElementById('expiryDateInput').value = '';
    document.getElementById('visibilitySelect').value = '';
    document.getElementById('descriptionInput').value = '';
    document.getElementById('biblePassageInput').value = '';
    // updateSchedulePreview(); // Preview logic disabled
}

function pushRequest() {
    const submitBtn = document.getElementById('submitScheduleBtn');
    submitBtn.disabled = true;
    
    // Validate that all required elements exist
    const nameInput = document.getElementById('nameInput');
    const creatorUid = document.getElementById('creatorUidInput');
    const typeSelect = document.getElementById('typeSelect');
    const targetChurch = document.getElementById('targetChurchInput');
    const expiryDate = document.getElementById('expiryDateInput');
    const visibilitySelect = document.getElementById('visibilitySelect');
    const descriptionInput = document.getElementById('descriptionInput');
    const biblePassageInput = document.getElementById('biblePassageInput');
    
    if (!creatorUid || !typeSelect || !targetChurch || !expiryDate || !visibilitySelect) {
        console.error('One or more form elements not found');
        alert('Form elements missing. Please refresh the page.');
        submitBtn.disabled = false;
        return;
    }
    
    const payload = {
        name: nameInput.value,
        description: descriptionInput ? descriptionInput.value : '',
        bible_passage: biblePassageInput ? biblePassageInput.value : '',
        creator_uid: creatorUid.value,
        type: typeSelect.value,
        target_church: targetChurch.value,
        expiry_date: expiryDate.value,
        visibility: visibilitySelect.value ? visibilitySelect.value : 'private',
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