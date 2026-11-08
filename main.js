audioCtx = new AudioContext();
masterGain = audioCtx.createGain();
masterGain.connect(audioCtx.destination);

class Tonepad {
  constructor () {
    this.touchTones = {};
    this.el = document.getElementById('tonepad');
    this.minNote = 72;
    this.maxNote = 85;
    this.upForHigherNotes = true;

    this.el.addEventListener('touchstart', e => {
      e.preventDefault();
      e.stopPropagation();
      for (let i = 0; i < e.changedTouches.length; i++) {
        let touch = e.changedTouches[i];
        let preciseMidi = this.calcPreciseMidi(touch);
        let midiRounded = Math.round(preciseMidi);
        let freq = this.midiToFreq(midiRounded);

        let newTone = new Tone(freq);
        this.touchTones[touch.identifier] = {
          yInit: touch.clientY,
          tone: newTone,
          midiOffset: midiRounded - preciseMidi
        };
        newTone.start();
      }
    });

    this.el.addEventListener('touchmove', e => {
      e.preventDefault();
      e.stopPropagation();
      for (let i = 0; i < e.changedTouches.length; i++) {
        let touch = e.changedTouches[i];
        let preciseMidi = this.calcPreciseMidi(touch);
        let tt = this.touchTones[touch.identifier];
        tt.tone.edit(this.midiToFreq(preciseMidi + tt.midiOffset));
      }
    });

    this.el.addEventListener('touchend', e => {
      e.preventDefault();
      e.stopPropagation();
      let changedIds = [];
      for (let i = 0; i < e.changedTouches.length; i++) {
        let id = e.changedTouches[i].identifier;
        this.touchTones[id].tone.stop();
      }
    });
  }

  getPadY (touch) {
    let y = this.upForHigherNotes
      ? this.el.clientHeight - touch.clientY
      : touch.clientY;

    return y / this.el.clientHeight;
  }

  calcPreciseMidi (touch) {
    return this.getPadY(touch) * (this.maxNote - this.minNote) + this.minNote;
  }
  
  midiToFreq (midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);  
  }
}

class Tone {
  constructor (freq) {
    this.osc = audioCtx.createOscillator();
    this.gain = audioCtx.createGain();
  
    this.osc.connect(this.gain);
    this.gain.connect(masterGain);
  
    this.osc.frequency.value = freq;

    this.osc.type = 'sawtooth';
    this.fadeTime = 0.8;
  }

  start () {
    this.osc.start();
  }

  edit (freq) {
    this.osc.frequency.value = freq;
  }

  stop () {
    let stopTime = audioCtx.currentTime + this.fadeTime;
    this.gain.gain.exponentialRampToValueAtTime(0.001, stopTime);
    this.osc.stop(stopTime);
  }
}

let tonepad = new Tonepad();
