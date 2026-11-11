(function () {
  'use strict';

  var channel = 'portfolio-music';
  var player = document.getElementById('mp');
  var handle = document.getElementById('mph');
  var volumeSlider = document.getElementById('mvol');
  var playButton = document.getElementById('mplay');
  var barsContainer = document.getElementById('bars');
  var audio = new Audio();
  var tracks = [
    { name: 'Aquatic Ambiance', src: './assets/songs/aquatic-ambiance.mp3' },
    { name: 'Lease', src: './assets/songs/lease.mp3' },
    { name: 'Eple', src: './assets/songs/eple.mp3' }
  ];
  var icons = {
    play: '<svg viewBox="0 0 20 20"><path d="M5 3l12 7-12 7z"/></svg>',
    pause: '<svg viewBox="0 0 20 20"><path d="M4 3h4.5v14H4zM11.5 3H16v14h-4.5z"/></svg>'
  };
  var trackIndex = 0;
  var playError = false;
  var isPlaying = false;
  var isDragging = false;
  var audioContext;
  var analyser;
  var bars = [];

  function notify(type, detail) {
    var message = Object.assign({ channel: channel, type: type }, detail || {});
    window.parent.postMessage(message, '*');
  }

  function notifySize() {
    window.requestAnimationFrame(function () {
      notify('state', {
        width: player.offsetWidth,
        height: player.offsetHeight,
        minimized: player.classList.contains('min')
      });
    });
  }

  function updateUI() {
    playButton.innerHTML = isPlaying ? icons.pause : icons.play;
    playButton.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
    document.getElementById('mpt').textContent = tracks[trackIndex].name;
    document.getElementById('mpn').textContent = playError
      ? 'Unable to play this track'
      : 'Track ' + (trackIndex + 1) + ' / ' + tracks.length;
    if (!isPlaying) bars.forEach(function (bar) { bar.style.height = '8%'; });
  }

  function reportPlaybackError(error) {
    isPlaying = false;
    playError = true;
    updateUI();
    console.error('Unable to play portfolio music track:', error);
  }

  function startAudioAnalysis() {
    var AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass || audioContext) return;

    audioContext = new AudioContextClass();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    var source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
  }

  function drawSpectrum() {
    if (!isPlaying || !analyser) return;
    var data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    bars.forEach(function (bar, index) {
      bar.style.height = Math.max(8, (data[index + 1] / 255) * 130) + '%';
    });
    window.requestAnimationFrame(drawSpectrum);
  }

  function playTrack() {
    playError = false;
    try {
      startAudioAnalysis();
    } catch (error) {
      audioContext = null;
      analyser = null;
      console.error('Music spectrum analyzer could not be initialized:', error);
    }

    if (audioContext && audioContext.state === 'suspended') audioContext.resume();
    var request = audio.play();
    if (request && typeof request.then === 'function') {
      request.then(function () {
        isPlaying = true;
        updateUI();
        drawSpectrum();
      }).catch(reportPlaybackError);
    } else {
      isPlaying = true;
      updateUI();
      drawSpectrum();
    }
  }

  function skipTrack(direction, continuePlayback) {
    var shouldPlay = isPlaying || continuePlayback;
    trackIndex = (trackIndex + direction + tracks.length) % tracks.length;
    playError = false;
    isPlaying = false;
    audio.pause();
    audio.src = tracks[trackIndex].src;
    audio.load();
    updateUI();
    if (shouldPlay) playTrack();
  }

  function togglePlayer() {
    var minimized = player.classList.toggle('min');
    var button = document.getElementById('mmin');
    button.setAttribute('aria-expanded', String(!minimized));
    button.setAttribute('aria-label', minimized ? 'Expand player' : 'Minimize player');
    notifySize();
  }

  var musicIcon = document.createElement('img');
  musicIcon.className = 'player-title-icon';
  musicIcon.src = './assets/icons/music.png';
  musicIcon.alt = '';
  handle.querySelector('b').prepend(musicIcon);

  var soundIcon = document.createElement('img');
  soundIcon.className = 'player-sound-icon';
  soundIcon.src = './assets/icons/sounds.png';
  soundIcon.alt = '';
  document.querySelector('.vol').prepend(soundIcon);

  for (var index = 0; index < 14; index++) {
    var bar = document.createElement('i');
    barsContainer.appendChild(bar);
    bars.push(bar);
  }

  audio.preload = 'metadata';
  audio.volume = volumeSlider.value / 100;
  audio.src = tracks[trackIndex].src;
  player.classList.add('min');
  document.getElementById('mmin').setAttribute('aria-expanded', 'false');

  document.getElementById('mmin').addEventListener('click', togglePlayer);
  document.getElementById('mprev').addEventListener('click', function () { skipTrack(-1); });
  document.getElementById('mnext').addEventListener('click', function () { skipTrack(1); });
  playButton.addEventListener('click', function () {
    if (audio.paused) playTrack();
    else {
      audio.pause();
      isPlaying = false;
      updateUI();
    }
  });
  volumeSlider.addEventListener('input', function () {
    audio.volume = volumeSlider.value / 100;
  });
  audio.addEventListener('ended', function () { skipTrack(1, true); });
  audio.addEventListener('error', function () {
    if (audio.error) reportPlaybackError(audio.error);
  });

  handle.addEventListener('pointerdown', function (event) {
    if (event.target.closest('button')) return;
    isDragging = true;
    handle.setPointerCapture(event.pointerId);
    player.classList.add('drag');
    notify('drag-start', { x: event.clientX, y: event.clientY });
  });
  handle.addEventListener('pointermove', function (event) {
    if (isDragging) notify('drag-move', { x: event.clientX, y: event.clientY });
  });
  ['pointerup', 'pointercancel'].forEach(function (eventName) {
    handle.addEventListener(eventName, function () {
      if (!isDragging) return;
      isDragging = false;
      player.classList.remove('drag');
      notify('drag-end');
    });
  });
  handle.addEventListener('keydown', function (event) {
    var movement = {
      ArrowLeft: [-24, 0],
      ArrowRight: [24, 0],
      ArrowUp: [0, -24],
      ArrowDown: [0, 24]
    }[event.key];
    if (!movement) return;
    event.preventDefault();
    notify('move', { dx: movement[0], dy: movement[1] });
  });

  window.addEventListener('message', function (event) {
    if (event.source !== window.parent || !event.data || event.data.channel !== channel) return;
    if (event.data.type === 'toggle') togglePlayer();
    else if (event.data.type === 'request-state') notifySize();
  });

  updateUI();
  notifySize();
})();
