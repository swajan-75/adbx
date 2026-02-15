import { useState, useEffect } from 'react';
import {
    HiOutlineDeviceTablet, HiOutlinePlus, HiOutlineArrowPath,
    HiOutlineMagnifyingGlass, HiOutlineBell
} from "react-icons/hi2";
import {
    MdPlayArrow, MdPause, MdFastForward, MdFastRewind,
    MdDeleteOutline, MdOutlineSettings, MdRocketLaunch,
    MdPlayCircleOutline
} from "react-icons/md";
import { IoMdCloseCircleOutline } from "react-icons/io";

import {
    GetDevices, PlayVLC, TogglePause, FastForward, Rewind,
    AddDevice, GetRecent, DeleteRecent, StartStatusMonitor, EmergencyKill
} from '../wailsjs/go/main/App';

function App() {
    const [devices, setDevices] = useState([]);
    const [selectedID, setSelectedID] = useState('');
    const [status, setStatus] = useState('Idle');
    const [showModal, setShowModal] = useState(false);
    const [deviceIP, setDeviceIP] = useState('');
    const [devicePort, setDevicePort] = useState('5555');
    const [recent, setRecent] = useState([]);
    const [videoURL, setVideoURL] = useState('');
    const [playback, setPlayback] = useState({ curr: '00:00:00', total: '00:00:00', percent: 0 });

    const refreshRecent = () => GetRecent().then(data => setRecent(data || []));
    const handleDelete = (id) => DeleteRecent(id).then(refreshRecent);

    const handleLaunch = () => {
        const trimmedURL = videoURL.trim();
        if (!selectedID || !trimmedURL) { setStatus('INVALID_INPUT'); return; }
        setStatus('Launching...');
        PlayVLC(selectedID, trimmedURL).then((res) => {
            setStatus(res);
            refreshRecent();
            setVideoURL('');
        });
    };

    const refreshDevices = () => {
        setStatus('Refreshing...');
        GetDevices().then(res => {
            setDevices(res || []);
            if (res?.length > 0 && !selectedID) setSelectedID(res[0].id);
            setTimeout(() => setStatus('Idle'), 800);
        });
    };

    useEffect(() => {
        const { EventsOn } = window.runtime;

        EventsOn("vlc_status", (data) => {
            console.log("Backend Status:", data);
            setPlayback({
                curr: data.curr || '00:00:00',
                total: data.total || '00:00:00',
                percent: data.percent || 0
            });
        });

        return () => window.runtime.EventsOff("vlc_status");
    }, []);

    useEffect(() => {
        const initData = async () => {
            try {
                const recentData = await GetRecent();
                setRecent(recentData || []);
                const deviceList = await GetDevices();
                setDevices(deviceList || []);
                if (deviceList?.length > 0) setSelectedID(deviceList[0].id);
            } catch (e) { console.error(e); }
        };
        initData();
    }, []);

    return (
        <div className="relative h-screen w-screen bg-slate-900 text-slate-200 font-sans antialiased tracking-tight flex flex-col overflow-hidden">


            <header
                style={{ "--wails-draggable": "drag" }}
                className="drag-region relative z-[10] w-full h-10 flex items-center justify-between px-4 bg-white/5 backdrop-blur-md border-b border-white/10 shrink-0">
                <div className="w-20 h-full"></div>

                <div className="absolute left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 pointer-events-none select-none">
                    ABDx
                </div>

                <div className="no-drag flex items-center gap-3">
                    <button className="text-white/40 hover:text-white transition-colors p-1">
                        <HiOutlineBell className="text-lg" />
                    </button>
                </div>
            </header>


            <div className="relative flex flex-1 overflow-hidden p-5 pt-2">


                <div className="absolute top-[-10%] left-[-10%] w-[700px] h-[700px] bg-blue-600/20 blur-[140px] rounded-full pointer-events-none z-0"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none z-0"></div>


                <aside className="relative z-10 w-64 h-full bg-white/10 backdrop-blur-[60px] rounded-[32px] shadow-2xl border border-white/10 p-8 flex flex-col shrink-0">
                    <div className="flex items-center gap-3 mb-10 px-2 shrink-0">
                        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                            <MdPlayCircleOutline className="text-xl" />
                        </div>
                        <span className="font-semibold text-xl tracking-tighter text-white uppercase ">ADBX</span>
                    </div>

                    <button onClick={() => setShowModal(true)} className="w-full flex items-center justify-center gap-2 px-5 py-3.5 mb-6 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg hover:bg-blue-700 transition-all active:scale-95 shrink-0">
                        <HiOutlinePlus className="text-lg" /> Add Device
                    </button>

                    <div className="flex-1 flex flex-col overflow-hidden">
                        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 px-2 shrink-0">Connected Nodes</h2>
                        <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
                            {devices.length === 0 ? (
                                <p className="text-[10px] text-slate-500 italic px-2">No devices found...</p>
                            ) : (
                                devices.map((device) => (
                                    <button
                                        key={device.id}
                                        onClick={() => setSelectedID(device.id)}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${selectedID === device.id
                                            ? 'bg-blue-600/80 text-white border-blue-500 shadow-md'
                                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <HiOutlineDeviceTablet className="text-lg shrink-0 opacity-70" />
                                            <span className="text-xs font-semibold truncate">{device.id}</span>
                                        </div>
                                        <div className={`w-1.5 h-1.5 rounded-full ${selectedID === device.id ? 'bg-white' : 'bg-emerald-500 animate-pulse'}`}></div>
                                    </button>
                                ))
                            )}
                        </div>
                        <button onClick={refreshDevices} className="w-full flex items-center justify-center gap-2 px-5 py-3.5 mt-4 bg-white/5 border border-white/10 text-slate-300 hover:bg-blue-600 hover:text-white rounded-2xl font-bold text-sm transition-all active:scale-95 shrink-0">
                            <HiOutlineArrowPath className={`text-lg ${status === 'Refreshing...' ? 'animate-spin' : ''}`} /> Refresh
                        </button>
                    </div>
                </aside>


                <main className="relative z-10 flex-1 flex flex-col ml-6 h-full overflow-hidden">
                    <header className="flex justify-between items-center mb-8 px-2 shrink-0">

                    </header>

                    {/* PLAYER */}

                    <section className="w-full max-w-2xl mx-auto flex flex-col items-center mb-10 shrink-0">
                        <div className="w-full bg-black/60 rounded-[48px] p-10 shadow-2xl border border-white/10 flex flex-col gap-8 backdrop-blur-[40px]">
                            {/* CONTROLS AREA */}
                            <div className="flex items-center justify-center px-4"> {/* Changed to justify-center */}
                                <div className="flex items-center gap-10">
                                    {/* REWIND */}
                                    <button onClick={(e) => { e.stopPropagation(); Rewind(selectedID); }} className="text-white text-4xl hover:scale-110 active:scale-90 transition-transform">
                                        <MdFastRewind />
                                    </button>

                                    {/* PLAY / PAUSE TOGGLE */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            status === 'Streaming' ? TogglePause(selectedID) : handleLaunch();
                                        }}
                                        className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center text-5xl shadow-xl hover:scale-105 active:scale-95 transition-all"
                                    >
                                        {status === 'Streaming' ? <MdPause /> : <MdPlayArrow />}
                                    </button>

                                    {/* FAST FORWARD */}
                                    <button onClick={(e) => { e.stopPropagation(); FastForward(selectedID); }} className="text-white text-4xl hover:scale-110 active:scale-90 transition-transform">
                                        <MdFastForward />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* TABLE */}
                    <section className="bg-white/10 backdrop-blur-[60px] rounded-[40px] border border-white/10 shadow-2xl flex-1 overflow-hidden flex flex-col min-h-0">
                        <div className="p-8 border-b border-white/10 flex justify-between items-center shrink-0">
                            <h2 className="font-bold text-2xl text-white tracking-tighter">Recently Played</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="text-slate-400 border-b border-white/10 uppercase text-[9px] font-bold tracking-widest sticky top-0 bg-white/5 backdrop-blur-3xl z-20">
                                    <tr>
                                        <th className="px-10 py-5">Source Link</th>
                                        <th className="px-10 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {recent.map(item => (
                                        <tr key={item.ID} className="hover:bg-white/5 transition group">
                                            <td className="px-10 py-5 font-mono text-[10px] truncate max-w-[250px] text-slate-300 tracking-tighter font-medium">{item.URL}</td>
                                            <td className="px-10 py-5 text-right flex items-center justify-end gap-2">
                                                <button onClick={() => { setStatus("Launching..."); PlayVLC(selectedID, item.URL).then(refreshRecent); }} className="p-2 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"><MdPlayArrow className="text-lg" /></button>
                                                <button onClick={() => handleDelete(item.ID)} className="p-2 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"><MdDeleteOutline className="text-lg" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </main>

                {/* RIGHT PANEL */}
                <aside className="relative z-10 w-80 ml-6 h-full flex flex-col gap-6 shrink-0">
                    <div className="bg-white/10 backdrop-blur-[60px] rounded-[32px] border border-white/10 p-8 shadow-2xl flex-1 flex flex-col overflow-hidden">
                        <h2 className="font-bold text-lg text-white mb-8 tracking-tighter uppercase shrink-0">Source_Config</h2>
                        <div className="flex flex-col gap-5 mb-8 shrink-0">
                            <textarea value={videoURL} onChange={(e) => setVideoURL(e.target.value)} placeholder="Paste stream link here..." className="w-full h-44 bg-white/5 border border-white/10 rounded-[24px] p-5 text-xs text-white font-mono focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all resize-none shadow-inner custom-scrollbar" />
                            <button onClick={handleLaunch} className="w-full bg-blue-600 text-white py-4.5 rounded-[22px] font-bold text-[11px] uppercase tracking-[0.2em] shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shrink-0">
                                <MdRocketLaunch className="text-lg" /> Start Intent
                            </button>
                        </div>
                        <div className="mt-auto space-y-4 text-xs font-bold uppercase tracking-widest text-slate-400 shrink-0">
                            <div className="p-5 bg-white/5 rounded-[24px] border border-white/10">
                                <p className="mb-1 text-[10px]">Target Node</p>
                                <p className="text-white font-mono truncate font-medium">{selectedID || 'NONE'}</p>
                            </div>
                            <div className="p-5 bg-white/5 rounded-[24px] border border-white/10 flex items-center justify-between">
                                <div><p className="mb-1 text-[10px]">Bridge</p><p className="text-emerald-400 italic tracking-tighter uppercase">{status}</p></div>
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            EmergencyKill().then((res) => {
                                setStatus(res);      
                                setDevices([]);      
                                setSelectedID('');  
                            });
                        }}
                        className="w-full bg-red-600/20 text-red-400 py-5 rounded-[28px] font-bold uppercase text-[10px] tracking-[0.2em] border border-red-500/20 hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2 shrink-0"
                    >
                        <IoMdCloseCircleOutline className="text-lg" /> Emergency Kill ADB
                    </button>
                </aside>
            </div>

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-4">
                    <div className="bg-slate-900/90 backdrop-blur-3xl rounded-[32px] p-8 w-full max-w-[400px] shadow-2xl border border-white/10">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 tracking-tighter"><HiOutlineDeviceTablet className="text-blue-400" /> Add New Device</h2>
                        <div className="space-y-4">
                            <input placeholder="Device IP" value={deviceIP} onChange={e => setDeviceIP(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-4 focus:ring-blue-500/20 outline-none transition-all font-medium text-sm" />
                            <input placeholder="Port" value={devicePort} onChange={e => setDevicePort(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-4 focus:ring-blue-500/20 outline-none transition-all font-medium text-sm" />
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl bg-white/10 text-white font-semibold transition-all text-sm">Cancel</button>
                            <button onClick={() => { const addr = `${deviceIP}:${devicePort || '5555'}`; AddDevice(addr).then(refreshDevices).finally(() => setShowModal(false)); }} className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all text-sm">Connect</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;