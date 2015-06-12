$(function() {
    var query;
    var query_match = [];
    var query_match_data = [];

    $.get('csvData/SE_onomatopoeia.csv')
        .done(function(data) {
            $.parse(data, {
                delimiter: "\n",
                header: false,
                dynamicTyping: true,
                preview: 101,
                step: function(data, file, inputElem) {
                    query_match.push(data.results[0]);
                }
            });

            // 変数にデータベース内のオノマトペを格納
            for (var i = 1; i < query_match.length - 1; i++) {
                query_match_data.push(query_match[i][2]);
            }
        })
        .fail(function(data) {
            console.log('error');
        });

    // クエリサジェスト機能
    $('#query').autocomplete({
        source: query_match_data,
        autoFocus: true,
        delay: 20,
        minLength: 1,
        position: {
            my: "left top"
        }
    });

    // 検索ボタンを押した時の処理
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
                    preview: 101,
                    step: function(data, file, inputElem) {
                        csvData.push(data.results[0]);
                    }
                });

                // [縦][横]、[0][0]:タイトル、[0][1]:グループ、[0][2]:オノマトペ、[100]まで
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
