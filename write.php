<?php

    $input = $_POST['ID'];
    $filename = "result/".$input.'.txt';


    if(file_exists($filename)){
        echo $filename."はすでに存在します。\n";
    }else{
        echo $filename."が存在しないので作成します。\n";
        touch($filename);
        chmod($filename, 0766);
    }


    // ファイルをオープンして既存のコンテンツを取得します 
    $current = file_get_contents($filename);
    // 新しい人物をファイルに追加します
    $current = ($_POST['chosenNode'].' // '.$_POST['time']);
    // 結果をファイルに書き出します
    file_put_contents($filename, $current, FILE_APPEND);

    file_put_contents($filename, "\n", FILE_APPEND);

?>