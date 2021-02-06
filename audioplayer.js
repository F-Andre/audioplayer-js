'use strict'

window.addEventListener('load', function () {
    const requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    const cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;
    audioPlayer();
    modal();


    function modal() {
        const about = document.getElementById('about');

        about.addEventListener('mousedown', function () {
            openModal();
        });

        function openModal() {
            const fond = document.createElement('div');
            fond.id = 'modal-fond';
            const closeFond = document.createElement('button');
            closeFond.id = 'close-fond';
            const modalHeader = document.createElement('div');
            modalHeader.id = 'modal-header';
            modalHeader.textContent = 'A propos de Audioplayer JS';
            const modalPanel = document.createElement('div');
            modalPanel.id = 'modal-panel';
            modalPanel.innerHTML = 'Audioplayer JS est un lecteur audio expérimental permettant de tester l\'API web audio, le chargement de données asynchrone et les animations frames en javaScript.<br><br>Fonctionnalités:<ul><li>Affichage la forme d\'onde mono ou stéréo du fichier audio</li><li>Affichage de la progression sur la forme d\'onde</li><li>Barre de progression cliquable</li><li>Analyseur de fréquence en temps réel.</li><li>Lecture aléatoire de la playlist</li><li>Ajout de fichiers à la playlist existante</li><li>Modification de l\'ordre la playlist en utilisant le glisser-déposer</li></ul><br>Raccourcis clavier:<ul><li>Touches haut et bas: navigation dans la playlist</li><li>Barre d\'espace: lecture/pause</li><li>Entrée: lire/relire la piste sélectionnée</li></ul>';

            fond.appendChild(closeFond);
            fond.appendChild(modalHeader);
            fond.appendChild(modalPanel);
            document.body.appendChild(fond);

            setTimeout(function () {
                fond.style.opacity = '100';
            }, 100);

            fond.addEventListener('mousedown', function () {
                fond.style.opacity = '0';
                setTimeout(function () {
                    document.body.removeChild(fond);
                }, 500);

            });
        }
    }

    function rafMouse() {
        let lastMouseXPos = 0;

        let ticking = false;

        function moveMouse(elemOver) {
            lastMouseXPos = elemOver.pageX;
            requestTicking();
        }

        function requestTicking() {
            if (!ticking) {
                requestAnimationFrame(updateMouseX);
            }
            ticking = true;
        }

        function updateMouseX() {
            ticking = false;
            seekBar(lastMouseXPos);
        }

        function seekBar(mousePosX) {
            const player = document.getElementById('audioPlayer');

            const canvas = document.getElementById('waveform');

            let canvasWidth = parseInt(window.getComputedStyle(canvas).width);

            let canvasPos = parseInt(window.getComputedStyle(canvas).marginLeft);

            mousePosX = mousePosX - canvasPos;

            canvas.addEventListener('mousedown', function () {
                let newCanPos = (100 / canvasWidth) * mousePosX;
                player.currentTime = (newCanPos / 100) * player.duration;
            });
        }

        document.getElementById('waveform').addEventListener('mousemove', function (e) {
            moveMouse(e);
        });
    }

    function audioPlayer() {
        // Définitions variables
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const gainNode = audioCtx.createGain();

        const playBtn = document.createElement('input');
        const pauseBtn = document.createElement('input');
        const stopBtn = document.createElement('input');
        const nextBtn = document.createElement('input');
        const prevBtn = document.createElement('input');
        const player = document.getElementById('audioPlayer');

        const playList = document.querySelector('#playerDiv table');

        const file = document.getElementById('audioFile');
        const fileLabel = document.getElementById('fileLabel');
        const loadButton = document.getElementById('loadButton');
        const fileDown = document.getElementById('fileDown');

        const info = document.createElement('div');
        const timer = document.createElement('p');
        const progressBar = document.createElement('div');

        const canvas = document.getElementById('waveform');
        const canvasCtx = canvas.getContext('2d');
        const monoWaveform = document.getElementById('mono');
        const stereoWaveform = document.getElementById('stereo');

        const rtaOn = document.getElementById('rtaOn');
        const rtaOff = document.getElementById('rtaOff');
        const shufOn = document.getElementById('shufOn');
        const shufOff = document.getElementById('shufOff');
        const volume = document.getElementById('volume');

        const source = audioCtx.createMediaElementSource(player);

        let loadedTrk = 0;
        let tracks = {};
        let tksFile = [];
        let tksOrder = [];
        let tksRdm = [];
        let volumeValue = 1;

        let drawWaveForm;
        let drawVisual;

        const analyser = audioCtx.createAnalyser();

        // Mise en place interface
        info.id = 'playerInfo';
        player.crossOrigin = 'anonymous';

        playBtn.setAttribute('type', 'button');
        playBtn.id = 'play';
        playBtn.className = 'controlBtn';
        pauseBtn.setAttribute('type', 'button');
        pauseBtn.id = 'pause';
        pauseBtn.className = 'controlBtn';
        stopBtn.setAttribute('type', 'button');
        stopBtn.id = 'stop';
        stopBtn.className = 'controlBtn';
        nextBtn.setAttribute('type', 'button');
        nextBtn.id = 'next';
        nextBtn.className = 'controlBtn';
        prevBtn.setAttribute('type', 'button');
        prevBtn.id = 'prev';
        prevBtn.className = 'controlBtn';

        document.getElementById('control').appendChild(prevBtn);
        document.getElementById('control').appendChild(playBtn);
        document.getElementById('control').appendChild(pauseBtn);
        document.getElementById('control').appendChild(stopBtn);
        document.getElementById('control').appendChild(nextBtn);

        progressBar.id = 'progressBar';

        canvas.width = parseInt(window.getComputedStyle(canvas).width);
        canvas.height = 120;
        canvasCtx.fillStyle = 'rgb(112, 112, 112)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        function togglePlay(track) {
            document.querySelector('[playing]') ? document.querySelector('[playing]').removeAttribute('playing') : '';
            if (track) {
                track.setAttribute('playing', '');
            }
        }

        // Key binding
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowUp' || e.code === 'ArrowDown') {
                e.preventDefault();
            }
            let enterKey;
            if (e.code === 'Enter' || e.code === 'NumpadEnter') {
                enterKey = e.code;
            }
            switch (e.code) {
                case enterKey:
                    if (document.querySelector('[select]')) {
                        let trkEnter = parseInt(document.querySelector('[select]').getAttribute('data-audiotrk'));
                        togglePlay(document.querySelector('[select]'));
                        player.setAttribute('src', tracks[trkEnter].tUrl);
                        player.setAttribute('type', tracks[trkEnter].tType);
                        info.textContent = tracks[trkEnter].tName;
                        audioCtx.resume().then(() => {
                            playMusic(trkEnter);
                        });
                    } else {
                        document.querySelectorAll('.plyLst')[0].setAttribute('select', 'true');
                        togglePlay(document.querySelector('[select]'));
                        player.setAttribute('src', tracks[0].tUrl);
                        player.setAttribute('type', tracks[0].tType);
                        info.textContent = tracks[0].tName;
                        audioCtx.resume().then(() => {
                            playMusic(0);
                        });
                    }
                    break;

                case 'ArrowUp':
                    if (document.querySelector('[select]')) {
                        let curSelect = document.querySelector('[select]');
                        if (curSelect.previousElementSibling.classList.contains('plyLst')) {
                            curSelect.previousElementSibling.setAttribute('select', 'true');
                            curSelect.removeAttribute('select');
                        }
                    } else {
                        let lastTrk = playList.lastElementChild;
                        let lastTrkNbr = parseInt(lastTrk.getAttribute('data-audiotrk'));
                        lastTrk.setAttribute('select', 'true');
                        player.setAttribute('src', tracks[lastTrkNbr].tUrl);
                        player.setAttribute('type', tracks[lastTrkNbr].tType);
                        info.textContent = tracks[lastTrkNbr].tName;
                    }
                    break;

                case 'ArrowDown':
                    if (document.querySelector('[select]')) {
                        let curSelect = document.querySelector('[select]');
                        if (curSelect.nextElementSibling) {
                            curSelect.nextElementSibling.setAttribute('select', 'true');
                            curSelect.removeAttribute('select');
                        }
                    } else {
                        document.querySelectorAll('.plyLst')[0].setAttribute('select', 'true');
                        player.setAttribute('src', tracks[0].tUrl);
                        player.setAttribute('type', tracks[0].tType);
                        info.textContent = tracks[0].tName;
                    }
                    break;

                case 'Space':
                    if (playBtn.hasAttribute('enabled')) {
                        player.pause();
                        audioCtx.suspend();
                        playBtn.hasAttribute('enabled') ? playBtn.removeAttribute('enabled') : '';
                        pauseBtn.hasAttribute('enabled') ? '' : pauseBtn.setAttribute('enabled', 'true');
                    } else if (pauseBtn.hasAttribute('enabled')) {
                        playBtn.setAttribute('enabled', 'true');
                        pauseBtn.removeAttribute('enabled');
                        audioCtx.resume().then(() => {
                            player.play();
                        });

                    } else {
                        togglePlay(document.querySelector('[select]'));
                        playBtn.setAttribute('enabled', 'true');
                        audioCtx.resume().then(() => {
                            player.play();
                        });

                    }
                    break;
            }
        });

        playBtn.addEventListener('mousedown', function buttonPlay(e) {
            if (pauseBtn.hasAttribute('enabled') || player.currentTime > 0) {
                audioCtx.resume().then(() => {
                    player.play();
                });
                pauseBtn.hasAttribute('enabled') ? pauseBtn.removeAttribute('enabled') : '';
                playBtn.hasAttribute('enabled') ? '' : playBtn.setAttribute('enabled', 'true');
            } else if (document.querySelector('[select]') && player.currentTime === 0) {
                let trkPB = parseInt(document.querySelector('[select]').getAttribute('data-audiotrk'));
                togglePlay(document.querySelector('[select]'));
                player.setAttribute('src', tracks[trkPB].tUrl);
                player.setAttribute('type', tracks[trkPB].tType);
                info.textContent = tracks[trkPB].tName;
                audioCtx.resume().then(() => {
                    playMusic(trkPB);
                });
            } else if (document.querySelectorAll('.plyLst').length > 0 && shufOff.hasAttribute('active')) {
                player.setAttribute('src', tracks[0].tUrl);
                player.setAttribute('type', tracks[0].tType);
                info.textContent = tracks[0].tName;
                togglePlay(document.querySelectorAll('.plyLst')[0]);
                audioCtx.resume().then(() => {
                    playMusic(0);
                });
            } else if (document.querySelectorAll('.plyLst').length > 0 && shufOn.hasAttribute('active')) {
                let rdmIndex = tksRdm[0];
                player.setAttribute('src', tracks[rdmIndex].tUrl);
                player.setAttribute('type', tracks[rdmIndex].tType);
                info.textContent = tracks[rdmIndex].tName;
                togglePlay(document.querySelectorAll('.plyLst')[rdmIndex]);
                audioCtx.resume().then(() => {
                    playMusic(rdmIndex);
                });
            }
        });

        pauseBtn.addEventListener('mousedown', function () {
            if (document.querySelectorAll('.plyLst').length > 0) {
                pauseBtn.blur();
                player.pause();
                audioCtx.suspend();
                playBtn.hasAttribute('enabled') ? playBtn.removeAttribute('enabled') : '';
                pauseBtn.hasAttribute('enabled') ? '' : pauseBtn.setAttribute('enabled', 'true');
            }
        });

        stopBtn.addEventListener('mousedown', function () {
            player.pause();
            player.currentTime ? player.currentTime = 0 : '';
            togglePlay();
            playBtn.hasAttribute('enabled') ? playBtn.removeAttribute('enabled') : '';
            pauseBtn.hasAttribute('enabled') ? pauseBtn.removeAttribute('enabled') : '';
            audioCtx.suspend();
        });

        nextBtn.addEventListener('mousedown', () => {
            nextTrack();
        });

        prevBtn.addEventListener('mousedown', () => {
            prevTrack();
        });

        monoWaveform.addEventListener('mousedown', () => {
            monoWaveform.hasAttribute('active') ? '' : monoWaveform.setAttribute('active', ''), stereoWaveform.removeAttribute('active');
            if (document.querySelector('[playing]')) {
                let j = parseInt(document.querySelector('[playing]').getAttribute('data-audiotrk'));
                cancelAnimationFrame(drawWaveForm);
                displayWave(tracks[j].tWaveformM);
            }
        });

        stereoWaveform.addEventListener('mousedown', () => {
            stereoWaveform.hasAttribute('active') ? '' : stereoWaveform.setAttribute('active', 'true'), monoWaveform.removeAttribute('active');
            if (document.querySelector('[playing]')) {
                let j = parseInt(document.querySelector('[playing]').getAttribute('data-audiotrk'));
                cancelAnimationFrame(drawWaveForm);
                displayWave(tracks[j].tWaveformL, tracks[j].tWaveformR);
            }
        });

        function toggleButton(elementTarget, elementOff) {
            elementOff.hasAttribute('active') ? elementOff.removeAttribute('active') : '';
            elementTarget.hasAttribute('active') ? '' : elementTarget.setAttribute('active', 'true');
        }

        rtaOn.addEventListener('mousedown', () => {
            toggleButton(rtaOn, rtaOff);
            document.querySelector('#canvasRta') ? document.querySelector('#canvasRta').style.display = 'block' : '';
            displayRta();
        });

        rtaOff.addEventListener('mousedown', () => {
            cancelAnimationFrame(drawVisual);
            toggleButton(rtaOff, rtaOn);
            document.querySelector('#canvasRta') ? document.querySelector('#canvasRta').style.display = 'none' : '';
        });

        shufOn.addEventListener('mousedown', () => {
            toggleButton(shufOn, shufOff);
        });

        shufOff.addEventListener('mousedown', () => {
            toggleButton(shufOff, shufOn);
        });

        volume.addEventListener('input', function (e) {
            volumeValue = e.target.value / 100;
            gainNode.gain.setValueAtTime(volumeValue, audioCtx.currentTime);
        });

        function closeList() {
            const loadButChild = loadButton.lastElementChild;
            loadButton.removeChild(loadButChild);
            fileDown.setAttribute('active', 'false');
            fileDown.removeAttribute('listOpen');
        }

        fileDown.addEventListener('mousedown', function downList() {

            if (fileDown.getAttribute('active') !== 'true') {
                fileDown.setAttribute('active', 'true');
            } else {
                fileDown.setAttribute('active', 'false');
            }

            if (!fileDown.hasAttribute('listOpen')) {
                const fileDownList = document.createElement('ul');

                const fileDownAdd = document.createElement('li');

                const fileAdd = document.createElement('input');

                const fileAddLabel = document.createElement('label');

                const fileDownRemove = document.createElement('li');

                fileAdd.setAttribute('type', 'file');
                fileAdd.setAttribute('multiple', '');
                fileAdd.setAttribute('accept', '.mp3, .flac, .ogg');
                fileAdd.setAttribute('name', 'addFile');
                fileAdd.id = 'addFile';
                fileAdd.style.display = 'none';

                fileAddLabel.setAttribute('for', 'addFile');
                fileAddLabel.textContent = 'Ajouter des fichiers';

                fileDown.setAttribute('listOpen', '');

                fileDownRemove.textContent = 'Effacer la playlist';
                fileDownList.style.listStyleType = 'none';
                fileDownList.id = 'down-list';

                fileDownAdd.appendChild(fileAdd);
                fileDownAdd.appendChild(fileAddLabel);
                fileDownList.appendChild(fileDownAdd);
                fileDownList.appendChild(fileDownRemove);
                loadButton.appendChild(fileDownList);
                fileAddLabel.focus(false);
            } else {
                closeList();
            }

            if (fileAdd) {
                fileAdd.addEventListener('mousedown', function () {
                    loadedTrk = 0;
                });

                fileAdd.addEventListener('change', function () {
                    let a = 0;

                    if (document.getElementsByClassName('plyLst')) {
                        a = document.getElementsByClassName('plyLst').length;
                    }

                    let nbrFichiers = this.files.length;
                    for (let i = 0; i < nbrFichiers; i++) {
                        tksFile.push(fileAdd.files[i]);
                        createAudioSource(fileAdd.files[i], i + a, nbrFichiers + a);
                    }
                    closeList();
                });
            }

            if (fileDownRemove) {
                fileDownRemove.addEventListener('mousedown', function () {
                    const loadedTracks = document.querySelectorAll('.plyLst');
                    for (let i = 0; i < loadedTracks.length; i++) {
                        playList.removeChild(loadedTracks[i]);
                    }
                    closeList();
                });
            }
        });

        function displayWave(waveArrayL, waveArrayR) {
            if (waveArrayR) {
                canvas.height = 240;
            } else {
                canvas.height = 120;
            }
            let progressValue = 0;

            function draw() {
                drawWaveForm = requestAnimationFrame(draw);
                canvasCtx.fillStyle = 'rgb(0, 0, 0)';
                canvasCtx.fillRect(progressValue, 0, canvas.width, canvas.height);
                canvasCtx.fillStyle = 'rgb(112, 112, 112)';
                canvasCtx.fillRect(0, 0, progressValue, canvas.height);
                let waveArrayLength = waveArrayL.length;
                let barWidth, barHeight, x;
                if (!waveArrayR) {
                    barWidth = (canvas.width / waveArrayLength) * 1.25;
                    x = 0;
                    for (let i = 0; i < waveArrayLength; i++) {
                        barHeight = waveArrayL[i] * 225;
                        canvasCtx.fillStyle = 'rgb(255,128,0)';
                        canvasCtx.fillRect(x, (canvas.height / 2) - barHeight / 2, barWidth, barHeight);
                        x += barWidth;
                    }
                } else {
                    barWidth = (canvas.width / waveArrayLength) * 1.25;
                    x = 0;
                    for (let i = 0; i < waveArrayLength; i++) {
                        let barHeightL = waveArrayL[i] * 300;
                        let barHeightR = waveArrayR[i] * 300;
                        canvasCtx.fillStyle = 'rgb(255,128,0)';
                        canvasCtx.fillRect(x, (canvas.height / 4) - barHeightL / 4, barWidth, barHeightL);
                        canvasCtx.fillRect(x, ((canvas.height / 4) * 3) - barHeightR / 4, barWidth, barHeightR);
                        x += barWidth;
                    }
                }
            }

            drawWaveForm = requestAnimationFrame(draw);

            player.addEventListener('timeupdate', function () {
                progressValue = (player.currentTime / player.duration) * canvas.width;
            });
        }

        function displayRta() {
            if (document.querySelector('#canvasRta') && !rtaOn.hasAttribute('active')) {
                source.disconnect(audioCtx.destination)
            }

            let canvasRta;
            if (!document.querySelector('#canvasRta')) {
                canvasRta = document.createElement('canvas');
                canvasRta.id = 'canvasRta';
                document.querySelector('#playerDiv').insertBefore(canvasRta, player);
            } else {
                canvasRta = document.querySelector('#canvasRta');
            }
            const canvasRatCtx = canvasRta.getContext('2d');
            canvasRta.width = parseInt(window.getComputedStyle(canvas).width);
            canvasRta.height = 240;
            canvasRatCtx.fillStyle = 'rgb(0, 0, 0)';
            canvasRatCtx.fillRect(0, 0, canvasRta.width, canvasRta.height);

            rtaOff.hasAttribute('active') ? canvasRta.style.display = 'none' : canvasRta.style.display = 'block';

            analyser.fftSize = 4096;
            analyser.minDecibels = -90;
            let bufferLength = analyser.frequencyBinCount;
            let dataArrayRta = new Uint8Array(bufferLength);

            function drawRta() {
                drawVisual = requestAnimationFrame(drawRta);

                analyser.getByteFrequencyData(dataArrayRta);
                canvasRatCtx.fillStyle = 'rgb(0, 0, 0)';
                canvasRatCtx.fillRect(0, 0, canvasRta.width, canvasRta.height);
                canvasRatCtx.beginPath();
                canvasRatCtx.lineWidth = 3;
                canvasRatCtx.lineCap = 'round';

                let scale = Math.log(bufferLength - 1) / canvasRta.width;
                let barHeight;

                for (let i = 0; i < bufferLength; i++) {
                    let x = Math.log(i) / scale;
                    barHeight = dataArrayRta[i] / 1.5;
                    let y = canvasRta.height - barHeight;
                    canvasRatCtx.strokeStyle = 'rgb(255, 102, 0)';
                    canvasRatCtx.lineTo(x, y);
                }
                canvasRatCtx.stroke();
            }

            drawVisual = requestAnimationFrame(drawRta);
        }

        function playMusic(j) {
            audioCtx.resume();
            player.crossOrigin = 'anonymous';
            cancelAnimationFrame(drawWaveForm);
            canvasCtx.fillStyle = 'rgb(112, 112, 112)';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

            document.querySelector('#playerDiv').insertBefore(info, canvas);

            let fileAudio = tksFile[j];
            pauseBtn.focus();
            pauseBtn.blur();

            pauseBtn.hasAttribute('enabled') ? pauseBtn.removeAttribute('enabled') : '';
            playBtn.hasAttribute('enabled') ? '' : playBtn.setAttribute('enabled', 'true');

            function audioArray(decodeddata, decodedDataArray) {
                let y = 0;

                let resolution = decodeddata.duration * 30;
                let redNeg, redPos;

                let dataArrayLength = decodedDataArray.length;
                let rdLength = Math.round(dataArrayLength / (resolution / 2.5));
                let reducedData = new Float32Array(rdLength);
                for (let i = 0; i < dataArrayLength; i += resolution) {
                    let slicedArray = decodedDataArray.slice(i, (resolution + i));
                    let slicedPos = slicedArray.filter(function (element) {
                        return element > 0;
                    });
                    let slicedNeg = slicedArray.filter(function (element) {
                        return element <= 0;
                    });
                    if (slicedPos.length > 0) {
                        redPos = slicedPos.reduce(function (a, b) {
                            return a + b;
                        });
                    }
                    if (slicedNeg.length > 0) {
                        redNeg = slicedNeg.reduce(function (a, b) {
                            return a + b;
                        });
                    }

                    redNeg = redNeg / resolution;
                    redPos = redPos / resolution;
                    let redArray = [redPos, redNeg];
                    reducedData.set(redArray, y);
                    y += redArray.length;
                }
                return reducedData;
            }

            if (tracks[j].tWaveformL) {
                if (monoWaveform.hasAttribute('active')) {
                    displayWave(tracks[j].tWaveformM);
                } else {
                    displayWave(tracks[j].tWaveformL, tracks[j].tWaveformR);
                }
            } else {
                let reader = new FileReader();
                reader.addEventListener('load', function () {
                    let bufferFile = reader.result;
                    audioCtx.decodeAudioData(bufferFile).then((decodeddata) => {
                        let decodedDataArrayL = decodeddata.getChannelData(0);
                        let decodedDataArrayR = decodeddata.getChannelData(1);
                        let reducedDataL = audioArray(decodeddata, decodedDataArrayL);
                        let reducedDataR = audioArray(decodeddata, decodedDataArrayR);
                        let reducedDataM = new Float32Array(reducedDataL.length);
                        let arrayM = [];

                        let k = 0;
                        for (let i = 0; i < reducedDataM.length; i++) {
                            let sommeLR = reducedDataL[i] + reducedDataR[i];
                            arrayM = [sommeLR];
                            reducedDataM.set(arrayM, k);
                            k += arrayM.length;
                        }
                        tracks[j].tWaveformL = reducedDataL;
                        tracks[j].tWaveformR = reducedDataR;
                        tracks[j].tWaveformM = reducedDataM;
                        tracks[j].tDuree = decodeddata.duration;
                    })
                        .then(() => {
                            if (monoWaveform.hasAttribute('active')) {
                                displayWave(tracks[j].tWaveformM);
                            } else {
                                displayWave(tracks[j].tWaveformL, tracks[j].tWaveformR);
                            }
                        });
                });
                reader.readAsArrayBuffer(fileAudio);
            }

            player.setAttribute('data-loaded', j);

            source.connect(analyser);
            source.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            player.play();
            rafMouse();

            info.appendChild(timer);
            player.addEventListener('timeupdate', function () {
                timer.textContent = timeConvert(player.currentTime) + ' / ' + timeConvert(player.duration);
            });
        }

        player.addEventListener('ended', function () {
            nextTrack();
        });

        function timeConvert(duration) {
            let min = isNaN(duration) ? '--' : Math.floor(duration / 60);
            let sec = isNaN(duration) ? '--' : Math.floor(duration % 60);
            if (!isNaN(duration)) {
                sec = new Intl.NumberFormat('fr-FR', {
                    minimumIntegerDigits: 2
                }).format(sec);
            }
            return min + 'min ' + sec + 's';
        }

        fileLabel.addEventListener('mousedown', function () {
            loadedTrk = 0;
            tracks = {};
            tksFile = [];
            tksOrder = [];
            if (loadButton.lastElementChild !== fileDown) {
                closeList();
            }
        });

        file.addEventListener('change', function setFileFunc() {
            info.innerHTML = '';
            const loadedTracks = document.querySelectorAll('.plyLst');
            for (let i = 0; i < loadedTracks.length; i++) {
                playList.removeChild(loadedTracks[i]);
            }
            let nbrFichiers = this.files.length;
            for (let i = 0; i < nbrFichiers; i++) {
                tksFile.push(file.files[i]);
            }

            tksFile.forEach(function (value, index) {
                createAudioSource(value, index, nbrFichiers);
            });
        });

        function createAudioSource(audioFile, n, nbr) {
            let reader = new FileReader();
            reader.addEventListener('load', function () {
                tracks[n] = {
                    tName: audioFile.name,
                    tUrl: reader.result,
                    tType: audioFile.type
                };
                loadedTrk++;
                if (loadedTrk === nbr) {
                    createPlaylist();
                }
            });

            reader.addEventListener('progress', function (e) {
                let progressWidth = e.loaded / (e.total / parseInt(window.getComputedStyle(playList).width));
                progressBar.style.width = parseInt(progressWidth) + 'px';
                document.querySelector('#progress').appendChild(progressBar);
            });
            reader.readAsDataURL(audioFile);
        }

        function displayDuration(audioFile, n) {
            let time;
            let reader = new FileReader();
            reader.addEventListener('load', function () {
                let buffer = reader.result;

                function decode() {
                    return audioCtx.decodeAudioData(buffer);
                }

                function playList() {
                    return new Promise(resolve => {
                        resolve(document.querySelectorAll('.plyLst')[n]);
                    });
                }

                async function asyncTime() {
                    let decodeddata = await decode();
                    time = decodeddata.duration;
                    tracks[n].tDuree = time;
                    return time;
                }

                asyncTime().then(t => {
                    playList().then(l => {
                        l.childNodes[2].setAttribute('loading', 'false');
                        l.childNodes[2].firstElementChild.textContent = timeConvert(t);
                    });
                });
            });
            reader.readAsArrayBuffer(audioFile);
        }

        function createPlaylist() {
            document.querySelector('#progress').innerHTML = '';
            for (let trkNbr in tracks) {
                let b = document.getElementsByClassName('plyLst');
                if (!b[trkNbr]) {
                    const tr = document.createElement('tr');
                    const tdState = document.createElement('td');
                    const tdNom = document.createElement('td');
                    const tdDuree = document.createElement('td');
                    const tdType = document.createElement('td');
                    const divDuree = document.createElement('div');

                    tdNom.textContent = tracks[trkNbr].tName;
                    tdDuree.setAttribute('loading', 'true');
                    tdType.textContent = tracks[trkNbr].tType;
                    tr.setAttribute('data-audiotrk', trkNbr);
                    tr.setAttribute('data-place', trkNbr);
                    tr.setAttribute('draggable', 'true');
                    tr.id = 'track' + trkNbr;

                    if ((trkNbr % 2) === 0) {
                        tr.classList.add('trP');
                    } else {
                        tr.classList.add('trI');
                    }

                    tr.classList.add('plyLst');

                    tdDuree.appendChild(divDuree);
                    tr.appendChild(tdState);
                    tr.appendChild(tdNom);
                    tr.appendChild(tdDuree);
                    tr.appendChild(tdType);
                    playList.appendChild(tr);
                    tksOrder.push(parseInt(trkNbr));
                }
            }
            tksRdm = [];
            let tksOrderLength = tksOrder.length;
            do {
                let rdm = Math.floor(Math.random() * tksOrderLength);
                if (!tksRdm.includes(rdm)) {
                    tksRdm.push(rdm);
                }
            } while (tksRdm.length < tksOrderLength);

            dragdrop();
            listPlay();

            for (let i = 0; i < tksFile.length; i++) {
                displayDuration(tksFile[i], i);
            }
        }

        function listPlay() {
            let listAudio = document.querySelectorAll('.plyLst');
            for (let i = 0; i < listAudio.length; i++) {
                listAudio[i].addEventListener('mouseup', (e) => {
                    let parElt = e.target.parentElement;
                    let trkLP = parseInt(parElt.getAttribute('data-audiotrk'));
                    if (document.querySelector('[select]')) {
                        togglePlay();
                        document.querySelector('[select]').removeAttribute('select');
                        parElt.setAttribute('select', 'true');
                        parElt.setAttribute('playing', 'true');
                        player.setAttribute('src', tracks[trkLP].tUrl);
                        player.setAttribute('type', tracks[trkLP].tType);
                        info.textContent = tracks[trkLP].tName;
                        audioCtx.resume().then(() => {
                            playMusic(trkLP);
                        });
                    } else {
                        togglePlay();
                        parElt.setAttribute('select', 'true');
                        parElt.setAttribute('playing', 'true');
                        player.setAttribute('src', tracks[trkLP].tUrl);
                        player.setAttribute('type', tracks[trkLP].tType);
                        info.textContent = tracks[trkLP].tName;
                        audioCtx.resume().then(() => {
                            playMusic(trkLP);
                        }, false);
                    }
                });
            }
        }

        function nextTrack() {
            if (document.querySelectorAll('.plyLst').length > 0) {
                let actTrack = document.querySelector('[playing]') || document.querySelector('[select]');
                let fileaudio = parseInt(actTrack.getAttribute('data-audiotrk'));
                let fileaudioIndex = tksOrder.indexOf(fileaudio);

                if (shufOff.hasAttribute('active')) {
                    if (tksOrder[fileaudioIndex + 1] !== undefined) {
                        let listPosition = actTrack.getAttribute('data-place');
                        listPosition++;
                        togglePlay(document.querySelectorAll('.plyLst')[listPosition]);
                        player.currentTime = 0;
                        fileaudio = tksOrder[fileaudioIndex + 1];
                        setNext(fileaudio);
                    } else if (player.currentTime === player.duration) {
                        listEnd();
                    }
                }
                if (shufOn.hasAttribute('active')) {
                    let rdmIndex = tksRdm.indexOf(fileaudio);
                    if (tksRdm[rdmIndex + 1] !== undefined) {
                        let listPosition = tksRdm[rdmIndex + 1];
                        togglePlay(document.querySelectorAll('.plyLst')[listPosition]);
                        player.currentTime = 0;
                        fileaudio = tksRdm[rdmIndex + 1];
                        setNext(fileaudio);
                    } else if (player.currentTime === player.duration) {
                        listEnd();
                    }
                }
            }
        }

        function setNext(fileaudio) {
            player.setAttribute('src', tracks[fileaudio].tUrl);
            player.setAttribute('name', tracks[fileaudio].tName);
            player.setAttribute('type', tracks[fileaudio].tType);
            info.textContent = tracks[fileaudio].tName;
            audioCtx.resume().then(() => {
                playMusic(fileaudio);
            });
        }

        function prevTrack() {
            if (document.querySelectorAll('.plyLst').length > 0) {
                let actTrack = document.querySelector('[playing]') || document.querySelector('[select]');
                let fileaudio = parseInt(actTrack.getAttribute('data-audiotrk'));
                let fileaudioIndex = tksOrder.indexOf(fileaudio);

                if (shufOff.hasAttribute('active')) {
                    if (tksOrder[fileaudioIndex - 1] !== undefined) {
                        let listPosition = actTrack.getAttribute('data-place');
                        listPosition--;
                        togglePlay(document.querySelectorAll('.plyLst')[listPosition]);
                        player.currentTime = 0;
                        fileaudio = tksOrder[fileaudioIndex - 1];
                        setNext(fileaudio);
                    } else if (player.currentTime === player.duration) {
                        listEnd();
                    }
                }
                if (shufOn.hasAttribute('active')) {
                    let rdmIndex = tksRdm.indexOf(fileaudio);
                    if (tksRdm[rdmIndex - 1] !== undefined) {
                        let listPosition = tksRdm[rdmIndex - 1];
                        togglePlay(document.querySelectorAll('.plyLst')[listPosition]);
                        player.currentTime = 0;
                        fileaudio = tksRdm[rdmIndex - 1];
                        setNext(fileaudio);
                    } else if (player.currentTime === player.duration) {
                        listEnd();
                    }
                }
            }
        }

        function listEnd() {
            cancelAnimationFrame(drawWaveForm);
            audioCtx.suspend();
            cancelAnimationFrame(drawVisual);
        }

        function dragdrop() {
            let dragged;
            document.addEventListener('dragstart', function (e) {
                dragged = e.target;
                e.dataTransfer.setData('text', e.target.id);
            }, false);

            document.addEventListener("dragover", function (e) {
                e.preventDefault();
                if (e.target.parentElement.classList.contains('plyLst')) {
                    e.target.parentElement.classList.add('dragover');
                }
            }, false);

            document.addEventListener('dragexit', function (e) {
                e.target.parentElement.classList.remove('dragover');
            }, false);

            document.addEventListener('dragenter', function (e) {
            }, false);

            document.addEventListener('dragleave', function (e) {
                e.target.parentElement.classList.remove('dragover');
            }, false);

            document.addEventListener('drop', function (e) {
                e.preventDefault();
                if (e.target.parentElement.classList.contains('plyLst')) {

                    playList.insertBefore(dragged, e.target.parentElement);
                    let listTracks = document.getElementsByClassName('plyLst');
                    tksOrder = [];
                    for (let i = 0; i < listTracks.length; i++) {
                        listTracks[i].classList.remove('dragover');
                        listTracks[i].setAttribute('data-place', i);
                        if ((i % 2) === 0) {
                            listTracks[i].classList.remove('trI')
                            listTracks[i].classList.add('trP');
                        } else {
                            listTracks[i].classList.remove('trP');
                            listTracks[i].classList.add('trI');
                        }
                        let n = parseInt(listTracks[i].getAttribute('data-audiotrk'));
                        tksOrder.push(n);
                    }
                }
            }, false);
        }
    }

});