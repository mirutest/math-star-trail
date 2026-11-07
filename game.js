const levels = [
  {name:"加法", color:0x66ddff, questions:[["8 + 7",15,14,16],["23 + 16",39,37,49],["48 + 27",75,65,85]]},
  {name:"減法", color:0x91ffdd, questions:[["17 − 9",8,7,9],["42 − 18",24,26,34],["100 − 36",64,66,74]]},
  {name:"乘法", color:0xffd789, questions:[["3 × 7",21,18,24],["6 × 8",48,42,54],["9 × 7",63,56,72]]},
  {name:"除法", color:0xc4a7ff, questions:[["18 ÷ 3",6,5,9],["56 ÷ 7",8,7,9],["81 ÷ 9",9,8,10]]},
  {name:"混合", color:0xff9ebd, questions:[["(6 + 4) × 3",30,18,24],["36 ÷ 6 + 8",14,12,16],["50 − (7 × 6)",8,12,18]]},
];
const el = (id) => document.getElementById(id);
const touch = new Map();
for (const button of document.querySelectorAll("[data-key]")) {
  button.addEventListener("pointerdown", (event) => {
    button.setPointerCapture(event.pointerId);
    touch.set(event.pointerId, button.dataset.key);
  });
  button.addEventListener("lostpointercapture", (event) => touch.delete(event.pointerId));
}
window.addEventListener("blur", () => touch.clear());

class StarTrail extends (window.Phaser?.Scene ?? Object) {
  create() {
    this.stage = 0;
    this.round = 0;
    this.score = 0;
    this.balls = [];
    this.arrows = this.input.keyboard.createCursorKeys();
    this.letters = this.input.keyboard.addKeys("W,A,S,D");
    const sky = this.add.graphics();
    sky.fillStyle(0x111b37).fillRect(0, 0, 840, 420);
    for (let i = 0; i < 93; i++) {
      sky.fillStyle(0xbad4ff, 0.25 + (i % 5) / 8);
      sky.fillCircle((i * 173) % 840, (i * i * 43 + 17) % 420, i % 9 ? 1 : 2);
    }
    sky.lineStyle(1, 0x8199e5, 0.2);
    for (const radius of [66, 108, 150, 192]) sky.strokeCircle(420, 210, radius);
    sky.strokeRoundedRect(14, 14, 812, 392, 20);
    this.ship = this.add.container(420, 327, [
      this.add.ellipse(0, 19, 52, 20, 0x91ffdd, 0.2),
      this.add.triangle(0, 26, 0, 0, 20, 0, 10, 21, 0xffc470),
      this.add.triangle(0, 0, 0, 50, 25, 0, 50, 50, 0x91ffdd),
      this.add.circle(0, 4, 7, 0x233b78).setStrokeStyle(2, 0xffffff),
    ]).setDepth(2);
    this.progress();
    this.prompt("✦ 開始太空任務", "移動太空船，碰到答案球就能收集它。", "開始探險", () => this.question());
  }

  progress() {
    el("levels").replaceChildren(...levels.map(({name}, index) => {
      const item = document.createElement("span");
      item.textContent = index < this.stage ? `✓ ${name}` : `${index + 1} · ${name}`;
      if (index === this.stage) {
        item.className = "active";
        item.setAttribute("aria-current", "step");
      }
      return item;
    }));
  }

  prompt(title, details, label, next) {
    this.running = false;
    el("message").textContent = title;
    el("details").textContent = details;
    el("action").textContent = label;
    el("action").disabled = false;
    el("action").onclick = next;
    el("overlay").hidden = false;
  }

  question() {
    el("overlay").hidden = true;
    const level = levels[this.stage];
    const [expression, answer, ...decoys] = level.questions[this.round];
    this.answer = answer;
    this.progress();
    el("level").textContent = `第 ${this.stage + 1} 關・${level.name}　${this.round + 1} / ${level.questions.length}`;
    el("question").textContent = `${expression} = ?`;
    el("feedback").textContent = "移動太空船，碰觸正確的數字球。";
    this.ship.setPosition(420, 327);
    this.balls = Phaser.Utils.Array.Shuffle([answer, ...decoys]).map((value, index) => {
      const orb = this.add.container(155 + index * 265, index === 1 ? 105 : 170, [
        this.add.circle(0, 0, 49, level.color, 0.12),
        this.add.circle(0, 0, 38, 0x23335a).setStrokeStyle(3, level.color),
        this.add.text(0, 0, String(value), {fontFamily:"system-ui",fontSize:"30px",fontStyle:"bold"}).setOrigin(0.5),
      ]);
      return {value, orb};
    });
    this.running = true;
  }

  collect(ball) {
    if (ball.value !== this.answer) {
      this.score -= 5;
      el("score").textContent = this.score;
      this.balls = this.balls.filter((option) => option !== ball);
      ball.orb.destroy();
      el("feedback").textContent = `${ball.value} 不正確，−5 分。再算一次！`;
      return;
    }
    this.score += 10;
    el("score").textContent = this.score;
    el("feedback").textContent = `答對了！答案是 ${this.answer}，+10 分。`;
    for (const {orb} of this.balls) orb.destroy();
    this.balls = [];
    this.round++;
    if (this.round < levels[this.stage].questions.length) {
      this.prompt("✦ 答對了！", "準備收集下一題的答案球。", "下一題", () => this.question());
      return;
    }
    const completed = levels[this.stage].name;
    this.round = 0;
    this.stage++;
    this.progress();
    if (this.stage < levels.length) {
      this.prompt(`✦ ${completed}關通過！`, `下一站是${levels[this.stage].name}星球。`, "前往下一關", () => this.question());
      return;
    }
    el("level").textContent = "任務完成";
    el("question").textContent = "五關全通過";
    this.prompt("✦ 探險成功！", `你完成了全部 15 題，總分 ${this.score} / 150。`, "再玩一次", () => {
      this.stage = 0;
      this.score = 0;
      el("score").textContent = "0";
      this.question();
    });
  }

  update(_time, delta) {
    if (!this.running) return;
    const pressed = [...touch.values()];
    const held = (direction, letter) => this.arrows[direction].isDown || this.letters[letter].isDown || pressed.includes(direction);
    const x = Number(held("right", "D")) - Number(held("left", "A"));
    const y = Number(held("down", "S")) - Number(held("up", "W"));
    const step = 0.27 * Math.min(delta, 40) / (Math.hypot(x, y) || 1);
    this.ship.x = Phaser.Math.Clamp(this.ship.x + x * step, 28, 812);
    this.ship.y = Phaser.Math.Clamp(this.ship.y + y * step, 32, 386);
    const hit = this.balls.find(({orb}) => Math.hypot(this.ship.x - orb.x, this.ship.y - orb.y) < 49);
    if (hit) this.collect(hit);
  }
}

if (window.Phaser) {
  new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game",
    width: 840,
    height: 420,
    scale: {mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH},
    scene: StarTrail,
  });
} else {
  el("details").textContent = "無法載入 Phaser。請確認網路連線後重新整理。";
}
