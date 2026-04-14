import WaveSurfer from 'wavesurfer.js';

export class AudioEngine {
    constructor() {
        const container = document.querySelector('#waveform');
        if (!container) return;

        this.wavesurfer = WaveSurfer.create({
            container: '#waveform',
            waveColor: '#bf5fff',
            progressColor: '#00f5ff',
            cursorColor: '#ffffff',
            barWidth: 2,
            barRadius: 3,
            responsive: true,
            height: 80,
            normalize: true,
            partialRender: true
        });

        this.isPlaying = false;
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;

        this.init();
    }

    async init() {
        if (!this.wavesurfer) return;

        // Switching to a local asset to avoid CORS issues with external URLs.
        const audioUrl = '/assets/demo.mp3';
        this.wavesurfer.load(audioUrl);

        const playBtn = document.getElementById('playPause');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                if (this.wavesurfer.isPlaying()) {
                    this.wavesurfer.pause();
                    playBtn.innerText = 'PLAY';
                } else {
                    this.wavesurfer.play();
                    playBtn.innerText = 'PAUSE';
                    this.setupAudioContext();
                }
            });
        }

        this.wavesurfer.on('ready', () => {
            const durationEl = document.getElementById('duration');
            if (durationEl) durationEl.innerText = this.formatTime(this.wavesurfer.getDuration());
        });

        this.wavesurfer.on('audioprocess', () => {
            const currentEl = document.getElementById('currentTime');
            if (currentEl) currentEl.innerText = this.formatTime(this.wavesurfer.getCurrentTime());
        });
    }

    setupAudioContext() {
        if (!this.audioContext) {
            const audio = this.wavesurfer.getMediaElement();
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = this.audioContext.createMediaElementSource(audio);
            this.analyser = this.audioContext.createAnalyser();
            
            source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            this.analyser.fftSize = 256;
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
        }
    }

    getFrequencyData() {
        if (this.analyser) {
            this.analyser.getByteFrequencyData(this.dataArray);
            return this.dataArray;
        }
        return null;
    }

    formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }
}
