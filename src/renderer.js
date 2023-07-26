const { ipcRenderer } = require('electron')

const prevBtn = document.querySelector('.prevBtn')
const playBtn = document.querySelector('.playBtn')
const nextBtn = document.querySelector('.nextBtn')
const trackProgress = document.querySelector('.track-progress')
const trackVolume = document.querySelector('.track-volume')
const trackCurrentTime = document.querySelector('.track-current-time')
const trackTotalDuration = document.querySelector('.track-duration-time')
const playerContainer = document.querySelector('.player')
const coverImage = document.querySelector('.coverImage')
const alienLogo = document.querySelector('#alien-logo')


let audioPlayer = new Audio()
let isTrackPaused = false
let trackIndex = 0 // to determine the index of the current playing track in the tracklist

// all files imported to the player are stored in this array
let tracklist = []

// sound effects -> will be applied on the next update
// const ctx = new AudioContext()
// ctx.createMediaElementSource(audioPlayer)

// const oscillator = ctx.createOscillator()
// oscillator.type = 'sine'
// oscillator.frequency.setValueAtTime(420, ctx.currentTime);

// const biquadFilter = ctx.createBiquadFilter();
// biquadFilter.type = 'lowpass';
// biquadFilter.frequency.setValueAtTime(200, ctx.currentTime + 4);
// oscillator.connect(biquadFilter);

// biquadFilter.connect(ctx.destination);
// oscillator.start();
// oscillator.stop(30);

const updateTrackRunningTime = () => {

	if(audioPlayer.currentTime < 10){
		trackCurrentTime.innerHTML = `00:0${Math.floor(audioPlayer.currentTime)}`
	}

	if(audioPlayer.currentTime >= 10){
		trackCurrentTime.innerHTML = `00:${Math.floor(audioPlayer.currentTime)}`
	}

	if(audioPlayer.currentTime === 60){
		trackCurrentTime.innerHTML = `0${Math.floor(audioPlayer.currentTime / 60)}:00`
	}

	if(audioPlayer.currentTime > 60 && audioPlayer.currentTime % 60 < 10){
		trackCurrentTime.innerHTML = `0${Math.floor(audioPlayer.currentTime / 60)}:0${Math.floor(audioPlayer.currentTime % 60)}`
	}

	if(audioPlayer.currentTime > 60 && audioPlayer.currentTime % 60 >= 10){
		trackCurrentTime.innerHTML = `0${Math.floor(audioPlayer.currentTime / 60)}:${Math.floor(audioPlayer.currentTime % 60)}`
	}

	if(audioPlayer.currentTime === 600){
		trackCurrentTime.innerHTML = `${600 / 60}:00`
	}

	if(audioPlayer.currentTime > 600 && audioPlayer.currentTime % 60 < 10){
		trackCurrentTime.innerHTML = `${600 / 60}:0${Math.floor(audioPlayer.currentTime % 60)}`
	}

	if(audioPlayer.currentTime > 600 && audioPlayer.currentTime >= 10){
		trackCurrentTime.innerHTML = `${600 / 60}:${Math.floor(audioPlayer.currentTime % 60)}`
	}

}

const updateTrackProgress = () => {

	setInterval(() => {
		if(audioPlayer.duration){
			let currentTime = audioPlayer.currentTime * (100 / audioPlayer.duration)
			trackProgress.value = currentTime
			updateTrackRunningTime()
		}
	},1000)
}

// change the volume if user adjusts it
trackVolume.addEventListener('change', () => {
	// the audio player volume is set from 0 - 1, dividing it by 100 changes
	// the track volume value since it is from 0 - 100, changes to a range of 0 - 1
	audioPlayer.volume = trackVolume.value / 100
})

const prettifyTrackDuration = (duration) => {
	let trackDurationSec, trackDurationMin
	// in this case a track less than 60 seconds doesnt include a , (1 minutes, 40 seconds) for example
	// if it is i first check if it contains a (.) since some shorter track comes with for example 40.56 sec
	// if true, i split the string and grab the first value which in this case 40, i do not intend to display
	// float like values. otherwise i just grab the duration second itself then return it.
	// this format comes with fp-props module -> to understand you should look at how metadata is displayed
	if(!duration.includes(',')){
		trackDurationSec = duration.includes('.') ? duration.split('.')[0] : duration
		trackDurationMin = "00"
		audioPlayer.volume = 0.5
		trackVolume.value = 50
	}else{
		// get the minute digit which shows at index 0 excluding the string 'minutes' after it
		trackDurationMin = tracklist[trackIndex].metadata.extension === '.mp3' ? duration.split(', ')[0].substring(0, 1) : duration.split('.')[0].substring(0, 1)
		// get the first two digits excluding the string 'seconds' after it
		trackDurationSec = tracklist[trackIndex].metadata.extension === '.mp3' ? duration.split(', ')[1].substring(0, 2) : duration.split('.')[1].substring(0, 2)
	}	
	return `${trackDurationMin}:${trackDurationSec}`
}

const generateRandomBackgroundOptions = () => {
	const red = Math.floor(Math.random() * 255)
	const green = Math.floor(Math.random() * 255)
	const blue = Math.floor(Math.random() * 255)

	const colorOptions = {
		primaryColor: { red: red, green: green, blue: blue }, 
		secondaryColor: { 
			red: red <= 200 ? red + 10 : red,
			green: green <= 200 ? green + 10 : green,
			blue: blue <= 200 ? blue + 10 : blue,
		} 
	}

	return colorOptions
}

const changePlayerBackground = () => {
	const colorPicker = generateRandomBackgroundOptions()
	playerContainer.style.background = `
		linear-gradient(
			180deg,
			rgba(${colorPicker.primaryColor.red}, ${colorPicker.primaryColor.green}, ${colorPicker.primaryColor.blue}, 0.4),
			rgba(${colorPicker.secondaryColor.red}, ${colorPicker.secondaryColor.green}, ${colorPicker.secondaryColor.blue}, 0.4) 
		)
	`
}

const loadTrack = (track) => {
	console.log(track)
	audioPlayer.src = track.song
	audioPlayer.load()

	audioPlayer.volume = 0.5 // when the track loads set it to 50%, range of (0 - 1)
	updateTrackProgress()
	// update the track duration
	trackTotalDuration.textContent = prettifyTrackDuration(track.metadata.durationPretty)
	currentTrackinfo = track

	// send the loaded track metadata to the main process
	ipcRenderer.send('current-track-metadata', track.metadata)
}

const playTrack = () => {
	isTrackPaused = false
	audioPlayer.play()
	playBtn.innerHTML = '<i class="prevBtn fa fa-pause-circle fa-3x"></i>'
	showNotificationOnPlay(currentTrackinfo.metadata)
	ipcRenderer.send('currentPlayingTrack', tracklist[trackIndex])
	coverImage.style.display = 'none'
	alienLogo.style.display = 'block'
}

const pauseTrack = () => {
	isTrackPaused = true
	audioPlayer.pause()
	playBtn.innerHTML = '<i class="prevBtn fa fa-play-circle fa-3x"></i>'
	coverImage.style.display = 'block'
	alienLogo.style.display = 'none'
}

const playPaused = () => {
	if(isTrackPaused) playTrack()
	else pauseTrack()
}

const playNext = () =>{
	if(trackIndex < tracklist.length - 1) trackIndex++
	else trackIndex = 0
	loadTrack(tracklist[trackIndex])
	playTrack()
	changePlayerBackground()
}

const playPrev = () => {
	if(trackIndex > 0) trackIndex--
	else trackIndex = trackIndex.length - 1
	loadTrack(tracklist[trackIndex])
	playTrack()
	changePlayerBackground()
}

const showNotificationOnPlay = (metadata) => {
	const notification = new Notification('SpacePlayer', { body: `${metadata.fileName} is now playing...`, icon: '../build/icon.ico' })
}

playBtn.addEventListener('click', (event) => {
	playPaused()
})

prevBtn.addEventListener('click', (event) => {
	playPrev()
})

nextBtn.addEventListener('click', (event) => {
	playNext()
})

const replaceAndPlay = (track) => {
	tracklist = []
	trackIndex = 0
	tracklist.push(track)

	loadTrack(tracklist[trackIndex])
	playTrack()
	trackVolume.value = 50
	audioPlayer.volume = 0.5
}

ipcRenderer.on('imported-song', (event, track) => {
	tracklist.push(track)
	console.log('track',track)
	if(audioPlayer.src === '' || audioPlayer.src === null){
		loadTrack(tracklist[trackIndex])
		playTrack()
		audioPlayer.volume = 0.5
		trackVolume.value = 50
	}
	// send the current track list to the main process
	ipcRenderer.send('current-track-list', tracklist)
	// add to queue
	ipcRenderer.send('queued-to-playlist')

})


ipcRenderer.on('loop-track', (event) => {
	audioPlayer.loop = true
})

ipcRenderer.on('unloop-track', (event) => {
	audioPlayer.loop = false
})

ipcRenderer.on('playNormalRate', (event) => {
	audioPlayer.playbackRate = 1.0
})

ipcRenderer.on('playHalfRate', (event) => {
	audioPlayer.playbackRate = 0.5
})

ipcRenderer.on('playFasterRate', (event) => {
	audioPlayer.playbackRate = 2.0
})

// if the track ends reset it and pause it
audioPlayer.addEventListener('ended', (event) => {
	audioPlayer.currentTime = 0
	playBtn.innerHTML = '<i class="prevBtn fa fa-play-circle fa-2x"></i>'
	tracklist[trackIndex].song.volume = 0.5
	trackVolume.value = 50
	playNext()
})

// drag and drop files 

window.addEventListener('dragenter', (event) => {
	event.preventDefault()
	playerContainer.style.background = 'linear-gradient(180deg, #e6a963, #111)'
})

window.addEventListener('dragover', (event) => {
	event.preventDefault()
	playerContainer.style.background = 'linear-gradient(180deg, #e6a963, #111)'
})

window.addEventListener('dragleave', (event) => {
	event.preventDefault()
	playerContainer.style.background = 'linear-gradient(180deg, #e5a918, #333)'
})

window.addEventListener('drop', (event) => {
	// get all the files which were dragged over, check if they are mp3's
	// send them to the main process to attach metadata to the files
	const files = [...event.dataTransfer.files]
	let filePaths = []

	files.filter((file) => {
		if(file.type === 'audio/mpeg') filePaths.push(file.path)
	})
	if(filePaths) ipcRenderer.send('dragDroppedFiles', filePaths)
	playerContainer.style.background = 'linear-gradient(180deg, #e5a918, #222)'
	
	if(audioPlayer.src) ipcRenderer.send('queued-to-playlist')
})

// get the clicked or selected song and load it to the player automatically
let selectedTrack = ipcRenderer.sendSync('play-selected-track')
if(selectedTrack.error || selectedTrack === null || selectedTrack === undefined){
	console.log('nothing got returned')
}else{
	replaceAndPlay(selectedTrack)
}


// get the new changed selected track, remove and replace it with the old track on the same
// window instance
ipcRenderer.on('new-selected-track', (event, track) => {
	replaceAndPlay(track)
})

ipcRenderer.on('clear-playlist', (event) => {
	tracklist = []
	audioPlayer.pause()
	audioPlayer.src = ""
	trackProgress.value = 0
	trackVolume.value = 0
	playBtn.innerHTML = '<i class="prevBtn fa fa-play-circle fa-3x"></i>'
	trackTotalDuration.textContent = "00:00"
	trackCurrentTime.textContent = "00:00"
	coverImage.style.display = 'block'
	alienLogo.style.display = 'none'
	
})

// seek the track to the seeked position
trackProgress.addEventListener('change', () => {
	audioPlayer.currentTime = audioPlayer.duration * (trackProgress.value / 100)
})

// Most of the code is self descriptive, i tried to implement the most readable
// variable and function names but if you feel lost always ask me on my email what
// most of the code is all about. GO AHEAD AND CONTRIBUTE TO THIS PROJECT ASTRONAUT 🚀