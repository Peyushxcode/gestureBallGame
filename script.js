const canvas = document.getElementById("gameCanvas");
        const ctx = canvas.getContext("2d");
        const gestureResult = document.getElementById("gestureResult");

        let ball = { x: canvas.width / 2, y: canvas.height - 30, radius: 15 };
        let obstacles = [];
        let gameSpeed = 2;
        let score = 0;

        function addObstacle() {
            const x = Math.random() * (canvas.width - 20);
            obstacles.push({ x: x, y: 0, width: 20, height: 20 });
        }

        function drawBall() {
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fillStyle = "blue";
            ctx.fill();
            ctx.closePath();
        }

        function drawObstacles() {
            ctx.fillStyle = "red";
            obstacles.forEach(obstacle => {
                ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            });
        }

        function updateObstacles() {
            obstacles.forEach(obstacle => {
                obstacle.y += gameSpeed;
            });
            obstacles = obstacles.filter(obstacle => obstacle.y < canvas.height);
        }

        function checkCollision() {
            for (let obstacle of obstacles) {
                const distX = ball.x - obstacle.x - obstacle.width / 2;
                const distY = ball.y - obstacle.y - obstacle.height / 2;
                const distance = Math.sqrt(distX * distX + distY * distY);
                if (distance < ball.radius + obstacle.width / 2) {
                    alert("Game Over! Score: " + score);
                    resetGame();
                }
            }
        }

        function resetGame() {
            obstacles = [];
            score = 0;
            ball.x = canvas.width / 2;
        }

        function gameLoop() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawBall();
            drawObstacles();
            updateObstacles();
            checkCollision();
            score++;
            requestAnimationFrame(gameLoop);
        }

        // Load TensorFlow.js and the HandPose model
        async function loadModel() {
            const model = await handpose.load();
            console.log("HandPose model loaded.");
            return model;
        }

        // Recognize hand gestures
        async function recognizeGestures(model) {
            const video = document.createElement('video');
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;

            video.onloadedmetadata = () => {
                video.play();
                detectGestures(model, video);
            };
        }

        // Detect specific gestures
        async function detectGestures(model, video) {
            const predictions = await model.estimateHands(video);
            if (predictions.length > 0) {
                const landmarks = predictions[0].landmarks;
                const gesture = detectGesture(landmarks);
                gestureResult.innerHTML = gesture;

                if (gesture === "Move Left Gesture Detected!") {
                    ball.x -= 5; // Move ball left
                } else if (gesture === "Move Right Gesture Detected!") {
                    ball.x += 5; // Move ball right
                }
            }

            requestAnimationFrame(() => detectGestures(model, video));
        }

        function detectGesture(landmarks) {
            const thumbTip = landmarks[4];   // Thumb tip
            const indexTip = landmarks[8];    // Index finger tip

            // Define the gesture thresholds for left and right movement
            const threshold = 15;

            // Move Left Gesture: Index finger up and thumb to the side
            const isMoveLeft = indexTip[0] < thumbTip[0] - threshold;

            // Move Right Gesture: Index finger up and thumb to the opposite side
            const isMoveRight = indexTip[0] > thumbTip[0] + threshold;

            if (isMoveLeft) {
                return "Move Left Gesture Detected!";
            } else if (isMoveRight) {
                return "Move Right Gesture Detected!";
            } else {
                return "No Gesture Detected.";
            }
        }

        // Start the game
        async function main() {
            const model = await loadModel();
            recognizeGestures(model);
            setInterval(addObstacle, 1000); // Add a new obstacle every second
            gameLoop(); // Start the game loop
        }

        main();