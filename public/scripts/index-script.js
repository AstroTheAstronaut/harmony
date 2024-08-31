document.addEventListener('DOMContentLoaded', function () {
    const uploadZipButton = document.getElementById('uploadZipButton');
    const zipSelector = document.getElementById('zipSelector');
    const outputDiv = document.querySelector('.output-zip');

    uploadZipButton.addEventListener('click', function () {
        const file = zipSelector.files[0];

        if (file) {
            const reader = new FileReader();

            reader.onload = function (e) {
                JSZip.loadAsync(e.target.result).then(function (zip) {
                    let jsonFilePath = null;

                    // Find book.json
                    for (let fileName in zip.files) {
                        if (fileName.endsWith('book.json')) {
                            jsonFilePath = fileName;
                            break;
                        }
                    }

                    if (jsonFilePath) {
                        zip.file(jsonFilePath).async('string').then(function (content) {
                            try {
                                const jsonData = JSON.parse(content);
                                const bookName = jsonData.name;
                                const book_uuid = jsonData.book_uuid;

                                if (!bookName || !book_uuid) {
                                    throw new Error('Book JSON is missing required fields.');
                                }

                                outputDiv.textContent = `Book Title: ${bookName}, UUID: ${book_uuid}`;

                                // Process songs
                                let songPromises = [];
                                for (let fileName in zip.files) {
                                    if (fileName.endsWith('.lyric')) {
                                        songPromises.push(zip.file(fileName).async('string').then(function (content) {
                                            const songData = JSON.parse(content);
                                            return uploadSong(songData, book_uuid, bookName); // Include bookName
                                        }));
                                    }
                                }

                                // Wait for all uploads to finish
                                Promise.all(songPromises).then(() => {
                                    outputDiv.textContent += ' All songs have been uploaded.';
                                }).catch(err => {
                                    console.error('Error uploading songs:', err.message);
                                    outputDiv.textContent += ' Error uploading some songs.';
                                });

                            } catch (err) {
                                outputDiv.textContent = 'Error parsing JSON file: ' + err.message;
                            }
                        }).catch(function (err) {
                            outputDiv.textContent = 'Error reading JSON file: ' + err.message;
                        });
                    } else {
                        outputDiv.textContent = 'book.json file not found in the zip.';
                    }
                }).catch(function (err) {
                    outputDiv.textContent = 'Error loading zip file: ' + err.message;
                });
            };

            reader.readAsArrayBuffer(file);
        } else {
            outputDiv.textContent = 'Please select a zip file.';
        }
    });

    async function uploadSong(songData, book_uuid, bookName) {
        // Create a single JSON object for each song
        const songJson = {
            title: songData.ATTR_TITLE || '',
            artist: songData.ATTR_ARTIST || '',
            book: book_uuid,
            bookName: bookName,
            bookSongNumber: songData.ATTR_NUMBER || null,
            parts: (songData.ATTR_LYRICS || []).map((lyric, index) => ({
                type: lyric.TYPE || '',
                lyrics: lyric.LYRIC || '',
                order: songData.ATTR_ORDER ? songData.ATTR_ORDER[index] : index
            }))
        };
        
        // Push the song JSON to the backend
        return fetch('/upload-song', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ jsonFiles: [songJson] }) // Ensure jsonFiles is an array
        }).then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`Failed to upload song: ${text}`);
                });
            }
            return response.json();
        }).catch(err => {
            console.error('Error uploading song:', err.message);
            throw err;
        });
    }
    
});

