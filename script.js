const ADMIN_PASSWORT = "Kicker2026";

const menuButton = document.getElementById("menuButton");
const menu = document.getElementById("menu");
const baum = document.getElementById("baum");

let spieler = JSON.parse(localStorage.getItem("spieler")) || [];
let baumDaten = JSON.parse(localStorage.getItem("baum")) || [];
let bg = localStorage.getItem("bg") || "white";

let championMode = false;

/* INIT */
applyBackground(bg);
updateSpielerListe();
updateTurnierbaum();

if (checkAdmin()) showAdmin();

/* MENU */
menuButton.onclick = () => menu.classList.toggle("open");

document.addEventListener("click", (e) => {
  if (!menu.contains(e.target) && e.target !== menuButton) {
    menu.classList.remove("open");
  }
});

/* LOGIN */
function login() {
  const pw = document.getElementById("password").value;
  if (pw === ADMIN_PASSWORT) {
    localStorage.setItem("admin", "true");
    localStorage.setItem("adminExpires", Date.now() + 30 * 60 * 1000);
    showAdmin();
  }
}

function checkAdmin() {
  const expires = Number(localStorage.getItem("adminExpires") || 0);
  if (expires < Date.now()) {
    localStorage.removeItem("admin");
    localStorage.removeItem("adminExpires");
    return false;
  }
  return localStorage.getItem("admin") === "true";
}

function showAdmin() {
  document.getElementById("login").classList.add("hidden");
  document.getElementById("adminBereich").classList.remove("hidden");
}

function logout() {
  localStorage.removeItem("admin");
  localStorage.removeItem("adminExpires");
  location.reload();
}

document.getElementById("password").addEventListener("keydown", e => {
  if (e.key === "Enter") login();
});

document.getElementById("showPw").onchange = e => {
  document.getElementById("password").type = e.target.checked ? "text" : "password";
};

/* SPIELER */
function spielerHinzufuegen() {
  const input = document.getElementById("spielerName");
  const name = input.value.trim();
  if (!name) return;

  spieler.push(name);
  input.value = "";
  save();
  updateSpielerListe();

  if (!isPowerOfTwo(spieler.length) || spieler.length < 2 || spieler.length > 128) {
    updateTurnierbaum();
    return;
  }

  initTurnier();
}

function resetSpieler() {
  if (!confirm("Turnier wirklich zurücksetzen?")) return;
  spieler = [];
  baumDaten = [];
  save();
  updateSpielerListe();
  updateTurnierbaum();
}

function updateSpielerListe() {
  const liste = document.getElementById("spielerListe");
  liste.innerHTML = "";
  spieler.forEach(s => {
    const li = document.createElement("li");
    li.textContent = s;
    liste.appendChild(li);
  });
}

/* TURNIER */
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}

function isPowerOfTwo(n) {
  return n > 1 && (n & (n - 1)) === 0;
}

function initTurnier() {
  if (!isPowerOfTwo(spieler.length)) {
    baumDaten = [];
    updateTurnierbaum();
    return;
  }

  shuffle(spieler);
  baumDaten = [];

  let runde = [];
  for (let i = 0; i < spieler.length; i += 2) {
    runde.push({ p1: spieler[i], p2: spieler[i + 1], winner: null });
  }

  baumDaten.push(runde);
  save();
  updateTurnierbaum();
}

function setWinner(r, m, w) {
  const match = baumDaten[r][m];
  if (match.winner) return;

  match.winner = w;

  if (!baumDaten[r + 1]) baumDaten[r + 1] = [];

  const nextIndex = Math.floor(m / 2);

  if (!baumDaten[r + 1][nextIndex]) {
    baumDaten[r + 1][nextIndex] = { p1: w, p2: null, winner: null };
  } else {
    baumDaten[r + 1][nextIndex].p2 = w;
  }

  save();
  updateTurnierbaum();
}

function updateTurnierbaum() {
  baum.innerHTML = "";
  const lines = document.getElementById("baumLines");
  lines.innerHTML = "";

  if (!baumDaten.length) {
    baum.innerHTML = "<p>Bitte 2–128 Spieler eintragen (nur 2,4,8,16,32,64,128).</p>";
    hideChampionBox();
    return;
  }

  const rounds = baumDaten.length;
  baum.style.gridTemplateColumns = `repeat(${rounds}, 1fr)`;

  baumDaten.forEach((runde, r) => {
    const col = document.createElement("div");
    col.classList.add("runde");

    runde.forEach((m, i) => {
      const d = document.createElement("div");
      d.className = "match" + (m.winner ? " winner" : "");
      if (r === rounds - 1) d.classList.add("finale");

      if (r === rounds - 1 && m.winner) {
        d.innerHTML = `<strong>${m.winner}</strong> 👑 Champion`;
      } else {
        d.innerHTML = `<strong>${m.p1 || "?"}</strong> vs <strong>${m.p2 || "?"}</strong>`;
      }

      if (!m.winner && m.p1 && m.p2) {
        const b1 = document.createElement("button");
        b1.textContent = m.p1;
        b1.onclick = () => {
          if (championMode) animateChampion(m.p1, d);
          else setWinner(r, i, m.p1);
        };

        const b2 = document.createElement("button");
        b2.textContent = m.p2;
        b2.onclick = () => {
          if (championMode) animateChampion(m.p2, d);
          else setWinner(r, i, m.p2);
        };

        d.appendChild(b1);
        d.appendChild(b2);
      }

      col.appendChild(d);
    });

    baum.appendChild(col);
  });

  requestAnimationFrame(drawLines);
  checkChampion();
}

function drawLines() {
  const lines = document.getElementById("baumLines");
  const wrapper = document.getElementById("baumWrapper");
  lines.innerHTML = "";
  lines.setAttribute("width", wrapper.scrollWidth);
  lines.setAttribute("height", wrapper.scrollHeight);

  const cols = Array.from(document.querySelectorAll("#baum > .runde"));
  const strokeColor =
    document.body.classList.contains("black") ||
    document.body.classList.contains("gradient")
      ? "white"
      : "black";

  for (let r = 0; r < cols.length - 1; r++) {
    const matches = Array.from(cols[r].querySelectorAll(".match"));
    const nextMatches = Array.from(cols[r + 1].querySelectorAll(".match"));

    matches.forEach((m, i) => {
      if (!nextMatches[Math.floor(i / 2)]) return;

      const rect = m.getBoundingClientRect();
      const rectNext = nextMatches[Math.floor(i / 2)].getBoundingClientRect();
      const wrapRect = wrapper.getBoundingClientRect();

      const x1 = rect.right - wrapRect.left;
      const y1 = rect.top + rect.height / 2 - wrapRect.top;
      const x2 = rectNext.left - wrapRect.left;
      const y2 = rectNext.top + rectNext.height / 2 - wrapRect.top;

      const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
      line.setAttribute("d", `M ${x1} ${y1} C ${x1 + 40} ${y1}, ${x2 - 40} ${y2}, ${x2} ${y2}`);
      line.setAttribute("stroke", strokeColor);
      line.setAttribute("fill", "transparent");
      line.setAttribute("stroke-width", "2");

      lines.appendChild(line);
    });
  }
}

/* CHAMPION BUTTON */
function adminChampionMode() {
  if (!checkAdmin()) return;

  championMode = true;
  document.body.classList.add("championMode");
  alert("Champion-Modus aktiviert! Klicke auf einen Spieler, um ihn zum Champion zu machen.");
}

/* Animation für Champion-Auswahl */
function animateChampion(playerName, matchDiv) {
  const champBox = document.getElementById("championBox");
  const clone = matchDiv.cloneNode(true);
  clone.style.position = "absolute";
  clone.style.zIndex = 9999;
  const rect = matchDiv.getBoundingClientRect();
  clone.style.top = rect.top + "px";
  clone.style.left = rect.left + "px";
  clone.style.width = rect.width + "px";
  clone.style.transition = "all 1s ease-in-out";
  clone.style.boxShadow = "0 0 20px gold";
  clone.style.transform = "rotate(0deg)";
  document.body.appendChild(clone);

  const boxRect = champBox.getBoundingClientRect();
  setTimeout(() => {
    clone.style.top = boxRect.top + "px";
    clone.style.left = boxRect.left + "px";
    clone.style.width = boxRect.width + "px";
    clone.style.opacity = 0.2;
    clone.style.transform = "rotate(20deg) scale(0.8)";
  }, 20);

  setTimeout(() => {
    document.body.removeChild(clone);
    setChampion(playerName);
  }, 1020);
}

function setChampion(playerName) {
  if (!championMode) return;

  const rounds = baumDaten.length;
  if (rounds === 0) return;

  const finalMatch = baumDaten[rounds - 1][0];

  if (finalMatch) {
    finalMatch.winner = playerName;
    finalMatch.p1 = playerName;
    finalMatch.p2 = null;
  } else {
    baumDaten.push([{ p1: playerName, p2: null, winner: playerName }]);
  }

  save();
  updateTurnierbaum();

  championMode = false;
  document.body.classList.remove("championMode");
}

/* CHAMPION BOX */
function hideChampionBox() {
  document.getElementById("championBox").classList.add("hidden");
}

function checkChampion() {
  const rounds = baumDaten.length;
  if (rounds < 1) return;

  const finalMatch = baumDaten[rounds - 1][0];
  const champBox = document.getElementById("championBox");
  const champName = document.getElementById("championName");

  if (finalMatch && finalMatch.winner) {
    champName.textContent = finalMatch.winner;
    champBox.classList.remove("hidden");
  } else {
    champBox.classList.add("hidden");
  }
}

/* BACKGROUND */
function setBackground(t) {
  bg = t;
  applyBackground(t);
  localStorage.setItem("bg", t);
}

function applyBackground(t) {
  document.body.className = "";
  if (t !== "white") document.body.classList.add(t);
}

/* SAVE */
function save() {
  localStorage.setItem("spieler", JSON.stringify(spieler));
  localStorage.setItem("baum", JSON.stringify(baumDaten));
}