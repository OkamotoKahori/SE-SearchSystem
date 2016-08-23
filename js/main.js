// 検索部分関連
var soundData = [];
var centerNode;
var similarSoundData = [],
    similarContextData = [],
    similarOnomatopoeiaData = [];
var linkList;

// お気に入り機能関連
var selected_node_text;
var selected_SE;
var selected_type;
var favList = [];
var selectData = false;
var favID;

// var count = 0;


$(function() {
    // JSONデータの格納
    var onomatopoeia_suggest = [],
        context_suggest = [];

    // JSONデータの格納
    $.getJSON('data_tag.json', function(data) {
        for (var i = 0; i < data.length; i++) {
            soundData.push(data[i]);
            // サジェスト用配列の作成
            onomatopoeia_suggest.push(data[i].onomatopoeia);
            context_suggest.push(data[i].context[0]);
            context_suggest.push(data[i].context[1]);
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

    });


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
            for (var i = 0; i < 2; i++) {
                if (centerNode.context[0] === soundData[b].context[i]) {
                    // 中心のノードと同じ効果音以外を配列に格納
                    if (centerNode.name !== soundData[b].name) {
                        soundData[b].type = "context";
                        similarContext.push(soundData[b]);
                    }
                }
            }
        }

        // 効果音名が２つ付いていた場合、２つ目の名前と同じ名前がついた効果音を探す
        if (centerNode.context[1] !== "") {
            for (var b = 0; b < soundData.length; b++) {
                for (var i = 0; i < 2; i++) {
                    if (centerNode.context[1] === soundData[b].context[i]) {
                        // 中心のノードと同じ効果音以外を配列に格納
                        if (centerNode.name !== soundData[b].name) {
                            soundData[b].type = "context";
                            similarContext.push(soundData[b]);
                        }
                    }
                }
            }
        }

        for (var b = 0; b < soundData.length; b++) {
            for (var i = 0; i < 20; i++) {
                if (centerNode.tag[i] !== "") {
                    if (centerNode.tag[i] === soundData[b].context[0] || centerNode.tag[i] === soundData[b].context[1]) {
                        // 中心のノードと同じ効果音以外を配列に格納
                        if (centerNode.name !== soundData[b].name) {
                            soundData[b].type = "context";
                            similarContext.push(soundData[b]);
                        }
                    }
                }
            }
        }

        // 重複の削除
        similarContext = similarContext.filter(function(x, i, self) {
            return self.indexOf(x) === i;
        });

        return similarContext;
    }

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
        linkList = {
            nodes: node,
            links: link
        };

        // 重複の削除
        // linkList = linkList.filter(function(x, i, self) {
        //     return self.indexOf(x) === i;
        // });
        console.log(linkList);
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

        // forceレイアウトの適用部分
        var force = d3.layout.force()
            .nodes(linkList.nodes)
            .links(linkList.links)
            .charge(-1000)
            .linkDistance(function(d) {
                return Math.floor(Math.random() * 2 + 1) * 150;
            })
            .friction(0.5) //値が大きいほどノード同士が離れる
            .gravity(0.2) //値が大きいほどノードが中心に寄る
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
                    return 0.5;
                }
            });

        node.append("text")
            .attr("x", -20)
            .attr("dy", ".35em")
            .text(function(d) {
                text = (d.onomatopoeia + " " + d.context[0] + " " + d.context[1]);
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

            selectData = d;

            $('#sound').append('<audio autoplay><source src="./sound/' + d.name + '.wav" type="audio/wav"></audio>');
            $('#download_source').append('<a href="./sound/' + d.name + '.wav" download="' + d.name + '.wav"></a>');
        }

        // ノードからマウスをアウトしたときの処理：音を停止
        function mouseout() {

            selectData = false;

            $('#sound').empty();
            $('#download_source').empty();
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
    };


    // キー操作
    $('html').keyup(function(e) {
        switch (e.which) {

            case 70: //f：お気に入り
                if (selectData !== false) {
                    favList_output(selectData);
                }

            case 82: //r：お気に入りの削除
                var pID = '#' + favID;
                $(pID).remove();
        }
    });

    // お気に入り部分
    function favList_output(selectData) {

        var text_color;

        if (selectData.type === "center") {
            text_color = "#FF82AB";
        } else if (selectData.type === "sound") {
            text_color = "#FFA500";
        } else if (selectData.type === "context") {
            text_color = "#00FA9A";
        } else {
            text_color = "#7B68EE";
        }

        $('#favList').append('<p class="favorite" id ="' + selectData.name + '"><font color="' + text_color + '">' + selectData.onomatopoeia + " " + selectData.context[0] + " " + selectData.context[1] + '</font></p>');

        // お気に入りへの重複追加をしない
        var ID_check = [],
            duplicateID = [];

        [].forEach.call(document.querySelectorAll('[id]'), function(elm) {
            var id = elm.getAttribute('id');
            if (ID_check.indexOf(id) !== -1) {
                duplicateID.push(id);
            } else {
                ID_check.push(id);
            }
        });

        // 既に追加したいIDが存在していたら削除
        if (duplicateID.length > 0) {
            var remove_duplicateID = '#' + duplicateID;
            $(remove_duplicateID).remove();
        }

        // お気に入りに追加された要素をドラッグ移動可能にする
        $('.favorite').draggable();

        // マウスオーバー時に再生
        $('.favorite').filter(":last").hover(function() {

                favID = (this.id);
                $('#sound').append('<audio autoplay><source src="./sound/' + selectData.name + '.wav" type="audio/wav"></audio>');

            },
            // マウスアウト時に停止
            function() {

                $('#sound').empty();

            });
    }


    // 検索ボタンがクリックされたときの処理
    $('#search').on('click', function() {

        var query_onomatopoeia = [],
            query_context = [];

        var message_num = 0;

        // count += 1;
        // console.log(count);

        //クエリの取得
        query_onomatopoeia = $('#query_onomatopoeia').val();
        query_context = $('#query_context').val();

        // クエリに一致した効果音を探す：オノマトペ
        // もし、テキストボックスに1文字以上入っていればの処理
        if (query_onomatopoeia.length >= 1 && query_context.length === 0) {
            for (var i = 0; i < soundData.length - 1; i++) {
                // オノマトペの一致
                if (query_onomatopoeia === soundData[i].onomatopoeia) {
                    centerNode = soundData[i];
                    centerNode.type = "center";
                    break; //ひとつ設定されたら処理を抜ける
                }
            }
        }

        // クエリに一致した効果音を探す：文脈
        // もし、テキストボックスに1文字以上入っていればの処理
        else if (query_context.length >= 1 && query_onomatopoeia.length === 0) {
            for (var i = 0; i < soundData.length - 1; i++) {
                if (query_context === soundData[i].context[0] || query_context === soundData[i].context[1]) {
                    centerNode = soundData[i];
                    centerNode.type = "center";
                    break;
                }
            }
        }
        // 両方のボックスに入力があった場合
        else if (query_onomatopoeia.length >= 1 && query_context.length >= 1) {
            for (var i = 0; i < soundData.length - 1; i++) {
                // 両方のクエリが一致した場合
                if (query_onomatopoeia === soundData[i].onomatopoeia && query_context === soundData[i].context[0] || query_onomatopoeia === soundData[i].onomatopoeia && query_context === soundData[i].context[1]) {
                    centerNode = soundData[i];
                    centerNode.type = "center";
                    break;
                    // それ以外の場合
                } else {
                    for (var j = 0; j < soundData.length - 1; j++) {
                        // オノマトペが一致した効果音を提示する
                        if (query_onomatopoeia === soundData[j].onomatopoeia) {
                            centerNode = soundData[j];
                            centerNode.type = "center";
                            message_num = 3;
                            // 文脈が一致した効果音を提示する
                        } else if (query_context === soundData[j].context[0] || query_context === soundData[j].context[1]) {
                            centerNode = soundData[j];
                            centerNode.type = "center";
                            message_num = 4;
                        }
                    }
                }
            }
        }
        // ボックスに入力がない場合
        else if (query_onomatopoeia.length == 0 && query_context.length == 0) {
            message_num = 2;
        }
        // 何も一致しなかった場合
        if (centerNode == undefined) {
            message_num = 1;
        }

        // アラートの表示部
        switch (message_num) {
            case 1:
                alert('一致する効果音がありませんでした。');
                message_num = 0;
                break;
            case 2:
                alert('クエリを入力してください。');
                message_num = 0;
                break;
            case 3:
                alert('条件に完全一致する効果音がなかったため、オノマトペが一致する効果音を提示します。');
                message_num = 0;
                break;
            case 4:
                alert('条件に完全一致する効果音がなかったため、音の発生源が一致する効果音を提示します。');
                message_num = 0;
                break;
        }

        //音響特徴が類似した効果音集合をつくる 
        similarSoundData = similar_sound(centerNode);
        //文脈が類似した効果音集合をつくる
        similarContextData = similar_context(centerNode);
        //オノマトペが類似した効果音集合をつくる
        similarOnomatopoeiaData = similar_onomatopoeia(centerNode);

        // 中心の効果音，音響特徴が類似した効果音，文脈が類似した効果音，オノマトペが類似した効果音の集合をつくる
        linkList = create_linkList(centerNode, similarSoundData, similarContextData, similarOnomatopoeiaData);

        // 可視化する
        visualize_output(linkList);

    });

    //突貫工事
    // $('#query_onomatopoeia').on('click', function() {
    //     if (count >= 1) {
    //         window.location.reload();
    //     }
    // })

    // $('#query_context').on('click', function() {
    //     if (count >= 1) {
    //         window.location.reload();
    //     }
    // })

});
