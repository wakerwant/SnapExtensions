/*
    you can have properly supported custom js types in Snap!
*/
if (!window.ADT) {
    function lisp(o, ...a) {
        let str = o.map(v => v === "" ? a.shift() : v).join("");
        let proc = new Process(null, world.childThatIsA(IDE_Morph).stage);
        proc.pushContext();
        return proc.assemble(proc.parseCode(str));
    }
    class ADT extends List {
        constructor() {
            super([new List(["...", this.constructor.proto])]);
        }
        static
        __do(self, action, args) {
            if (!(self instanceof ADT))
                throw new Error("expecting a js defined adt but got a " + Process.prototype.reportTypeOf(self));
            if (List.prototype[action])
                throw new Error("cannot call list methods directly");
            return self[action](...args.itemsArray()) ?? '';
        }
        static
        proto = new List([
                new List(["_type", "adt"]),
                new List(["__do", ADT.__do]),
                new List(["_morph", lisp`(call (get __do) (this [object]) "toString" (list))`])
            ]);
        static
        init(cls) {
            if (!cls.prototype instanceof this) {
                throw new Error("expecting a js defined adt type but got " + cls.name);
            }
            if (cls.proto) return;
            if (cls.prototype.__proto__.constructor !== this)
                this.init(cls.prototype.__proto__.constructor);
            let proto = new List(["...", cls.prototype.__proto__.constructor.proto])
            for (let k of Object.getOwnPropertyNames(cls.prototype)) {
                proto.bind(k, lisp`(call (get __do) (this [object]) ${k} (this [inputs]))`);
            }
            proto.bind("_type", cls.adtType || cls.name);
            cls.proto = proto;
        }
    }
    window.ADT = ADT;
}
