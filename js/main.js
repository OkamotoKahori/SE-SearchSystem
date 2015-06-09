$(function() {
    var query;

    $('#search').on('click', function() {
        $('#result').empty();
        query = $('#query').val();

        var csvData = [];
        $.get('csvData/SE_onomatopoeia.csv')
            .done(function(data) {
                $.parse(data, {
                    delimiter: "\n",
                    header: false,
                    dynamicTyping: true,
                    preview: 100,
                    step: function(data, file, inputElem) {
                        csvData.push(data.results[0]);
                    }
                });
 
                // [縦][横]、[0][0]:タイトル、[0][1]:グループ、[0][2]:オノマトペ、[99]まで
                // 検索部分
                for (var i = 1; i < csvData.length - 1; i++) {
                    console.log(csvData[i][0]);
                    if (csvData[i][2] === query) {
                        $('#result').append('<p><a href="./sound/' + csvData[i][0] + '.wav" target="_blank">' + csvData[i][0] + '</a></p>');

                    }
                }

            })
            .fail(function(data) {
                console.log('error');
            });
    });
});
