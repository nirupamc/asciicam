let capture;
        let asciiDiv;
        let mediaRecorder;
        let recordedChunks = [];
        let isRecording = false;
        let isCameraStarted = false;

        const ASCII_SETS = {
            'Classic': '@%#*+=-:. ',
            'Blocks': '█▓▒░ ',
            'Dotted': '⣿⡆⠂ '
        };

        let currentAsciiSet = ASCII_SETS['Classic'];
        let contrast = 1.0;
        let brightness = 0;
        let asciiSize = 8;
        let asciiWidth, asciiHeight;

        function setup() {
            noCanvas();
            asciiDiv = select('#ascii-output');

            select('#startCamera').mousePressed(toggleCamera);
            select('#capturePhoto').mousePressed(capturePhoto);
            select('#startRecord').mousePressed(startRecording);
            select('#stopRecord').mousePressed(stopRecording);
            select('#asciiSet').changed(() => currentAsciiSet = ASCII_SETS[select('#asciiSet').value()]);
            select('#brightness').input(() => brightness = parseFloat(select('#brightness').value()));
            select('#contrast').input(() => contrast = parseFloat(select('#contrast').value()));
            windowResized();
        }

        function toggleCamera() {
            if (!isCameraStarted) {
                capture = createCapture(VIDEO);
                capture.style('transform', 'scaleX(-1)');
                capture.size(640, 480);
                capture.hide();
                isCameraStarted = true;
                select('#startCamera').html('Stop Camera');
                select('#capturePhoto').removeAttribute('disabled');
                select('#startRecord').removeAttribute('disabled');
            } else {
                if (capture) {
                    capture.remove();
                }
                asciiDiv.html('');
                isCameraStarted = false;
                select('#startCamera').html('Start Camera');
                select('#capturePhoto').attribute('disabled', '');
                select('#startRecord').attribute('disabled', '');
                select('#stopRecord').attribute('disabled', '');
            }
        }

        function draw() {
            if (capture && capture.loadedmetadata) {
                let asciiImage = '';
                capture.loadPixels();

                for (let y = 0; y < asciiHeight; y++) {
                    for (let x = asciiWidth - 1; x >= 0; x--) {
                        const pixelX = floor(map(x, 0, asciiWidth, 0, capture.width));
                        const pixelY = floor(map(y, 0, asciiHeight, 0, capture.height));
                        const index = (pixelY * capture.width + pixelX) * 4;

                        let r = capture.pixels[index];
                        let g = capture.pixels[index + 1];
                        let b = capture.pixels[index + 2];

                        let brightnessValue = ((r + g + b) / 3 + brightness) * contrast;
                        brightnessValue = constrain(brightnessValue, 0, 255);

                        const charIndex = floor(map(brightnessValue, 0, 255, 0, currentAsciiSet.length - 1));
                        asciiImage += currentAsciiSet[charIndex];
                    }
                    asciiImage += '\n';
                }

                asciiDiv.style('font-size', `${asciiSize}px`);
                asciiDiv.html(asciiImage);
            }
        }

        function capturePhoto() {
            const link = document.createElement('a');
            link.download = 'ascii-photo.txt';
            link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(asciiDiv.html());
            link.click();
        }

        function startRecording() {
            recordedChunks = [];
            const stream = asciiDiv.elt.captureStream(30);
            mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    recordedChunks.push(e.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'ascii-recording.webm';
                link.click();
                URL.revokeObjectURL(url);
            };
            
            mediaRecorder.start();
            isRecording = true;
            select('#startRecord').attribute('disabled', '');
            select('#stopRecord').removeAttribute('disabled');
        }

        function stopRecording() {
            if (mediaRecorder && isRecording) {
                mediaRecorder.stop();
                isRecording = false;
                select('#startRecord').removeAttribute('disabled');
                select('#stopRecord').attribute('disabled', '');
            }
        }

        function windowResized() {
            let containerWidth = select('.container').width;
            asciiWidth = Math.floor(containerWidth / 8);
            asciiHeight = Math.floor(asciiWidth * 3 / 4);
        }