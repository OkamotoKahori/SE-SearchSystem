var soundData = [];

// 音響特徴が類似した効果音を探す
function similar_sound(centerNode) {
    var similarSounds = [];
    for (var a = 0; a < soundData.length; a++) {
        if (centerNode.group_number === soundData[a].group_number) {
            // 中心のノードと同じ効果音以外を配列に格納
            if (centerNode.name !== soundData[a].name) {
                soundData[a].type = "sound";
                similarSounds.push(soundData[a]);
            }
        }
    }
    return similarSounds;
}

// 文脈が類似した効果音を探す
function similar_context(centerNode) {
    var similarContext = [];
    for (var b = 0; b < soundData.length; b++) {
        if (centerNode.category === soundData[b].category) {
            // 中心のノードと同じ効果音以外を配列に格納
            if (centerNode.name !== soundData[b].name) {
                soundData[b].type = "context";
                similarContext.push(soundData[b]);
            }
        }
    }
    return similarContext;
}

// var context_2 = centerNode.context_2;

// $.ajax({
//     url: 'relatedword.php',
//     type: 'POST',
//     async: true,
//     // dataType: 'json',
//     data: {
//         'context_1': context_1,
//         'context_2': context_2
//     }

// }).success(function(data) {
//     console.log(data);
//     // contexts.data1
// }).error(function() {
//     console.log('error');
// });


// オノマトペが類似した効果音を探す
function similar_onomatopoeia(centerNode) {
    var similarOnomatopoeia = [];

    //  レーベンシュタイン編集距離     
    for (var c = 0; c < soundData.length; c++) {
        var matrix = new Array(centerNode.form.length + 1);

        for (var i = 0; i < centerNode.form.length + 1; i++) {
            matrix[i] = new Array(soundData[c].form.length + 1);
        }

        for (var i = 0; i < centerNode.form.length + 1; i++) {
            matrix[i][0] = i;
        }

        for (var j = 0; j < soundData[c].form.length + 1; j++) {
            matrix[0][j] = j;
        }

        for (var i = 1; i < centerNode.form.length + 1; i++) {

            for (var j = 1; j < soundData[c].form.length + 1; j++) {
                var x = centerNode.form[i - 1] == soundData[c].form[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + x
                );
            }

        }

        if (matrix[centerNode.form.length][soundData[c].form.length] <= 2) {
            if (centerNode.name !== soundData[c].name) {
                soundData[c].type = "onomatopoeia";
                similarOnomatopoeia.push(soundData[c]);
            }
        }
    }
    return similarOnomatopoeia;
}


// 何と何を繋げるのかのリストとノード情報を作成
function create_linkList(centerNode, similarSoundData, similarContextData, similarOnomatopoeiaData) {
    var node = [],
        link = [];

    node.push(centerNode); //中心のノードの情報を追加

    // 音響特徴が類似した効果音のリストを追加
    for (var l = 0; l < similarSoundData.length; l++) {
        node.push(similarSoundData[l]);
        link.push({
            source: centerNode,
            target: similarSoundData[l]
        });
    }

    // 文脈が類似した効果音のリストを追加
    for (var m = 0; m < similarContextData.length; m++) {
        node.push(similarContextData[m]);
        link.push({
            source: centerNode,
            target: similarContextData[m]
        });
    }

    // オノマトペが類似した効果音のリストを追加
    for (var n = 0; n < similarOnomatopoeiaData.length; n++) {
        node.push(similarOnomatopoeiaData[n]);
        link.push({
            source: centerNode,
            target: similarOnomatopoeiaData[n]
        });
    }

    // ノードとリンク情報のデータセットを作る
    var linkList = {
        nodes: node,
        links: link
    };

    return linkList;
}

// 可視化部分
function visualize_output(linkList) {
    // svg領域の準備
    var width = $("#result").innerWidth(),
        height = $("#result").innerHeight(),
        svg = d3.select("#result").append("svg")
        .attr("width", width)
        .attr("height", height);

    // var fav_width = $("#favList").innerWidth(),
    //     fav_height = $("#favList").innerHeight(),
    //     fav_svg = d3.select("#favList").append("svg")
    //     .attr("width", fav_width)
    //     .attr("height", fav_height);

    // forceレイアウトの適用部分
    var force = d3.layout.force()
        .nodes(linkList.nodes)
        .links(linkList.links)
        .charge(-1000)
        .linkDistance(function(d) {
            return Math.floor(Math.random() * 2 + 1) * 150;
        })
        .friction(0.3)
        .gravity(0.05)
        .size([width, height])
        .on("tick", tick)
        .start();

    // リンクの描画
    var link = svg.selectAll(".link")
        .data(force.links())
        .enter()
        .append("line")
        .attr("class", "link")
        .attr("stroke", function(d) {
            return "#FF0077";
        })
        .attr("stroke-width", 1.5 + "px")
        .style("opacity", 0.5);

    // ノードの描画
    var node = svg.selectAll(".node")
        .data(force.nodes())
        .enter().append("g")
        .attr("class", "node")
        .on("mouseover", mouseover)
        .on("mouseout", mouseout)
        .on("click", click)
        // .on("contextmenu", contextmenu)
        .call(force.drag)

    node.append("circle")
        .attr("r", 25)
        .attr("fill", function(d) {
            if (d.type === "center") {
                return "#FF82AB";
            } else if (d.type === "sound") {
                return "#FFA500";
            } else if (d.type === "context") {
                return "#00FA9A";
            } else {
                return "#7B68EE";
            }
        })
        .style("opacity", function(d) {
            if (d.type !== "center") {
                return 0.5
            }
        });

    node.append("text")
        .attr("x", -20)
        .attr("dy", ".35em")
        .text(function(d) {
            var text = (d.onomatopoeia + " " + d.context_1 + " " + d.context_2);
            return text;
        })
        .attr("font-size", 12 + "px")
        .attr("font-family", "sans-serif")
        .attr("pointer-events", "none");

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

    // ノードにマウスを乗せたときの処理：音を再生
    function mouseover(d) {
        $('#sound').append('<audio autoplay><source src="./sound/' + d.name + '.wav" type="audio/wav"></audio>');
    }

    // ノードからマウスをアウトしたときの処理：音を停止
    function mouseout() {
        $('#sound').empty();
    }

    // ノードをクリックしたときの処理
    function click(centerNode) {
        // 可視化部分の初期化
        svg.remove();
        $('#sound').empty();
        delete centerNode.type; // JSONのtypeを削除

        // centerNodeにtype:centerを追加
        centerNode.type = "center";

        // centerNodeに類似した効果音情報の取得
        similarSoundData = similar_sound(centerNode);
        similarContextData = similar_context(centerNode);
        similarOnomatopoeiaData = similar_onomatopoeia(centerNode);

        // リストの更新
        linkList = create_linkList(centerNode, similarSoundData, similarContextData, similarOnomatopoeiaData);

        // 可視化部分の更新
        visualize_output(linkList);
    }

    // function contextmenu(d) {
    //     // favListのサークル描画
    //     var fav_node = fav_svg.selectAll("fav_node")
    //         .data(d)
    //         .enter().append("circle")
    //         .attr("class", "fav_node")
    //         .on("mouseover", mouseover)
    //         .on("mouseout", mouseout)

    //     fav_node.append("circle")
    //         .attr("r", 25)
    //         .attr("fill", function() {
    //             return "#FF82AB";
    //         })
    //         .style("opacity", function() {
    //             return 0.5;
    //         })

    //     fav_node.append("text")
    //         .attr("x", -20)
    //         .attr("dy", ".35em")
    //         .text(function(d) {
    //             var text = (d.onomatopoeia + " " + d.context_1 + " " + d.context_2);
    //             return text;
    //         })
    //         .attr("font-size", 12 + "px")
    //         .attr("font-family", "sans-serif")
    //         .attr("pointer-events", "none");

    // }
};


$(function() {
    var onomatopoeia_suggest = [],
        context_suggest = [];

    var centerNode;

    var similarSoundData = [],
        similarContextData = [],
        similarOnomatopoeiaData = [];

    var linkList = {};

    // JSONデータの格納
    $.getJSON('data_form.json', function(data) {
        // $.getJSON('data.json', function(data) {
        for (var i = 0; i < data.length; i++) {
            soundData.push(data[i]);
            // サジェスト用配列の作成
            onomatopoeia_suggest.push(data[i].onomatopoeia);
            context_suggest.push(data[i].context_1);
            context_suggest.push(data[i].context_2);
        }

        // サジェスト用配列内の重複を削除
        onomatopoeia_suggest = onomatopoeia_suggest.filter(function(x, i, self) {
            return self.indexOf(x) === i;
        });
        context_suggest = context_suggest.filter(function(x, i, self) {
            return self.indexOf(x) === i;
        });

        // クエリサジェスト機能
        $('#query_onomatopoeia').autocomplete({
            source: onomatopoeia_suggest,
            autoFocus: true,
            delay: 20,
            minLength: 1,
            position: {
                my: "left top"
            }
        });
        $('#query_context').autocomplete({
            source: context_suggest,
            autoFocus: true,
            delay: 20,
            minLength: 1,
            position: {
                my: "left top"
            }
        });

        // 検索ボタンがクリックされたときの処理
        $('#search').on('click', function() {
            var query_onomatopoeia = [],
                query_context = [];

            //クエリの取得
            query_onomatopoeia = $('#query_onomatopoeia').val();
            query_context = $('#query_context').val();

            // スペース区切りで配列に格納


            // クエリに一致した効果音を探す：オノマトペ
            // もし、テキストボックスに1文字以上入っていればの処理
            if (query_onomatopoeia.length >= 1) {
                for (var i = 0; i < soundData.length - 1; i++) {
                    // オノマトペの一致
                    if (query_onomatopoeia === soundData[i].onomatopoeia) {
                        centerNode = soundData[i];
                        centerNode.type = "center";
                        break; //ひとつ設定されたら処理を抜ける
                    }
                    // else if (centerNode === undefined) {
                    //     $('#result').text('一致する効果音がありませんでした');
                    //     return;
                    // }
                }
            }

            // クエリに一致した効果音を探す：文脈
            // もし、テキストボックスに1文字以上入っていればの処理
            else if (query_context.length >= 1) {
                for (var j = 0; j < soundData.length - 1; j++) {
                    if (query_context === soundData[j].context_1 || query_context === soundData[j].context_2) {
                        centerNode = soundData[j];
                        centerNode.type = "center";
                        break;
                    }
                }
            }
            // else if (query_onomatopoeia.length == 0 & query_context.length == 0) {
            //     console.log('入力なし');
            //     return;
            // }

            // else if (query_onomatopoeia.length >= 1 & query_context.length >=1){
            //  for (var k = 0; k < soundData.length - 1; k++){
            //      if (query_onomatopoeia === soundData[k].context_1)
            //  }
            // }

            similarSoundData = similar_sound(centerNode);
            similarContextData = similar_context(centerNode);
            similarOnomatopoeiaData = similar_onomatopoeia(centerNode);

            // 文脈の類似を作ったらここにsimilarContextData追加する
            linkList = create_linkList(centerNode, similarSoundData, similarContextData, similarOnomatopoeiaData);

            visualize_output(linkList);


        });

    });

});
