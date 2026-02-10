document.addEventListener('DOMContentLoaded', function () {
    const partTypeSelect = document.getElementById('partType');
    const lyricsPartInput = document.getElementById('lyricsPart');
    const addPartButton = document.getElementById('addPart');
    const partsContainer = document.getElementById('partsContainer');
    const previewDiv = document.getElementById('previewContainer');
    const partsInput = document.getElementById('parts');
    const bookSelect = document.getElementById('book');
    const bookSongNumberInput = document.getElementById('bookSongNumber');
    const titleInput = document.getElementById('title');
    const altTitleInput = document.getElementById('alt_title');
    const artistInput = document.getElementById('artist');
    const chordInput = document.getElementById('chord');
    const fileInput = document.getElementById('fileInput');
    const importButton = document.getElementById('importButton');
    const typeDropdown = document.getElementById('typeDropdown');

    const previewTitleContainer = document.getElementById('previewTitleContainer');
    const previewTitle = document.getElementById('previewTitle');
    const previewAltTitle = document.getElementById('previewAltTitle');
    const previewSongNumber = document.getElementById('previewSongNumber');
    const previewChordContainer = document.getElementById('previewChordContainer');
    const previewChord = document.getElementById('previewChord');
    const previewArtist = document.getElementById('previewArtist');
    const previewBook = document.getElementById('previewBook');
    const previewPartsContainer = document.getElementById('previewPartsContainer');

    let parts = [];
    let isFirstPartAdded = false;

    function updatePreviewTitle() {
        const title = titleInput.value.trim() || '';
        previewTitle.innerText = title;
    }

    function updatePreviewAltTitle() {
        const altTitle = altTitleInput.value.trim() || '';
        previewAltTitle.innerText = altTitle;
    }
    
    titleInput.addEventListener('input', updatePreviewTitle);
    altTitleInput.addEventListener('input', updatePreviewAltTitle);

    function updatePreviewArtist() {
        const artist = artistInput.value.trim() || '';
        previewArtist.innerText = artist;
    }
    artistInput.addEventListener('input', updatePreviewArtist);

    function updatePreviewBook() {
        let bookId = bookSelect.value;
        const bookName = bookId ? Array.from(bookSelect.options).find(option => option.value == bookId)?.text : '';
        previewBook.innerText = bookName;
    }
    bookSelect.addEventListener('change', updatePreviewBook);

    function updatePreviewChord() {
        let chord = chordInput.value.trim() || '';
        const previewChordContainer = document.getElementById("previewChordContainer");
        const previewChord = document.getElementById("previewChord");
        if (chord && chord.trim() !== "") {
            previewChord.innerText = chord;
            previewChordContainer.style.display = "block"; // Show container
        } else {
            previewChordContainer.style.display = "none"; // Hide container
            previewChord.textContent = ""; // Clear content
        }
    }
    chordInput.addEventListener('input', updatePreviewChord);

    function updatePreviewSongNumber() {
        const bookSongNumber = bookSongNumberInput.value.trim();
        if(bookSongNumber == '') 
            previewSongNumber.innerText = '';
        else previewSongNumber.innerText = bookSongNumber + '.';
    }
    bookSongNumberInput.addEventListener('input', updatePreviewSongNumber);

    // document.srtfx = Sortable.create(document.getElementById('previewPartsContainer'), {
    //     animation: 150,
    //     onEnd: function (evt) {
    //         console.log('newlist', evt.to);
    //         // const movedPart = parts.splice(evt.oldIndex, 1)[0];
    //         // parts.splice(evt.newIndex, 0, movedPart);
    //         // //updatePreview();
    //         // partsInput.value = JSON.stringify(parts);
    //     },
    // });

    document.songParts = [];

    function updatePreview() {
        console.log(parts);
        let previewContent = '';

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

        previewPartsContainer.innerHTML = previewContent;
        addDragAndDropEvents(); 

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

        addDragAndDropEvents();
    }

    partTypeSelect.addEventListener('change', updatePreview);

    addPartButton.addEventListener('click', function () {
        const type = partTypeSelect.value;
        console.log(type);
        const lyrics = lyricsPartInput.value.trim();

        if (lyrics) {
            parts.push({ type, lyrics });
            lyricsPartInput.value = '';
            updatePreview();
            partsInput.value = JSON.stringify(parts); //TODO UPDATE HERE

            // Make sure the parts input is no longer required after the first part
            if (!isFirstPartAdded) {
                isFirstPartAdded = true;
                partsInput.required = false;
            }
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
                    console.log(data);
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
