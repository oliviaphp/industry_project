// Taken from: https://github.com/JAnken123/wikipediagame

var originalArray = new Array(); // stores medical entities 

function nextWord() {

    //traverse through originalArray to chech which index matches the element on the screen
    for(var i = 0; i < originalArray.length; i++) {
        if(originalArray[i] == document.getElementById("tokenInput").innerHTML) {
            if(originalArray[i] != originalArray[originalArray.length - 1]) {
                    var next = originalArray[i+1]; // gets the next word in the array
                    console.log(next);
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
                    console.log(prev);
                    getWiki(prev);
                }
                else {
                    alert("No previous words available");
                }

            }
        


    }
    //;

}

// retrives biomedical words from cTAKES
//$(document).ready(function(){
    $.ajax({
        url: "http://localhost:9999/ctakes?text=I%20would%20suggest%20taking%20paracetamol%20for%20your%20headache%20and%20possibly%20aspirin%20or%20codeine",
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
                            $.each(value.annotation , function(key, value ){  
                                if(key == "canonicalForm") {
                                    // token = value;
                                    // document.getElementById("tokenInput").innerHTML = token;
                                    // getWiki(token); //passes the token value to getWiki to retrieve the info
                                    originalArray.push(value);
                                }

                            }); 
                            
                        });


                    }



                 });

                }
             });
        getWiki(originalArray[0]);
    }
});
    
//});



// retrives text information about word
function getWiki(token) {
    document.getElementById("tokenInput").innerHTML = token;

        // recieves article summary at top of Wiki page
        var URL = 'https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext&=';

        //var place = document.getElementById('userinput').value;
        var place = token;
        URL += "&titles=" + place;
        URL += "&rvprop=content";
        URL += "&callback=?";
        //console.log(URL);
        $.getJSON(URL, function (data) {
            var obj = data.query.pages;
            var ob = Object.keys(obj)[0];
            //console.log(obj[ob]["extract"]);
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
    //var word = document.getElementById('tokenInput').value;
    console.log(token);

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
}

