// To parse this data:
//
//   import { Convert, Interface } from "./file";
//
//   const interface = Convert.toInterface(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface Interface {
//    type:     string;
//    metadata: Metadata;
    features?: Feature[];
//    bbox:     number[];
}

export interface Feature {
    type:       FeatureType;
    properties: Properties;
    geometry:   Geometry;
    id:         string;
}

export interface Geometry {
    type:        GeometryType;
    coordinates: number[];
}

export enum GeometryType {
    Point = "Point",
}

export interface Properties {
    mag:     number | null;
    place:   string;
    time:    number;
    updated: number;
    tz:      null;
    url:     string;
    detail:  string;
    felt:    number | null;
    cdi:     number | null;
    mmi:     number | null;
    alert:   Alert | null;
    status:  Status;
    tsunami: number;
    sig:     number;
    net:     Net;
    code:    string;
    ids:     string;
    sources: Sources;
    types:   string;
    nst:     number | null;
    dmin:    number | null;
    rms:     number;
    gap:     number | null;
    magType: MagType | null;
    type:    PropertiesType;
    title:   string;
}

export enum Alert {
    Green = "green",
    Yellow = "yellow",
}

export enum MagType {
    MB = "mb",
    MBLg = "mb_lg",
    Md = "md",
    Mh = "mh",
    Ml = "ml",
    Mw = "mw",
    Mwr = "mwr",
    Mww = "mww",
}

export enum Net {
    AV = "av",
    Ak = "ak",
    Ci = "ci",
    Hv = "hv",
    MB = "mb",
    Nc = "nc",
    Nm = "nm",
    Nn = "nn",
    Ok = "ok",
    PR = "pr",
    SE = "se",
    Tx = "tx",
    Us = "us",
    Uu = "uu",
    Uw = "uw",
}

export enum Sources {
    AV = ",av,",
    AVAk = ",av,ak,",
    Ak = ",ak,",
    AkAV = ",ak,av,",
    AkAtUs = ",ak,at,us,",
    AkUs = ",ak,us,",
    Ci = ",ci,",
    CiUs = ",ci,us,",
    EwNcUs = ",ew,nc,us,",
    Hv = ",hv,",
    HvUs = ",hv,us,",
    MB = ",mb,",
    MBUs = ",mb,us,",
    Nc = ",nc,",
    NcNn = ",nc,nn,",
    NcNnUs = ",nc,nn,us,",
    NcUs = ",nc,us,",
    NcUsNn = ",nc,us,nn,",
    Nm = ",nm,",
    Nn = ",nn,",
    NnUs = ",nn,us,",
    Ok = ",ok,",
    OkUs = ",ok,us,",
    PR = ",pr,",
    SE = ",se,",
    SEUs = ",se,us,",
    Tx = ",tx,",
    Us = ",us,",
    UsAk = ",us,ak,",
    UsAtAk = ",us,at,ak,",
    UsHv = ",us,hv,",
    UsMB = ",us,mb,",
    UsNn = ",us,nn,",
    UsOk = ",us,ok,",
    UsPR = ",us,pr,",
    UsSE = ",us,se,",
    UsTx = ",us,tx,",
    Uu = ",uu,",
    Uw = ",uw,",
}

export enum Status {
    Automatic = "automatic",
    Reviewed = "reviewed",
}

export enum PropertiesType {
    Earthquake = "earthquake",
    Explosion = "explosion",
    QuarryBlast = "quarry blast",
}

export enum FeatureType {
    Feature = "Feature",
}

export interface Metadata {
    generated: number;
    url:       string;
    title:     string;
    status:    number;
    api:       string;
    count:     number;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toInterface(json: string): Interface {
        return cast(JSON.parse(json), r("Interface"));
    }

    public static interfaceToJson(value: Interface): string {
        return JSON.stringify(uncast(value, r("Interface")), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ''): never {
    const prettyTyp = prettyTypeName(typ);
    const parentText = parent ? ` on ${parent}` : '';
    const keyText = key ? ` for key "${key}"` : '';
    throw Error(`Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`);
}

function prettyTypeName(typ: any): string {
    if (Array.isArray(typ)) {
        if (typ.length === 2 && typ[0] === undefined) {
            return `an optional ${prettyTypeName(typ[1])}`;
        } else {
            return `one of [${typ.map(a => { return prettyTypeName(a); }).join(", ")}]`;
        }
    } else if (typeof typ === "object" && typ.literal !== undefined) {
        return typ.literal;
    } else {
        return typeof typ;
    }
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = '', parent: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key, parent);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val, key, parent);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases.map(a => { return l(a); }), val, key, parent);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue(l("array"), val, key, parent);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue(l("Date"), val, key, parent);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue(l(ref || "object"), val, key, parent);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, key, ref);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key, ref);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val, key, parent);
    }
    if (typ === false) return invalidValue(typ, val, key, parent);
    let ref: any = undefined;
    while (typeof typ === "object" && typ.ref !== undefined) {
        ref = typ.ref;
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val, key, parent);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function l(typ: any) {
    return { literal: typ };
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "Interface": o([
        { json: "type", js: "type", typ: "" },
        { json: "metadata", js: "metadata", typ: r("Metadata") },
        { json: "features", js: "features", typ: a(r("Feature")) },
        { json: "bbox", js: "bbox", typ: a(3.14) },
    ], false),
    "Feature": o([
        { json: "type", js: "type", typ: r("FeatureType") },
        { json: "properties", js: "properties", typ: r("Properties") },
        { json: "geometry", js: "geometry", typ: r("Geometry") },
        { json: "id", js: "id", typ: "" },
    ], false),
    "Geometry": o([
        { json: "type", js: "type", typ: r("GeometryType") },
        { json: "coordinates", js: "coordinates", typ: a(3.14) },
    ], false),
    "Properties": o([
        { json: "mag", js: "mag", typ: u(3.14, null) },
        { json: "place", js: "place", typ: "" },
        { json: "time", js: "time", typ: 0 },
        { json: "updated", js: "updated", typ: 0 },
        { json: "tz", js: "tz", typ: null },
        { json: "url", js: "url", typ: "" },
        { json: "detail", js: "detail", typ: "" },
        { json: "felt", js: "felt", typ: u(0, null) },
        { json: "cdi", js: "cdi", typ: u(3.14, null) },
        { json: "mmi", js: "mmi", typ: u(3.14, null) },
        { json: "alert", js: "alert", typ: u(r("Alert"), null) },
        { json: "status", js: "status", typ: r("Status") },
        { json: "tsunami", js: "tsunami", typ: 0 },
        { json: "sig", js: "sig", typ: 0 },
        { json: "net", js: "net", typ: r("Net") },
        { json: "code", js: "code", typ: "" },
        { json: "ids", js: "ids", typ: "" },
        { json: "sources", js: "sources", typ: r("Sources") },
        { json: "types", js: "types", typ: "" },
        { json: "nst", js: "nst", typ: u(0, null) },
        { json: "dmin", js: "dmin", typ: u(3.14, null) },
        { json: "rms", js: "rms", typ: 3.14 },
        { json: "gap", js: "gap", typ: u(3.14, null) },
        { json: "magType", js: "magType", typ: u(r("MagType"), null) },
        { json: "type", js: "type", typ: r("PropertiesType") },
        { json: "title", js: "title", typ: "" },
    ], false),
    "Metadata": o([
        { json: "generated", js: "generated", typ: 0 },
        { json: "url", js: "url", typ: "" },
        { json: "title", js: "title", typ: "" },
        { json: "status", js: "status", typ: 0 },
        { json: "api", js: "api", typ: "" },
        { json: "count", js: "count", typ: 0 },
    ], false),
    "GeometryType": [
        "Point",
    ],
    "Alert": [
        "green",
        "yellow",
    ],
    "MagType": [
        "mb",
        "mb_lg",
        "md",
        "mh",
        "ml",
        "mw",
        "mwr",
        "mww",
    ],
    "Net": [
        "av",
        "ak",
        "ci",
        "hv",
        "mb",
        "nc",
        "nm",
        "nn",
        "ok",
        "pr",
        "se",
        "tx",
        "us",
        "uu",
        "uw",
    ],
    "Sources": [
        ",av,",
        ",av,ak,",
        ",ak,",
        ",ak,av,",
        ",ak,at,us,",
        ",ak,us,",
        ",ci,",
        ",ci,us,",
        ",ew,nc,us,",
        ",hv,",
        ",hv,us,",
        ",mb,",
        ",mb,us,",
        ",nc,",
        ",nc,nn,",
        ",nc,nn,us,",
        ",nc,us,",
        ",nc,us,nn,",
        ",nm,",
        ",nn,",
        ",nn,us,",
        ",ok,",
        ",ok,us,",
        ",pr,",
        ",se,",
        ",se,us,",
        ",tx,",
        ",us,",
        ",us,ak,",
        ",us,at,ak,",
        ",us,hv,",
        ",us,mb,",
        ",us,nn,",
        ",us,ok,",
        ",us,pr,",
        ",us,se,",
        ",us,tx,",
        ",uu,",
        ",uw,",
    ],
    "Status": [
        "automatic",
        "reviewed",
    ],
    "PropertiesType": [
        "earthquake",
        "explosion",
        "quarry blast",
    ],
    "FeatureType": [
        "Feature",
    ],
};
