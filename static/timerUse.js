let remainingTimeMs = 12000
let countdownTimer

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
    }
  })
}

formatAndDisplayTime(remainingTimeMs)
