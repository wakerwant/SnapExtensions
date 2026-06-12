(()=>{
    let pageSize = 65536;
    class WasmMemory extends ADT{
        static adtType = 'wasm_memory';
        /** @type {WebAssembly.Memory} */
        _mem = null;
        constructor(opt=new List([])){
            super();
            if(opt instanceof WebAssembly.Memory){
                if(opt.wrapper instanceof WasmMemory)
                    return opt.wrapper;
                this._mem=opt;
            }else{
                this._mem=new WebAssembly.Memory({
                    address:opt.lookup('addressType')||void 0,
                    maximum:(opt.lookup('addressType')=='i64'?
                        BigInt(opt.lookup('maximum').toString()):
                        Number(opt.lookup('maximum')))||void 0,
                    initial:opt.lookup('addressType')=='i64'?
                        BigInt(opt.lookup('initial').toString()):
                        Number(opt.lookup('initial')),
                    shared:!!opt.lookup('shared')
                });
            }
            this._mem.wrapper=this;
        }
        buffer(){
            return new Buffer(this._mem.buffer);
        }
        grow(amount){
            try{
                this._mem.grow(Number(amount));
            }catch(err){
                this._mem.grow(BigInt(amount.toString()));
            }
        }
        toString(){
            return `<wasm_memory with ${this.buffer().byteLength()/pageSize} pages>`
        }
    }
    ADT.init(WasmMemory);
    class WasmGlobal extends ADT{
        static adtType = 'wasm_global';
        /** @type {WebAssembly.Global} */
        _var = null;
        constructor(opt=new List()){
            super();
            if(opt instanceof WebAssembly.Global){
                if(opt.wrapper instanceof WasmGlobal)
                    return opt.wrapper;
                this._var = opt
            }else{
                this._var = new WebAssembly.Global(
                    {
                        mutable:!!opt.lookup('mutable'),
                        value:opt.lookup('type')
                    },
                    opt.lookup('type')=='i64'? BigInt(opt.lookup('value').toString()):
                    ['i32','f32','f64'].includes(opt.lookup('type'))? Number(opt.lookup('value')):
                    opt.lookup('type')=='funcref'?wasmObjectFor(opt.lookup('value')):
                    opt.lookup('value')
                );
            }
            this._var.wrapper = this;
        }
        get(){
            let result = this._var.value;
            if(typeof result == 'function' && result.snapContext)
                return result.snapContext;
            if(typeof result == 'bigint')
                return BigInteger(result);
            return result;
        }
        set(val){
            if(val instanceof BigInteger)
                this._var.value = BigInt(val.toString());
            try{
                this._var.value = val;
            }catch(err){
                this._var.value = wasmObjectFor(val);
            }
        }
    }
    ADT.init(WasmGlobal);
    class WasmTable extends ADT{
        static adtType = 'wasm_table';
        /** @type {WebAssembly.Table} */
        _table = null;
        constructor(opt=new List()){
            super();
            if(opt instanceof WebAssembly.Table){
                if(opt.wrapper instanceof WasmTable)
                    return opt.wrapper;
                this._table = opt;
            }else{
                this._table=new WebAssembly.Table({
                    element:opt.lookup('elementType'),
                    initial:Number(opt.lookup('initialLength')),
                    maximum:Number(opt.lookup('maximumLength'))||void 0
                })
            }
            this._table.wrapper = this;
        }
        get(idx){
            let result = this._table.get(Number(idx)-1);
            if(typeof result == 'function' && result.snapContext)
                return result.snapContext;
            return result;
        }
        set(idx,val){
            try{
                this._table.set(Number(idx)-1,val);
            }catch(err){
                this._table.set(Number(idx)-1,wasmObjectFor(val));
            }
        }
        size(){
            return this._table.length;
        }
        grow(amount){
            this._table.grow(amount);
        }
        _morph(){
            let arr = [];
            for(let i = 0; i < this._table.length; i++){
                arr.push(this.get(i+1));
            }
            return new List(arr);
        }
    }
    ADT.init(WasmTable);
    class WasmTag extends ADT{
        static adtType = 'wasm_errTag';
        /** @type {WebAssembly.Tag} */
        _tag = null;
        constructor(opt=new List()){
            super();
            if(opt instanceof WebAssembly.Tag){
                if(opt.wrapper instanceof WasmTag)
                    return opt.wrapper;
                this._tag = opt;
            }else{
                this._tag=new WebAssembly.Tag({
                    parameters:opt.itemsArray()
                });
            }
            this._tag.wrapper = this;
        }
        types(){
            return new List([...this._tag.type?.()||[]]);
        }
    }
    ADT.init(WasmTag);
    class WasmError extends ADT{
        static adtType = 'wasm_error';
        /** @type {WebAssembly.Exception} */
        _err = null;
        constructor(opt=new List()){
            super();
            if(opt instanceof WebAssembly.Exception){
                if(opt.wrapper instanceof WasmError)
                    return opt.wrapper;
                this._err = opt;
            }else{
                this._err=new WebAssembly.Exception(
                    wasmObjectFor(opt.lookup('tag')),
                    opt.lookup('payload').map((v,i)=>
                        opt.lookup('tag').types().at(i+1)=='funcref'?
                        wasmObjectFor(v):
                        v instanceof BigInteger? BigInt(v.toString()):v
                    ).itemsArray()
                );
            }
            this._err.wrapper = this;
        }
        isA(tag){
            return this._err.is(tag instanceof WasmTag?tag._tag:tag);
        }
        getArg(tag,idx){
            let result = this._err.getArg(tag instanceof WasmTag?tag._tag:tag,Number(idx)-1);
            if(typeof result == 'function' && result.snapContext)
                return result.snapContext;
            return result;
        }
        throw(){
            throw this._err;
        }
    }
    ADT.init(WasmError);
    class WasmModule extends ADT{
        static adtType = 'wasm_module';
        /** @type {WebAssembly.Module} */
        _module = null;

        constructor(module){
            super();
            this._module=module;
        }
        customSections(name){
            return new List(WebAssembly.Module.customSections(this._module,name).map(v=>new Buffer(v)));
        }
        exports(){
            return new List(WebAssembly.Module.exports(this._module).map(v=>
                new List([
                    new List(['kind',v.kind]),
                    new List(['name',v.name])
                ])
            ));
        }
        imports(){
            return new List(WebAssembly.Module.imports(this._module).map(v=>
                new List([
                    new List(['module',v.module]),
                    new List(['kind',v.kind]),
                    new List(['name',v.name])
                ])
            ));
        }
        instanate(objects=new List()){
            let dict = Object.fromEntries(objects.map(v=>
                    [v.at(1),Object.fromEntries(v.at(2).map(v=>[v.at(1),wasmObjectFor(v.at(2))]).itemsArray())]
                ).itemsArray());
            return new PromiseWrapper(WebAssembly.instantiate(this._module,dict).then(v=>new WasmInstance(v)))
        }
    }
    ADT.init(WasmModule);
    class WasmInstance extends ADT{
        static adtType = 'wasm_instance';
        /** @type {WebAssembly.Instance} */
        _inst = null;
        constructor(inst){
            super()
            this._inst=inst;
        }
        exports(){
            return new List(Object.entries(this._inst.exports).map(v=>new List([v[0],wasmADTfor(v[1])])));
        }
    }
    ADT.init(WasmInstance);

    function wasmObjectFor(obj){
        if(obj instanceof Context){
            let f = function(...args){
                let result = invoke(
                    obj,
                    new List(args).map(v=>typeof v == 'bigint'?BigInteger(v):v),//support bignums
                    Process.prototype.reportData(obj),
                    500
                );
                if(result instanceof BigInteger)
                    return BigInt(result.toString());//IEEE754 bypass
                return result;
            }
            f.snapContext = obj;
            return f;
        }
        if(obj instanceof WasmMemory)
            return obj._mem;
        if(obj instanceof WasmGlobal)
            return obj._var;
        if(obj instanceof WasmTable)
            return obj._table;
        if(obj instanceof WasmTag)
            return obj._tag;
        if(obj instanceof WasmError)
            return obj._err;
        return obj;
    }
    function wasmADTfor(obj){
        if(obj instanceof WebAssembly.Memory)
            return new WasmMemory(obj);
        if(obj instanceof WebAssembly.Global)
            return new WasmGlobal(obj);
        if(obj instanceof WebAssembly.Table)
            return new WasmTable(obj);
        if(obj instanceof WebAssembly.Tag)
            return new WasmTag(obj);
        if(obj instanceof WebAssembly.Exception)
            return new WasmError(obj);
        return obj;
    }
    SnapExtensions.primitives.set('wasm_mem(opt)',function(...args){
        return new WasmMemory(...args.slice(0,-1));
    })
    SnapExtensions.primitives.set('wasm_global(opt)',function(...args){
        return new WasmGlobal(...args.slice(0,-1));
    })
    SnapExtensions.primitives.set('wasm_table(opt)',function(...args){
        return new WasmTable(...args.slice(0,-1));
    })
    SnapExtensions.primitives.set('wasm_tag(opt)',function(...args){
        return new WasmTag(...args.slice(0,-1));
    })
    SnapExtensions.primitives.set('wasm_error(opt)',function(...args){
        return new WasmError(...args.slice(0,-1));
    })
    SnapExtensions.primitives.set('wasm_compile(bytes[,options])',function(...args){
        let [bytes,opt]=args.slice(0,-1);
        opt||=new List();
        return new PromiseWrapper(WebAssembly.compile(
            bytes instanceof Buffer?
                bytes._bytes:
                new Uint8Array(bytes.itemsArray()).buffer,
            {
                builtins:opt.lookup('builtins') instanceof List?
                    opt.lookup('builtins').itemsArray():
                    [],
                importedStringConstants:String(opt.lookup('strings')||'')||void 0
            }
        ).then(v=>new WasmModule(v)));
    });

    //modified to support my wasm libary
    Process.prototype.tryCatch = function(action,exception,errVarName){
            var next = this.context.continuation();

            this.handleError = function(error) {
                this.resetErrorHandling();
                if (exception.expression instanceof CommandBlockMorph) {
                    exception.expression = exception.expression.blockSequence();
                }
                exception.pc = 0;
                exception.outerContext.variables.addVar(errVarName);
                exception.outerContext.variables.setVar(errVarName, 
                    error instanceof WebAssembly.Exception?
                        new WasmError(error):
                        error.message
                );
                this.context = exception;
                this.evaluate(next, new List(), true);
            };

            this.evaluate(action, new List(), true);
    }
    window.WasmInstance = WasmInstance;
    window.WasmMemory   = WasmMemory;
    window.WasmGlobal   = WasmGlobal;
    window.WasmTable    = WasmTable;
    window.WasmTag      = WasmTag;
    window.WasmError    = WasmError;
    window.WasmModule   = WasmModule;
})()(()=>{
    let pageSize = 65536;
    class WasmMemory extends ADT{
        static adtType = 'wasm_memory';
        /** @type {WebAssembly.Memory} */
        _mem = null;
        constructor(opt=new List([])){
            super();
            if(opt instanceof WebAssembly.Memory){
                if(opt.wrapper instanceof WasmMemory)
                    return opt.wrapper;
                this._mem=opt;
            }else{
                this._mem=new WebAssembly.Memory({
                    address:opt.lookup('addressType')||void 0,
                    maximum:(opt.lookup('addressType')=='i64'?
                        BigInt(opt.lookup('maximum').toString()):
                        Number(opt.lookup('maximum')))||void 0,
                    initial:opt.lookup('addressType')=='i64'?
                        BigInt(opt.lookup('initial').toString()):
                        Number(opt.lookup('initial')),
                    shared:!!opt.lookup('shared')
                });
            }
            this._mem.wrapper=this;
        }
        buffer(){
            return new Buffer(this._mem.buffer);
        }
        grow(amount){
            try{
                this._mem.grow(Number(amount));
            }catch(err){
                this._mem.grow(BigInt(amount.toString()));
            }
        }
        toString(){
            return `<wasm_memory with ${this.buffer().byteLength()/pageSize} pages>`
        }
    }
    ADT.init(WasmMemory);
    class WasmGlobal extends ADT{
        static adtType = 'wasm_global';
        /** @type {WebAssembly.Global} */
        _var = null;
        constructor(opt=new List()){
            super();
            if(opt instanceof WebAssembly.Global){
                if(opt.wrapper instanceof WasmGlobal)
                    return opt.wrapper;
                this._var = opt
            }else{
                this._var = new WebAssembly.Global(
                    {
                        mutable:!!opt.lookup('mutable'),
                        value:opt.lookup('type')
                    },
                    opt.lookup('type')=='i64'? BigInt(opt.lookup('value').toString()):
                    ['i32','f32','f64'].includes(opt.lookup('type'))? Number(opt.lookup('value')):
                    opt.lookup('type')=='funcref'?wasmObjectFor(opt.lookup('value')):
                    opt.lookup('value')
                );
            }
            this._var.wrapper = this;
        }
        get(){
            let result = this._var.value;
            if(typeof result == 'function' && result.snapContext)
                return result.snapContext;
            if(typeof result == 'bigint')
                return BigInteger(result);
            return result;
        }
        set(val){
            if(val instanceof BigInteger)
                this._var.value = BigInt(val.toString());
            try{
                this._var.value = val;
            }catch(err){
                this._var.value = wasmObjectFor(val);
            }
        }
    }
    ADT.init(WasmGlobal);
    class WasmTable extends ADT{
        static adtType = 'wasm_table';
        /** @type {WebAssembly.Table} */
        _table = null;
        constructor(opt=new List()){
            super();
            if(opt instanceof WebAssembly.Table){
                if(opt.wrapper instanceof WasmTable)
                    return opt.wrapper;
                this._table = opt;
            }else{
                this._table=new WebAssembly.Table({
                    element:opt.lookup('elementType'),
                    initial:Number(opt.lookup('initialLength')),
                    maximum:Number(opt.lookup('maximumLength'))
                })
            }
            this._table.wrapper = this;
        }
        get(idx){
            let result = this._table.get(Number(idx)-1);
            if(typeof result == 'function' && result.snapContext)
                return result.snapContext;
            return result;
        }
        set(idx,val){
            try{
                this._table.set(Number(idx)-1,val);
            }catch(err){
                this._table.set(Number(idx)-1,wasmObjectFor(val));
            }
        }
        size(){
            return this._table.length;
        }
        grow(amount){
            this._table.grow(amount);
        }
        _morph(){
            let arr = [];
            for(let i = 0; i < this._table.length; i++){
                arr.push(this.get(i));
            }
            return new List(arr);
        }
    }
    ADT.init(WasmTable);
    class WasmTag extends ADT{
        static adtType = 'wasm_errTag';
        /** @type {WebAssembly.Tag} */
        _tag = null;
        constructor(opt=new List()){
            super();
            if(opt instanceof WebAssembly.Tag){
                if(opt.wrapper instanceof WasmTag)
                    return opt.wrapper;
                this._tag = opt;
            }else{
                this._tag=new WebAssembly.Tag({
                    parameters:opt.itemsArray()
                });
            }
            this._tag.wrapper = this;
        }
    }
    ADT.init(WasmTag);
    class WasmError extends ADT{
        static adtType = 'wasm_error';
        /** @type {WebAssembly.Exception} */
        _err = null;
        constructor(opt=new List()){
            super();
            if(opt instanceof WebAssembly.Exception){
                if(opt.wrapper instanceof WasmError)
                    return opt.wrapper;
                this._err = opt;
            }else{
                this._err=new WebAssembly.Exception(
                    wasmObjectFor(opt.lookup('tag')),
                    opt.lookup('payload').map((v,i)=>
                        opt.lookup('tag').at(i+1)=='funcref'?
                        wasmObjectFor(v):
                        v
                    )
                );
            }
            this._tag.wrapper = this;
        }
        isA(tag){
            return this._err.is(tag instanceof WasmTag?tag._tag:tag);
        }
        getArg(tag,idx){
            let result = this._err.getArg(tag instanceof WasmTag?tag._tag:tag,Number(idx)-1);
            if(typeof result == 'function' && result.snapContext)
                return result.snapContext;
            return result;
        }
        throw(){
            throw this._err;
        }
    }
    ADT.init(WasmError);
    class WasmModule extends ADT{
        static adtType = 'wasm_module';
        /** @type {WebAssembly.Module} */
        _module = null;

        constructor(module){
            super();
            this._module=module;
        }
        customSections(name){
            return new List(WebAssembly.Module.customSections(this._module,name).map(v=>new Buffer(v)));
        }
        exports(){
            return new List(WebAssembly.Module.exports(this._module).map(v=>
                new List([
                    new List(['kind',v.kind]),
                    new List(['name',v.name])
                ])
            ));
        }
        imports(){
            return new List(WebAssembly.Module.imports(this._module).map(v=>
                new List([
                    new List(['module',v.module]),
                    new List(['kind',v.kind]),
                    new List(['name',v.name])
                ])
            ));
        }
        instanate(objects=new List()){
            let dict = Object.fromEntries(objects.map(v=>
                    Object.fromEntries(v.map(v=>[v.at(1),wasmObjectFor(v.at(2))]).itemsArray())
                ).itemsArray());
            return new PromiseWrapper(WebAssembly.instantiate(this._module,dict).then(v=>new WasmInstance(v)))
        }
    }
    ADT.init(WasmModule);
    class WasmInstance extends ADT{
        static adtType = 'wasm_instance';
        /** @type {WebAssembly.Instance} */
        _inst = null;
        constructor(inst){
            super()
            this._inst=inst;
        }
        exports(){
            return new List(Object.entries(this._inst.exports).map(v=>new List([v[0],wasmADTfor(v[1])])));
        }
    }
    ADT.init(WasmInstance);

    function wasmObjectFor(obj){
        if(obj instanceof Context){
            let f = function(...args){
                let result = invoke(
                    obj,
                    new List(args).map(v=>typeof v == 'bigint'?BigInteger(v):v),//support bignums
                    void 0,
                    500
                );
                if(result instanceof BigInteger)
                    return BigInt(result.toString());//IEEE754 bypass
                return result;
            }
            f.snapContext = obj;
            return f;
        }
        if(obj instanceof WasmMemory)
            return obj._mem;
        if(obj instanceof WasmGlobal)
            return obj._var;
        if(obj instanceof WasmTable)
            return obj._table;
        if(obj instanceof WasmTag)
            return obj._tag;
        if(obj instanceof WasmError)
            return obj._err;
        return obj;
    }
    function wasmADTfor(obj){
        if(obj instanceof WebAssembly.Memory)
            return new WasmMemory(obj);
        if(obj instanceof WebAssembly.Global)
            return new WasmGlobal(obj);
        if(obj instanceof WebAssembly.Table)
            return new WasmTable(obj);
        if(obj instanceof WebAssembly.Tag)
            return new WasmTag(obj);
        if(obj instanceof WebAssembly.Exception)
            return new WasmError(obj);
        return obj;
    }
    SnapExtensions.primitives.set('wasm_mem(opt)',function(...args){
        return new WasmMemory(...args.slice(0,-1));
    })
    SnapExtensions.primitives.set('wasm_global(opt)',function(...args){
        return new WasmGlobal(...args.slice(0,-1));
    })
    SnapExtensions.primitives.set('wasm_table(opt)',function(...args){
        return new WasmTable(...args.slice(0,-1));
    })
    SnapExtensions.primitives.set('wasm_tag(opt)',function(...args){
        return new WasmTag(...args.slice(0,-1));
    })
    SnapExtensions.primitives.set('wasm_error(opt)',function(...args){
        return new WasmError(...args.slice(0,-1));
    })
    SnapExtensions.primitives.set('wasm_compile(bytes[,options])',function(...args){
        let [bytes,opt]=args.slice(0,-1);
        opt||=new List();
        return new PromiseWrapper(WebAssembly.compile(
            bytes instanceof Buffer?
                bytes._bytes:
                new Uint8Array(bytes.itemsArray()).buffer,
            {
                builtins:opt.lookup('builtins') instanceof List?
                    opt.lookup('builtins').itemsArray():
                    [],
                importedStringConstants:String(opt.lookup('strings')||'')||void 0
            }
        ).then(v=>new WasmModule(v)));
    });

    //modified to support my wasm libary
    Process.prototype.tryCatch = function(action,exception,errVarName){
            var next = this.context.continuation();

            this.handleError = function(error) {
                this.resetErrorHandling();
                if (exception.expression instanceof CommandBlockMorph) {
                    exception.expression = exception.expression.blockSequence();
                }
                exception.pc = 0;
                exception.outerContext.variables.addVar(errVarName);
                exception.outerContext.variables.setVar(errVarName, 
                    error instanceof WebAssembly.Exception?
                        new WasmError(error):
                        error.message
                );
                this.context = exception;
                this.evaluate(next, new List(), true);
            };

            this.evaluate(action, new List(), true);
    }
    window.WasmInstance = WasmInstance;
    window.WasmMemory   = WasmMemory;
    window.WasmGlobal   = WasmGlobal;
    window.WasmTable    = WasmTable;
    window.WasmTag      = WasmTag;
    window.WasmError    = WasmError;
    window.WasmModule   = WasmModule;
})()
