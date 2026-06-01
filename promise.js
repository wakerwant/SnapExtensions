/* @depends ADT */
class PromiseWrapper extends ADT{
    static adtType = "promise";
    _promise=null;
    constructor(promise){
        super();
        this._promise = promise;
    }
    then(callback){
        return new PromiseWrapper(this._promise.then(
            callback instanceof Function ? callback : function(...args){
                let threads = world.childThatIsA(IDE_Morph).stage.threads;
                let proc = new Process();
                proc.initializeFor(callback, new List(args).map(v=>v??null));
                return new Promise((report,error)=>{
                    proc.throwError = (err)=>error(err);
                    proc.handleError = proc.throwError;
                    proc.runStep();
                    if(!proc.isRunning())
                        return report(proc.homeContext.inputs[0]);
                    threads.processes.push(proc);
                })
            }
        ))
    }
    catch(callback){
        return new PromiseWrapper(this._promise.catch(
            callback instanceof Function ? callback : function(err){
                let threads = world.childThatIsA(IDE_Morph).stage.threads;
                let proc = new Process();
                proc.initializeFor(callback, new List([err.message??err]).map(v=>v??null));
                return new Promise((report,error)=>{
                    proc.throwError = (err)=>error(err);
                    proc.handleError = proc.throwError;
                    proc.runStep();
                    if(!proc.isRunning())
                        return report(proc.homeContext.inputs[0]);
                    threads.processes.push(proc);
                })
            }
        ))
    }
}
ADT.init(PromiseWrapper);
(()=>{
    let proc = new Process(null,world.childThatIsA(IDE_Morph).stage);
    proc.pushContext();
    PromiseWrapper.proto.bind("wait",proc.assemble(proc.parseCode(`(
        (var result errored isDone)
        (set isDone (bool f))
        (run (item then (this [object])) (cmd (
            (if (not (get isDone)) (
                (set result (get data))
                (set errored (bool f))
                (set isDone (bool t))
            ))
        ) data))
        (run (item catch (this [object])) (cmd (
            (if (not (get isDone)) (
                (set result (get data))
                (set errored (bool t))
                (set isDone (bool t))
            ))
        ) data))
        (waitUntil (get isDone))
        (if (get errored) (extension "err_error(msg)" (get result)))
        (report (get result))
    )`)))
})()
