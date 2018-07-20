function testLocation() {
  var hostname = window.location.hostname;
	var href     = window.location.href;
	var referrer = document.referrer;
	var isBot    = /bot|google|baidu|bing|msn|duckduckbot|teoma|slurp|yandex/i.test(navigator.userAgent);

	console.log(hostname);
	console.log(href);
	console.log(referrer.length);
	console.log(isBot);
	console.log(navigator.userAgent);

  if ((hostname == 'area24.ilsole24ore.com') && (!isBot) &&
      ((href == 'http://area24.ilsole24ore.com/') || (href == 'https://area24.ilsole24ore.com/')) &&
      (((referrer.indexOf("area24-en.ilsole24ore.com") == -1) && (referrer.indexOf("area24.ilsole24ore.com") == -1)) || 
          (referrer.length == 0) || (href == referrer))
      ) 
    {
    var request  = new XMLHttpRequest();
    
    request.open('GET', 'https://ipapi.co/json/', true);
    
    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
      // Success!
      var data = JSON.parse(request.responseText);
      console.log("Vanilla JS");
      console.log(data);
      var country = data.country;
      if (country !== "IT") {
        console.log("redirect to english");
  			window.location.replace("https://area24-en.ilsole24ore.com");
        }
      } else {
      // We reached our target server, but it returned an error
      }
    };
    request.onerror = function() {
      // There was a connection error of some sort
      };
    request.send();
    }
	}

testLocation();

/*
Property	Description
hash	Sets or returns the anchor part (#) of a URL
host	Sets or returns the hostname and port number of a URL
hostname	Sets or returns the hostname of a URL
href	Sets or returns the entire URL
origin	Returns the protocol, hostname and port number of a URL
pathname	Sets or returns the path name of a URL
port	Sets or returns the port number of a URL
protocol	Sets or returns the protocol of a URL
search	Sets or returns the querystring part of a URL

*/