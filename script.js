
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


function biomedicalExtractor(dictation) {

// retrives biomedical words from cTAKES
//$(document).ready(function(){
    $.ajax({
        //url: "http://localhost:9999/ctakes?text=I%20would%20suggest%20taking%20paracetamol%20for%20your%20headache%20and%20possibly%20aspirin%20or%20codeine",
        url: "http://localhost:9999/ctakes?text=" + dictation,
        dataType: 'json',
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
                                    originalArray.indexOf(value) === -1 ? originalArray.push(value) : console.log("This item already exists");
                                    // document.getElementById("tokenInput").innerHTML = token;
                                    getWiki(value); //passes the token value to getWiki to retrieve the info
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
    
//});
}



// retrives text information about word
function getWiki(token) {

        // recieves article summary at top of Wiki page
        var URL = 'https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext&=';

        //var place = document.getElementById('userinput').value;
        //var place = token;
        URL += "&titles=" + token;
        URL += "&rvprop=content";
        URL += "&callback=?";
        //console.log(URL);
        $.getJSON(URL, function (data) {
            var obj = data.query.pages;
            var ob = Object.keys(obj)[0];
            //console.log(obj[ob]["extract"]);  

            document.getElementById("tokenInput").innerHTML = token;
            document.getElementById("wiki_intro").innerHTML = obj[ob]["extract"];
        
            imageWiki(token);


        });

        // avoids cross-origin-policy
    //     $.ajaxPrefilter(function (options) {
    //     if (options.crossDomain && jQuery.support.cors) {
    //         var https = (window.location.protocol === 'http:' ? 'http:' : 'https:');
    //         options.url = https + '//cors-anywhere.herokuapp.com/' + options.url;
    //     }
        
    // });


    



        
function setButtonColor(color) {
  $("button").css("background", function(x){
    return color;
  });
}

}

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
        //'https://en.wikipedia.org/w/api.php?action=query&titles=' + token + '&prop=images', // na        

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
    });

    //console.log('https://en.wikipedia.org/w/api.php?action=parse&format=json&prop=text&section=0&page=' + token + '&callback=?');
}

// exports the session into an XML/JSON format
function exportSession() {
    if(originalArray.length == 0) {
        alert("Nothing to export");
    }
    else {
        alert("Session exported");
        var fs = require("fs");
        fs.writeFile("./object.json", JSON.stringify(originalArray, null, 4), (err) => {
            if (err) {
                console.error(err);
                return;
            };
            console.log("File has been created");
        });
    }
}

