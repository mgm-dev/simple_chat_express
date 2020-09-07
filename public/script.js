const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myPeer = new Peer();
const myVideo = document.createElement('video');
myVideo.muted = true;
const peers = {};

const form = document.getElementById('chat-form');
const input = document.getElementById('chat-input');
const log = document.getElementById('chat-log');

form.addEventListener('submit', function (e) {
  e.preventDefault();
  if (input.value === '') {
    return;
  }
  socket.emit('client-message', ROOM_ID, USER_NAME, input.value);
  input.value = '';
});

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    addVideoStream(myVideo, stream);

    myPeer.on('call', (call) => {
      call.answer(stream);
      const video = document.createElement('video');
      call.on('stream', (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on('user-connected', (userId) => {
      connectToNewUser(userId, stream);
    });
  });

socket.on('server-message', (userName, message) => {
  log.append(userName + ' : ' + message + '\n');
});

socket.on('user-disconnected', (userId) => {
  if (peers[userId]) peers[userId].close();
});

myPeer.on('open', (id) => {
  socket.emit('join-room', ROOM_ID, id);
});

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement('video');
  call.on('stream', (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on('close', () => {
    video.remove();
    if (document.querySelectorAll('video').length === 1) {
      videoGrid.classList.add('grid-off');
      videoGrid.classList.remove('grid-on');
    }
  });

  peers[userId] = call;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  videoGrid.append(video);
  if (document.querySelectorAll('video').length > 1) {
    videoGrid.classList.remove('grid-off');
    videoGrid.classList.add('grid-on');
  }
}

function copyToClipboard(text) {
  window.prompt('Copy to clipboard: Ctrl+C, Enter', text);
}
