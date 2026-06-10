/*
    you can have properly supported custom js types in Snap!
*/
if (!window.ADT) {
    function parseLisp(str) {
        let proc = new Process(null, world.childThatIsA(IDE_Morph).stage);
        proc.pushContext();
        return proc.assemble(proc.parseCode(str));
    }
    class ADT extends List {
        constructor() {
            super([]);
            this.add(new List(["...", this.constructor.proto]));
        }
        toString(){
            return "<"+this.lookup("_type")+">"
        }
        static
        __do(self, action, args) {
            if (!(self instanceof ADT))
                throw new Error("expecting a js defined adt but got a " + Process.prototype.reportTypeOf(self));
            if (self[action] == List.prototype[action])
                throw new Error("cannot call list methods directly");
            return self[action](...args.itemsArray()) ?? '';
        }
        static
        proto = new List([
                new List(["_type", "adt"]),
                new List(["__do", ADT.__do]),
                new List(["_morph", parseLisp(`(call (get __do) (this [object]) "toString" (list))`)])
            ]);
        static
        getInputNames(funct){
            let result = '';
            let stringified = String(funct);
            let level = 0;
            for(let i = 0; i < stringified.length; i++){
                if(['(','{','['].includes(stringified[i])){
                    level++;
                    continue;
                }
                if([')','}',']'].includes(stringified[i])){
                    if(level==1)
                        break;
                    level--;
                    continue;
                }
                if(level==1)
                    result+=stringified[i];
            }
            return result.split(',').map(v=>String([...v.matchAll(/[a-zA-Z0-9_]+/g)][0])).filter(v=>v!=="");
        }
        static
        init(cls) {
            if (!cls.prototype instanceof this) {
                throw new Error("expecting a js defined adt type but got " + cls.name);
            }
            if (Object.hasOwn(cls,"proto")) return;
            if (cls.prototype.__proto__.constructor !== this)
                this.init(cls.prototype.__proto__.constructor);
            let proto = new List([new List(["...", cls.prototype.__proto__.constructor.proto])])
            for (let k of Object.getOwnPropertyNames(cls.prototype)) {
                if(typeof cls.prototype[k] !== 'function')
                    continue;
                let f = parseLisp(`(call (get __do) (this [object]) ${k} (this [inputs]))`);
                f.inputs = this.getInputNames(cls.prototype[k]);
                proto.bind(k, f);
            }
            proto.bind("_type", cls.adtType || cls.name);
            cls.proto = proto;
        }
    }
    window.ADT = ADT;
}
