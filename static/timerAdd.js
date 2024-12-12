let hr = (min = sec = ms = "0" + 0),
  startTimer

const startBtn = document.querySelector(".start")
const stopBtn = document.querySelector(".stop")

startBtn.addEventListener("click", start)
stopBtn.addEventListener("click", stop)

let date_inicio
let date_fin

function getDate() {
  let currentDate = new Date()

  let year = currentDate.getFullYear()
  let month = (currentDate.getMonth() + 1).toString().padStart(2, "0")
  let day = currentDate.getDate().toString().padStart(2, "0")
  let hours = currentDate.getHours().toString().padStart(2, "0")
  let minutes = currentDate.getMinutes().toString().padStart(2, "0")
  let seconds = currentDate.getSeconds().toString().padStart(2, "0")

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

function start() {
  date_inicio = getDate()
  console.log(date_inicio)

  startBtn.disabled = true

  startBtn.classList.add("active")
  stopBtn.classList.remove("stopActive")
  
  startTimer = setInterval(() => {
    ms++
    ms = ms < 10 ? "0" + ms : ms

    if (ms == 100) {
      sec++
      sec = sec < 10 ? "0" + sec : sec
      ms = "0" + 0
    }
    if (sec == 60) {
      min++
      min = min < 10 ? "0" + min : min
      sec = "0" + 0
    }
    if (min == 60) {
      hr++
      hr = hr < 10 ? "0" + hr : hr
      min = "0" + 0
    }
    putValue()
  }, 10)
}

function stop() {
  date_fin = getDate()
  // console.log(date_fin)

  startBtn.classList.remove("active")
  stopBtn.classList.remove("stopActive")
  clearInterval(startTimer)

  const summary = document.querySelector("#summary").value

  timeElapsedInMs =
    parseInt(hr) * 3600000 +
    parseInt(min) * 60000 +
    parseInt(sec) * 1000 +
    parseInt(ms)

  time = Math.floor(timeElapsedInMs / 100) * 100

  sendData(date_inicio, date_fin, summary, time)
}

function putValue() {
  document.querySelector(".second").innerHTML = sec
  document.querySelector(".minute").innerHTML = min
  document.querySelector(".hour").innerHTML = hr
}

function sendData(date_inicio, date_fin, summary, time) {
  fetch("/save_study", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      start: date_inicio,
      end: date_fin,
      summary: summary,
      time: time,
    }),
  })
    .then((response) => response.json())
    .then(data => {
      if (data.redirect) {
        //me redirige al endpoint especificado en el backend (perfil)
        window.location.href = data.redirect; 
      }
    })
    .catch((error) => console.error("Error al guardar los datos:", error))
}
