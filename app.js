let capture;
        let asciiDiv;
        let mediaRecorder;
        let recordedChunks = [];
        let isRecording = false;
        let isCameraStarted = false;
        
        const ASCII_CHARS = '@%#*+=-:. ';
        const WIDTH = 640;
        const HEIGHT = 480;
        const ASCII_WIDTH = 160;
        const ASCII_HEIGHT = 120;

        function setup() {
            noCanvas();
            asciiDiv = select('#ascii-output');
            
            select('#startCamera').mousePressed(toggleCamera);
            select('#capturePhoto').mousePressed(capturePhoto);
            select('#startRecord').mousePressed(startRecording);
            select('#stopRecord').mousePressed(stopRecording);
        }

        function toggleCamera() {
            if (!isCameraStarted) {
                capture = createCapture(VIDEO);
                capture.style('transform', 'scaleX(-1)'); // Mirror the video feed
                capture.size(WIDTH, HEIGHT);
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
                
                for (let y = 0; y < ASCII_HEIGHT; y++) {
                    // Mirror the output by reading pixels from right to left
                    for (let x = ASCII_WIDTH - 1; x >= 0; x--) {
                        const pixelX = floor(map(x, 0, ASCII_WIDTH, 0, WIDTH));
                        const pixelY = floor(map(y, 0, ASCII_HEIGHT, 0, HEIGHT));
                        const index = (pixelY * WIDTH + pixelX) * 4;
                        
                        const r = capture.pixels[index];
                        const g = capture.pixels[index + 1];
                        const b = capture.pixels[index + 2];
                        
                        const brightness = (r + g + b) / 3;
                        const charIndex = floor(map(brightness, 0, 255, 0, ASCII_CHARS.length - 1));
                        asciiImage += ASCII_CHARS[charIndex];
                    }
                    asciiImage += '\n';
                }
                
                asciiDiv.html(asciiImage);
            }
        }

        function capturePhoto() {
            if (!capture) return;
            
            const tempCanvas = document.createElement('canvas');
            const ctx = tempCanvas.getContext('2d');
            tempCanvas.width = ASCII_WIDTH * 8;
            tempCanvas.height = ASCII_HEIGHT * 8;
            
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            // Mirror the canvas context for the saved image
            ctx.scale(-1, 1);
            ctx.translate(-tempCanvas.width, 0);
            
            ctx.fillStyle = '#33ff33';
            ctx.font = '8px monospace';
            
            const asciiArt = asciiDiv.html().split('\n');
            asciiArt.forEach((line, y) => {
                ctx.fillText(line, 0, y * 8);
            });
            
            // Reset transform for future drawings
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            
            const link = document.createElement('a');
            link.download = 'ascii-photo.png';
            link.href = tempCanvas.toDataURL();
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