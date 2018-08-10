
// Speech to text
// speech-to-text algorihtm adapted from https://github.com/wesbos/JavaScript30/blob/master/20%20-%20Speech%20Detection/index-FINISHED.html

var dictation; // stores the word that we want to pass to the biomedical extractor


window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  
  let p = document.createElement('p');
  const words = document.querySelector('.words');
  words.appendChild(p);
  recognition.addEventListener('result', e => {
    const transcript = Array.from(e.results)
      .map(result => result[0])
      .map(result => result.transcript)
      .join('')

      if (e.results[0].isFinal) {
        var text = transcript;
        //console.log(text);
        dictation = encodeURIComponent(text.trim()); //replaces spaces with %20 to become a URL
        //console.log(dictation);
        biomedicalExtractor(dictation); // passes the text in URL format to biomedicalExtractor function

       }
  });
  recognition.addEventListener('end', recognition.start); // this means the app will conitnue to listen even if there is a pause
  recognition.start();



var originalArray = new Array(); // stores medical entities 
var jsonStorage = new Array(); // stores all the information from the session
     

function nextWord() {

    //traverse through originalArray to chech which index matches the element on the screen
    for(var i = 0; i < originalArray.length; i++) {
        if(originalArray[i] == document.getElementById("tokenInput").innerHTML) {
            if(originalArray[i] != originalArray[originalArray.length - 1]) {
                    var next = originalArray[i+1]; // gets the next word in the array
                    //console.log(next);
                    getWiki(next);

                    break;
                }
                else {
                    alert("No more words available");
                }
            } 

            
        }
    }

function previousWord() {
    // traverse through originalArray to chech which index matches the element on the screen
    for(var i = 0; i < originalArray.length; i++) {
            if(originalArray[i] == document.getElementById("tokenInput").innerHTML) {
                if(originalArray[i] != originalArray[0]) {
                    var prev = originalArray[i-1]; // gets the previous word in the array
                    //console.log(prev);
                    getWiki(prev);
                }
                else {
                    alert("No previous words available");
                }

            }
        


    }
    //;

}

// extracts biomedical terms from cTAKES
function biomedicalExtractor(dictation) {

    //  $.ajaxPrefilter(function (options) {
    //     if (options.crossDomain && jQuery.support.cors) {
    //         var https = (window.location.protocol === 'http:' ? 'http:' : 'https:');
    //         options.url = https + '//cors-anywhere.herokuapp.com/' + options.url;
    //     }
    // });
var URL = "http://localhost:9999/ctakes?text=" + dictation;
    
    $.ajax({ 

        //url: "http://localhost:9999/ctakes?text=I%20would%20suggest%20taking%20paracetamol%20for%20your%20headache%20and%20possibly%20aspirin%20or%20codeine",
        url: "http://localhost:9999/ctakes?text=" + dictation,
        dataType: 'json',
        // headers: {
        //     'Access-Control-Allow-Origin': URL,
        //     //'Access-Control-Allow-Origin': '*',
        //     'Access-Control-Allow-Methods' : "GET, HEAD, POST, PUT, OPTIONS",
        //     'Access-Control-Allow-Headers': 'X-Custom-Header'
        // },   
        success: function(data) {
        var jcontent = data; // assigns the data from the JSON file to the variable jcontent

        // read the JSON file and extract the biomedical words
        $(jcontent).each(function(index, value){ // iterates through jcontent
             if(value.typ == "org.apache.ctakes.typesystem.type.syntax.WordToken") { // WordToken is where the enitiy is stored
                current = jcontent[index];
                next = jcontent[index+1]; //gets the next index after WordToken
                 $(next).each(function(index, value){ // this will ensure we return the correct word
                    if(value.typ == "org.apache.ctakes.typesystem.type.textsem.MedicationMention") {
                        $(current).each(function(key, value) {
                            $.each(value.annotation , function(key, value){  
                                if(key == "canonicalForm") {
                                    // ensures no duplicates in array
                                    originalArray.indexOf(value) === -1 ? originalArray.push(value) && getWiki(value): console.log("This item already exists");
                                    //getWiki(value); //passes the token value to getWiki to retrieve the info
                                    console.log(originalArray); 
                                    }

                                }); 
                            
                            });

                        }

                    });

                }
             });
            //getWiki(originalArray[0]);
        }
    });
    
}



// retrives text information about word
function getWiki(token) {

    // $.ajaxPrefilter(function (options) {
    //     if (options.crossDomain && jQuery.support.cors) {
    //         var https = (window.location.protocol === 'http:' ? 'http:' : 'https:');
    //         options.url = https + '//cors-anywhere.herokuapp.com/' + options.url;
    //     }
    // });
        // recieves article summary at top of Wiki page
        var URL = 'https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext&=';

        URL += "&titles=" + token;
        URL += "&rvprop=content";
        URL += "&callback=?";
        console.log(URL);
        $.getJSON(URL, function (data) {
            var obj = data.query.pages;
            var ob = Object.keys(obj)[0];
            //console.log(obj[ob]["extract"]);  

            document.getElementById("tokenInput").innerHTML = token;
            document.getElementById("wiki_intro").innerHTML = obj[ob]["extract"];
        
            imageWiki(token);

        });

        
function setButtonColor(color) {
  $("button").css("background", function(x){
    return color;
  });
}

}

var imageURLS;
// retrives images
function imageWiki(token) {
    $("#img").html(""); // clears contents from earlier searches

    // $.ajaxPrefilter(function (options) {
    //     if (options.crossDomain && jQuery.support.cors) {
    //         var https = (window.location.protocol === 'http:' ? 'http:' : 'https:');
    //         options.url = https + '//cors-anywhere.herokuapp.com/' + options.url;
    //     }
    // });

    $.get(
        'https://en.wikipedia.org/w/api.php?action=parse&format=json&prop=text&section=0&page=' + token + '&callback=?',

    function (response) {
        var m;
        var urls = [];
        var regex = /<img.*?src=\\"(.*?)\\"/gmi;
        //re = /img.*?src="(.*?)"/g

        while (m = regex.exec(response)) {
            urls.push(m[1]);
        }

        urls.forEach(function (url) {
            $("#img").append('<img src="' + window.location.protocol + url + '">');
            
        });
        
        imageURLS = urls;

        //-------------------------------------------------
        //var jsonObject = new Array();
        var medical = document.getElementById("tokenInput").innerHTML;

        // store term, info, and image urls to store in json file
        var jsonObject = {
        "Medical_Term": document.getElementById("tokenInput").innerHTML,
        "Description": document.getElementById("wiki_intro").innerHTML,
        "Images": imageURLS,       
        };

        jsonStorage.push(jsonObject);
                
    });

}

// exports the session into JSON format
function exportSession() {
    if(originalArray.length == 0) {
        alert("Nothing to export");
    }
    else {
        console.log(jsonStorage);
        alert("Session Exported. To start another session, press the 'New Session' button");

        // code below is adapted from https://medium.com/@danny.pule/export-json-to-csv-file-using-javascript-a0b7bc5b00d2

       var jsonObject = JSON.stringify(jsonStorage); // makes data readable on exported file
       var csv = jsonObject;

       var fileTitle = 'session';

       var exportedFilename = fileTitle + '.txt' || 'export.txt'; // to change to csv file: fileTitle + '.csv' || 'export.csv'

       var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, exportedFilename);
        } else {
            var link = document.createElement("a");
            if (link.download !== undefined) { // feature detection
                // Browsers that support HTML5 download attribute
                var url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", exportedFilename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

        }

        // clears contents from that session
         $("#img").html(""); 
         $("#wiki_intro").html("");
         $("#tokenInput").html("");
         originalArray.length = 0;
         //jsonObject.length = 0;
         jsonStorage.length = 0;
         console.log(originalArray);
         //console.log(jsonObject);
         console.log(jsonStorage);



    }

}
