const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron')
const fp = require("fs-props")

const fs = require('fs')
const path = require('path')
const url = require('url')

let mainWindow, loadingWindow
let metadataInfo = null
let playlistInfo = null
let isNewTrackQueued = false


const menuTemplate = [
	{
		label: 'File',
		submenu: [
			{
				label: 'Import Tracks',
				accelerator: 'Ctrl+I',
				click: importSong
			},
			{
				label: 'Import Folder',
				accelerator: 'Ctrl+F',
				click: importFolder
			},
			{
				type: 'separator',
			},
			{
				label: 'Quit App',
				accelerator: 'Ctrl+X',
				role: 'quit'
			}
		]
	},

	{
		label: 'Audio',
		submenu: [
			{
				label: 'Mute Track',
				type: 'checkbox',
				accelerator: 'Ctrl+M',
				click: muteTrack
			},
			{
				label: 'Loop Track',
				type: 'checkbox',
				accelerator: 'Ctrl+L',
				click: loopTrack
			},
			{
				label: 'Playback Rate',
				submenu:[
					{
						label: 'Normal Speed',
						accelerator: 'Ctrl+Shift+1',
						type: 'radio',
						click: normalPlaybackRate
					},
					{
						label: 'Half Speed',
						accelerator: 'Ctrl+Shift+2',
						type: 'radio',
						click: halfPlaybackRate
					},
					{
						label: 'Faster Speed',
						accelerator: 'Ctrl+Shift+3',
						type: 'radio',
						click: fasterPlaybackRate
					},
				]
			}
		]
	},

	{
		label: 'Media',
		submenu:[
			{
				label: 'View Track Metadata',
				accelerator: 'Ctrl+Shift+M',
				click: viewTrackMetadata
			},
			{
				label: 'View Playlist',
				accelerator: 'Ctrl+Shift+L',
				click: viewPlaylist
			},
			{
				label: 'Clear Playlist',
				accelerator: 'Ctrl+Shift+D',
				click: clearPlaylist
			}
		]
	},

	{
		label: 'Window',
		submenu:[
			{
				label: 'Toggle Fullscreen',
				accelerator: 'F11',
				role: 'togglefullscreen'
			},
		]
	},

	{
		label: 'About',
		submenu:[
			{
				label: 'About App',
				accelerator: 'F9',
				click: openAboutAppDialog
			},
			{
				label: 'Contact Me',
				accelerator: 'F8',
				click: openContactDialog
			},
		]
	}
]

ipcMain.on('current-track-list', (event, playlist) => {
	playlistInfo = playlist
})

ipcMain.on('current-track-metadata', (event, metadata) => {
	metadataInfo = metadata
})

// ipcMain.on('play-selected-file', (event) => {
// 	let selectedFile = null
// 	if(process.platform == 'win32' && process.argv.length >= 2){
// 		selectedFile = process.argv[1]
// 		selectedFileExtension = selectedFile.split('.')[1]

// 		if(selectedFileExtension === 'mp3'){
// 			fp.props(selectedFile).then((properties) => {
// 				event.returnValue = { song: selectedFile, metadata: properties }
// 			}).catch(err => {throw err})
// 		}
// 	}
// })

//console.log('length: ', process.argv.length, 'contents:', process.argv)

ipcMain.on('queued-to-playlist', (event) => {
	if(!isNewTrackQueued){
		dialog.showMessageBox(mainWindow, {
			type: 'info',
			title: 'Reminder',
			message: `Queued to playlist`,
		})
		.then((response) => console.log(response))
		.catch((err) => {
			throw err
		})
		isNewTrackQueued = true
	}
})

function viewPlaylist(){
	if(playlistInfo !== null){
		const songs = playlistInfo.map((track) => { return track.metadata })
		dialog.showMessageBox(mainWindow, {
			type: 'info',
			title: 'Playlist',
			message: `${playlistInfo.length} Track(s) Imported`,
			detail: `
				${songs.map((song, index) => metadataInfo.fileName === song.fileName ? 1 + index + '. ' + song.fileName + ' ⏸ (currently playing)' + '\n\n' : 1 + index + '. ' + song.fileName + '\n\n' )}
			`
		})
		.then((response) => console.log(response))
		.catch((err) => {
			throw err
		})
	}else{
		dialog.showMessageBox(mainWindow, {
			type: 'error',
			title: 'Playlist',
			message: 'No playlist found',
			detail: 'Make sure you import tracks to the player to view the playlist'
		})
		.then((response) => console.log(response))
		.catch((err) => {
			throw err
		})
	}
}

function viewTrackMetadata(){
	if(metadataInfo !== null){
		dialog.showMessageBox(mainWindow, {
			type: 'info',
			title: 'Track Metadata Information',
			message: `${metadataInfo.fileName}`,
			detail: `
				Artist: ${metadataInfo.artist ? metadataInfo.artist : 'N/A'}

				Title: ${metadataInfo.title ? metadataInfo.title : 'N/A'}

				Album: ${metadataInfo.album ? metadataInfo.album : 'N/A'}

				Genre: ${metadataInfo.genre ? metadataInfo.genre : 'N/A'}

				Composer: ${metadataInfo.composer ? metadataInfo.composer : 'N/A'}

				Year: ${metadataInfo.year ? metadataInfo.year : 'N/A'}

				Bitrate: ${metadataInfo.bitRatePretty ? metadataInfo.bitRatePretty : 'N/A'}

				Channels: ${metadataInfo.channels ? metadataInfo.channels : 'N/A'}


			`
		})
		.then((response) => console.log(response))
		.catch((err) => {
			throw err
		})
	}else{
		dialog.showMessageBox(mainWindow, {
			type: 'error',
			title: 'Track Metadata Information',
			message: 'No metadata found',
			detail: 'Make sure you load the song to the player to view its metadata'
		})
		.then((response) => console.log(response))
		.catch((err) => {
			throw err
		})
	}
}

function openContactDialog(){
	dialog.showMessageBox(mainWindow, {
		type: 'info',
		title: 'Contact Me',
		message: 'https://hbfl3x.netlify.app',
		detail: `
		Email me: hbfl3x@gmail.com, happybanda@dyuni.ac.mw
		Phone: 0982272003
		Github: https://github.com/HBFLEX
		Twitter: https://twitter.com/HB_FL3X
		`
	})
	.then((response) => console.log(response))
	.catch((err) => {
		throw err
	})
}

function openAboutAppDialog(){
	dialog.showMessageBox(mainWindow, {
		type: 'info',
		title: 'About SpacePlayer🪐',
		message: 'Version 1.0.0',
		detail: 'Developed by Happy Banda @Space Labs Tech, All rights reserved.'
	})
	.then((response) => console.log(response))
	.catch((err) => {
		throw err
	})
}

function clearPlaylist(){
	metadataInfo = null
	playlistInfo = null
	mainWindow.title = "SpacePlayer🪐"
	mainWindow.webContents.send('clear-playlist')
}

function normalPlaybackRate(menuItem, mainWindow){
	mainWindow.webContents.send('playNormalRate')
}

function halfPlaybackRate(menuItem, mainWindow){
	mainWindow.webContents.send('playHalfRate')
}

function fasterPlaybackRate(menuItem, mainWindow){
	mainWindow.webContents.send('playFasterRate')
}

function loopTrack(menuItem, mainWindow){
	menuItem.checked ? mainWindow.webContents.send('loop-track') : mainWindow.webContents.send('unloop-track')
}

function muteTrack(){
	mainWindow.webContents.setAudioMuted(!mainWindow.webContents.isAudioMuted())
}

function importSong(){
	dialog.showOpenDialog(mainWindow, {
		title: 'Import Tracks',
		buttonLabel: 'Import',
		properties: ['openFile', 'multiSelections'],
		filters: [ { name: 'Audio', extensions: ['mp3'] } ],
	}).then(songs => {
		// read every single file in a directory and send them
		// to the renderer process
		songs.filePaths.forEach((song) => {
			fp.props(song).then((properties) => {
				mainWindow.webContents.send('imported-song', { song: song, metadata: properties, totalTracks: songs.filePaths })
			}).catch(err => console.log(err))
		})
	}).catch(err => {throw err})
}

function importFolder(){
	dialog.showOpenDialog(mainWindow, {
		title: 'Import folder',
		buttonLabel: 'Import Folder',
		filters: [ { name: 'Audio', extensions: ['mp3'] } ],
		properties: ['openDirectory'],
	}).then(folder => {
		// read every single file in a directory except non-mp3 files and send them
		// to the renderer process
		fs.readdir(folder.filePaths[0], (err, files) => {
			if(err) throw err
			const songs = files.filter((song) => {
				const ext = song.split('.')[1].toLowerCase()
				if(ext === 'mp3') return song
			})

			songs.forEach((audioFile) => {
				const songUrl = folder.filePaths[0] + '\\' + audioFile
				fp.props(songUrl).then((properties) => {
					mainWindow.webContents.send('imported-song', { song: songUrl, metadata: properties })
				}).catch(err => {throw err})
			})
		})
	}).catch(err => console.log(err))
}

ipcMain.on('currentPlayingTrack', (event, trackInfo) => {
	mainWindow.title = 'SpacePlayer🪐 - ' + trackInfo.metadata.fileName
})

ipcMain.on('dragDroppedFiles', (event, files) => {
	files.forEach((file) => {
		fp.props(file).then((properties) => {
			mainWindow.webContents.send('imported-song', { song: file, metadata: properties })
		}).catch(err => {throw err})
	})
})

ipcMain.on('play-selected-track', (event) =>{
	if(process.argv.length >= 2){
		fp.props(process.argv[1]).then((properties) => {
			event.returnValue = { song: process.argv[1], metadata: properties }
		})
	}
})


const gotSingleInstanceLock = app.requestSingleInstanceLock()
// check if the app got a single lock or if it contains multiple window instances
// if it doesnt which apply that there is no single lock, quit the other window
// instance, otherwise get process arguments from the second window instance which
// is closed and pass it to the first instance window, focus the main window then
// get the process arguments. The process arguments returns an array this time with
// different values coming thru, loop the array check if a value ends with an extension
// of .mp3 , if it does send it to the renderer process to finally play the selected song.
if(!gotSingleInstanceLock) app.quit()
else{
	app.on('second-instance', (_, argv) => {
		if(app.hasSingleInstanceLock()){
			if(mainWindow?.isMinimized()) mainWindow?.restore()
			mainWindow.focus()
			process.argv = argv
			const argvArr = process.argv

			argvArr.forEach((value) => {
				if(path.extname(value) === '.mp3'){
					fp.props(value).then((properties) => {
						mainWindow.webContents.send('new-selected-track', { song: value, metadata: properties })
					}).catch(err => { throw err })
				}
			})
		}
	})
}

const createAppWindow = (options = {}, fileName) => {
	let win
	win = new BrowserWindow(options)
	win.loadURL(url.format({
		pathname: path.join(__dirname, 'src', fileName),
		protocol: 'file:',
		slashes: true
	}))

	//win.webContents.openDevTools()

	win.once('ready-to-show', () => {
		loadingWindow.hide()
		loadingWindow.close()
		win.show()
	})
	win.on('closed', () => win = null)

	return win
}

function createLoadingWindow(){
	loadingWindow = new BrowserWindow({
		frame: false,
		width: 600,
		height: 340,
	})

	loadingWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'src', 'loading.html'),
		protocol: 'file:',
		slashes: true
	}))

	loadingWindow.on('closed', () => loadingWindow = null)
}

// set app custom model Id
app.setAppUserModelId('SpaceLabsTech.SpacePlayer🪐')

app.on('ready', () => {

	createLoadingWindow()

	Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate))
	mainWindow = createAppWindow({
		show: false,
		backgroundColor: '#FFF',
		width: 900,
		height: 600,
		minWidth: 600,
		minHeight: 500,
		icon: path.join(__dirname, 'src', 'static', 'images', 'player_icon.ico'),
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			enableRemoteModule: true
		}
	}, 'app.html')

	mainWindow.webContents.send('info',{ argvCount: process.argv.length, argv: process.argv })

})

app.on('window-all-closed', () => app.quit())
// Most of the code is self descriptive, i tried to implement the most readable
// variable and function names but if you feel lost always ask me on my email what
// most of the code is all about. GO AHEAD AND CONTRIBUTE TO THIS PROJECT ASTRONAUT 🚀