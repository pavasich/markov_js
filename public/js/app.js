/* Markov Chains WIP        (0.1)
      emphasis on WIP

   github: pavasich
   email: paul.vasich@gmail.com

---------------------------------

  USAGE: > var M = new Markov();
         > m.readText(string);
         > m.readText(otherstring)
         ...
         > m.finalize();
         > var chains = m.out;
         do something fun with chains

    This iteration of Markov waits patiently until passed a string with
      Markov.readText(string)
    The generated Markov chains are left un-normalized, thus allowing
      further calls of readText
    Call Markov.finalize() to normalize the chains and generate output,
      accessed via Markov.out
    Note that this iteration refuses to parse text after being finalized.

    TODO: add type checks
          catch errors
          make Markov dynamic
          add punctuation strip toggle
          add toLowercase toggle
          save results
          categorize results by 'style'
*/

// Toggle auto-test. true runs, anything else does not
var TESTING = false;

/* shuffle prototype
     an implementation of the Durstenfeld shuffle
        sounds like a dance move IMO
   O(n), so go nuts                               */
Array.prototype.shuffle = function() {
  for (var i = this.length-1; i > 0; i--) {
    var j = Math.floor((i+1) * Math.random());
    var tmp = this[i];
    this[i]  = this[j];
    this[j]  = tmp;
  }
}

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};
var starts = {};
var terminals = {};
var chains = {};
/////////////////////////////////////////////////                         Markov
function Markov() {

  // privates

  var finalized = false;
  var keys = Object.keys(starts);

  var readPair = function(word1, word2) {
    // if a chain exists, update it
    if (word1 == undefined || word2 == undefined ||
        word1.length == 0  || word2.length == 0)
        return

    if (chains[word1] != undefined)
      chains[word1].addWord(word2);

    // otherwise, add a new chain
    else {
      var chain = new Chain(word1);
      chain.addWord(word2);
      chains[word1] = chain;
    }
  }

  /* instanceOf Chain =>
       [[string_1, freq_1], ...[string_n, freq_n]]   */
  function genChains() {
    var ret = {};

    for (var key in chains)
      ret[key] = chains[key].values;

    return ret;
  }

  // publics

  // readText(string) => grow chain database via readPair
  this.readText = function(text) {
    if (finalized)
      throw "Markov: forgot how to read after finalize was called"

    var lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].split(' ');
      starts[line[0]] = 1;
      terminals[line[line.length-1]] = 1;
      for (var j = 0; j < line.length-1; j++)
        readPair(line[j], line[j+1])
    }
  }

  /* finalize() => normalize chains and generate ouput
       output appears at markov.out
       can only be called once!        */
  this.finalize = function() {
    if (finalized)
      throw 'Markov: can only call finalize once'

    // normalize each chain
    for (var key in chains)
      chains[key].normalize();

    // genChains generates the manageable chains
    this.out = genChains();
    finalized = true;
  }

  // get your groove on
  this.shuffle = function() {
    if (finalized !== true)
      throw "Markov: can't shuffle before finalize is called";

    for (var key in this.out)
      this.out[key].shuffle();
  }

  // the rest is terrible and furiously thrown together.

  this.next = function(word) {
    if (finalized !== true)
      throw "Markov: can't call next before finalize is called"

    var ls = this.out[word];
    if (ls == undefined || ls.length === 0) {
      return false;
    }
    var stop = Math.random();
    var sum = 0;
    for (var i = 0; i < ls.length; i++) {
      sum += ls[i][1];
      if (sum > stop) return ls[i][0];
    }

    if (sum < stop) {
      // console.log('next failed; returning random');
      ls.shuffle();
      return ls[0][0];
    }
    else
      return ls[ls.length-1][0];
  }

  var genSentence = function(sentence) {
    if (sentence == undefined) console.log('Whyyyyy')
    var nextWord = this.next(sentence[sentence.length-1]);

    if (nextWord === undefined)
      if (sentence.length < 3)
        return genSentence(keys[parseInt(Math.random() * starts.length)]);
      else
        return ' '.join(sentence);

    if (sentence.length >= 3 && terminals[nextWord] == 1)
      return ' '.join(sentence);
    else{
      sentence.push(nextWord);
      return genSentence(sentence);
    }
  }

  this.ramble = function(limit) {
    if (finalized !== true)
      throw "Markov: can't ramble before finalize is called";

    var output = '';
    for (var j = 0; j < limit; j++)
      output += genSentence(keys[parseInt(Math.random() * starts.length)])
  }
  return output;
}
/////////////////////////////////////////////////                     END Markov


/////////////////////////////////////////////////                          Chain
// TODO: streamline Chain constructor

function Chain(word) {
  // privates
  var car = word;
  var cdr = new NormalizedArray();
  var normalized = false;

  // publics

  // getCar() => Chain.car as a string
  this.getCar = function() {
    return car;
  }

  // addWord(string) => update cdr entry for string
  this.addWord = function(word) {
    cdr.add(word);
  }

  // normalize() => creates a public values attribute for Markov
  this.normalize = function() {
    if (normalized)
      throw "Chain: normalize can only be called once"

    cdr.normalize();
    normalized = true;
    this.values = cdr.ls;
  }
}
/////////////////////////////////////////////////                      END Chain


/////////////////////////////////////////////////                NormalizedArray
/*
  An array that can be normalized.
  Functions somewhat like a set. Only adds unique elements and
    keeps track of how many times it has seen each one.
  When normalized, the number of times each element has appeared
    is divided by the sum of updates (words added/incremented) to
    find each word's relative frequency
  That's how Markov "decides" which word comes next in a chain

  TODO: ignore garbage
*/

function NormalizedArray() {

  var members = {};
  var wordCount = 0;
  var normalized = false;
  this.ls = [];

  /* add(string) => pushes into ls and members if it's unique
       otherwise, add 1 to the number of times it has been added */
  this.add = function(item) {
    if (members[item] != undefined)
      members[item] += 1;

    else {
      members[item] = 1;
      this.ls.push(item);
    }
    wordCount += 1; // always
  }
  // word count => word frequency
  this.normalize = function() {
    if (normalized)
      throw 'NormalizedArray: normalize can only be called once';

    for (var i = 0; i < this.ls.length; i++)
      this.ls[i] = [this.ls[i], (members[this.ls[i]] / wordCount)];

    normalized = true;
  }
}
/////////////////////////////////////////////////            END NormalizedArray


/////////////////////////////////////////////////                      quicksort
// function quicksort(ls) {
//   if (ls.length === 0)
//     return [];
//
//   var l = [], p = ls[0], r = [];
//
//   for (var i = 1; i < ls.length; i++) {
//     if (ls[i].frequency < p.frequency){
//       l.push(ls[i]);
//       console.log(l)}
//     else
//       r.push(ls[i]);
//   }
//   return quicksort(l).concat(p, quicksort(r));
// }
/////////////////////////////////////////////////                  END quicksort



/////////////////////////////////////////////////                        Testing
// if (TESTING){
// var m = new Markov();
//
// m.finalize();
// var result = m.out;
// }
////////////////////////////////////////////////////                 END Testing
window.onload = function() {
  var text = document.createElement('div');
  text.class = '.text';
  console.log('starting ajax');
  var markov = new MarkovComp();
  var markovParent = document.getElementById('output');
  $.ajax({
    url: "http://localhost:3000/src/sci-fi.txt",
    dataType: "text",
    success: function(data) {
      markov.init(markovParent, data)
    }
  });

  var btn = document.getElementById('submit-text');
  btn.addEventListener('click', function() {
    markov.render();
  });

}

function MarkovComp() {
  var initialized = false;
  var domElement  = null;
  var markov      = null;

  this.init = function(selector, text) {
    if (initialized)
      throw 'MarkovComp: can only be initialized once'

    markov = new Markov();
    markov.readText(text);
    markov.finalize();

    domElement = document.createElement('div');
    selector.appendChild(domElement);

    initialized = true;
    console.log('initialied component');
    var d = markov.ramble(5);
    domElement.innerHTML = d;
  }

  this.render = function() {
    var text = markov.ramble(5);
    domElement.innerHTML = text;
  }
}
