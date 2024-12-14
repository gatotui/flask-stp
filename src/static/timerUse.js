let time = document.querySelector('.tiempo').textContent.trim();

let remainingTimeMs = time
let countdownTimer
let date_inicio
let date_fin
let lastRT

const hourSpan = document.querySelector(".hour")
const minuteSpan = document.querySelector(".minute")
const secondSpan = document.querySelector(".second")
const startBtn = document.querySelector(".start")
const stopBtn = document.querySelector(".stop")

startBtn.addEventListener("click", startCountdown)
stopBtn.addEventListener("click", stopCountdown)

let firstTime = true

function formatAndDisplayTime(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  hourSpan.textContent = hours < 10 ? "0" + hours : hours
  minuteSpan.textContent = minutes < 10 ? "0" + minutes : minutes
  secondSpan.textContent = seconds < 10 ? "0" + seconds : seconds

  if (firstTime) {
    stopBtn.disabled = true
    firstTime = false
  }
}

function startCountdown() {
  startBtn.disabled = true
  stopBtn.disabled = false

  date_inicio = getDate()

  countdownTimer = setInterval(() => {
    if (remainingTimeMs <= 0) {
      clearInterval(countdownTimer)
      stopBtn.disabled = true
      alert("¡Tiempo terminado!")
      return
    }

    remainingTimeMs -= 1000
    formatAndDisplayTime(remainingTimeMs)
  }, 1000)
}

function stopCountdown() {
  Swal.fire({
    title: "¿Estás seguro?",
    text: "Esto detendrá el cronómetro.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sí, detener",
    cancelButtonText: "Cancelar",
  }).then((result) => {
    if (result.isConfirmed) {
      clearInterval(countdownTimer)
      stopBtn.disabled = true
      startBtn.disabled = false
      Swal.fire("Detenido", "El cronómetro ha sido detenido.", "success")
      date_fin = getDate()
      lastRT = time - remainingTimeMs
      sendData(date_inicio, date_fin, remainingTimeMs)
    }
  })
}

formatAndDisplayTime(remainingTimeMs)

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

function sendData(date_inicio, date_fin, remainingTimeMs) {
  // console.log('enviando informacion al backend')
  // console.log(remainingTimeMs)
  fetch("/save_use", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      start: date_inicio,
      end: date_fin,
      time: remainingTimeMs,
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