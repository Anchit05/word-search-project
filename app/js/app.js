function Trie() {
    this.words = 0;
    this.prefixes = 0;
    this.children = [];
};

Trie.prototype = {
    insert: function(str, pos) {
        if(str.length == 0) { //blank string cannot be inserted
            return;
        }

        var T = this,
            k,
            child;

        if(pos === undefined) {
            pos = 0;
        }
        if(pos === str.length) {
            T.words ++;
            return;
        }
        T.prefixes ++;
        k = str[pos];
        if(T.children[k] === undefined) { //if node for this char doesn't exist, create one
            T.children[k] = new Trie();
        }
        child = T.children[k];
        child.insert(str, pos + 1);
    },
    countWord: function(str, pos) {
        if(str.length == 0) {
            return 0;
        }

        var T = this,
            k,
            child,
            ret = 0;

        if(pos === undefined) {
            pos = 0;
        }   
        if(pos === str.length) {
            return T.words;
        }
        k = str[pos];
        child = T.children[k];
        if(child !== undefined) { //node exists
            ret = child.countWord(str, pos + 1);
        }
        return ret;
    }
}
// To sort the map in descending order
function sortFrequencyMap(wordsFrequency) {
    var sortable = [];
    for (var words in wordsFrequency) {
        sortable.push([words, wordsFrequency[words]])
    }
    sortable.sort(
        function(a, b) {
            return b[1] - a[1]
        }
    )
    return sortable;
}
//Words That should be ignore
function wordsToIgnore() {
    var arr = ["a", "an", "and", "as", "be", "can", "for", "has", "he", "him", "his", "i", "if", "in", "is", "it", "me", "mine", "of", "on", "that", "the", "this", "to", "with", "you", "your", "yours", "was", "been"];
    return arr;
};
//Count frequency of words in file 
function checkCount(arr,ignoreWords) {
    var count = 0,
        word,
        sortedWords,
        maxFrequencyMap = {};
    var obj = new Trie();
    for (var i=0; i<arr.length; i++) {
        word = arr[i].toLowerCase();
        if (ignoreWords.indexOf(word) === -1) {
            obj.insert(word);
            count = obj.countWord(word);
            maxFrequencyMap[word] = count;
            //            console.log("Count of " + word + " : " + count);
        }
    }
//    console.log("Map of words: ",maxFrequencyMap);
    sortedWords = sortFrequencyMap(maxFrequencyMap);
//    console.log("sorted of words: ",sortedWords);
};
document.getElementById("openfile").addEventListener('change',function(){
    var fr = new FileReader();
    console.log("file Obj: ", fr);
    fr.onload = function() {
        var ifEmpty = $("input[type='file']").filter(function (){
            return !this.value
        }).length;
        if (!ifEmpty && !this.result.trim().length) {   //to check if file is empty or have only spaces
            alert("File is empty");
        } else {
            var arr = [];
            arr = this.result.replace( /\n/g, " " );
            arr = arr.replace(/[!@#$%^&*,.:]/g, "" ).split( " " ); //to ignore special characters in file
            console.log("array: ", arr);
            document.getElementById("fileContent").textContent = this.result;
            var ignoreWords = wordsToIgnore();
            checkCount(arr,ignoreWords);
        }
    }
    fr.readAsText(this.files[0]);
});