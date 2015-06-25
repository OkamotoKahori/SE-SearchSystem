$(function() {
    var query;
    var csvData = [];
    var query_suggest = [];

    // csvデータの読み込み (サジェストのための読み込み)
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
            // 変数にデータベース内のオノマトペを格納：サジェスト用
            for (var i = 1; i < csvData.length; i++) {

                query_suggest.push(csvData[i][2]);
            }

        })
        .fail(function(data) {
            console.log('error');
        });



    // クエリサジェスト機能
    $('#query').autocomplete({
        source: query_suggest,
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

        // [縦][横]、[0][0]:タイトル、[0][1]:グループ、[0][2]:オノマトペ、[100]まで
        // 検索部分
        var onomatopoeia_match;
        var group_match;
        var sound_match;
        var sound_similar = [];
        var group_similar = [];
        var onomatopoeia_similar = [];
        var links = [];
        var nodes = {};

        // クエリに一致した効果音を探す
        for (var i = 1; i < csvData.length; i++) {
            console.log(csvData[i][0]);
            if (csvData[i][2] === query) {
                // $('#result').append('<p><a href="./sound/' + csvData[i][0] + '.wav" target="_blank">' + csvData[i][0] + '</a></p>');
                sound_match = csvData[i][0];
                group_match = csvData[i][1];
                onomatopoeia_match = csvData[i][2];
                links.push({
                    source: onomatopoeia_match,
                    target: onomatopoeia_similar,
                    type: '<audio src="./sound/' + sound_match + '.wav" autoplay></audio>'
                });
            }
        }
        // クエリに一致した効果音と同じグループに属する効果音を探す
        for (var j = 1; j < csvData.length; j++) {
            if (group_match === csvData[j][1]) {
                sound_similar = csvData[j][0];
                group_similar = csvData[j][1];
                onomatopoeia_similar = csvData[j][2];
                // デバッグ用コンソール
                console.log(onomatopoeia_similar, group_similar);
                // ノード表示用
                links.push({
                    source: onomatopoeia_match,
                    target: onomatopoeia_similar,
                    type: '<audio src="./sound/' + sound_match + '.wav" autoplay></audio>'

                });


            }
        }


        // D3での可視化部分
        // Compute the distinct nodes from the links.
        links.forEach(function(link) {
            link.source = nodes[link.source] || (nodes[link.source] = {
                name: link.source
            });
            link.target = nodes[link.target] || (nodes[link.target] = {
                name: link.target
            });
        });

        var width = window.innerWidth,
            height = window.innerHeight;

        var force = d3.layout.force()
            .nodes(d3.values(nodes))
            .links(links)
            .size([width, height])
            .linkDistance(60)
            .charge(-300)
            .on("tick", tick)
            .start();

        var svg = d3.select("body").append("svg")
            .attr("width", width)
            .attr("height", height);

        var link = svg.selectAll(".link")
            .data(force.links())
            .enter().append("line")
            .attr("class", "link");

        var node = svg.selectAll(".node")
            .data(force.nodes())
            .enter().append("g")
            .attr("class", "node")
            .on("mouseover", mouseover)
            .on("mouseout", mouseout)
            .call(force.drag);

        node.append("circle")
            .attr("r", 8);

        node.append("text")
            .attr("x", 12)
            .attr("dy", ".35em")
            .text(function(d) {
                return d.name;
            });

        function tick() {
            link
                .attr("x1", function(d) {
                    return d.source.x;
                })
                .attr("y1", function(d) {
                    return d.source.y;
                })
                .attr("x2", function(d) {
                    return d.target.x;
                })
                .attr("y2", function(d) {
                    return d.target.y;
                });

            node
                .attr("transform", function(d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });
        }

        // ノードからマウスを乗せたときの処理
        function mouseover() {
            d3.select(this).select("circle").transition()
                .duration(750)
                .attr("r", 16);
            // 音再生したい
        }

        // ノードからマウスをアウトしたときの処理
        function mouseout() {
            d3.select(this).select("circle").transition()
                .duration(750)
                .attr("r", 8);
        }
    });
});
