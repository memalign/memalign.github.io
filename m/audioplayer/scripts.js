// scripts.js
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const audioPlayer = document.getElementById('audioPlayer');
    const playPauseButton = document.getElementById('playPauseButton');
    const skipBackButton = document.getElementById('skipBackButton');
    const skipForwardButton = document.getElementById('skipForwardButton');
    const speedSelect = document.getElementById('speedSelect');
    const clearButton = document.getElementById('clearButton');

    const dbName = 'audioPlayerDB';
    const storeName = 'audioFiles';
    let db;

    const openDB = () => {
        const request = indexedDB.open(dbName, 1);

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            db.createObjectStore(storeName, { keyPath: 'id' });
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            loadFromIndexedDB();
        };

        request.onerror = (event) => {
            console.error('IndexedDB error:', event.target.errorCode);
        };
    };

    const saveFileToIndexedDB = (fileData) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        store.put({
            id: 1,
            fileData
        });
    };

    const savePlaybackInfoToLocalStorage = (currentTime, playbackRate) => {
        localStorage.setItem('audioPlayerCurrentTime', currentTime);
        localStorage.setItem('audioPlayerPlaybackRate', playbackRate);
    };

    const loadFromIndexedDB = () => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(1);

        request.onsuccess = (event) => {
            const data = event.target.result;
            if (data) {
                const blob = new Blob([data.fileData], { type: 'audio/mpeg' });
                const url = URL.createObjectURL(blob);
                audioPlayer.src = url;
                audioPlayer.load();
            }
        };

        request.onerror = (event) => {
            console.error('IndexedDB error:', event.target.errorCode);
        };
    };

    const handleFile = (file) => {
        if (!file.type.startsWith('audio/')) {
            alert('Please select a valid audio file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const fileData = event.target.result;
            saveFileToIndexedDB(fileData);
            const blob = new Blob([fileData], { type: file.type });
            const url = URL.createObjectURL(blob);
            audioPlayer.src = url;
            audioPlayer.play();
        };
        reader.readAsArrayBuffer(file);
    };

    fileInput.addEventListener('change', (event) => {
        handleFile(event.target.files[0]);
    });

    dropZone.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropZone.style.borderColor = '#000';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#ccc';
    });

    dropZone.addEventListener('drop', (event) => {
        event.preventDefault();
        dropZone.style.borderColor = '#ccc';
        handleFile(event.dataTransfer.files[0]);
    });

    playPauseButton.addEventListener('click', () => {
        if (audioPlayer.paused) {
            audioPlayer.play();
        } else {
            audioPlayer.pause();
        }
    });

    skipBackButton.addEventListener('click', () => {
        audioPlayer.currentTime -= 10;
    });

    skipForwardButton.addEventListener('click', () => {
        audioPlayer.currentTime += 10;
    });

    speedSelect.addEventListener('change', () => {
        audioPlayer.playbackRate = speedSelect.value;
        savePlaybackInfoToLocalStorage(audioPlayer.currentTime, audioPlayer.playbackRate);
    });

    audioPlayer.addEventListener('timeupdate', () => {
        const timeToSave = Math.max(0, audioPlayer.currentTime - 2);
        savePlaybackInfoToLocalStorage(timeToSave, audioPlayer.playbackRate);
    });



    audioPlayer.addEventListener('loadeddata', () => {
        const currentTime = localStorage.getItem('audioPlayerCurrentTime');
        const playbackRate = localStorage.getItem('audioPlayerPlaybackRate');

        if (currentTime) {
            console.log("Setting currentTime to " + parseFloat(currentTime));
            audioPlayer.currentTime = parseFloat(currentTime);
        }

        if (playbackRate) {
            audioPlayer.playbackRate = parseFloat(playbackRate);
            speedSelect.value = playbackRate;  // Update the speed UI element
        }
    }, { once: true });


    clearButton.addEventListener('click', () => {
        audioPlayer.src = '';
        audioPlayer.currentTime = 0;
        audioPlayer.playbackRate = 1;
        speedSelect.value = 1;  // Reset the speed UI element
        localStorage.removeItem('audioPlayerCurrentTime');
        localStorage.removeItem('audioPlayerPlaybackRate');
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        store.delete(1);
    });

    openDB();
});
