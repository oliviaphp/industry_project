$('#showLoader').hide(); // hides the loading icon

var originalArray = new Array(); // stores medical entities 
var jsonStorage = new Array(); // stores all the information from the session
var newArray = new Array(); // stores buttons under Session Terms
var check = new Array(); // helps to ensure no duplicates in exported JSON file

var snomedCode; // contains the snomed code for a particular medical entity
var snomedArray = new Array();


// Speech to text
// speech-to-text algorithm adapted from https://github.com/wesbos/JavaScript30/blob/master/20%20-%20Speech%20Detection/index-FINISHED.html

var dictation; // stores the text that we want to pass to the biomedical extractor

// set recognition interface to SpeechRecognition regardless of what browser the user is on
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// instantiate speech recognition interface
const recognition = new SpeechRecognition();
recognition.interimResults = true; // supports interim results
recognition.lang = 'en-US';
  
  let p = document.createElement('p');
  const words = document.querySelector('.words');
  words.appendChild(p);

  // dictate
  recognition.addEventListener('result', e => {
    const transcript = Array.from(e.results)
      .map(result => result[0])
      .map(result => result.transcript)
      .join('')

      if (e.results[0].isFinal) {
        var text = transcript;
        dictation = encodeURIComponent(text.trim()); //replaces spaces with %20 to become a URL
        biomedicalExtractor(dictation); // passes the text in URL format to biomedicalExtractor function
        

       }
  });

  recognition.addEventListener('end', recognition.start); // this means the app will continue to listen even if there is a pause
  recognition.start();

// end of speech-to-text

// navigate to next word
function nextWord() {

    //traverse through originalArray to check which index matches the element on the screen
    for(var i = 0; i < originalArray.length; i++) {
        if(originalArray[i] == document.getElementById("tokenInput").innerHTML) {
            if(originalArray[i] != originalArray[originalArray.length - 1]) {
                    var next = originalArray[i+1]; // gets the next word in the array
                    getWiki(next);

                    break;
                }
                else {
                    alert("No more words available");
                }
            } 

            
        }
    }

// navigate to previous word
function previousWord() {
    // traverse through originalArray to check which index matches the element on the screen
    for(var i = 0; i < originalArray.length; i++) {
            if(originalArray[i] == document.getElementById("tokenInput").innerHTML) {
                if(originalArray[i] != originalArray[0]) {
                    var prev = originalArray[i-1]; // gets the previous word in the array
                    getWiki(prev);
                }
                else {
                    alert("No previous words available");
                }

            }

    }

}

// deletes word
function deleteWord() {

    if(originalArray.length == 0) {
        alert("Session is empty. Nothing to delete");
    }
    else { // delete word  
        for(var j = 0; j < check.length; j++) { // delete from check array
            if(check[j] == document.getElementById("tokenInput").innerHTML) {
                check.splice(j, 1);
            }
        }

        $(jsonStorage).each(function(index, value){ // delete from jsonStorage
            if(value.Medical_Term == document.getElementById("tokenInput").innerHTML) {
                jsonStorage.splice(index, 1);
            }
        });

        // delete from snomed array
        console.log(document.getElementById("snomed").innerHTML);
        for(var k = 0; k < snomedArray.length; k++) {
            if(snomedArray[k] == document.getElementById("snomed").innerHTML) {
                snomedArray.splice(k, 1);
            }
        }

        var lastElement = originalArray[originalArray.length - 1];

        // delete from originalArray and change app display
        for(var i = 0; i < originalArray.length; i++) { 
            if(originalArray[i] == document.getElementById("tokenInput").innerHTML) { 
                var wordDelete = originalArray[i];
                if(wordDelete == lastElement){
                    var prev = originalArray[i-1];
                    originalArray.splice(i, 1);
                    getWiki(prev);
                }
                else {
                    var next = originalArray[i+1];
                    originalArray.splice(i, 1);
                    getWiki(next);
                    }
                
                }
                
            }
        }
            
        showArray(originalArray);
    }
            


// extracts biomedical terms from text using cTAKES
function biomedicalExtractor(dictation) {

    var URL = "http://localhost:9999/ctakes?text=" + dictation;
    
    $.ajax({ 
        url: "http://localhost:9999/ctakes?text=" + dictation,
        dataType: 'json', 
        success: function(data) {
        var jcontent = data; // assigns the data from the JSON file to the variable jcontent

        // read the JSON file and extract the biomedical words
        $(jcontent).each(function(index, value){ // iterates through jcontent
             if(value.typ == "org.apache.ctakes.typesystem.type.syntax.WordToken") { // WordToken is where the entity is stored
                current = jcontent[index];
                next = jcontent[index+1]; //gets the next index after WordToken
                 $(next).each(function(index, value){ // this will ensure we return the correct word
                    if(value.typ == "org.apache.ctakes.typesystem.type.textsem.MedicationMention" || value.typ == "org.apache.ctakes.typesystem.type.textsem.SignSymptomMention" 
                        || value.typ == "org.apache.ctakes.typesystem.type.textsem.DiseaseDisorderMention" || value.typ == "org.apache.ctakes.typesystem.type.textsem.ProcedureMention" 
                        || value.typ == "org.apache.ctakes.typesystem.type.textsem.AnatomicalSiteMention") {
                        $.each(value.annotation , function(key, value){   // get snomed code for value                               
                         if(key == "ontologyConceptArr") {
                            var position = value[0];
                            $(position).each(function(key, value) {
                                $.each(value.annotation , function(key, value){
                                    if(key == "code") {
                                        snomedCode = value; // snomed code 
                                        snomedArray.indexOf(value) === -1 ? snomedArray.push(value) : console.log(""); // if no duplicates, add to snomedArray    
                                        }
                                    });
                                });
                             }
                            }); // end of get snomed code
                        $(current).each(function(key, value) {                           
                            $.each(value.annotation , function(key, value){  // get medical term to pass to getWiki
                                if(key == "canonicalForm") {
                                    // ensures no duplicates in array
                                    originalArray.indexOf(value) === -1 ? originalArray.push(value) && getWiki(value) : console.log(""); 
                                    showArray(originalArray);
                                    }

                                });         
                            
                            });

                        }

                    });

                }
             });
        }
    });
    
}

// displays the originalArray under Term Log
// this allows users to go directly to the page they want
function showArray(array) {
    $("#logs").html("");

    newArray = array.join("\n"); // puts each array element on new line
    var newArray = array.slice(' ');

    // adding buttons based on input and creating dynamic ids
    for (var i = 0; i < newArray.length; i++) {
        document.getElementById("logs").innerHTML += "<button class='button' id=myId"+i+">" + newArray[i] + "</button>" + "\n";
   }

   // if button is clicked, go to relevant page
   $("button").click(function() {
        var theValue=$(this).text(); // get the button text

        for(var j = 0; j < originalArray.length; j++) {
            originalArray[j] == theValue ? getWiki(theValue) : console.log("");
        }
    });

}


// retrieves text information about word
function getWiki(token) {
    
    $('#showLoader').show(); // shows loading icon to let user know the app is processing the information

    // CORS origin request
    // $.ajaxPrefilter(function (options) {
    //     if (options.crossDomain && jQuery.support.cors) {
    //         var https = (window.location.protocol === 'http:' ? 'http:' : 'https:');
    //         options.url = https + '//cors-anywhere.herokuapp.com/' + options.url;
    //     }
    // });

        // receives article summary at top of Wiki page
        var URL = 'https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext&=';

        URL += "&titles=" + token;
        URL += "&rvprop=content";
        URL += "&callback=?";

        $.getJSON(URL, function (data) {
            var obj = data.query.pages;
            var ob = Object.keys(obj)[0]; 

            // get correct snomed code
            var snomedIndex;
            var code;

            for(var i = 0; i < originalArray.length; i++) {
            originalArray[i] == token ? snomedIndex = i : console.log("");
            }


            for(var j = 0; j <= snomedArray.length; j++) {
                j == snomedIndex ? code = snomedArray[j]: console.log("");
            }


            // display info on page
            document.getElementById("tokenInput").innerHTML = token;
            document.getElementById("wiki_intro").innerHTML = obj[ob]["extract"];
            document.getElementById("snomed").innerHTML = code;

            $('#showLoader').hide();
        
            imageWiki(token);

        });

        
function setButtonColor(color) {
  $("button").css("background", function(x){
    return color;
  });
}

}



var imageURLS;
// retrieves images
function imageWiki(token) {
    $("#img").html(""); // clears contents from earlier searches

    // CORS origin request
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
 
        while (m = regex.exec(response)) {
            urls.push(m[1]);
        }

        urls.forEach(function (url) {
            $("#img").append('<img src="' + window.location.protocol + url + '">');
            
        });
        
        imageURLS = urls;


        // store term, info, and image urls to store in json file
        var jsonObject = {
        "Medical_Term": document.getElementById("tokenInput").innerHTML,
        "Description": document.getElementById("wiki_intro").innerHTML,
        "Images": imageURLS,       
        };
    

        // algorithm to ensure no duplicates in exported JSON file
       if(check.length != 0) {
        $.each(check, function(index, value) {
            check.indexOf(jsonObject.Medical_Term) === -1 ? check.push(jsonObject.Medical_Term) && jsonStorage.push(jsonObject) : console.log("");
        });
       }
       else {
        check.push(jsonObject.Medical_Term);
        jsonStorage.push(jsonObject);
       }        
        
    });

}


// exports the session into JSON format
function exportSession() {
    if(originalArray.length == 0) {
        alert("Nothing to export");
    }
    else {
        alert("Session Exported");

    var d = new Date();

        // code below is adapted from https://medium.com/@danny.pule/export-json-to-csv-file-using-javascript-a0b7bc5b00d2

        // converts object to JSON
       var jsonFile = JSON.stringify(jsonStorage, null, "\t"); // makes data readable on exported file
       var csv = jsonFile;

       var fileTitle = d; // names the exported file

       var exportedFilename = fileTitle + '.json' || 'export.json'; // to change to csv file: fileTitle + '.csv' || 'export.csv'

       var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); // creating blob and inserting data into the blob
        if (navigator.msSaveBlob) { // if browser supports saving of blobs
            navigator.msSaveBlob(blob, exportedFilename);
        } else { // if browser doesn't support saving of blobs
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
        // this refreshes the page for a new session 
         $("#img").html(""); 
         $("#wiki_intro").html("");
         $("#tokenInput").html("");
         $("#logs").html(""); 
         $("#snomed").html(""); 
         originalArray.length = 0;
         jsonStorage.length = 0;
         check.length = 0;
         snomedArray.length = 0;
    }


    // upload to Azure blob storage
    // this code is adapted from https://dmrelease.blob.core.windows.net/azurestoragejssample/samples/sample-blob.html
    var blobUri = 'https://' + 'medicalwebapp' + '.blob.core.windows.net';
    var blobService = AzureStorage.Blob.createBlobServiceWithSas(blobUri, '?sv=2017-11-09&ss=b&srt=sco&sp=rwdlac&se=2018-09-02T22:07:22Z&st=2018-09-02T14:07:22Z&spr=https&sig=KHUZ9JPGV%2FmwiJoFBZ%2FH%2F%2B6NOZQ1mRAJhn1S3pT4Kn0%3D');
    var file = exportedFilename;

    var customBlockSize = file.size > 1024 * 1024 * 32 ? 1024 * 1024 * 4 : 1024 * 512;
    blobService.singleBlobPutThresholdInBytes = customBlockSize;

    var finishedOrError = false;
    var speedSummary = blobService.createBlockBlobFromText('sessiondata', d + '.json', csv, function(error, result, response) {
    finishedOrError = true;
    if (error) {
        console.log("Upload Blob failed");
    } else {
        // Upload successful
    }
        });



}



