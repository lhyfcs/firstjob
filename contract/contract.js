'use strict';


var ContentInfo = function(text) {
    if (text){

    } else {

    }
};

ContentInfo.prototype = {
    toString: function(){
        return JSON.stringify(this);
    }
};

var ContentCollection = function(){
    LocalContractStorage.defineMapProperty(this, 'id', {
        parse: function(text){
            return new ContentInfo(text);
        },
        stringify: function(o){
            return o.toString();
        }
    });
};

ContentCollection.prototype = {
    init: function() {

    }
};

