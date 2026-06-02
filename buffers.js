(()=>{
    class Buffer extends ADT{
        static adtType = "buffer"
        static isLe = !!new Uint8Array(new Uint16Array([1]).buffer).at(0);
        _bytes = null;
        _view = null;
        constructor(size=1024){
            super();
            this._bytes = 
                Process.prototype.reportTypeOf(size) == "number" ? 
                    new ArrayBuffer(Number(size)) : 
                        size instanceof ArrayBuffer ? size :
                        (()=>{throw new Error("expecting an ArrayBuffer but got "+size)});
            this._view = new DataView(this._bytes);
        }
        byteLength(){
            return this._bytes.byteLength;
        }
        
        get(type,idx){
            return Buffer.isLe ? this.get_le(type,idx) : this.get_be(type,idx);
        }
        get_le(type,idx){
            if(typeof type !== 'string')
                return this.get_le(String(type),idx);
            if(idx instanceof List)
                return idx.map(v=>this.get_le(type,v));
            return this._view["get"+{u:"Uint",i:"Int",f:"Float"}[type[0]]+Number(type.slice(1))](idx-1,true);
        }
        get_be(type,idx){
            if(typeof type !== 'string')
                return this.get_be(String(type),idx);
            if(idx instanceof List)
                return idx.map(v=>this.get_be(type,v));
            return this._view["get"+{u:"Uint",i:"Int",f:"Float"}[type[0]]+Number(type.slice(1))](idx-1,false);
        }

        set(type,idx,val){
            return Buffer.isLe ? this.set_le(type,idx,val) : this.set_be(type,idx,val);
        }
        set_le(type,idx,val){
            if(typeof type !== 'string')
                return this.set_le(String(type),idx,val);
            if(idx instanceof List)
                return idx.map(v=>this.set_le(type,v,val));
            if(val instanceof List)
                return val.map((v,i)=>this.set_le(type,idx+i,v));
            return this._view["set"+{u:"Uint",i:"Int",f:"Float"}[type[0]]+Number(type.slice(1))](idx-1,val,true);
        }
        set_be(type,idx,val){
            if(typeof type !== 'string')
                return this.set_be(String(type),idx,val);
            if(idx instanceof List)
                return idx.map(v=>this.set_be(type,v,val));
            if(val instanceof List)
                return val.map((v,i)=>this.set_be(type,idx+i,v));
            return this._view["set"+{u:"Uint",i:"Int",f:"Float"}[type[0]]+Number(type.slice(1))](idx-1,val,false);
        }

        slice(start,end){
            return new Buffer(this._bytes.slice(start-1,end));
        }

        export(fileName){
            let fileReader = new FileReader();
            fileReader.addEventListener("loadend",data=>{
                IDE_Morph.prototype.saveFileAs(fileReader.result,'application/octet-stream',fileName);
            })
            fileReader.readAsDataURL(new Blob([this._bytes],{type:'application/octet-stream'}));
        }
        _morph(){
            return new List([...new Uint8Array(this._bytes)].map(v=>v.toString(16).padStart(2,0)));
        }
        toString(){
            return `<buffer of length ${this.byteLength()}>`
        }
    }
    ADT.init(Buffer);
    window.Buffer = Buffer;
})()
