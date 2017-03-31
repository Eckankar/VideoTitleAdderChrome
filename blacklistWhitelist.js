// blacklist and whitelist should contain strings corresponding to 
// specific urls that are on the whitelist (allowed for preview)
// or blacklist (prevented from preview).
var blacklist = [];
var whitelist = [];




// addBeginning takes a url without a http:// beginning (or equal)
// and returns a list of strings composed of the url with the beginnings
// found in beginList.
// addBeginning: Str -> listof(Str)
function addBeginning(inString){

	// beginList contains common url headers, like www., http, and https.
	// Intended to add multiple instances of a url, so that the blacklist
	// works no matter the used protocol.
	var beginList = ["https://", "http://"];
	var returnList = [];
	var tempUrl;
	for (var i = 0; i < beginList.length; i++){
		tempUrl = beginList[i] + inString;
		returnList.push(tempUrl);
	}

	return returnList;
};

// removeBeginning takes a url that may have a http:// or http://
// and returns a string without that beginning. If the input has a
// www. at the beginning, the original input is returned. If none
// of the three beginnings are found, then www. is added to the
// original input and then is returned.
// removeBeginning: Str -> Str
function removeBeginning(inString){
	removeList = ["http://", "https://"];

	checkVar = false;

	for (var t = 0; t < removeList.length; t++){
		spliceStr = inString.splice(0, removeList[t].length);
		if (removeList[t] === inString.splice(0, removeList[t].length)){
			checkVar = true;
			newStr = inString.splice(0, removeList[t].length);
		}
	};

	if (checkVar == false){
		spliceStr = inString.splice(0, 4);
		if (spliceStr === "www."){
			return inString;
		} else {
			return ("www." + inString);
		}
	}

	return newStr;
};

// addBlacklist takes a string and adds the url to the list of banned
// urls, in addition to the url with a different protocol.
// addBlacklist: Str -> None
// Effects: blacklist is mutated to add a string to the list
function addBlacklist(inString){
	blacklist.push(addBeginning(removeBeginning(inString)));
};

// remBlacklist takes a string and removes the url, and the url with
// other domains, from the blacklist.
// remBlacklist: Str -> None
// Effects: blacklist is mutated to remove a string from the list
function remBlacklist(inString){
	var indexOfItem = blacklist.indexOf(inString);
	blacklist.splice(indexOfItem, 1);
};

// addWhitelist takes a string and adds the url to the list of allowed
// urls, in addition to the url with a different protocol.
// addWhitelist: Str -> None
// Effects: whitelist is mutated to add a string to the list
function addWhitelist(inString){
	whitelist.push(addBeginning(removeBeginning(inString)));
};

// remWhitelist takes a string and removes the url, and the url with
// other domains, from the whitelist.
// remWhitelist: Str -> None
// Effects: whitelist is mutated to remove a string from the list
function remWhitelist(inString){
	var indexOfItem = whitelist.indexOf(inString);
	whitelist.splice(indexOfItem, 1);
};

// checkList takes a string representing a url to be checked, and a
// string representing a list to check (should be either whitelist
// or blacklist, but this opens the possibilities of having multiple
// organized lists). It will return true if the url is part of the list
// and false if it is not.
// checkList: Str Str -> Bool
// Improvement note: If the list provided is known to be sorted, and 
// youtube urls have a set way of organizing urls, then binary search
// can be implemented.
function checkList(inUrl, inList){
	for (var i = 0; i < inList.length; i++){
		if (inUrl === inList[i]){
			return true;
		}
	}

	return false;
};