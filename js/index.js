$(function() {
    //判断有没有安装钱包插件
    if (typeof(webExtensionWallet) === "undefined") {
        var view = "<div style='padding: 15px;'>" +
            "<div><b>未检测到您安装了钱包插件，请先安装钱包插件！</b><a href='https://github.com/ChengOrangeJu/WebExtensionWallet' target='_blank'>钱包插件安装地址</a></div></div>"
        layer.alert(view);
        getItemsList();
        $(".wallet_message").hide();
    } else {
        window.postMessage({
            "target": "contentscript",
            "data": {},
            "method": "getAccount",
        }, "*");
        window.addEventListener('message', function(e) {
            if (e.data && e.data.data && e.data.data.account) {
                if (e.data.data.account != from) {
                    from = e.data.data.account;
                    wallet.getAccountState(from);
                }
            }
        })
        getItemsList();
    }

})

//房间人数
$("#number").on('keyup', function(e) {
    var num = e.target.value;
    var new_num = new BigNumber(num).toFixed(0).toString();
    $(this).val(new_num)
});
//创建房间
function create() {
    if (typeof(webExtensionWallet) === "undefined") {
        var view = "<div style='padding: 15px;'>" +
            "<div><b>未检测到您安装了钱包插件，请先安装钱包插件！</b><a href='https://github.com/ChengOrangeJu/WebExtensionWallet' target='_blank'>钱包插件安装地址</a></div></div>"
        layer.alert(view);
        return;
    }
    var layer_create_home = layer.open({
        type: 1,
        title: "请填写夺宝项目信息",
        content: $("#create_room"),
        btn: ["确定", "取消"],
        yes: function() {
            if ($("#house_name").val() == "") {
                layer.alert("房间名称不能为空！");
                return;
            } else if (!/^([2-9]|[1-9][0-9]{1}|100)$/.test($("#number").val())) {
                layer.alert("人数必须在2-100之间");
                return;
            } else if (!/(^[1-9]\d*(\.\d{1,2})?$)|(^0(\.\d{1,2})?$)/.test($("#price").val())) {
                layer.alert("请输入合适的投注价格");
                return;
            }

            var args = [$("#house_name").val(), $("#number").val(), $("#price").val()]
            layer.close(layer_create_home);
            wallet.sendRowTracition({
                callFunction: "createItem",
                callArgs: JSON.stringify(args),
                options: {
                    listener: function(res) {
                        var txhash = res.txhash;
                        var layer_create = layer.load(1, { shade: 0.5 });
                        wallet.getTransactionReceipt(txhash, function(receipt) {
                            layer.close(layer_create);
                            layer.msg("创建成功！");
                            from = receipt.from;
                            getItemsList();
                        });
                    }
                }

            })
        },
        btn2: function() {
            layer.close(layer_create_home);
        }
    })

}


//参与
function goIn(itemId, price) {
    wallet.sendRowTracition({
        value: price,
        callFunction: "join",
        callArgs: "[\"" + itemId + "\"]",
        options: {
            listener: function(res) {
                var txhash = res.txhash;
                var layer_goin = layer.load(1, { shade: 0.5 });
                wallet.getTransactionReceipt(txhash, function(receipt) {
                    console.log(receipt);
                    layer.close(layer_goin);
                    layer.msg("参与成功！");
                    from = receipt.from;
                    getItemsList();
                });
            }
        }
    })
}

//获取比赛列表
function getItemsList() {
    wallet.getresources({
        contract: {
            function: "listItems",
            args: "[]"
        }
    }, function(res) {
        console.log(res)
        var result = res.result;
        if (result != "" && result != "{}") {
            result = JSON.parse(result);
            $("#houselist").html("");
            for (const key in result) {
                var item = result[key];
                houseView(item);
            }
        } else if (result == "{}" || result == "") {
            $("#houselist").append("<div class='s12'>暂无夺宝，<a href='javascript:create()'>快来参加夺宝游戏吧</a></div>");
        } else if (res.execute_err != "") {
            var message = res.execute_err || "获取房间列表失败";
            layer.alert(message);
        }
    })
}

//房间显示
function houseView(item) {
    var state_view = ""; //比赛是否开奖显示的内容
    var houseStateImg = ""; //房间状态
    var progress = 0;
    if (item.takepart == item.member) { //参加人数==约定人数，即开奖
        progress = 1;
        var win_result = item.result;
        if (win_result == from) { //中奖者是否是本人
            houseState = "恭喜你赢得大奖！"; //本人中奖
        } else { //中奖者非本人
            item.isin == 1 ? houseState = "很遗憾，你没有中奖" : houseState = "该项目已经结束了";;
        }
        state_view = "<span>中奖者：</span><span class='text-red' title=" + win_result + ">" + win_result + "</span>"
    } else {
        houseState = "该项目正在火热进行中，赶快来参与夺宝吧"; //未开奖，正在进行
        progress = new BigNumber(item.takepart).dividedBy(item.member).toString();
        if (item.isin == 1) {
            state_view = "<span>已参与：</span><span title=" + item.takepart + ">" + item.takepart + "（人）</span>";
        } else {
            state_view = "<button class='goInBtn btn waves-effect waves-light' onclick='goIn(" + item.itemId + "," + item.price + ")'>去参与</button>";
        }
    }
    var join_state = ""; //参加状态
    item.isin == 1 ? join_state = "是" : join_state = "否";

    var win_money = new BigNumber(item.price).times(item.member).toString(); //奖金池
    var view = "<div class='col s12 house " + houseState + "'>" +
        "<div class='card horizontal'>" +
        "<div class='card-image'>" +
        // "<div class='item_state_icon_wrap'>" +
        // "<img class='item_state_icon' src='images/" + houseState + ".png' alt=''>" +
        // "</div>" +
        "<img class='item_state_image' src='images/home.png'>" +
        "</div>" +
        "<div class='card-stacked'><div class='card-content'>" +
        "<ul class='item_detail'>" +
        "<li style='position: relative'><i class='progress_value'>" + new BigNumber(progress).times(100).decimalPlaces(2).toString() + "%</i><progress value='" + progress + "'>25%</progress></li>" +
        "<li><span title=" + item.itemId + ">项目ID：</span><span>" + item.itemId + "</span></li>" +
        "<li><span title=" + item.name + ">项目名称：</span><span>" + item.name + "</span></li>" +
        "<li><span>项目状态：</span><span class='text-red'>" + houseState + "</span></li>" +
        "<li><span>价格：</span><span title=" + item.price + ">" + item.price + "（NAS）</span></li>" +
        "<li><span>人数：</span><span title=" + item.member + ">" + item.member + "（人）</span></li>" +
        "<li><span>奖金池：</span><span title=" + win_money + ">" + win_money + "（NAS）</span></li>" +
        "<li><span>是否参与：</span><span title=" + join_state + ">" + join_state + "</span></li>" +
        "<li>" + state_view + "</li>" +
        "</ul></div></div></div></div>";
    $("#houselist").append(view);
}

//going,win,no_win,over
$(document).on("mouseover", ".house.win", function() {})