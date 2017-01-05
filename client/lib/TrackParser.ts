import { Track } from '../obj/Track'

let track: Track;

const beatCountLength: number =  1.5;            // in seconds;
const beatCountSamples: number = 300;   // a magic constant;

/*
 This may take several seconds to load depending on bandwidth.
 Once completed it will provide several global arrays in track.buffers...
 */

function loadTrack(url, completed) {
    const audioCtx = new (<any>window.AudioContext || window.webkitAudioContext)();  // Original Decoder
    // Fetch Audio Track via AJAX with URL
    let request = new XMLHttpRequest();

    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    request.onload = function(ajaxResponseBuffer) {
        track.frames = ajaxResponseBuffer['total'];
        // Arguments: Channels, Length, Sample Rate
        track.monoContext = new OfflineAudioContext(1, track.frames, 44100); // FX Decoder (in mono)

        var audioData = request.response;
        audioCtx.decodeAudioData(audioData, function(buffer) {
            track.buffer = buffer;
            track.data_original = numberizeArray(track.buffer.getChannelData(0));

            generateFilters(completed);
        }, decodeFail);
    };
    request.send();

    return audioCtx;
}

function decodeFail(e) {
    alert('decodeFail');
    console.log('decodeFail: ', e)
}

function generateFilters(completed) {
    Promise.all([
        generateLowPassFilter()
    ]).then(() => {
        console.log("generating BPM");
        if(track.buffer.duration>30) {
            var clip = getClip(30,
                (track.buffer.duration/2)-15, track.data_lowpass);
            var sample = getSampleClip(clip, 900);
            var nSample = normalizeArrayP(sample);
            track.bpm = countFlatLineGroupings(nSample).length;
        }
    }).then(() => {
        console.log("generating pace data");
        track.data_rate = new Array();
        for(var trackPiece = 0; trackPiece<track.buffer.duration; trackPiece++) {
            var beats = generateClipBeats(beatCountLength, trackPiece, track.data_lowpass);
            var sample = getSampleClip(beats, beatCountSamples);
            var nSample = normalizeArrayP(sample);
            var beatCount = countFlatLineGroupings(nSample).length;
            track.data_rate.push(beatCount);
        }
    }).then(() => {
        console.log("flagging beats");
        var data_beats = countFlatLineGroupings(getSampleClip(track.data_lowpass, track.buffer.duration*20));
        console.log('sample for beatsing: ',track.buffer.duration,data_beats.length)
        track.data_beats = new Array();
        data_beats.forEach((beat) => {
            track.data_beats.push(Math.floor(((beat/20)*44100)+0.1));
        });
        console.log(track.data_beats);
    }).then(() => {
        completed();
    });
}

function generateClipBeats(length, startTime, source) {
    var clip_length = length * track.buffer.sampleRate;
    var section = startTime * track.buffer.sampleRate;
    var newArr = [];

    for (var i = 0; i < clip_length; i++) {
        newArr.push(source[section + i]);
    }

    return newArr;
}

function generateLowPassFilter() {
    var source = track.monoContext.createBufferSource();
    source.buffer = track.buffer;

    // Create a Low Pass Filter to Isolate Low End Beat
    var filter = track.monoContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 180;
    source.connect(filter);
    filter.connect(track.monoContext.destination);

    // Schedule start at time 0
    source.start(0);

    // Render this low pass filter data to new Audio Context and Save in 'lowPassAudioBuffer'
    return track.monoContext.startRendering().then((lowPassAudioBuffer) =>{
// LOW PASS FILTER
        var audioCtx = new AudioContext();
        var song = audioCtx.createBufferSource();
        song.buffer = lowPassAudioBuffer;
        song.connect(audioCtx.destination);

        track.data_lowpass = normalizeArrayP(song.buffer.getChannelData(0));
        console.log("Low Pass Buffer Rendered!");
    });
}

function numberizeArray(data) {

    var newArray = [];

    for (var i = 0; i < data.length; i++) {
        newArray.push(Math.round((data[i + 1] - data[i]) * 1000));
    }

    return newArray;
}

function normalizeArrayP(data) {

    var newArray = [];

    for (var i = 0; i < data.length; i++) {
        newArray.push(Math.abs(Math.round((data[i + 1] - data[i]) * 1000)));
    }

    return newArray;
}

function getSampleClip(data, samples) {
    var newArray = [];
    var modulus_coefficient = Math.round(data.length / samples);

    for (var i = 0; i < data.length; i++) {
        if (i % modulus_coefficient == 0) {
            newArray.push(data[i]);
        }
    }
    return newArray;
}

function countFlatLineGroupings(data) {
    var groupings = 0;
    var newArray = normalizeArrayP(data);
    var timings = new Array();

    var max = getMax(newArray);
    var min = getMin(newArray);
    var threshold = Math.round((max - min) * 0.2);

    for (var i = 0; i < newArray.length; i++) {

        if (newArray[i] > threshold &&
            newArray[i + 1] < threshold &&
            newArray[i + 2] < threshold &&
            newArray[i + 3] < threshold &&
            newArray[i + 4] < threshold) {
            timings.push(i);
        }
    }

    return timings;
}

function getClip(length, startTime, data) {

    var clip_length = length * 44100;
    var section = startTime * 44100;
    var newArr = [];

    for (var i = 0; i < clip_length; i++) {
        newArr.push(data[section + i]);
    }

    return newArr;
}

function getMax(a) {
    var m = -Infinity,
        i = 0,
        n = a.length;

    for (; i != n; ++i) {
        if (a[i] > m) {
            m = a[i];
        }
    }
    return m;
}

function getMin(a) {
    var m = Infinity,
        i = 0,
        n = a.length;

    for (; i != n; ++i) {
        if (a[i] < m) {
            m = a[i];
        }
    }
    return m;
}

export function TrackParser(url: String = "demo.mp3", completed): Track {
    track = new Track();
    track.url = url;

    track.context = loadTrack('/assets/'+track.url, completed);
    return track;
}