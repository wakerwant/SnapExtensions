/*
    ------------------------------
    |  Snap! buffer list libary  |
    |       by wakerwant         |
    ------------------------------
    requires ./bigint.js
*/
function snapRequire(url=''){
    SnapExtensions.primitives.get('src_load(url)')(url,new Process(new CommandBlockMorph(),world.childThatIsA(IDE_Morph).stage));
}
snapRequire('https://raw.githubusercontent.com/wakerwant/SnapExtensions/refs/heads/main/bigint.js');
SnapExtensions.primitives.set("buffer_asBufferList(type,list)",function(type,list){
    return new List({
        ["unsigned byte"]:Uint8Array,
        ["unsigned short"]:Uint16Array,
        ["unsigned int"]:Uint32Array,
        ["unsigned long"]:BigUint64Array,
        
        ["byte"]:Int8Array,
        ["short"]:Int16Array,
        ["int"]:Int32Array,
        ["long"]:BigInt64Array,
        
        ["float"]:Float32Array,
        ["real"]:Float64Array
    }[type].from((!type.includes('long'))?list.itemsArray():[...list.itemsArray()].map(v=>BigInt(String(v)))));
})
SnapExtensions.primitives.set("buffer_bufferList(buf,type)",function(list,type,proc){
    return new List(new {
        ["unsigned byte"]:Uint8Array,
        ["unsigned short"]:Uint16Array,
        ["unsigned int"]:Uint32Array,
        ["unsigned long"]:BigUint64Array,
        
        ["byte"]:Int8Array,
        ["short"]:Int16Array,
        ["int"]:Int32Array,
        ["long"]:BigInt64Array,
        
        ["float"]:Float32Array,
        ["real"]:Float64Array
    }[type](list?.contents?.buffer??(()=>{
        throw new Error("expected a buffer list but got a "+proc.reportTypeOf(list))
    })()));
})
SnapExtensions.primitives.set("byte_typeOfBufferList(buf)",function(list){
    return {
        ["Uint8"]:"unsigned byte",
        ["Uint16"]:"unsigned short",
        ["Uint32"]:"unsigned int",
        ["BigUint64"]:"unsigned long",

        ["Int8"]:"byte",
        ["Int16"]:"short",
        ["Int32"]:"int",
        ["BigInt64"]:"long",

        ["Float32"]:"float",
        ["Float64"]:"real"
     }[list.itemsArray().constructor.name.slice(0,-"Array".length)]??"none"
})
