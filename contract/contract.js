'use strict';


var Auction = function(text) {
    if (text){
        var obj = JSON.parse(text);
        this.joinTime = obj.joinTime;
        this.from = obj.from;
        this.pay = new BigNumber(obj.pay);
        this.id = obj.id;
        this.context = obj.context;
    } else {
        this.joinTime = "";
        this.from = "";
        this.pay = new BigNumber(0);
        this.id = 0;
        this.context = "";
    }
};

Auction.prototype = {
    toString: function(){
        return JSON.stringify(this);
    }
};

var AuctionCollection = function(){
    LocalContractStorage.defineProperty(this, "fundpool");
    LocalContractStorage.defineProperty(this, "start");
    LocalContractStorage.defineProperty(this, "auctiondays");
    LocalContractStorage.defineProperty(this, "highest");
    LocalContractStorage.defineProperty(this, "counter");
    LocalContractStorage.defineMapProperty(this, 'collection', {
        parse: function(text){
            return new Auction(text);
        },
        stringify: function(o){
            return o.toString();
        }
    });
};

AuctionCollection.prototype = {
    init: function() {
        this.fundpool = new BigNumber(0);
        this.highest = new BigNumber(0);
        this.start = this.getDay();
        this.auctiondays = 2; 
        this.counter = 0; 
        this.test = "";

    },

    tender: function(opt){
        var from = Blockchain.transaction.from;
        var value = new BigNumber(Blockchain.transaction.value);
        var standard = new BigNumber(1000000000000000);
        if(value < standard){
            return "投标金额小于0.001 nas,请重新输入.";
        }
        if (value < this.highest){
            return "投标金额小于当前最大金额，无效投标.";
        }
        var today = this.getDay();
        if (this.start + this.auctiondays < today){
            this._startNewAcution(today);
        }
        var acution = new Auction();
        acution.joinTime = this._getTime();
        acution.id = this._nextId();
        acution.from = from;
        acution.pay = value;
        acution.context = opt;
        this.fundpool = value.plus(this.fundpool);
        this.collection.put(acution.id,acution);
        this.highest = value;
        return "success:";
    },

    getHighest: function() {
        return this._convertBigNumber(this.highest);
    },
    refund: function(){
        var standard = new BigNumber(1000000000000000);
        if (this.fundpool < standard) {
            return "没有投标";
        }
        var str ="";
        for(var i = 1; i < this.counter; i++){
            var item = this.collection.get(i);
            var res = Blockchain.transfer(item.from, item.pay);
            if(!res){ 
                throw new Error("转账失败.");
            }
        }
        this._resetData();        
        return "success";
    },
    
    _startNewAcution: function(day){
        this.start = day;
        this._resetData();
    },
    _resetData: function(){
        for(var i = 1; i <= this.counter;i++){
            this.collection.del(i);
        }
        this.fundpool = new BigNumber(0);
        this.highest = new BigNumber(0);
        this.counter = 0;
    },
    _getTime: function(){
        var day = this.getDay();
        var hour = this._getHour();
        var minute = this._getMinute();
        return day + ":" + hour + ":" + minute;
    },
    _getHour:function(){
        var ts = Blockchain.transaction.timestamp;
        var hour = parseInt(((ts/3600)%24+8)%24);
        return hour;
    },
    _getMinute:function(){
        var ts = Blockchain.transaction.timestamp;
        var minute = parseInt(ts%3600/60);
        return minute;
    },
    getDay: function() {
        var ts = Blockchain.transaction.timestamp;
        var day = parseInt(ts/86400);
        return day;
    },
    _nextId: function(){
        return ++this.counter;
    },
    accountList: function(){
        var list = [];
        for(var i = 1; i <= this.counter; i++){
            var item = this.collection.get(i);
            list.push({from: item.from, context: item.context, payNas: this._convertBigNumber(item.pay)});
        }
        return list;
    },
    listCollection: function() {
        var str = "" + this.counter + "---";
        var items = [];
        for(var i = 1; i <= this.counter; i++){
            var item = this.collection.get(i);
            if (item) str += item.toString();
        }
        return str;
    },
    collectInfo: function(){
        return JSON.stringify(this.collection);
    },
    _convertBigNumber:function(_num){
        var num = Number(_num);
        return (num/Number("1000000000000000000")).toFixed(3);
    },
    checkRefund:function(){
        var standard = new BigNumber(1000000000000000);
        if (this.counter<=0 || this.fundpool < standard) return "False";
        var curDay = this.getDay();
        var acution = this.collection.get(1);
        if (curDay - acution.day >= 1) return "True" 
    }
};

module.exports = AuctionCollection;

