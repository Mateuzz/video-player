/*=============================================================*
 *                   Functions
 *=============================================================*/

function setTimeBarGradient(timeBar, percentElapsed, loadedEnd) {
    const linearGradient = ` linear-gradient(
            to right,
        ${colors.barCurrentTime} 0%,
        ${colors.barCurrentTime} ${percentElapsed}%,
        ${colors.barLoaded} ${percentElapsed}%,
        ${colors.barLoaded} ${loadedEnd}%,
        ${colors.barNonLoaded} ${loadedEnd}%`

    timeBar.style.background = linearGradient
}

function getVideoBufferedLoadedEnd(video) {
    let i
    for (i = 0; i < video.buffered.length; ++i) {
        if (video.buffered.end(i) > video.currentTime)
            return video.buffered.end(i) / video.duration * 100
    }
    return null
}

function setTimeBarPos(timeBarBall, video) {
    const percentElapsed = video.currentTime / video.duration
    timeBarBall.style.translate = `${percentElapsed * parseFloat(getComputedStyle(timeBar).width)}px`
}

function styleTimeBarOnMouseInteraction(timeBar, nextDurationPercent, timeBarWidth) {
    const loadedEnd = getVideoBufferedLoadedEnd(video)
    if (loadedEnd)
        setTimeBarGradient(timeBar, nextDurationPercent * 100, loadedEnd)
    else 
        setTimeBarGradient(timeBar, nextDurationPercent * 100, nextDurationPercent * 100)
    timeBarBall.style.translate = `${nextDurationPercent * timeBarWidth}px`
}

function showTimeBarBall(timeBarBall, size) {
    timeBarBall.style.width = size
    timeBarBall.style.height = size
    if (size == 0) {
        timeBarBall.style.left = 0
        timeBarBall.style.bottom = 0
    } else {
        timeBarBall.style.left = '-12px'
        timeBarBall.style.bottom = '-6px'
    }
}

function setTimeBarColor(timeBar, video) {
    const percentElapsed = video.currentTime / video.duration * 100
    const loadedEnd = getVideoBufferedLoadedEnd(video)

    if (loadedEnd) 
        setTimeBarGradient(timeBar, percentElapsed, loadedEnd)
    else 
        setTimeBarGradient(timeBar, percentElapsed, percentElapsed)
}

function playPause(video, play) {
    if (video.paused) {
        clearVideoFwdBwdInterval(video)
        playMedia(video, play)
    } else {
        pauseMedia(video, play)
    }
}

function changeIcon(ele, icon) {
    ele.innerHTML = `<i class="${icon}"></i>`
}

function stopMedia(video, play) {
    video.pause()
    video.currentTime = 0
    clearVideoFwdBwdInterval(video)
    changeIcon(play, 'fa-solid fa-play')
}

function pauseMedia(video, play) {
    video.pause()
    changeIcon(play, 'fa-solid fa-play')
}

function playMedia(vide, play) {
    vide.play()
    changeIcon(play, 'fa-solid fa-pause')
}

function muteToggle(video, volumeButton) {
    video.muted = !video.muted
    setVolumeIcon(volumeSlider, volumeButton)
}

function setVolumeIcon(volumeSlider, volumeButton) {
    if (video.muted) {
        changeIcon(volumeButton, 'fa-solid fa-volume-xmark')
    } else if (volumeSlider.value >= 0.4) {
        changeIcon(volumeButton, 'fa-solid fa-volume-high')
    } else if (volumeSlider.value <= 0.4) {
        changeIcon(volumeButton, 'fa-solid fa-volume-low')
    }
}

function parseTime(secondsFloat) {
    const hours = parseInt(secondsFloat / 3600)
    secondsFloat -= hours * 3600
    const minutes = parseInt(secondsFloat / 60)
    secondsFloat -= minutes * 60
    const seconds = parseInt(secondsFloat)

    return { hours, minutes, seconds }
}

function setDurationLabel(label, duration) {
    label.innerHTML = `${duration.hours > 0 ? duration.hours.toString().padStart(2, '0') + ':' : ''}
    ${duration.minutes.toString().padStart(2, '0')}:${duration.seconds.toString().padStart(2, '0')} `
}

function clearVideoFwdBwdInterval(video) {
    const intervalId = intervalData[video].id
    if (intervalId) 
        clearInterval(intervalId)
    intervalData[video] = {}
}

function setVideoFwdBwdInterval(video, play, speed) {
    const oldSpeed = intervalData[video].speed
    clearVideoFwdBwdInterval(video)

    // we clicked in the same button again
    if (oldSpeed == speed)
        return

    intervalData[video].id = setInterval(() => {
        video.currentTime += speed
        if (video.currentTime <= 3 || video.currentTime >= video.duration - 3) {
            clearVideoFwdBwdInterval(video)
        }
        speed *= 1.20
    }, 500)
    intervalData[video].speed = speed

    pauseMedia(video, play)
}





/*=============================================================*
 *                  Config
 *=============================================================*/

let intervalData = {}

const domStyle = getComputedStyle(document.body)

const colors = {
    barCurrentTime: domStyle.getPropertyValue('--bar-current-time'),
    barLoaded: domStyle.getPropertyValue('--bar-loaded'),
    barNonLoaded: domStyle.getPropertyValue('--bar-non-loaded')
}

let playerHasFocus = false
let timeBarDragged = false
let timeBarDraggedNewDuration
let playerHovered = false
let controlsHiddenTimeoutId = null





/*=============================================================*
 *                  Player Widgets
 *=============================================================*/

const player = document.querySelector('.video-player')
const video = player.querySelector('video')

const timeBarBox = player.querySelector('.video-time-bar-box')
const timeBar = player.querySelector('.video-time-bar')
const timeBarBall = player.querySelector('.video-time-bar-ball')

const controlsBox = player.querySelector('.video-controls-box')
const controlsStart = player.querySelector('.video-controls-start')

const play = player.querySelector('.video-play')
const stop = player.querySelector('.video-stop')
const volumeButton = player.querySelector('.video-mute')
const volumeSlider = player.querySelector('.video-volume-slider')
const elapsed = player.querySelector('.video-elapsed')
const duration = player.querySelector('.video-duration')
const backward = player.querySelector('.video-backward')
const forward = player.querySelector('.video-forward')
const full = player.querySelector('.video-fullscreen')

intervalData[video] = {}






/*=============================================================*
 *                  Button Actions
 *=============================================================*/

window.addEventListener('mousemove', (e) => {
    if (!timeBarDragged)
        return

    const timeBarWidth = parseFloat(getComputedStyle(timeBar).width)
    timeBarDraggedNewDuration = (e.x - timeBar.getBoundingClientRect().x) / timeBarWidth
    if (timeBarDraggedNewDuration > 1)
        timeBarDraggedNewDuration = 1
    if (timeBarDraggedNewDuration < 0)
        timeBarDraggedNewDuration = 0

    styleTimeBarOnMouseInteraction(timeBar, timeBarDraggedNewDuration, timeBarWidth)
})

window.addEventListener('keydown', (e) => {
    if (!playerHasFocus)
        return
    if (e.key == 'ArrowRight') {
        video.currentTime += 5
    } else if (e.key == 'ArrowLeft') {
        video.currentTime -= 5
    }
})

document.addEventListener('click', () => {
    playerHasFocus = false
})

document.addEventListener('mouseup', () => {
    if (timeBarDragged) {
        video.currentTime = timeBarDraggedNewDuration * video.duration
        timeBarDragged = false
        showTimeBarBall(timeBarBall, 0)
        if (!playerHovered && !video.paused)
            controlsBox.style.opacity = 0
    }
})

player.addEventListener('click', (e) => {
    playerHasFocus = true
    e.stopPropagation()
})

player.addEventListener('mouseenter', () => {
    controlsBox.style.opacity = 1
    playerHovered = true
})

player.addEventListener('mousemove', () => {
    controlsBox.style.opacity = 1
    playerHovered = true
})

player.addEventListener('mouseout', () => {
    if (!timeBarDragged && !video.paused) {
        controlsBox.style.opacity = 0
    }
    playerHovered = false
})

video.addEventListener('mouseup', () => {
    playPause(video, play)
})

play.addEventListener('click', () => {
    playPause(video, play)
})

video.addEventListener('ended', () => pauseMedia(video, play))

video.addEventListener('durationchange', () => {
    setDurationLabel(duration, parseTime(video.duration))
})

video.addEventListener('timeupdate', () => {
    if (timeBarDragged)
        return
    setDurationLabel(elapsed, parseTime(video.currentTime))
    setTimeBarColor(timeBar, video)
    setTimeBarPos(timeBarBall, video)
})

video.addEventListener('volumechange', () => {
    volumeSlider.value = video.volume
    setVolumeIcon(volumeSlider, volumeButton)
})

stop.addEventListener('click', () => stopMedia(video, play))

volumeButton.addEventListener('click', () => {
    muteToggle(video, volumeButton)
})

full.addEventListener('click', () => {
    video.requestFullscreen()
})

forward.addEventListener('click', () => {
    setVideoFwdBwdInterval(video, play, 10)
})

backward.addEventListener('click', () => {
    setVideoFwdBwdInterval(video, play, -10)
})





/*=============================================================*
 *                  Volume Slider Control
 *=============================================================*/

const volumeSliderKeys = [
    { width: '70px'} 
]

const volumeSliderKeysRev = [
    { width: '0'}
]

const volumeSliderTiming = {
    duration: 200,
    fill: 'forwards',
    easing: 'ease-in-out',
}

volumeButton.addEventListener('mouseenter', () => {
    volumeSlider.style.display = 'inline-block'
    volumeSlider.animate(volumeSliderKeys, volumeSliderTiming)
})

controlsStart.addEventListener('mouseleave', () => {
    volumeSlider.animate(volumeSliderKeysRev, volumeSliderTiming)
    setTimeout(() => {
        volumeSlider.style.display = 'none'
    }, volumeSliderTiming.duration);
})

volumeSlider.addEventListener('input', () => {
    video.volume = volumeSlider.value
    video.muted = false
    setVolumeIcon(volumeSlider, volumeButton)
})

timeBarBox.addEventListener('mousedown', (e) => {
    timeBarDragged = true
    const timeBarWidth = parseFloat(getComputedStyle(timeBar).width)
    timeBarDraggedNewDuration = e.offsetX / timeBarWidth
    styleTimeBarOnMouseInteraction(timeBar, timeBarDraggedNewDuration, timeBarWidth)

    showTimeBarBall(timeBarBall, '20px')
})

timeBarBox.addEventListener('mousemove', () => {
    showTimeBarBall(timeBarBall, '20px')
})

timeBarBox.addEventListener('mouseout', () => {
    if (!timeBarDragged) {
        showTimeBarBall(timeBarBall, '0')
    }
})
