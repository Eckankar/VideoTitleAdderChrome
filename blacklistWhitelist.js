// blacklist and whitelist should contain strings corresponding to 
// specific urls that are on the whitelist (allowed for preview)
// or blacklist (prevented from preview).
var blacklist = [];
var whitelist = [];

// beginList contains common url headers, like www., http, and https.
// Intended to add multiple instances of a url, so that the blacklist
// works no matter the used protocol.


// addBeginning takes a url without a http://www. beginning (or equal)
// and returns a list of strings composed of the url with the beginnings
// found in beginList.
// addBeginning: Str -> listof(Str)
function addBeginning(inString){
	var beginList = ["https://", "http://"];
	var returnList = [];
	var tempUrl;
	for (var i = 0; i < beginList.length; i++){
		tempUrl = beginList[i] + inString;
		returnList.push(tempUrl);
	}

	return returnList;
};

// addBlacklist takes a string and adds the url to the list of banned
// urls, in addition to the url with a different protocol.
// addBlacklist: Str -> None
// Effects: blacklist is mutated to add a string to the list
function addBlacklist(inString){

};

// remBlacklist takes a string and removes the url, and the url with
// other domains, from the blacklist.
// remBlacklist: Str -> None
// Effects: blacklist is mutated to remove a string from the list
function remBlacklist(inString){

};

// addWhitelist takes a string and adds the url to the list of allowed
// urls, in addition to the url with a different protocol.
// addWhitelist: Str -> None
// Effects: whitelist is mutated to add a string to the list
function addWhitelist(inString){

};

// remWhitelist takes a string and removes the url, and the url with
// other domains, from the whitelist.
// remWhitelist: Str -> None
// Effects: whitelist is mutated to remove a string from the list
function remWhitelist(inString){

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