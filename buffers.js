(()=>{

    try{
        window.SharedArrayBuffer||= new WebAssembly.Memory({
            initial:0,
            maximum:1,
            shared:true
        }).buffer.constructor;
    }catch(err){
        console.log("so, no shared array buffers T_T");
        window.SharedArrayBuffer = function(){
            if(new.target){
                throw new Error("sadly, shared array buffers are not allowed at all");
            }
        }
    }
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
                        size instanceof SharedArrayBuffer ? size :
                        (()=>{throw new Error("expecting an ArrayBuffer but got "+size)});
            this._view = new DataView(this._bytes);
        }
        byteLength(){
            return this._bytes.byteLength;
        }
        getAtomic(type,idx){
            if(!(this._bytes instanceof SharedArrayBuffer))
                return this.get(type,idx);
            if(typeof type !== 'string')
                return this.getAtomic(String(type),idx);
            let cls = window[{u:"Uint",i:"Int",f:"Float"}[type[0]]+Number(type.slice(1))+"Array"];
            function get(idx){
                if(idx instanceof List)
                    return idx.map(get);
                return Atomics.load(new cls(this._bytes,Number(idx)-1,1),0);
            }
            return get(idx);
        }
        get(type,idx){
            return Buffer.isLe ? this.get_le(type,idx) : this.get_be(type,idx);
        }
        get_le(type,idx){
            if(typeof type !== 'string')
                return this.get_le(String(type),idx);
            let method = this._view["get"+{u:"Uint",i:"Int",f:"Float"}[type[0]]+Number(type.slice(1))];
            function get(idx){
                if(idx instanceof List)
                    return idx.map(get);
                return method.call(this._view,Number(idx)-1,true);
            }
            return get(idx);
        }
        get_be(type,idx){
            if(typeof type !== 'string')
                return this.get_be(String(type),idx);
            let method = this._view["get"+{u:"Uint",i:"Int",f:"Float"}[type[0]]+Number(type.slice(1))];
            function get(idx){
                if(idx instanceof List)
                    return idx.map(get);
                return method.call(this._view,Number(idx)-1,false);
            }
            return get(idx);
        }

        setAtomic(type,idx,val){
            if(!(this._bytes instanceof SharedArrayBuffer))
                return this.set(type,idx,val);
            if(typeof type !== 'string')
                return this.setAtomic(String(type),idx,val);
            let size = Number(type.slice(1))/8;
            let cls = window[{u:"Uint",i:"Int",f:"Float"}[type[0]]+Number(type.slice(1))+"Array"];
            function set(idx,val){
                if(idx instanceof List && val instanceof List){
                    let maxIdx = Math.min(idx.length(),val.length());
                    let idxA = idx.itemsArray();
                    let valA = val.itemsArray();
                    for(let i = 0; i < maxIdx; i++){
                        set(idxA[i],valA[i]);
                    }
                    return;
                }
                if(idx instanceof List)
                    return idx.itemsArray().forEach(v=>set(v,val));
                if(val instanceof List)
                    return idx.itemsArray().forEach((v,i)=>set(idx+i*size,v));
                return Atomics.store(new cls(this._bytes,Number(idx)-1,1),0,Number(val));
            }
            return set(idx,val);
        }
        changeAtomic(type,idx,delta){
            if(!(this._bytes instanceof SharedArrayBuffer))
                return this.set(type,idx,this.get(type,idx)+val);
            if(typeof type !== 'string')
                return this.set_le(String(type),idx,val);
            let size = Number(type.slice(1))/8;
            let cls = window[{u:"Uint",i:"Int",f:"Float"}[type[0]]+Number(type.slice(1))+"Array"];
            function set(idx,val){
                if(idx instanceof List && val instanceof List){
                    let maxIdx = Math.min(idx.length(),val.length());
                    let idxA = idx.itemsArray();
                    let valA = val.itemsArray();
                    for(let i = 0; i < maxIdx; i++){
                        set(idxA[i],valA[i]);
                    }
                    return;
                }
                if(idx instanceof List)
                    return idx.itemsArray().forEach(v=>set(v,val));
                if(val instanceof List)
                    return idx.itemsArray().forEach((v,i)=>set(idx+i*size,v));
                return Atomics.add(new cls(this._bytes,Number(idx)-1,1),0,Number(val));
            }
            return set(idx,delta);
        }
        andAtomic(type,idx,val){
            if(!(this._bytes instanceof SharedArrayBuffer))
                return this.set(type,idx,this.get(type,idx)&val);
            if(typeof type !== 'string')
                return this.andAtomic(String(type),idx,val);
            let size = Number(type.slice(1))/8;
            let cls = window[{u:"Uint",i:"Int",f:"Float"}[type[0]]+Number(type.slice(1))+"Array"];
            function set(idx,val){
                if(idx instanceof List && val instanceof List){
                    let maxIdx = Math.min(idx.length(),val.length());
                    let idxA = idx.itemsArray();
                    let valA = val.itemsArray();
                    for(let i = 0; i < maxIdx; i++){
                        set(idxA[i],valA[i]);
                    }
                    return;
                }
                if(idx instanceof List)
                    return idx.itemsArray().forEach(v=>set(v,val));
                if(val instanceof List)
                    return idx.itemsArray().forEach((v,i)=>set(idx+i*size,v));
                return Atomics.and(new cls(this._bytes,Number(idx)-1,1),0,Number(val));
            }
            return set(idx,val);
        }
        orAtomic(type,idx,val){
            if(!(this._bytes instanceof SharedArrayBuffer))
                return this.set(type,idx,this.get(type,idx)|val);
            if(typeof type !== 'string')
                return this.orAtomic(String(type),idx,val);
            let size = Number(type.slice(1))/8;
            let cls = window[{u:"Uint",i:"Int",f:"Float"}[type[0]]+Number(type.slice(1))+"Array"];
            function set(idx,val){
                if(idx instanceof List && val instanceof List){
                    let maxIdx = Math.min(idx.length(),val.length());
                    let idxA = idx.itemsArray();
                    let valA = val.itemsArray();
                    for(let i = 0; i < maxIdx; i++){
                        set(idxA[i],valA[i]);
                    }
                    return;
                }
                if(idx instanceof List)
                    return idx.itemsArray().forEach(v=>set(v,val));
                if(val instanceof List)
                    return idx.itemsArray().forEach((v,i)=>set(idx+i*size,v));
                return Atomics.or(new cls(this._bytes,Number(idx)-1,1),0,Number(val));
            }
            return set(idx,val);
        }
        xorAtomic(type,idx,val){
            if(!(this._bytes instanceof SharedArrayBuffer))
                return this.set(type,idx,this.get(type,idx)^val);
            if(typeof type !== 'string')
                return this.xorAtomic(String(type),idx,val);
            let size = Number(type.slice(1))/8;
            let cls = window[{u:"Uint",i:"Int",f:"Float"}[type[0]]+Number(type.slice(1))+"Array"];
            function set(idx,val){
                if(idx instanceof List && val instanceof List){
                    let maxIdx = Math.min(idx.length(),val.length());
                    let idxA = idx.itemsArray();
                    let valA = val.itemsArray();
                    for(let i = 0; i < maxIdx; i++){
                        set(idxA[i],valA[i]);
                    }
                    return;
                }
                if(idx instanceof List)
                    return idx.itemsArray().forEach(v=>set(v,val));
                if(val instanceof List)
                    return idx.itemsArray().forEach((v,i)=>set(idx+i*size,v));
                return Atomics.xor(new cls(this._bytes,Number(idx)-1,1),0,Number(val));
            }
            return set(idx,val);
        }

        set(type,idx,val){
            return Buffer.isLe ? this.set_le(type,idx,val) : this.set_be(type,idx,val);
        }
        set_le(type,idx,val){
            if(typeof type !== 'string')
                return this.set_le(String(type),idx,val);
            let method = this._view["set"+{u:"Uint",i:"Int",f:"Float"}[type[0]]+Number(type.slice(1))];
            function set(idx,val){
                if(idx instanceof List && val instanceof List){
                    let maxIdx = Math.min(idx.length(),val.length());
                    let idxA = idx.itemsArray();
                    let valA = val.itemsArray();
                    for(let i = 0; i < maxIdx; i++){
                        set(idxA[i],valA[i]);
                    }
                    return;
                }
                if(idx instanceof List)
                    return idx.itemsArray().forEach(v=>set(v,val));
                if(val instanceof List)
                    return idx.itemsArray().forEach(v=>set(idx,v));
                return method.call(this._view,Number(idx)-1,Number(val),true);
            }
            return set(idx,val);
        }
        set_be(type,idx,val){
            if(typeof type !== 'string')
                return this.set_be(String(type),idx,val);
            let method = this._view["set"+{u:"Uint",i:"Int",f:"Float"}[type[0]]+Number(type.slice(1))];
            function set(idx,val){
                if(idx instanceof List && val instanceof List){
                    let maxIdx = Math.min(idx.length(),val.length());
                    let idxA = idx.itemsArray();
                    let valA = val.itemsArray();
                    for(let i = 0; i < maxIdx; i++){
                        set(idxA[i],valA[i]);
                    }
                    return;
                }
                if(idx instanceof List)
                    return idx.itemsArray().forEach(v=>set(v,val));
                if(val instanceof List)
                    return idx.itemsArray().forEach(v=>set(idx,v));
                return method.call(this._view,Number(idx)-1,Number(val),false);
            }
            return set(idx,val);
        }

        waitAtomic(type,idx,val,timeout=Infinity){
            if(!(this._bytes instanceof SharedArrayBuffer)){
                let start = Date.now();
                let end = Process.prototype.reportTypeOf(timeout)=='number'?
                    Math.max(start,start+timeout):Infinity;
                if(end == start)
                    return new PromiseWrapper(Promise.resolve(SnapEquals(this.get(type,idx),val)?"timeout":"ok"));
                return new PromiseWrapper((async()=>{
                    while(SnapEquals(this.get(type,idx),val)){
                        await new Promise(res=>setTimeout(res,0));
                        if(Date.now() >= end)
                            return "timeout";
                    }
                    return "ok";
                })())
            }
            let size = Number(type.slice(1))/8;
            let cls = window[{u:"Uint",i:"Int",f:"Float"}[type[0]]+Number(type.slice(1))+"Array"];
            function wait(idx,val){
                if(idx instanceof List && val instanceof List){
                    let maxIdx = Math.min(idx.length(),val.length());
                    let idxA = idx.itemsArray();
                    let valA = val.itemsArray();
                    for(let i = 0; i < maxIdx; i++){
                        wait(idxA[i],valA[i]);
                    }
                    return;
                }
                if(idx instanceof List)
                    return Promise.allSettled(...idx.map(v=>wait(v,val)).itemsArray());
                if(val instanceof List)
                    return Promise.allSettled(...idx.map((v,i)=>wait(idx+i*size,v).itemsArray()));
                return Promise.resolve(Atomics.waitAsync(new cls(this._bytes,Number(idx)-1,1),0,Number(val),timeout));
            }
            return new PromiseWrapper(wait(idx,val));
        }

        slice(start,end){
            return new Buffer(this._bytes.slice(start-1,end));
        }
        paste(start,slice,sliceStart=1,length=slice.byteLength()){
            if(!(slice instanceof Buffer)){
                throw new Error("expecting a buffer but got a "+Process.prototype.reportTypeOf(slice));
            }
            this.setAtomic('u8',start,slice.getAtomic('u8',Process.prototype.reportNumbers(sliceStart,sliceStart+length-1)));
        }
        export(fileName){
            let fileReader = new FileReader();
            fileReader.addEventListener("loadend",data=>{
                IDE_Morph.prototype.saveFileAs(fileReader.result,'application/',fileName);
            })
            fileReader.readAsDataURL(new Blob([this._bytes],{type:'application/octet-stream'}));
        }
        shared(){
            return this._bytes instanceof SharedArrayBuffer;
        }
        _morph(){
            return new List([...new Uint8Array(this._bytes)].map(v=>v.toString(16).padStart(2,0)));
        }
        toString(){
            return `<${this._bytes instanceof SharedArrayBuffer?'shared ':''}buffer of length ${this.byteLength()}>`
        }
    }
    ADT.init(Buffer);
    window.Buffer = Buffer;
    
    SnapExtensions.primitives.set(
        'buf_new(count)',
        function(count){
            return new Buffer(Number(count));
        }
    )
    SnapExtensions.primitives.set(
        'buf_new_shared(count)',
        function(count){
            return new Buffer(new SharedArrayBuffer(Number(count)));
        }
    )
    
    //credit to the Snap! devs for the original version of this function
    SnapExtensions.primitives.set(
        'buf_import',
        function (proc) {
            // raw is a Boolean flag selecting to keep the data unparsed
            var ide = this.parentThatIsA(IDE_Morph),
                wrld = ide.world(),
                acc = proc.context.accumulator,
                inp;
    
            function userImport() {
    
    
                function readText(aFile) {
                    var frd = new FileReader(),
                        ext = aFile.name.split('.').pop().toLowerCase();
    
                    function isType(aFile, string) {
                        return aFile.type.indexOf(string) !== -1 ||
                            (ext === string);
                    }
    
                    frd.onloadend = function (e) {
                        acc.data = new Buffer(e.target.result);
                    };
    
                    frd.readAsArrayBuffer(aFile);
                }
    
                document.body.removeChild(inp);
                ide.filePicker = null;
                if (inp.files.length > 0) {
                    readText(inp.files[inp.files.length - 1]);
                }
            }
    
            if (!acc) {
                acc = proc.context.accumulator = {
                    data: null
                };
                if (ide.filePicker) {
                    document.body.removeChild(ide.filePicker);
                    ide.filePicker = null;
                }
                inp = document.createElement('input');
                inp.type = 'file';
                inp.style.color = "transparent";
                inp.style.backgroundColor = "transparent";
                inp.style.border = "none";
                inp.style.outline = "none";
                inp.style.position = "absolute";
                inp.style.top = "0px";
                inp.style.left = "0px";
                inp.style.width = wrld.width() + 'px';
                inp.style.height = wrld.height() + 'px';
                inp.addEventListener(
                    "change",
                    userImport,
                    false
                );
                inp.addEventListener(
                    "cancel",
                    () => {
                        acc.data = '';
                        document.body.removeChild(inp);
                        ide.filePicker = null;
                    },
                    false
                );
                document.body.appendChild(inp);
                ide.filePicker = inp;
                inp.click();
            } else if (acc.data !== null) {
                return acc.data;
            }
            proc.pushContext('doYield');
            proc.pushContext();
        }
    );

})()
