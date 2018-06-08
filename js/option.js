let NebPay = require("nebpay");
let nebPay = new NebPay(); //支付需求

let nebulas = require("nebulas");
let Neb = nebulas.Neb;
let neb = new Neb();
let api = neb.api;
let HttpRequest = nebulas.HttpRequest;
neb.setRequest(new HttpRequest("https://mainnet.nebulas.io"));

var from = null, //用户地址
    to = "n1jzSAVh4izsQ3CZWxNSndTS94oEbedK8Xr"; //合约地址 
let from_request = "n1d4vqywuD6R8pT8BFVpvTKrwomZaHJqARF"; //一个地址，仅用来初始化时还没有用户信息的地址
let nonce, //交易次数
    gasPrice = 1000000, //默认配置
    gasLimit = 2000000;