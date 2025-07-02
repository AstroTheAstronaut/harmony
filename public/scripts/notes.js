document.addEventListener('DOMContentLoaded', () => {
    const inputField = document.getElementById('add-note-input');
    const notesList = document.getElementById('notes-list');

    // Add event listener for Enter key or blur event
    inputField.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter' && inputField.value.trim() !== '') {
            await addNoteToServer(inputField.value.trim());
            inputField.value = ''; // Clear the input field
        }
    });

    inputField.addEventListener('blur', async () => {
        if (inputField.value.trim() !== '') {
            await addNoteToServer(inputField.value.trim());
            inputField.value = ''; // Clear the input field
        }
    });

    // Function to add a note to the server
    async function addNoteToServer(noteText) {
        try {
            const response = await fetch('/addNote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    note: noteText,
                    user_id: '123', // Replace with dynamic user ID
                }),
            });

            const result = await response.json();

            if (result.success) {
                addNoteToUI(result.note);
            } else {
                console.error('Error adding note:', result.error);
            }
        } catch (error) {
            console.error('Network error:', error);
        }
    }

    // Function to dynamically add a note to the UI
    function addNoteToUI(note) {
        const noteItem = document.createElement('li');
        noteItem.className = 'list-group-item list-group-item-action';
        noteItem.innerHTML = `
            <div class="d-flex align-items-center justify-content-between">
                <div class="note-content">
                    <h6 class="mb-0 note-text d-inline">
                        <strong>${note.note}</strong>
                    </h6>
                    <span class="text-xs note-timestamp d-inline">${new Date(note.createdAt).toLocaleTimeString()}</span>
                </div>
                <div class="icon-group">
                    <a href="#" class="icon-link"><i class="fa-regular fa-square fa-fw"></i></a>
                    <a href="#" class="icon-link"><i class="fas fa-trash-can fa-fw"></i></a>
                    <a href="#" class="icon-link"><i class="fas fa-thumbtack fa-fw"></i></a>
                </div>
            </div>
        `;
        notesList.insertBefore(noteItem, inputField.closest('li'));
    }
});
