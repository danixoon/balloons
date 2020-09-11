function getRandomValue(min, max) {
  return Math.random() * (max - min) + min;
}

function getBallElement(width) {
  const ball = document.createElement("img");
  ball.classList.add("ball");
  ball.setAttribute("width", width);
  ball.setAttribute("src", `./ball${Math.floor(getRandomValue(0, 3))}.gif`);
  ball.setAttribute("style", `bottom: 0px; left: ${-width}px;`);

  return ball;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(x, a, b) {
  return x < a ? a : x > b ? b : x;
}

function game() {
  const spriteRatio = 300 / 600;
  const gameObjects = new Set();
  const gameDiv = document.getElementById("game");

  let globalWind = 0;
  let globalDifficulty = 1;
  let gameTime = 0;
  let gameState = "game";
  let mouse = { x: 0, y: 0 };
  let score = 0;
  let maxScore = 0;

  gameDiv.addEventListener("mousemove", function (ev) {
    mouse = ev;
  });

  class Spawner {
    constructor() {
      this.time = 0;
      this.interval = 1000;
      this.ended = false;
    }
    update() {
      if (gameState !== "end") {
        this.interval = 1000 / globalDifficulty;
      } else this.interval = 200;

      if (gameTime > this.time + this.interval) {
        this.spawnBall();
        this.time = gameTime;
      }
    }
    spawnBall() {
      const size = getRandomValue(
        100 / globalDifficulty,
        200 / globalDifficulty
      );
      gameObjects.add(
        new Ball({
          size,
          speed: getRandomValue(4 * globalDifficulty, 6 * globalDifficulty),
          y: 0,
          x: getRandomValue(10, gameDiv.offsetWidth - 10 - size),
          bounce: clamp(0.3 * globalDifficulty, 0.3, 0.9),
        })
      );
    }
  }

  class Pin {
    constructor() {
      this.x = 0;
      this.pin = document.createElement("img");
      this.pin.classList.add("pin");
      this.pin.setAttribute("src", "./pin.png");
      gameDiv.append(this.pin);
    }
    update() {
      this.x = mouse.x;
      this.pin.setAttribute("style", `left: ${this.x - 25}px;`);
    }
  }

  class Ball {
    constructor({ size = 100, speed = 2, x = 0, y = -1000, bounce = 0.6 }) {
      const ballElement = getBallElement(size);
      this.element = ballElement;
      this.y = y;
      this.x = x;
      this.dx = 0;
      this.size = size;
      this.speed = speed;
      this.bounce = bounce;

      this.offset = Math.random();

      gameDiv.append(ballElement);
    }
    update = (delta) => {
      const centerX = gameDiv.offsetWidth / 2;
      const dir = centerX - this.x;

      this.y += this.speed * delta;
      this.dx = lerp(this.dx, dir + globalWind, 0.002 * delta);

      const _x = this.x + this.dx;
      if (Math.abs(_x - centerX) > centerX - this.size / 2) {
        this.x = centerX + (centerX - this.size / 2) * Math.sign(this.dx);
        this.dx = -this.dx * this.bounce;
      } else this.x += this.dx;

      this.element.setAttribute(
        "style",
        `left: ${this.x - this.size / 2}px; top: ${
          gameDiv.offsetHeight - this.y
        }px`
      );

      if (this.y > gameDiv.offsetHeight + this.size / spriteRatio) {
        this.destroy();
        maxScore++;
      }
      if (
        gameState !== "end" &&
        this.y < gameDiv.offsetHeight &&
        this.y >= gameDiv.offsetHeight - 100 &&
        Math.abs(mouse.x - this.x) <= 50
      ) {
        score++;
        this.destroy();
      }
    };
    destroy = () => {
      this.inactive = true;
      this.element.classList.add("dissapear");
      setTimeout(() => {
        this.element.remove();
        gameObjects.delete(this);
      }, 200);
    };
  }

  let stop = false;

  function gameLoop(lastMs) {
    requestAnimationFrame((ms) => {
      if (stop) return;

      const delta = ms - lastMs;

      gameObjects.forEach((o) => !o.inactive && o.update(delta / 16.666));

      gameTime += delta;
      globalDifficulty = clamp(gameTime / 60000 + 1, 1, 2);
      globalWind = Math.cos(Date.now() / 1000) * 400 * globalDifficulty;

      if (gameTime > 60000 && gameState !== "end") {
        gameState = "end";
        document.getElementsByClassName("score__amount")[0].innerHTML = score;
        document.getElementsByClassName("score__max")[0].innerHTML = maxScore;

        gameDiv.classList.add("hide");
        setTimeout(() => {
          stop = true;
        }, 2000);
      }

      // console.log(gameTime);

      gameLoop(ms);
    });
  }
  gameLoop(performance.now());
  gameObjects.add(new Spawner());
  gameObjects.add(new Pin());
}

document.addEventListener("DOMContentLoaded", game);
