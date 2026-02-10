function updateSchedulePreview() {
    const type = document.getElementById('typeSelect').value;
    const targetChurch = document.getElementById('targetChurchInput').value;
    const expiry = document.getElementById('expiryDateInput').value;
    
    const submitBtn = document.getElementById('submitScheduleBtn');

    const typePreview = document.getElementById('typePreview');
    const targetChurchPreview = document.getElementById('targetChurchPreview');

    const expiryDatePreview = document.getElementById('expiryDatePreview');

    typePreview.textContent = type || 'N/A';
    targetChurchPreview.textContent = targetChurch || 'N/A';
    expiryDatePreview.textContent = expiry || 'N/A';
    submitBtn.disabled = false;
}

// Listeners

document.getElementById('typeSelect').addEventListener('change', updateSchedulePreview);
document.getElementById('targetChurchInput').addEventListener('input', updateSchedulePreview);
document.getElementById('expiryDateInput').addEventListener('input', updateSchedulePreview);

// Initial call to set the preview on page load
updateSchedulePreview();

function resetScheduleForm() {
    document.getElementById('typeSelect').value = '';
    document.getElementById('targetChurchInput').value = '';
    document.getElementById('expiryDateInput').value = '';
    updateSchedulePreview();
}

function pushRequest() {
    const submitBtn = document.getElementById('submitScheduleBtn');
    submitBtn.disabled = true;
    payload = {
        creator_uid : document.getElementById('creatorUidInput').value,
        type : document.getElementById('typeSelect').value,
        target_church : document.getElementById('targetChurchInput').value,
        expiry_date : document.getElementById('expiryDateInput').value,
        scheduleStatus : 'pending'
    }

    fetch('/schedules/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    }).then(response => {
        if (response.ok) {
            // Close modal and reset form
            const createModal = bootstrap.Modal.getInstance(document.getElementById('createScheduleModal'));
            createModal.hide();
            resetScheduleForm();
            // Optionally, refresh the page or update the schedule list dynamically
            location.reload();
        } else {
            alert('Failed to create schedule. Please try again.');
            submitBtn.disabled = false;
        }
    }).catch(error => {
        console.error('Error creating schedule:', error);
        alert('An error occurred. Please try again.');
        submitBtn.disabled = false;
    });
}