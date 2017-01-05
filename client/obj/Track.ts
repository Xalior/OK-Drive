
export class Track {
    url: String;
    frames: number;
    monoContext: OfflineAudioContext;
    context: OfflineAudioContext;
    buffer: AudioBuffer;
    data_original: Array<number>;
    data_lowpass: Array<number>;
    data_rate: Array<number>;
    data_beats: Array<number>;
    name: String;
    bpm: number;
    artist: String;

    constructor() {

    }
}