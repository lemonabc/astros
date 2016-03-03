'use strict';

class Middleware {
    /**
     * 
     * @param  {[type]}   filter [description]
     * {
     *   modType:['page', 'static'],
     *   fileType:['js','img', 'css'],
     *   name:['valiable']
     * }
     * @param  {Function} fn     [description]
     * @return {[type]}          [description]
     */
    constructor(filter, fn) {

        if (typeof filter === 'function') {
            fn = filter;
            filter = '*';
        }
        this.config = {};
        this.filter = filter;
        this.fn = fn;
        
        if(filter === '*'){return}
        
        for(let p in this.filter){

            if(typeof this.filter[p] == 'string'){
                this.filter[p] = [this.filter[p]];
            }
            
        }

    }
    test(asset) {
        if(!(asset instanceof astro.Asset)){
            console.error('astro.middle.test', 
                'asset is not instanceof astro.Asset');
            return {val:false};
        }
        if(this.filter === '*'){return {val:true}}
        for (let p in this.filter) {
            if (this.filter[p].indexOf(asset[p]) == -1) {
                return {val:false, des:[p,':',this.filter[p], '!=', asset[p]].join(' ')}
            }
        }
        // console.log(this.name, tag, this.filter, asset.info);
        return {val:true}
    }
}
module.exports = Middleware;

