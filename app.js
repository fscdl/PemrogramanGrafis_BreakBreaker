window.addEventListener('load', () => {

    // Mendapatkan elemen tombol fullscreen
    const fullScreenButton = document.querySelector('#fullScreenButton');

    // SUARA
    const penaltyCollision = new Audio('./sound/penalty-collision.mp3');
    const penaltyRemove = new Audio('./sound/penalty-remove.mp3');
    const paddleCollision = new Audio('./sound/paddle-collision.wav');
    const blockCollision = new Audio('./sound/block-collision.mp3');
    const lifeLost = new Audio('./sound/death.wav');

    // Mendapatkan elemen canvas dan context 2D
    const canvas = document.querySelector('#canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 1400;
    canvas.height = 720;

    // VARIABEL
    let startGame = false;
    let gameOver = false;
    let firstGame = true;
    let score = 0;

    // EVENT LISTENERS
    class InputHandler {
        constructor() {
            this.keys = [];
            this.touchX = '';
            // Menangani event keydown
            window.addEventListener('keydown', e => {
                if ((
                    e.key === 'ArrowRight' ||
                    e.key === 'ArrowLeft') &&
                    this.keys.indexOf(e.key) === -1) {
                        this.keys.push(e.key);
                } 
                if (e.key === 'Enter') startGame = true;
                if (e.key === 'Enter' && gameOver) restartGame();
            });
            // Menangani event keyup
            window.addEventListener('keyup', e => {
                if (e.key === 'ArrowRight' ||
                    e.key === 'ArrowLeft') {
                        this.keys.splice(this.keys.indexOf(e.key), 1);
                }
            });
            // Menangani event touchstart
            window.addEventListener('touchstart', () => {       
                startGame = true;
                if (gameOver) restartGame();
            });
            // Menangani event touchmove
            window.addEventListener('touchmove', e => {
                this.touchX = e.touches[0].clientX ;
                if (this.keys.indexOf('touch') === -1) this.keys.push('touch');
            })
            // Menangani event touchend
            window.addEventListener('touchend', () => {
                this.keys.splice(this.keys.indexOf('touch'), 1);
            })
        }
    };

    // PADDLE
    class Paddle {
        constructor() {
            this.width = 200;
            this.height = 30;
            this.offsetY = 70;
            this.image = document.querySelector('#paddle');
            this.positionX = (canvas.width / 2) - (this.width / 2);
            this.positionY = (canvas.height - this.height) - this.offsetY;
            this.speed = 10;
        }
        update() {
            // Mengupdate posisi paddle berdasarkan input
            if (input.keys.includes('ArrowRight')) {
                this.positionX += this.speed;
            } else if (input.keys.includes('ArrowLeft')) {
                this.positionX -= this.speed;
            } else if (input.keys.includes('touch')) {
                this.positionX = input.touchX / canvas.clientWidth * canvas.width - this.width / 2;
            }

            // Membatasi paddle agar tidak keluar dari canvas
            if (this.positionX + this.width > canvas.width) this.positionX = canvas.width - this.width;
            if (this.positionX < 0) this.positionX = 0;
        }
        reset() {
            this.positionX = (canvas.width / 2) - (this.width / 2),
            this.positionY = (canvas.height - this.height) - this.offsetY
        }
        draw() {
            ctx.drawImage(this.image, this.positionX, this.positionY, this.width, this.height);
        }
    };

    // BALL
    class Ball {
        constructor() {
            this.radius = 10;
            this.positionX = (paddle.width / 2) + paddle.positionX;
            this.positionY = paddle.positionY - this.radius;
            this.dx = 5;
            this.dy = -5;
            this.velocity = 7;
        }
        update(deltaTime) {
            // Mengupdate posisi bola saat permainan dimulai
            if (startGame) {
                this.positionX += this.dx * (deltaTime / 10);
                this.positionY += this.dy * (deltaTime / 10);
            } else {
                this.reset();
            }

            // Tabrakan dengan dinding
            if (this.positionX + this.radius > canvas.width || this.positionX - this.radius < 0) {
                this.dx *= -1;
            } else if (this.positionY - this.radius < 0) {
                this.dy *= -1;
            } else if (this.positionY + this.radius > canvas.height) {
                heart.loseLife();
                this.reset();
            }

            // Tabrakan dengan paddle
            if (this.positionX + this.radius > paddle.positionX &&
                this.positionX < paddle.positionX + paddle.width &&
                this.positionY + this.radius > paddle.positionY &&
                this.positionY < paddle.positionY + paddle.height) {

                paddleCollision.play();

                let collidePoint = ball.positionX - (paddle.positionX + paddle.width / 2);
                collidePoint = collidePoint / (paddle.width / 2);

                let angle = collidePoint * Math.PI / 3;

                ball.dx = ball.velocity * Math.sin(angle)
                ball.dy = -ball.velocity * Math.cos(angle) 
            }
        }
        reset() {
            this.positionX = (paddle.width / 2) + paddle.positionX;
            this.positionY = paddle.positionY - this.radius;
        }
        draw() {
            ctx.beginPath();
            ctx.fillStyle = "crimson";
            ctx.arc(this.positionX, this.positionY, this.radius, 0, 2 * Math.PI);
            ctx.fill();
        }
    };

    // BACKGROUND
    class Background {
        constructor() {
            this.x = 0;
            this.y = 0;
            this.width = canvas.width;
            this.height = canvas.height;
            this.image = document.querySelector('#layer');
        }
        draw() {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    };

    // BRICK
    class Brick {
        constructor() {
            this.width = 100;
            this.height = 30;
            this.offsetX = 20;
            this.offsetY = 20;
            this.offsetTop = 50;
            this.offsetLeft = 50;
            this.row = 3;
            this.column = 11;
            this.bricks = [];
            this.createBricks();
        }
        update() {
            // Tabrakan dengan brick
            this.bricks.forEach(row => {
                row.forEach(brick => {
                    if (brick.visible) {
                        if (ball.positionX + ball.radius > brick.x &&
                            ball.positionX - ball.radius < brick.x + this.width &&
                            ball.positionY + ball.radius > brick.y &&
                            ball.positionY - ball.radius < brick.y + this.height) {
                                blockCollision.play();
                                score ++;
                                if (score === 33) {
                                    brick.visible = false;
                                    gameOver = true;
                                }; 
                                const centerX = brick.x + this.width / 2;
                                const centerY = brick.y + this.height / 2;
                                particles.createParticles(centerX, centerY);
                                penalty.createPenalty(centerX, centerY);
                                ball.dy *= -1;
                                brick.visible = false;  
                        }
                    };
                })
            });
        }
        createBricks() {
            for (let c = 0; c < this.column; c++) {
                this.bricks[c] = [];
                for (let r = 0; r < this.row; r++) {
                    this.bricks[c][r] = {
                        x: c * (this.width + this.offsetX) + this.offsetLeft,
                        y: r * (this.height + this.offsetY) + this.offsetTop ,
                        visible: true
                    };
                };
            };
        }
        draw() {
            this.bricks.forEach(row => {
                row.forEach(brick => {
                    if (brick.visible) {
                        ctx.beginPath();
                        ctx.fillStyle = '#5066f2';
                        ctx.fillRect(brick.x, brick.y, this.width, this.height);
                        ctx.fill();
                    };
                });
            });
        }
    };

    // PARTIKEL
    class Particles {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.gravity = 0.2;
            this.dx = Math.random() * 5 - 2.5;
            this.dy = Math.random() * -5 - 2.5;
            this.radius = Math.random() * 7 + 3;
            this.numberOfParticles = 10;
            this.particles = [];
            this.life = 100; 
        }
        createParticles(brickX, brickY) {
            for (let i = 0; i < this.numberOfParticles; i++) {
                this.particles.push(new Particles(brickX, brickY));
            };
        }
        update(deltaTime) {
            // Animasikan dan hapus partikel
            this.particles.forEach((particle, index) => {
                particle.y += particle.dy;
                particle.x += particle.dx;
                particle.dy += particle.gravity * (deltaTime * 0.2);
                particle.life --;
                if (particle.life <= 0) {
                    this.particles.splice(index, 1);
                }
            });
        }
        draw() {
            this.particles.forEach(particle => {
                ctx.beginPath();
                ctx.fillStyle = '#5066f2';
                ctx.arc(particle.x, particle.y, particle.radius, 0, 2 * Math.PI);
                ctx.fill();
            });
        }
        reset() {
            this.particles = [];
        }
    }

    // PENALTI
    class Penalty {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.width = 70;
            this.height = 70;
            this.image = document.querySelector('#penalty');
            this.weight = Math.random() * 2 + 1;
            this.duration = 1000;
            this.collision = false;
            this.penalty = [];
        }
        createPenalty(brickX, brickY) { 
            const centerX = brickX - this.width / 2;
            const centerY = brickY - this.height / 2;
            this.penalty.push(new Penalty(centerX, centerY));   
        } 
        update(deltaTime) {
            this.penalty.forEach((penalty, index) => {
                penalty.y += penalty.weight * (deltaTime * 0.2);
                // Tabrakan dengan paddle
                if (penalty.x + penalty.width > paddle.positionX &&
                    penalty.x < paddle.positionX + paddle.width &&
                    penalty.y + penalty.height > paddle.positionY &&
                    penalty.y < paddle.positionY + paddle.height) {
                    this.collision = true;
                    // Menambahkan efek suara
                    if (this.collision && this.duration === 1000) {
                        penaltyCollision.play();
                    }
                // Menghapus penalty
                } else if (penalty.y + penalty.height > canvas.height) {
                    this.penalty.splice(index, 1);
                }      
            }); 

            // Penalti
            if (this.collision) {
                this.duration --;
                paddle.width = 100;
                if (this.duration <= 0) {
                    this.collision = false;
                    this.duration = 1000;
                    paddle.width = 200;
                    penaltyRemove.play();
                }
            }
        }
        draw() {
            this.penalty.forEach(penalty => {
                ctx.drawImage(penalty.image, penalty.x, penalty.y, penalty.width, penalty.height);
            });
        }
        reset() {
            this.penalty = [];
            this.duration = 1000;
            this.collision = false;
            paddle.width = 200;
        }
    };

    // NYAWA
    class Heart {
        constructor() {
          this.width = 30;
          this.height = 30;
          this.image = document.getElementById("heart");
          this.numberlife = 3;
          this.life = [];
          this.createLife();
        }
        createLife() {
          for (let i = 0; i < this.numberlife; i++) {
            this.life.push({ width: this.width, height: this.height });
          }
        }
        draw() {
          this.life.forEach((life, index) => {
            ctx.drawImage(this.image, life.width * index + 10, 10, life.width, life.height); 
          });
        }
        loseLife() {
            this.life.pop();
            lifeLost.play();
            if (this.life.length === 0) {
                gameOver = true;
            }
        }
        reset() {
            this.life = [];
            this.createLife();
        }
    }
      
    // INFORMASI PERMAINAN
    function gameInfos() {
        if (!startGame && firstGame) {
            ctx.font = '50px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#000';
            ctx.fillText('Gunakan Arrow Kanan & Kiri untuk bergerak!', (canvas.width / 2) + 2, (canvas.height -250) + 2);
            ctx.fillStyle = '#fff';
            ctx.fillText('Gunakan Arrow Kanan & Kiri untuk bergerak!', canvas.width / 2, canvas.height - 250);
            ctx.fillStyle = '#000';
            ctx.fillText('Tekan Enter untuk memulai!', (canvas.width / 2) + 2, (canvas.height -200) + 2);
            ctx.fillStyle = '#fff';
            ctx.fillText('Tekan Enter untuk memulai!', canvas.width / 2, canvas.height - 200);
        } 
        if (score > 0) {
            ctx.font = '30px sans-serif';
            ctx.fillStyle = '#000';
            ctx.fillText(`Skor: ${score}`, canvas.width / 2 + 2, 37);
            ctx.fillStyle = '#fff';
            ctx.fillText(`Skor: ${score}`, canvas.width / 2, 35);
        }
        if (gameOver) {
            ctx.font = '50px sans-serif';
            ctx.fillStyle = '#000';
            ctx.fillText('Game Over, tekan Enter untuk memulai ulang!', (canvas.width / 2) + 2, (canvas.height - 200) + 2);
            ctx.fillStyle = '#fff';
            ctx.fillText('Game Over, tekan Enter untuk memulai ulang!', canvas.width / 2, canvas.height - 200);
        }
    };

    // RESTART PERMAINAN
    function restartGame() {
        penalty.reset();
        brick.createBricks();
        paddle.reset();
        ball.reset();
        particles.reset();
        heart.reset();
        firstGame = false;
        score = 0;
        startGame = false;
        gameOver = false;
        gameLoop();
    };

    // MODE FULLSCREEN
    function toggleFullScreen() {
        if (!document.fullscreenElement) {
            canvas.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message}`);
            });    
        } else {
            document.exitFullscreen();
        }
    };
    fullScreenButton.addEventListener('click', toggleFullScreen);

    // INISIASI
    const paddle = new Paddle();
    const ball = new Ball();
    const background = new Background();
    const input = new InputHandler();
    const brick = new Brick();
    const particles = new Particles();
    const penalty = new Penalty();
    const heart = new Heart();

    // MENGGAMBAR
    function draw() {
        background.draw();
        paddle.draw();
        ball.draw();
        brick.draw();
        particles.draw();
        penalty.draw();
        heart.draw();
        gameInfos();     
    };
    
    // UPDATE
    function update(deltaTime) {
        paddle.update();
        ball.update(deltaTime);
        brick.update();
        particles.update(deltaTime);
        penalty.update(deltaTime);
    };

    // TIMESTAMP
    let lastTime = 0;

    // LOOP GAME
    function gameLoop(timeStamp) {
        let deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        update(deltaTime);
        draw();

        if (!gameOver) requestAnimationFrame(gameLoop);
    };
    gameLoop(0);
});
