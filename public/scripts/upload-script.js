document.addEventListener('DOMContentLoaded', function () {
    const partTypeSelect = document.getElementById('partType');
    const lyricsPartInput = document.getElementById('lyricsPart');
    const addPartButton = document.getElementById('addPart');
    const partsContainer = document.getElementById('partsContainer');
    const previewDiv = document.getElementById('preview');
    const partsInput = document.getElementById('parts');
    const bookSelect = document.getElementById('book');
    const bookSongNumberInput = document.getElementById('bookSongNumber');
    const titleInput = document.getElementById('title');
    const artistInput = document.getElementById('artist');
    const fileInput = document.getElementById('fileInput');
    const importButton = document.getElementById('importButton');
    const typeDropdown = document.getElementById('typeDropdown');

    let parts = [];
    let isFirstPartAdded = false;

    function updatePreview() {
        const title = titleInput.value.trim();
        const artist = artistInput.value.trim();
        const bookId = bookSelect.value;
        const bookSongNumber = bookSongNumberInput.value.trim();
        const bookName = bookId ? Array.from(bookSelect.options).find(option => option.value == bookId)?.text : '';
        let previewContent = '';

        if (title) {
            let titleContent = `<h1 class="preview-title">`;
            if (bookSongNumber) {
                titleContent += `<span class="preview-song-number">${bookSongNumber}. </span>`;
            }
            titleContent += `${title}</h1>`;
            previewContent += titleContent;
        }

        if (artist) {
            previewContent += `<h3 class="preview-artist">Artist: ${artist}</h3>`;
        }

        if (bookName) {
            previewContent += `<p>${bookName}</p>`;
        }

        if (parts.length > 0) {
            parts.forEach((part, index) => {
                previewContent += `
                <div class="song-part-container" data-index="${index}" draggable="true">
                <div class="song-part">
                    <strong>${part.type}:</strong>
                    <p>${part.lyrics}</p>
                </div>
                <div class="part-actions">
                    <button type="button" class="btn btn-danger btn-sm" onclick="removePart(${index})">Remove</button>
                    <button type="button" class="btn btn-success btn-sm" onclick="duplicatePart(${index})">Duplicate</button>
                    <button type="button" class="btn btn-warning btn-sm" onclick="changePartType(${index})">Change Type</button>
                </div>
            </div>
                `;
            });
        } else {
            previewContent += '<p>No parts added yet.</p>';
        }

        previewDiv.innerHTML = previewContent;
        addDragAndDropEvents(); 
        Sortable.create(document.getElementById('preview'), {
            animation: 150,  // Animation speed in milliseconds
            onEnd: function (evt) {
                const movedPart = parts.splice(evt.oldIndex, 1)[0];
                parts.splice(evt.newIndex, 0, movedPart);
                updatePreview();
                partsInput.value = JSON.stringify(parts);
            }
        });// Ensure drag-and-drop events are attached
    }

    function renderParts() {
        partsContainer.innerHTML = parts.map((part, index) => `
          <div class="song-part-container" data-index="${index}" draggable="true">
            <div class="song-part">
                <strong>${part.type}:</strong>
                 <p>${part.lyrics}</p>
            </div>
            <div class="part-actions">
                <button type="button" class="btn btn-danger btn-sm" onclick="removePart(${index})">Remove</button>
                <button type="button" class="btn btn-success btn-sm" onclick="duplicatePart(${index})">Duplicate</button>
                <button type="button" class="btn btn-warning btn-sm" onclick="changePartType(${index})">Change Type</button>
            </div>
        </div>
      `).join('');

        addDragAndDropEvents(); // Add this line to attach drag and drop events after rendering parts
    }

    titleInput.addEventListener('input', updatePreview);
    artistInput.addEventListener('input', updatePreview);
    bookSelect.addEventListener('change', updatePreview);
    bookSongNumberInput.addEventListener('input', updatePreview);
    partTypeSelect.addEventListener('change', updatePreview);
    

    addPartButton.addEventListener('click', function () {
        const type = partTypeSelect.value;
        const lyrics = lyricsPartInput.value.trim();

        if (lyrics) {
            parts.push({ type, lyrics });
            lyricsPartInput.value = '';
            updatePreview();
            partsInput.value = JSON.stringify(parts);
        } else {
            alert('Please enter lyrics.');
        }
    });

    function addDragAndDropEvents() {
        const partContainers = document.querySelectorAll('.song-part-container');
        partContainers.forEach(container => {
            container.addEventListener('dragstart', drag);
            container.addEventListener('dragover', dragOver);
            container.addEventListener('drop', drop);
            container.addEventListener('dragend', dragEnd);
        });
    }

    function drag(event) {
        event.dataTransfer.setData('text/plain', event.target.dataset.index);
    }

    function dragOver(event) {
        event.preventDefault();
    }

    function drop(event) {
        event.preventDefault();
        const index = event.dataTransfer.getData('text/plain');
        const targetIndex = event.target.closest('.song-part-container').dataset.index;
        if (index !== targetIndex) {
            const movedPart = parts.splice(index, 1)[0];
            parts.splice(targetIndex, 0, movedPart);
            updatePreview();
            partsInput.value = JSON.stringify(parts);
        }
    }

    function dragEnd(event) {
        event.target.style.opacity = '';
    }

    window.removePart = function (index) {
        parts.splice(index, 1);
        updatePreview();
        partsInput.value = JSON.stringify(parts);
    };

    window.duplicatePart = function (index) {
        parts.push({ ...parts[index] });
        updatePreview();
        partsInput.value = JSON.stringify(parts);
    };

    window.changePartType = function (index) {
        const part = parts[index];
        const typeDropdown = document.getElementById('typeDropdown');

        typeDropdown.value = part.type;
        typeDropdown.style.display = 'block'; 

        typeDropdown.onchange = function () {
            const newType = typeDropdown.value;
            if (newType) {
                part.type = newType;
                updatePreview();
                partsInput.value = JSON.stringify(parts);
                typeDropdown.style.display = 'none'; 
            }
        };
    };

    importButton.addEventListener('click', function () {
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const data = JSON.parse(e.target.result);
                    if (Array.isArray(data)) {
                        parts = data;
                        updatePreview();
                        partsInput.value = JSON.stringify(parts);
                    } else {
                        alert('Invalid file format.');
                    }
                } catch (error) {
                    alert('Error reading file.');
                }
            };
            reader.readAsText(file);
        }
    });
});
