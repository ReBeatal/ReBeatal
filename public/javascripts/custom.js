'use strict';
/*
 * VARIABLES, BABY!
 */
var socket = io.connect(); // Our dearest socket
var TIMEOUT = 7; // How long to wait for a server response before giving up
var THINKING = false; // Is ReBeatal processing a request right now?
var TEXTBOX = document.getElementById('ask'); // The question textbox

var ac = typeof AudioContext !== 'undefined' ? new AudioContext() : new webkitAudioContext();
var when = ac.currentTime;  // get the current Web Audio timestamp (this is when playback should begin)
var sequence1, sequence2, sequence3;
var tempo = 132;  // set the tempo

var param = getUrlParameter('q');
if(param !== null) {
  $('#ask').val(param);
  onQuestion();
}


// Play MP3 from URL
function playSound(url) {
  document.getElementById('audio').innerHTML = '<audio rel="noreferrer" src="' + url + '" autoplay loop="loop"></audio>';
  document.getElementById('dance').innerHTML = '<img src="/images/dance.gif">';
}

// Enter key press fuction
$(document).keypress(function(event) {
  if ((event.which == 13 || event.keyCode == 13) && !THINKING) {
    onQuestion();
  }
});

function onQuestion() {
  // Do this stuff when they hit enter
  var input = TEXTBOX.value;
  console.log('Asking server: ' + input);
  THINKING = true;

  TEXTBOX.value = "I'm thinking...";
  TEXTBOX.disabled = true;
  queryServer(input);
}

socket.on('message', function(msg) {
  didRespond = true;

  console.log('Got response from server: ' + msg.stuff);
  console.log(msg.audioURL);

  TEXTBOX.disabled = false;
  TEXTBOX.focus();

  if (THINKING) {
    setShareUrl(msg.query);
    playSound(msg.audioURL);
    stopAudio();
    setNotes(msg.notes);
    playAudio();
    document.getElementById('overwrite').innerHTML = '<p class="lead">' + msg.stuff + '</p>';
  }

  if (!msg.success) {
    TEXTBOX.value = '';
  } else {
    TEXTBOX.value = msg.query;
  }
  // Keep this variable assignment at the bootom
  THINKING = false;
});

var didRespond = false;
// Function to query the server
function queryServer(q) {
  didRespond = false;
  // Ask the server
  socket.emit('query', q);

  // No response in var=TIMEOUT amount of seconds
  setTimeout(function() {
    if (!didRespond) {

      TEXTBOX.disabled = false;
      TEXTBOX.value = '';
      TEXTBOX.focus();

      alert('The server appears to have cancer. ReBeatal the bot may have escaped his confines, the world is at risk.');

      // Keep this variable assignment at the bootom
      THINKING = false;
    }
  }, TIMEOUT * 1000);
}

function setShareUrl(query) {
  var shareUrl = window.location.protocol + '//' + window.location.hostname + '?q=' + encodeURIComponent(query);
  $('#share-box').val(shareUrl);
  return shareUrl;
}

function setNotes(lead) {
  // create an array of "note strings" that can be passed to a sequence

  // create 3 new sequences (one for lead, one for harmony, one for bass)
  sequence1 = new TinyMusic.Sequence( ac, tempo, lead );
  sequence2 = new TinyMusic.Sequence( ac, tempo, harmony );
  sequence3 = new TinyMusic.Sequence( ac, tempo, bass );

  // set staccato and smoothing values for maximum coolness
  sequence1.staccato = 0.55;
  sequence2.staccato = 0.55;
  sequence3.staccato = 0.05;
  sequence3.smoothing = 0.4;

  // adjust the levels so the bass and harmony aren't too loud
  sequence1.gain.gain.value = 1.0 / 2;
  sequence2.gain.gain.value = 0.8 / 2;
  sequence3.gain.gain.value = 0.65 / 2;

  // apply EQ settings
  sequence1.mid.frequency.value = 800;
  sequence1.mid.gain.value = 3;
  sequence2.mid.frequency.value = 1200;
  sequence3.mid.gain.value = 3;
  sequence3.bass.gain.value = 6;
  sequence3.bass.frequency.value = 80;
  sequence3.mid.gain.value = -6;
  sequence3.mid.frequency.value = 500;
  sequence3.treble.gain.value = -2;
  sequence3.treble.frequency.value = 1400;
}

function playAudio() {
  console.log('Playing audio');
  when = ac.currentTime;
  sequence1.play(when + ( 60 / tempo ) * 16 );
  sequence2.play(when + ( 60 / tempo ) * 16 );
  sequence3.play(when);
}

function stopAudio() {
  console.log('Stopping audio');
  if(sequence1) sequence1.stop();
  if(sequence2) sequence2.stop();
  if(sequence3) sequence3.stop();
}

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

var harmony = [
  '-   e',
  'D4  e',
  'C4  e',
  'D4  e',
  'Bb3 e',
  'C4  e',
  'A3  e',
  'Bb3 e',

  'G3  e',
  'A3  e',
  'Bb3 e',
  'A3  e',
  'G3  e',
  'A3  e',
  'F3  q',

  '-   e',
  'D4  s',
  'C4  s',
  'D4  e',
  'Bb3 e',
  'C4  e',
  'Bb3 e',
  'A3  e',
  'Bb3 e',

  'G3  e',
  'A3  e',
  'Bb3 e',
  'A3  e',
  'G3  s',
  'A3  s',
  'G3  e',
  'F3  q'
];
var bass = [
  'D3  q',
  '-   h',
  'D3  q',

  'A2  q',
  '-   h',
  'A2  q',

  'Bb2 q',
  '-   h',
  'Bb2 q',

  'F2  h',
  'A2  h'
];
