var d = document,
    similarCount = 0,
    finalData = [],
    similarMap = {},
    countingSimilarWords = {};

// get data from similar.json and create map of it
$.getJSON( "/js/similar.json", function( data ) {
    var items = [];
    $.each( data, function( key, val ) {
        items.push(val);
        for (var i=0; i< val.length; i++) {
            similarMap[val[i]] = val[0];
        }
    });
    console.log("Map: ",similarMap);
});

// take details from file when it is uploaded
d.getElementById("uploadBtn").onchange = function () {
    d.getElementById("uploadFile").value = this.value;
    var fr = new FileReader();
    console.log("file Obj: ", fr);
    fr.onload = function() {
        countingSimilarWords = {};
        var ifEmpty = $("input[type='file']").filter(function (){
            return !this.value
        }).length;
        if (!ifEmpty && !this.result.trim().length) {   //to check if file is empty or have only spaces
            alert("File is empty");
        } else {
            var arr = [];
            arr = this.result.replace( /\n/g, " " );
            arr = arr.replace(/[^a-zA-Z ]/g, "").split(" "); //to ignore special characters in file
            console.log("array: ", arr);
            console.log("this.result: ", this.result);
            var ignoreWords = wordsToIgnore();
            finalData = checkCount(arr,ignoreWords);
        }
    }
    fr.readAsText(this.files[0]);
    if (this.value) {
        $('.report-option').prop("disabled", false);
        $('#gen_report_btn-id').prop("disabled", false);
    }
};

function clearUpload () {
    d.getElementById("uploadFile").value = "";
    finalData = [];
    $('.report-option').prop("disabled", true);
    $('#gen_report_btn-id').prop("disabled", true);
};

// for generating reports of pie, bar and visual
function generateReport() {
    var chartType = $('.report-option')[0].innerText,
        data;
    chartType = chartType.trim();
    if (chartType === "Pie Chart") {
        $('#pie_chart').css("display", "block");
        $('#bar_chart').css("display", "none");
        $('#visual_report').css("display", "none");
        data = createDataForCharts(finalData, "pie");
        drawPieChart(data);
    } else if (chartType === "Bar Chart") {
        $('#bar_chart').css("display", "block");
        $('#pie_chart').css("display", "none");
        $('#visual_report').css("display", "none");
        data = createDataForCharts(finalData, "bar");
        drawBarChart(data);
    } else if (chartType === "Visual Report") {
        $('#visual_report').css("display", "block");
        $('#pie_chart').css("display", "none");
        $('#bar_chart').css("display", "none");
        drawVisualReport(countingSimilarWords);
    } else {
        alert("Select valid report type");
    }
};

//parse data according to charts necessity
function createDataForCharts(data, type) {
    var i, chartData = {xData: [], yData: []}, pieChartData = [];
    if (type === "pie") {
        for (i = 0; i < data.length; i++) {
            if (data[i][1] > 2) {
                pieChartData.push(data[i]);
            }
        }
        return pieChartData;
    } else {
        for (i = 0; i < data.length; i++) {
            if (data[i][0]) {
                chartData.xData.push(data[i][0]);
                chartData.yData.push(data[i][1]);    
            }
        }
        return chartData;
    }
};

// update the selected field in dropdown
$(".dropdown-menu li a").click(function(){
    var target = $(this).html();
    $(this).parents('.dropdown-menu').find('li').removeClass('active');
    $(this).parent('li').addClass('active');
    $(this).parents('#generate_report_id').find('.dropdown-toggle')
        .html(target + ' <span class="caret"></span>');
});

// for drawing BAR chart
function drawBarChart(data) {
    var containerHeight = (data.xData.length * 30)+150;
    $('#bar_chart').height(containerHeight);
    $('#bar_chart').highcharts({
        chart: {
            type: 'bar',
            inverted: true
        },
        colors: ["#26b45d"],
        title: {
            text: ''
        },
        xAxis: {
            categories: data.xData,
            labels: {
                formatter: function() {
                    var custLabel = this.value;
                    if (this.value.length > 10) {
                        custLabel = this.value.toString().substring(0, 10)+"..."
                    }
                    return custLabel;
                }
            }
        },
        yAxis: {
            title: {
                text: 'Word Count'
            }
        },
        series: [{
            name: "count",
            data: data.yData,
            dataLabels: {
                enabled: true
            }
        }]
    });
};

// for drawing PIE chart
function drawPieChart(data) {
    if (!data.length) {
        $('#pie_chart').html('<h3>Your data does not have any word with frequency more than 2</h3>')
        return;
    }
    console.log("pie chart", data);
    $('#pie_chart').highcharts({
        chart: {
            type: 'pie',
            options3d: {
                enabled: true,
                alpha: 45,
                beta: 0
            }
        },
        title: {
            text: 'Distribution of keywords'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                depth: 35,
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                }
            }
        },
        series: [{
            type: 'pie',
            name: 'Distribution of keywords',
            data: data
        }]
    });
};

function sortVisualData(data) {
    var arr = [];
    for (var word in data) {
        arr.push(data[word]);
    }
    var sorted = arr.sort(function(a, b) {
        return b.count - a.count;
    });
    return sorted;
}

// for drawing Visual Report
function drawVisualReport(data) {
    if (Object.keys(data).length === 0) {
        $('#visual_report').html('<h3>Your data does not have similar words</h3>')
        return;
    }
    var classname,
        liTemplate = "",
        template,
        tempData;
    
    tempData = sortVisualData(data);
    for (var word in tempData) {
        console.log(word);
        classname = getIcon();
        liTemplate = liTemplate + "<li><i class='" + classname + "'></i>" +
            "<p>" + tempData[word].count + "</p>" + 
            "<span>" + Object.keys(tempData[word].words).join('/') + "</span>";
    }
    template = "<ul class='v-report'>" + liTemplate + "</ul>";
    $("#visual_report").html(template);
};

function Trie() {
    this.words = 0;
    this.prefixes = 0;
    this.children = [];
};

//function for inserting and counting words in trie tree
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
};

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
};
//Words That should be ignore
function wordsToIgnore() {
    var arr = ["a", "an", "and", "as", "be", "can", "for", "has", "he", "him", "his", "i", "if", "in", "is", "it", "me", "mine", "of", "on", "that", "the", "this", "to", "with", "you", "your", "yours", "was", "been"];
    return arr;
};

function checkSimilarWords(str,word) {
    var count = 0;
    if (countingSimilarWords[str]) {
        count = countingSimilarWords[str].count;
        count = count + 1;
        countingSimilarWords[str].count = count;
        countingSimilarWords[str].words[word] = 0;
    } else {
        countingSimilarWords[str] = {
            count : 1,
            words:{}
        }
        countingSimilarWords[str].words[word] = 0; 
    }
};

//Count frequency of words in file 
function checkCount(arr,ignoreWords) {
    var count = 0,
        word,
        sortedWords,
        similarWord,
        maxFrequencyMap = {};
    var obj = new Trie();
    for (var i=0; i<arr.length; i++) {
        word = arr[i].toLowerCase();
        if (ignoreWords.indexOf(word) === -1) {
            if (similarMap[word]) {
                similarWord = similarMap[word];
                checkSimilarWords(similarWord,word);
                console.log("aaaaaaa: ",similarWord);
            }
            obj.insert(word);
            count = obj.countWord(word);
            maxFrequencyMap[word] = count;
        }
    }
    console.log("Similar words: ",countingSimilarWords);
    sortedWords = sortFrequencyMap(maxFrequencyMap);
    return sortedWords;
};

function getIcon() {
    var iconArray = icons;
    var randIcon = Math.floor(Math.random()*(iconArray.length));
    var classname = "fa fa-" + iconArray[randIcon];
    return classname;
};