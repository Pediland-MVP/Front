'use client';
"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatefulButton = StatefulButton;
var React = require("react");
var button_1 = require("../../ui/src/button");
var framer_motion_1 = require("framer-motion");
var fa6_1 = require("react-icons/fa6");
var utils_1 = require("@befroosh/lib/utils");
var im_1 = require("react-icons/im");
// mock async code
var useStatus = function (_a) {
    var resloveTo = _a.resloveTo;
    var _b = React.useState('idle'), status = _b[0], setStatus = _b[1];
    // mock async request
    var onSubmit = function () {
        setStatus('loading');
        setTimeout(function () {
            setStatus(resloveTo);
        }, 3500);
    };
    return {
        onSubmit: onSubmit,
        status: status,
    };
};
//======================================
function StatefulButton(_a) {
    var rest = __rest(_a, []);
    var _b = useStatus({ resloveTo: 'success' }), status = _b.status, onSubmit = _b.onSubmit;
    return (<button_1.Button disabled={status == 'loading'} onClick={onSubmit} {...rest} variant={status === 'error' ? 'destructive' : rest.variant} className={(0, utils_1.cn)('w-36 rounded-lg overflow-hidden', rest.className)}>
      <framer_motion_1.AnimatePresence mode="wait">
        {/* //------------------------------IDLE */}
        {status === 'idle' && (<framer_motion_1.motion.span key={status} exit={{
                opacity: 0,
                y: -15,
                transition: { duration: 0.3, type: 'spring' },
            }}>
            Click me
          </framer_motion_1.motion.span>)}
        {/* //------------------------------LOADING */}
        {status === 'loading' && (<framer_motion_1.motion.span key={status} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 100, y: 0, transition: { delay: 0 } }} exit={{ opacity: 0, y: -15, transition: { duration: 0.3 } }}>
            <im_1.ImSpinner2 className="animate-spin" size="19"/>
          </framer_motion_1.motion.span>)}
 
        {/* //------------------------------RESOLVED */}
        {['success', 'error'].includes(status) && (<framer_motion_1.motion.span key={status} initial={{ opacity: 0, y: 15, scale: 0 }} animate={{
                opacity: 100,
                y: 0,
                scale: 1,
                transition: { delay: 0.1, duration: 0.4 },
            }} exit={{ opacity: 0, y: -15, transition: { duration: 0.3 } }}>
            {status === 'success' && <fa6_1.FaCircleCheck size="20"/>}
            {status === 'error' && <fa6_1.FaCircleXmark size="20"/>}
          </framer_motion_1.motion.span>)}
      </framer_motion_1.AnimatePresence>
    </button_1.Button>);
}
